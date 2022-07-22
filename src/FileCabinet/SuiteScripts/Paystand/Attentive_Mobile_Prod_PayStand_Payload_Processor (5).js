/**
 * Module Description...
 *
 * @copyright 2018 PayStand Inc.
 * @author Darren Hill darren@darrenhillconsulting.ca
 *
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 * @NScriptType plugintypeimpl
 */
define(["require", "exports", "N/record", "N/search", "N/util", "N/log", "N/cache", "N/runtime", "N/error", "N/config"], function (require, exports, record, search, util, log, cache, runtime, error, config) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getCurrencyId = exports.processPrePayment = exports.processPayment = void 0;
    // noinspection JSUnusedGlobalSymbols
    exports.processPayment = function (paymentPayload) {
        var paymentId = -1, headerFieldsToCopy = [];
        if (paymentPayload.invoices && paymentPayload.invoices.length > 0) {
            var payment_1 = null;
            var invoiceIds_1 = [];
            var invoiceObj_1 = {};
            paymentPayload.invoices.forEach(function (invoice) {
                invoiceIds_1.push(paymentPayload.unMask({ transactionGUID: invoice.invoiceId }).transactionId);
            });
            var transactionDetails = getTransactionDetails({ transactionId: invoiceIds_1[0], transactionType: search.Type.INVOICE });
            var manageFeeResponse_1 = manageFees(paymentPayload, transactionDetails);
            // Update - Apply Discounts
            log.audit('manageFeeResponse', manageFeeResponse_1);
            if (manageFeeResponse_1.applyDiscount) {
                var discount_1 = manageFeeResponse_1.discount;
                paymentPayload.invoices.forEach(function (invoice) {
                    var invoiceId = paymentPayload.unMask({ transactionGUID: invoice.invoiceId }).transactionId;
                    if (!invoiceObj_1[invoiceId]) {
                        var paymentAmount = invoice.paymentAmount;
                        if (paymentAmount < discount_1) {
                            var partialDiscount = paymentAmount - 1;
                            invoiceObj_1[invoiceId] = {
                                id: invoiceId,
                                paymentAmount: paymentAmount,
                                discount: partialDiscount
                            };
                            discount_1 = discount_1 - partialDiscount;
                        }
                        else if (paymentAmount > discount_1) {
                            invoiceObj_1[invoiceId] = {
                                id: invoiceId,
                                paymentAmount: paymentAmount,
                                discount: discount_1
                            };
                            discount_1 = 0;
                        }
                    }
                });
                log.audit('invoiceObj', invoiceObj_1);
                var paystandDiscountItem = getPaystandDiscount({ discountExternalId: 'paystand_discount', subsidiaryId: transactionDetails.subsidiaryId });
                for (var key in invoiceObj_1) {
                    try {
                        var invoiceRec = record.load({
                            type: record.Type.INVOICE,
                            id: invoiceObj_1[key].id,
                            isDynamic: true
                        });
                        var discountRate = +invoiceRec.getValue({ fieldId: 'discountrate' });
                        var custbodyPaystandDiscount = +invoiceRec.getValue({ fieldId: 'custbody_paystand_discount' });
                        invoiceRec.setValue({ fieldId: 'discountitem', value: paystandDiscountItem });
                        discountRate += -Math.abs(invoiceObj_1[key].discount);
                        custbodyPaystandDiscount += -Math.abs(invoiceObj_1[key].discount);
                        invoiceRec.setValue({ fieldId: 'discountrate', value: discountRate });
                        invoiceRec.setValue({ fieldId: 'custbody_paystand_discount', value: custbodyPaystandDiscount });
                        invoiceRec.save();
                    }
                    catch (err) {
                        log.error({ title: 'Error updating', details: invoiceObj_1[key].id });
                    }
                }
            }
            // region Create the appropriate Customer Payment record
            if (paymentPayload.invoices.length === 1) {
                payment_1 = record.transform({
                    fromType: record.Type.INVOICE,
                    fromId: invoiceIds_1[0],
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
            }
            else {
                payment_1 = record.transform({
                    fromType: record.Type.CUSTOMER,
                    fromId: paymentPayload.extCustomerId,
                    toType: record.Type.CUSTOMER_PAYMENT,
                    isDynamic: true
                });
                // Need to ensure the A/R Account is sourced in ... if not, we'll not see any invoices!
                // Might as well purposely set the 'aracct' field so we know it matches that of the incoming invoices.
                payment_1.setValue({ fieldId: 'aracct', value: transactionDetails.arAccountId });
            }
            // endregion
            if (payment_1 !== null) {
                // When the invoicesFullyPaidWithCredits is true we are going to create a payment.
                if (!paymentPayload.invoicesFullyPaidWithCredits) {
                    // Need to specify NOT to auto-apply, as Netsuite assumes Customer Payments from the Customer record are autoapplied.
                    payment_1.setValue({ fieldId: 'autoapply', value: false });
                    setPaymentMethod(paymentPayload, payment_1);
                    payment_1.setValue({ fieldId: 'externalid', value: paymentPayload.payment.id });
                    payment_1.setValue({ fieldId: 'custbody_paystand_event', value: paymentPayload.payStandEventId });
                    payment_1.setValue({ fieldId: 'trandate', value: netSuiteDate(paymentPayload.payment.datePosted) });
                    if (paymentPayload.payment.settlementAmount && +paymentPayload.payment.settlementAmount > 0) {
                        payment_1.setValue({ fieldId: 'custbody_paystand_settlement_amt', value: paymentPayload.payment.settlementAmount });
                    }
                    // NetSuite currencies are manually managed, and as such users can really put in whatever they want for ISO codes.  We'll need to do a search for the intenralid
                    var isMultiCurrency = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                    if (paymentPayload.payment.currency && isMultiCurrency) {
                        var transactionCurrencyId = exports.getCurrencyId(paymentPayload.payment.currency);
                        if (transactionCurrencyId > 0) {
                            payment_1.setValue({ fieldId: 'currency', value: transactionCurrencyId });
                        }
                        else {
                            log.error("Issue with Payment Id: " + paymentPayload.payment.id, "Failed to find Currency: " + paymentPayload.payment.currency);
                        }
                    }
                    // NetSuite currencies are manually managed, and as such users can really put in whatever they want for ISO codes.  We'll need to do a search for the intenralid
                    if (paymentPayload.payment.settlementCurrency) {
                        var currencyId = exports.getCurrencyId(paymentPayload.payment.settlementCurrency);
                        if (currencyId > 0) {
                            payment_1.setValue({ fieldId: 'custbody_paystand_settlement_cur', value: currencyId });
                        }
                        else {
                            log.error("Issue with Payment Id: " + paymentPayload.payment.id, "Failed to find Currency: " + paymentPayload.payment.settlementCurrency);
                        }
                    }
                    // Set undeposited account to be used for saving the payment
                    payment_1.setValue({ fieldId: 'account', value: '' });
                    payment_1.setValue({ fieldId: 'undepfunds', value: 'T' });
                    // Step #1 - Copy over any Header Fields
                    if (headerFieldsToCopy.length > 0) {
                        var firstInvoice_1 = record.load({ type: record.Type.INVOICE, id: invoiceIds_1[0] });
                        util.each(headerFieldsToCopy, function (headerFieldToCopy) {
                            var headerValue = firstInvoice_1.getValue({ fieldId: headerFieldToCopy });
                            if (headerValue) {
                                payment_1.setValue({ fieldId: headerFieldToCopy, value: headerValue });
                            }
                        });
                    }
                }
                // Step #2 - Unapply all
                clearFlag({
                    transaction: payment_1,
                    sublistId: 'apply',
                    flagFieldId: 'apply',
                    flagValue: false
                });
                var appliedTo_1 = [];
                // Step #3 - Find and apply all related Invoices
                util.each(paymentPayload.invoices, function (invoiceDetails) {
                    var invoicePaymentAmount = invoiceDetails.paymentAmount;
                    if (manageFeeResponse_1.applyDiscount) {
                        if (invoiceObj_1[paymentPayload.unMask({ transactionGUID: invoiceDetails.invoiceId }).transactionId]) {
                            invoicePaymentAmount -= invoiceObj_1[paymentPayload.unMask({ transactionGUID: invoiceDetails.invoiceId }).transactionId].discount;
                        }
                    }
                    appliedTo_1.push(findAndApply({
                        transactionId: paymentPayload.unMask({ transactionGUID: invoiceDetails.invoiceId }).transactionId,
                        paymentObj: payment_1,
                        paymentAmount: invoicePaymentAmount,
                        tranType: 'Invoice'
                    }));
                });
                log.debug('appliedTo', appliedTo_1);
                var creditApplied = false;
                var currentCreditAmount = +paymentPayload.creditAmountUsed;
                if (currentCreditAmount > 0) {
                    var creditLines = payment_1.getLineCount({ sublistId: 'credit' });
                    if (creditLines > 0) {
                        for (var c = 0; c < creditLines; c++) {
                            payment_1.selectLine({ sublistId: 'credit', line: c });
                            var due = +payment_1.getCurrentSublistValue({ sublistId: 'credit', fieldId: 'due' });
                            if (due <= currentCreditAmount && currentCreditAmount > 0) {
                                payment_1.setCurrentSublistValue({ sublistId: 'credit', fieldId: 'apply', value: true });
                                currentCreditAmount = currentCreditAmount - due;
                            }
                            else if (due > currentCreditAmount && currentCreditAmount > 0) {
                                payment_1.setCurrentSublistValue({ sublistId: 'credit', fieldId: 'apply', value: true });
                                payment_1.setCurrentSublistValue({ sublistId: 'credit', fieldId: 'amount', value: currentCreditAmount });
                                currentCreditAmount = currentCreditAmount - due;
                            }
                        }
                        creditApplied = true;
                    }
                }
                // When the invoicesFullyPaidWithCredits is true we are going to create a payment.
                if (!paymentPayload.invoicesFullyPaidWithCredits) {
                    // Step #4 - Find and apply all related Fees
                    if (manageFeeResponse_1.feeRevenueId > 0) {
                        log.debug('findAndApply', manageFeeResponse_1.feeRevenueId);
                        findAndApply({
                            transactionId: manageFeeResponse_1.feeRevenueId,
                            paymentObj: payment_1,
                            tranType: 'Fee'
                        });
                    }
                    if (manageFeeResponse_1.transactionFeeId > 0) {
                        findAndApply({
                            transactionId: manageFeeResponse_1.transactionFeeId,
                            paymentObj: payment_1,
                            tranType: 'Fee'
                        });
                    }
                    if (manageFeeResponse_1.convenienceFeeId > 0) {
                        findAndApply({
                            transactionId: manageFeeResponse_1.convenienceFeeId,
                            paymentObj: payment_1,
                            tranType: 'Fee'
                        });
                    }
                    var memo = appliedTo_1.join('\n').length > 500 ?
                        appliedTo_1.join('\n').slice(0, 500) + "... [full list on PayStand Event]" :
                        appliedTo_1.join('\n');
                    payment_1.setValue({
                        fieldId: 'memo',
                        value: memo
                    });
                }
                paymentId = +payment_1.save();
                log.audit('paymentId', paymentId);
                // When a credit is applied like a payment, NS does not create a Customer Payment, we update the credit memo.
                if (!creditApplied) {
                    // We should validate the the PayStand Payment amount (Total) matches exactly with the Generated NetSuite Customer Payment amount (total)
                    // The payments 'applied' should equal the PayStand payment 'amount'
                    var applied = +record.load({ type: record.Type.CUSTOMER_PAYMENT, id: paymentId }).getValue({ fieldId: 'applied' });
                    log.debug('applied', applied);
                    log.debug('paymentPayload.payment.amount', paymentPayload.payment.amount);
                    //When the fundType is Check, the PayStand Payment amount (Total) is able to be greater than the Generated NetSuite Customer Payment amount (total)
                    if (applied !== paymentPayload.payment.amount && (paymentPayload.payment.source.fundType !== 'check' || applied > paymentPayload.payment.amount)) {
                        log.error('Payment amounts uneven', "NS PAYMENT: " + applied + " !== PAYSTAND PAYMENT " + paymentPayload.payment.amount);
                        // DELETE THE PAYMENT RECORD FIRST, to free up the FEE Transaction
                        record.delete({
                            type: record.Type.CUSTOMER_PAYMENT,
                            id: paymentId
                        });
                        // DELETE THE FEE TRANSACTION
                        if (manageFeeResponse_1.feeRevenueId > 0) {
                            record.delete({
                                type: 'customtransaction_paystand_fee_revenue',
                                id: manageFeeResponse_1.feeRevenueId
                            });
                        }
                        if (manageFeeResponse_1.transactionFeeId > 0) {
                            record.delete({
                                type: 'customtransaction_paystand_tran_fee',
                                id: manageFeeResponse_1.transactionFeeId
                            });
                        }
                        if (manageFeeResponse_1.convenienceFeeId > 0) {
                            record.delete({
                                type: 'customtransaction_paystand_conv_fee',
                                id: manageFeeResponse_1.convenienceFeeId
                            });
                        }
                    }
                }
                if (manageFeeResponse_1.feeRevenueId > 0) {
                    updateCustomTransaction({
                        customTransactionType: 'customtransaction_paystand_fee_revenue',
                        feeTransactionId: manageFeeResponse_1.feeRevenueId,
                        transactionId: paymentId,
                        transactionType: record.Type.CUSTOMER_PAYMENT
                    });
                }
                if (manageFeeResponse_1.transactionFeeId > 0) {
                    updateCustomTransaction({
                        customTransactionType: 'customtransaction_paystand_tran_fee',
                        feeTransactionId: manageFeeResponse_1.transactionFeeId,
                        transactionId: paymentId,
                        transactionType: record.Type.CUSTOMER_PAYMENT
                    });
                }
                if (manageFeeResponse_1.convenienceFeeId > 0) {
                    updateCustomTransaction({
                        customTransactionType: 'customtransaction_paystand_conv_fee',
                        feeTransactionId: manageFeeResponse_1.convenienceFeeId,
                        transactionId: paymentId,
                        transactionType: record.Type.CUSTOMER_PAYMENT
                    });
                }
            }
        }
        return paymentId;
    };
    // noinspection JSUnusedGlobalSymbols
    exports.processPrePayment = function (prePaymentPayload) {
        var prePaymentId = -1;
        if (prePaymentPayload.salesOrders && prePaymentPayload.salesOrders.length > 0) {
            var transactionId = prePaymentPayload.unMask({ transactionGUID: prePaymentPayload.salesOrders[0].salesOrderId }).transactionId;
            var transactionDetails = getTransactionDetails({ transactionId: transactionId, transactionType: search.Type.SALES_ORDER });
            var manageFeeResponse = manageFees(prePaymentPayload, transactionDetails);
            // Update - Apply Discounts
            log.audit('manageFeeResponse', manageFeeResponse);
            if (manageFeeResponse.applyDiscount) {
                var discount = manageFeeResponse.discount;
                var paystandDiscountItem = getPaystandDiscount({ discountExternalId: 'paystand_discount', subsidiaryId: transactionDetails.subsidiaryId });
                try {
                    var soRec = record.load({
                        type: record.Type.SALES_ORDER,
                        id: transactionId,
                        isDynamic: true
                    });
                    var discountRate = +soRec.getValue({ fieldId: 'discountrate' });
                    var custbodyPaystandDiscount = +soRec.getValue({ fieldId: 'custbody_paystand_discount' });
                    soRec.setValue({ fieldId: 'discountitem', value: paystandDiscountItem });
                    discountRate += -Math.abs(discount);
                    custbodyPaystandDiscount += -Math.abs(discount);
                    soRec.setValue({ fieldId: 'discountrate', value: discountRate });
                    soRec.setValue({ fieldId: 'custbody_paystand_discount', value: custbodyPaystandDiscount });
                    soRec.save();
                }
                catch (err) {
                    log.error({ title: 'Error updating', details: transactionId });
                }
            }
            log.audit({ title: 'transactionDetails', details: transactionDetails });
            // When the payment method is -1 (Create Invoice), we should be creating a customer deposit
            // or
            // If we have payment method ID (Create Cash Sale) and fees, It is necessary create a customer deposit with the total fees amount.
            if (transactionDetails.paymentMethodId < 0 || (transactionDetails.paymentMethodId > 0 && (manageFeeResponse.transactionFeeId > 0 || manageFeeResponse.convenienceFeeId > 0) || manageFeeResponse.feeRevenueId > 0)) {
                var deposit = record.create({
                    type: record.Type.CUSTOMER_DEPOSIT,
                    defaultValues: {
                        entity: transactionDetails.customerId,
                        salesorder: transactionId
                    },
                    isDynamic: true
                });
                setPaymentMethod(prePaymentPayload, deposit);
                deposit.setValue({ fieldId: 'subsidiary', value: transactionDetails.subsidiaryId });
                deposit.setValue({ fieldId: 'custbody_paystand_event', value: prePaymentPayload.payStandEventId });
                deposit.setValue({ fieldId: 'trandate', value: netSuiteDate(prePaymentPayload.payment.datePosted) });
                // When is not a Cash Sale, we use the amount and the fees, otherwise the amount should be only the total fees.
                if (transactionDetails.paymentMethodId < 0) {
                    deposit.setValue({ fieldId: 'externalid', value: prePaymentPayload.payment.id });
                    deposit.setValue({ fieldId: 'payment', value: prePaymentPayload.payment.amount });
                }
                else if (transactionDetails.paymentMethodId > 0 && (manageFeeResponse.transactionFeeId > 0 || manageFeeResponse.convenienceFeeId || manageFeeResponse.feeRevenueId > 0)) {
                    deposit.setValue({ fieldId: 'externalid', value: "dep_" + prePaymentPayload.payment.id });
                    deposit.setValue({ fieldId: 'payment', value: manageFeeResponse.totalFeesAmount });
                }
                if (prePaymentPayload.payment.settlementAmount && +prePaymentPayload.payment.settlementAmount > 0) {
                    deposit.setValue({ fieldId: 'custbody_paystand_settlement_amt', value: prePaymentPayload.payment.settlementAmount });
                }
                // NetSuite currencies are manually managed, and as such users can really put in whatever they want for ISO codes.  We'll need to do a search for the intenralid
                var isMultiCurrency = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                if (prePaymentPayload.payment.currency && isMultiCurrency) {
                    var transactionCurrencyId = exports.getCurrencyId(prePaymentPayload.payment.currency);
                    if (transactionCurrencyId > 0) {
                        deposit.setValue({ fieldId: 'currency', value: transactionCurrencyId });
                    }
                    else {
                        log.error("Issue with Payment Id: " + prePaymentPayload.payment.id, "Failed to find Currency: " + prePaymentPayload.payment.currency);
                    }
                }
                // NetSuite currencies are manually managed, and as such users can really put in whatever they want for ISO codes.  We'll need to do a search for the intenralid
                if (prePaymentPayload.payment.settlementCurrency) {
                    var settlementCurrencyId = exports.getCurrencyId(prePaymentPayload.payment.settlementCurrency);
                    if (settlementCurrencyId > 0) {
                        deposit.setValue({ fieldId: 'custbody_paystand_settlement_cur', value: settlementCurrencyId });
                    }
                    else {
                        log.error("Issue with Payment Id: " + prePaymentPayload.payment.id, "Failed to find Currency: " + prePaymentPayload.payment.settlementCurrency);
                    }
                }
                // Set undeposited account to be used for saving the deposit
                deposit.setValue({ fieldId: 'account', value: '' });
                deposit.setValue({ fieldId: 'undepfunds', value: 'T' });
                prePaymentId = +deposit.save();
                // If there was a fee associated, apply this deposit to it.
                if (manageFeeResponse.transactionFeeId > 0 || manageFeeResponse.convenienceFeeId || manageFeeResponse.feeRevenueId > 0) {
                    if (manageFeeResponse.feeRevenueId > 0) {
                        updateCustomTransaction({
                            customTransactionType: 'customtransaction_paystand_fee_revenue',
                            feeTransactionId: manageFeeResponse.feeRevenueId,
                            transactionId: prePaymentId,
                            transactionType: record.Type.CUSTOMER_DEPOSIT
                        });
                    }
                    if (manageFeeResponse.transactionFeeId > 0) {
                        updateCustomTransaction({
                            customTransactionType: 'customtransaction_paystand_tran_fee',
                            feeTransactionId: manageFeeResponse.transactionFeeId,
                            transactionId: prePaymentId,
                            transactionType: record.Type.CUSTOMER_DEPOSIT
                        });
                    }
                    if (manageFeeResponse.convenienceFeeId > 0) {
                        updateCustomTransaction({
                            customTransactionType: 'customtransaction_paystand_conv_fee',
                            feeTransactionId: manageFeeResponse.convenienceFeeId,
                            transactionId: prePaymentId,
                            transactionType: record.Type.CUSTOMER_DEPOSIT
                        });
                    }
                    // Need to apply this customer deposit against the Fee!
                    var saveDeposit = false, depositApplication = record.transform({
                        fromType: record.Type.CUSTOMER_DEPOSIT,
                        fromId: prePaymentId,
                        toType: record.Type.DEPOSIT_APPLICATION,
                        isDynamic: true
                    });
                    var payStandFeesAccounts = getPayStandAccounts(+depositApplication.getValue({ fieldId: 'subsidiary' }));
                    depositApplication.setValue({ fieldId: 'aracct', value: payStandFeesAccounts.accountsReceivableAccountId });
                    for (var i = 0, invoiceCount = depositApplication.getLineCount({ sublistId: 'apply' }); i < invoiceCount; i = i + 1) {
                        if (+depositApplication.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i }) === manageFeeResponse.transactionFeeId
                            || +depositApplication.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i }) === manageFeeResponse.convenienceFeeId
                            || +depositApplication.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i }) === manageFeeResponse.feeRevenueId) {
                            depositApplication.selectLine({ sublistId: 'apply', line: i });
                            depositApplication.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
                            depositApplication.setValue({ fieldId: 'memo', value: "Paystand Fee # " + depositApplication.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'refnum' }) });
                            depositApplication.commitLine({ sublistId: 'apply' });
                            saveDeposit = true;
                        }
                    }
                    if (saveDeposit) {
                        depositApplication.save();
                    }
                    else {
                        log.error('Could not find Paystand Fee', "Unable to auto apply the Paystand Fee to Customer Deposit #" + prePaymentId);
                    }
                }
                // When we create a Cash Sale, we can not relate the SO to the customer deposit.
                if (transactionDetails.paymentMethodId < 0) {
                    // Lastly, update the Customer Deposit by setting the sales order field (header)
                    deposit = record.load({
                        id: prePaymentId,
                        type: record.Type.CUSTOMER_DEPOSIT,
                        isDynamic: true
                    });
                    deposit.setValue({ fieldId: 'salesorder', value: transactionId });
                    deposit.save();
                }
            }
            // If we have a payment method, we need to create the cash sale.
            if (transactionDetails.paymentMethodId > 0) {
                var cashSale = record.transform({
                    fromType: record.Type.SALES_ORDER,
                    fromId: transactionId,
                    toType: record.Type.CASH_SALE,
                    isDynamic: true
                });
                cashSale.setValue({ fieldId: 'externalid', value: prePaymentPayload.payment.id });
                cashSale.setValue({ fieldId: 'custbody_paystand_event', value: prePaymentPayload.payStandEventId });
                cashSale.setValue({ fieldId: 'trandate', value: netSuiteDate(prePaymentPayload.payment.datePosted) });
                if (prePaymentPayload.payment.settlementAmount && +prePaymentPayload.payment.settlementAmount > 0) {
                    cashSale.setValue({ fieldId: 'custbody_paystand_settlement_amt', value: prePaymentPayload.payment.settlementAmount });
                }
                // NetSuite currencies are manually managed, and as such users can really put in whatever they want for ISO codes.  We'll need to do a search for the intenralid
                var isMultiCurrency = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                if (prePaymentPayload.payment.currency && isMultiCurrency) {
                    var transactionCurrencyId = exports.getCurrencyId(prePaymentPayload.payment.currency);
                    if (transactionCurrencyId > 0) {
                        cashSale.setValue({ fieldId: 'currency', value: transactionCurrencyId });
                    }
                    else {
                        log.error("Issue with Payment Id: " + prePaymentPayload.payment.id, "Failed to find Currency: " + prePaymentPayload.payment.currency);
                    }
                }
                // NetSuite currencies are manually managed, and as such users can really put in whatever they want for ISO codes.  We'll need to do a search for the intenralid
                if (prePaymentPayload.payment.settlementCurrency) {
                    var settlementCurrencyId = exports.getCurrencyId(prePaymentPayload.payment.settlementCurrency);
                    if (settlementCurrencyId > 0) {
                        cashSale.setValue({ fieldId: 'custbody_paystand_settlement_cur', value: settlementCurrencyId });
                    }
                    else {
                        log.error("Issue with Payment Id: " + prePaymentPayload.payment.id, "Failed to find Currency: " + prePaymentPayload.payment.settlementCurrency);
                    }
                }
                // Set undeposited account to be used for saving the deposit
                cashSale.setValue({ fieldId: 'account', value: '' });
                cashSale.setValue({ fieldId: 'undepfunds', value: 'T' });
                prePaymentId = +cashSale.save();
            }
        }
        return prePaymentId;
    };
    var findAndApply = function (options) {
        log.debug('FindAndApplyOptions - transactionId', options.transactionId);
        log.debug('FindAndApplyOptions - paymentAmount', options.paymentAmount);
        log.debug('FindAndApplyOptions - tranType', options.tranType);
        var tranId, foundTransactionIndex = +options.paymentObj.findSublistLineWithValue({
            sublistId: 'apply',
            fieldId: 'doc',
            value: options.transactionId.toString()
        });
        log.debug("FindAndApplyOptions - " + foundTransactionIndex, foundTransactionIndex);
        if (foundTransactionIndex > -1) {
            options.paymentObj.selectLine({ sublistId: 'apply', line: foundTransactionIndex });
            options.paymentObj.setCurrentSublistValue({ sublistId: 'apply', fieldId: 'apply', value: true });
            if (options.paymentAmount) {
                log.debug('FindAndApplyOptions - Updating Amount' + foundTransactionIndex, options.paymentAmount);
                options.paymentObj.setCurrentSublistValue({
                    sublistId: 'apply',
                    fieldId: 'amount',
                    value: options.paymentAmount
                });
            }
            tranId = options.paymentObj.getCurrentSublistValue({ sublistId: 'apply', fieldId: 'refnum' });
            options.paymentObj.commitLine({ sublistId: 'apply' });
        }
        else {
            // Oh no, didn't find that tra!
            log.error("findAndApply - Locating " + options.tranType + " Line", "Unable to find " + options.tranType + " id: " + options.transactionId + " on " + options.paymentObj.type + " id: " + options.paymentObj.id);
            throw error.create({
                name: '6e7ecaad5q22425cb27a4e68v34814r3',
                message: "resourceNotFound : Unable to find " + options.tranType + " id: " + options.transactionId + " on " + options.paymentObj.type + " id: " + options.paymentObj.id,
                notifyOff: false
            });
        }
        return options.tranType + " #" + tranId;
    };
    var manageFees = function (paymentPayload, transactionDetails) {
        var manageFeeResponse = {
            transactionFeeId: -1,
            convenienceFeeId: -1,
            totalFeesAmount: 0,
            feeRevenueId: -1,
            discount: 0,
            applyDiscount: false
        };
        // We want to create only Fee Revenue objects from this bundle version onwards
        var useFeeRevenue = true;
        // We leave this as a conditional in case we want to have a behavior or other conditionaly in the future
        if (useFeeRevenue) {
            var feeSplit = paymentPayload.payment.feeSplit;
            if (feeSplit) {
                var payerTotalFees = (feeSplit || {}).payerTotalFees;
                if (+payerTotalFees) {
                    manageFeeResponse.feeRevenueId = createFeeRevenue({
                        transactionDetails: transactionDetails,
                        payStandPaymentId: paymentPayload.payment.id,
                        payStandEventId: paymentPayload.payStandEventId,
                        feeAmount: +payerTotalFees,
                        tranDate: netSuiteDate(paymentPayload.payment.datePosted)
                    });
                    manageFeeResponse.totalFeesAmount = +payerTotalFees;
                }
                if (feeSplit.feeSplitType === 'discount_fees') {
                    manageFeeResponse.applyDiscount = true;
                    manageFeeResponse.discount = feeSplit.discount || feeSplit.payerDiscount;
                }
            }
        }
        else {
            if (paymentPayload.payment.feeSplit && paymentPayload.payment.feeSplit.feeSplitType) {
                var _a = paymentPayload.payment.feeSplit || {}, payerTotalFees = _a.payerTotalFees, networkFees = _a.networkFees, surchargeFees = _a.surchargeFees, feeSplitType = _a.feeSplitType;
                switch (feeSplitType) {
                    case 'recoup_all_fees':
                        if (+payerTotalFees) {
                            manageFeeResponse.transactionFeeId = createTransactionFee({
                                transactionDetails: transactionDetails,
                                payStandPaymentId: paymentPayload.payment.id,
                                payStandEventId: paymentPayload.payStandEventId,
                                feeAmount: +payerTotalFees,
                                tranDate: netSuiteDate(paymentPayload.payment.datePosted)
                            });
                            manageFeeResponse.totalFeesAmount = +payerTotalFees;
                        }
                        break;
                    case 'recoup_custom_of_subtotal':
                        // Create transaction fee only if there is a Fee payed by customer
                        if (+payerTotalFees && +networkFees) {
                            // we want to create the transaction fee either with the networkFee or payerTotalFees depending on if the networkFee was completely covered or not
                            var networkFeesCoveredByPayer = +networkFees < +payerTotalFees ? +networkFees : +payerTotalFees;
                            manageFeeResponse.transactionFeeId = createTransactionFee({
                                transactionDetails: transactionDetails,
                                payStandPaymentId: paymentPayload.payment.id,
                                payStandEventId: paymentPayload.payStandEventId,
                                feeAmount: +networkFeesCoveredByPayer,
                                tranDate: netSuiteDate(paymentPayload.payment.datePosted)
                            });
                            manageFeeResponse.totalFeesAmount = +networkFeesCoveredByPayer;
                        }
                        // Only create this transaction if the payer payed more of the networkfee amount (surchargeFees)
                        if (+surchargeFees) {
                            manageFeeResponse.convenienceFeeId = createConvenienceFee({
                                transactionDetails: transactionDetails,
                                payStandPaymentId: paymentPayload.payment.id,
                                payStandEventId: paymentPayload.payStandEventId,
                                feeAmount: +surchargeFees,
                                tranDate: netSuiteDate(paymentPayload.payment.datePosted)
                            });
                            manageFeeResponse.totalFeesAmount = +manageFeeResponse.totalFeesAmount + +surchargeFees;
                        }
                        break;
                    default:
                        log.audit('manageFees - unhandled feeSplitType', paymentPayload.payment.feeSplit.feeSplitType);
                        break;
                }
            }
        }
        return manageFeeResponse;
    };
    var getTransactionDetails = function (options) {
        var customerId = -1, subsidiaryId = 1, arAccountId = -1, paymentMethodId = -1, searchColumns = ['entity', 'account', 'paymentmethod'];
        if (isOneWorld()) {
            subsidiaryId = -1;
            searchColumns.push('subsidiary');
        }
        var transactionLookup = search.lookupFields({
            type: options.transactionType,
            id: options.transactionId,
            columns: searchColumns
        });
        if (transactionLookup.entity && transactionLookup.entity.length > 0) {
            customerId = +transactionLookup.entity[0].value;
        }
        if (transactionLookup.subsidiary && transactionLookup.subsidiary.length > 0) {
            subsidiaryId = +transactionLookup.subsidiary[0].value;
        }
        if (transactionLookup.account && transactionLookup.account.length > 0) {
            arAccountId = +transactionLookup.account[0].value;
        }
        if (transactionLookup.paymentmethod && transactionLookup.paymentmethod.length > 0) {
            paymentMethodId = +transactionLookup.paymentmethod[0].value;
        }
        return {
            transactionId: options.transactionId,
            transactionType: options.transactionType,
            customerId: customerId,
            subsidiaryId: subsidiaryId,
            arAccountId: arAccountId,
            paymentMethodId: paymentMethodId
        };
    };
    var createFeeRevenue = function (options) {
        var feeTransactionId = -1;
        if (options.transactionDetails.customerId > 0 && options.transactionDetails.subsidiaryId > 0) {
            // Regenerate any PayStand Fee records.
            search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['externalidstring', 'is', "frev_" + options.payStandPaymentId],
                    'AND',
                    ['mainline', 'is', 'T']
                ]
            }).run().each(function (result) {
                feeTransactionId = +result.id;
                try {
                    record.delete({
                        type: result.recordType,
                        id: result.id
                    });
                    feeTransactionId = -1;
                }
                catch (e) {
                    log.error('Unable to delete Original Paystand Fee Revenue', e);
                }
                return false;
            });
            if (feeTransactionId < 0) {
                var payStandFeesAccounts = getPayStandAccounts(options.transactionDetails.subsidiaryId);
                if (options.transactionDetails.transactionType === search.Type.SALES_ORDER) {
                    options.transactionDetails.arAccountId = payStandFeesAccounts.accountsReceivableAccountId;
                }
                var feeTransaction = record.create({
                    type: 'customtransaction_paystand_fee_revenue',
                    isDynamic: true
                });
                feeTransaction.setValue({ fieldId: 'externalid', value: "frev_" + options.payStandPaymentId });
                feeTransaction.setValue({ fieldId: 'subsidiary', value: options.transactionDetails.subsidiaryId });
                feeTransaction.setValue({ fieldId: 'custbody_paystand_event', value: options.payStandEventId });
                feeTransaction.setValue({ fieldId: 'trandate', value: options.tranDate });
                // Set the Undeposited Funds account first!
                feeTransaction.selectNewLine({ sublistId: 'line' });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: payStandFeesAccounts.otherIncomeAccountId });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: options.feeAmount });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: options.transactionDetails.customerId });
                feeTransaction.commitLine({ sublistId: 'line' });
                feeTransaction.selectNewLine({ sublistId: 'line' });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: options.transactionDetails.arAccountId });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: options.feeAmount });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: options.transactionDetails.customerId });
                feeTransaction.commitLine({ sublistId: 'line' });
                feeTransactionId = +feeTransaction.save();
            }
        }
        return feeTransactionId;
    };
    var createConvenienceFee = function (options) {
        var feeTransactionId = -1;
        if (options.transactionDetails.customerId > 0 && options.transactionDetails.subsidiaryId > 0) {
            // Regenerate any PayStand Fee records.
            search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['externalidstring', 'is', "conv_" + options.payStandPaymentId],
                    'AND',
                    ['mainline', 'is', 'T']
                ]
            }).run().each(function (result) {
                feeTransactionId = +result.id;
                try {
                    record.delete({
                        type: result.recordType,
                        id: result.id
                    });
                    feeTransactionId = -1;
                }
                catch (e) {
                    log.error('Unable to delete Original Paystand Convenience Fee', e);
                }
                return false;
            });
            if (feeTransactionId < 0) {
                var payStandFeesAccounts = getPayStandAccounts(options.transactionDetails.subsidiaryId);
                if (options.transactionDetails.transactionType === search.Type.SALES_ORDER) {
                    options.transactionDetails.arAccountId = payStandFeesAccounts.accountsReceivableAccountId;
                }
                var feeTransaction = record.create({
                    type: 'customtransaction_paystand_conv_fee',
                    isDynamic: true
                });
                feeTransaction.setValue({ fieldId: 'externalid', value: "conv_" + options.payStandPaymentId });
                feeTransaction.setValue({ fieldId: 'subsidiary', value: options.transactionDetails.subsidiaryId });
                feeTransaction.setValue({ fieldId: 'custbody_paystand_event', value: options.payStandEventId });
                feeTransaction.setValue({ fieldId: 'trandate', value: options.tranDate });
                // Set the Undeposited Funds account first!
                feeTransaction.selectNewLine({ sublistId: 'line' });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: payStandFeesAccounts.otherIncomeAccountId });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: options.feeAmount });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: options.transactionDetails.customerId });
                feeTransaction.commitLine({ sublistId: 'line' });
                feeTransaction.selectNewLine({ sublistId: 'line' });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: options.transactionDetails.arAccountId });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: options.feeAmount });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: options.transactionDetails.customerId });
                feeTransaction.commitLine({ sublistId: 'line' });
                feeTransactionId = +feeTransaction.save();
            }
        }
        return feeTransactionId;
    };
    var createTransactionFee = function (options) {
        var feeTransactionId = -1;
        if (options.transactionDetails.customerId > 0 && options.transactionDetails.subsidiaryId > 0 && options.transactionDetails.arAccountId > 0) {
            // Regenerate any PayStand Fee records.
            search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['externalidstring', 'is', "fee_" + options.payStandPaymentId],
                    'AND',
                    ['mainline', 'is', 'T']
                ]
            }).run().each(function (result) {
                feeTransactionId = +result.id;
                try {
                    record.delete({
                        type: result.recordType,
                        id: result.id
                    });
                    feeTransactionId = -1;
                }
                catch (e) {
                    log.error('Unable to delete Original Paystand Fee', e);
                }
                return false;
            });
            if (feeTransactionId < 0) {
                var payStandFeesAccounts = getPayStandAccounts(options.transactionDetails.subsidiaryId);
                if (options.transactionDetails.transactionType === search.Type.SALES_ORDER) {
                    options.transactionDetails.arAccountId = payStandFeesAccounts.accountsReceivableAccountId;
                }
                var feeTransaction = record.create({
                    type: 'customtransaction_paystand_tran_fee',
                    isDynamic: true
                });
                feeTransaction.setValue({ fieldId: 'externalid', value: "fee_" + options.payStandPaymentId });
                feeTransaction.setValue({ fieldId: 'subsidiary', value: options.transactionDetails.subsidiaryId });
                feeTransaction.setValue({ fieldId: 'custbody_paystand_event', value: options.payStandEventId });
                feeTransaction.setValue({ fieldId: 'trandate', value: options.tranDate });
                // Set the Undeposited Funds account first!
                feeTransaction.selectNewLine({ sublistId: 'line' });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: payStandFeesAccounts.unDepositedFundsAccountId });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'credit', value: options.feeAmount });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: options.transactionDetails.customerId });
                feeTransaction.commitLine({ sublistId: 'line' });
                feeTransaction.selectNewLine({ sublistId: 'line' });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'account', value: options.transactionDetails.arAccountId });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'debit', value: options.feeAmount });
                feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'entity', value: options.transactionDetails.customerId });
                feeTransaction.commitLine({ sublistId: 'line' });
                feeTransactionId = +feeTransaction.save();
            }
        }
        return feeTransactionId;
    };
    var updateCustomTransaction = function (options) {
        var feeTransaction = record.load({
            type: options.customTransactionType,
            id: options.feeTransactionId,
            isDynamic: true
        });
        var payStandPayment = record.load({ type: options.transactionType, id: options.transactionId });
        var memoString = options.transactionType + " #" + payStandPayment.getValue({ fieldId: 'tranid' });
        feeTransaction.setValue({ fieldId: 'memo', value: memoString });
        feeTransaction.setValue({ fieldId: 'custbody_paystand_fee_payment', value: options.transactionId });
        feeTransaction.selectLine({ sublistId: 'line', line: 0 });
        feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoString });
        feeTransaction.commitLine({ sublistId: 'line' });
        feeTransaction.selectLine({ sublistId: 'line', line: 1 });
        feeTransaction.setCurrentSublistValue({ sublistId: 'line', fieldId: 'memo', value: memoString });
        feeTransaction.commitLine({ sublistId: 'line' });
        return +feeTransaction.save();
    };
    var setPaymentMethod = function (paymentPayload, transaction) {
        if (paymentPayload.payment.source) {
            // Lets put in some extra payment information
            switch (paymentPayload.payment.source.fundType) {
                case 'card':
                    transaction.setValue({ fieldId: 'paymentmethod', value: 10 }); // PayStand Card
                    break;
                case 'ach':
                    transaction.setValue({ fieldId: 'paymentmethod', value: 11 }); // PayStand ACH
                    break;
                case 'echeck':
                    transaction.setValue({ fieldId: 'paymentmethod', value: 12 }); // PayStand Smart ACH
                    break;
                case 'check':
                    transaction.setValue({ fieldId: 'paymentmethod', value: 2 }); // PayStand Check
                    transaction.setValue({ fieldId: 'checknum', value: paymentPayload.payment.source.checkNumber }); // PayStand Check
                    // Payment Amount: When the fundType is Check, the PayStand Payment amount (Total) is set as the NetSuite Customer Payment amount (total)
                    transaction.setValue({ fieldId: 'payment', value: paymentPayload.payment.amount });
                    break;
            }
            transaction.setValue({ fieldId: 'memo', value: "fundType: " + paymentPayload.payment.source.fundType + " " + (paymentPayload.payment.source.brand || '') + " last4: " + paymentPayload.payment.source.last4 });
        }
    };
    var getPaystandDiscount = function (options) {
        var paystandDiscount = -1;
        var payStandFeesAccounts = getPayStandAccounts(options.subsidiaryId);
        search.create({
            type: search.Type.ITEM,
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                ['externalid', 'is', options.discountExternalId]
            ]
        }).run().each(function (result) {
            paystandDiscount = +result.id;
            return true;
        });
        if (paystandDiscount === -1) {
            var discountRec = record.create({
                type: record.Type.DISCOUNT_ITEM,
                isDynamic: true
            });
            discountRec.setValue({ fieldId: 'itemid', value: 'Paystand Discount' });
            if (isOneWorld()) {
                discountRec.setValue({ fieldId: 'subsidiary', value: options.subsidiaryId });
                discountRec.setValue({ fieldId: 'includechildren', value: true });
            }
            discountRec.setValue({ fieldId: 'externalid', value: options.discountExternalId });
            discountRec.setValue({ fieldId: 'account', value: payStandFeesAccounts.otherIncomeAccountId });
            discountRec.setValue({ fieldId: 'rate', value: 1 });
            paystandDiscount = discountRec.save();
        }
        return +paystandDiscount;
    };
    var getPayStandAccounts = function (subsidiaryId) {
        var lookupCache = cache.getCache({ name: 'PAYSTAND_FEE_ACCT_CACHE1' }), payStandAccounts = JSON.parse(lookupCache.get({
            key: subsidiaryId.toString(),
            loader: function () {
                var foundPayStandAccounts = {
                    payStandProcessorFeeAccountId: -1,
                    unDepositedFundsAccountId: -1,
                    accountsReceivableAccountId: -1,
                    otherIncomeAccountId: -1
                };
                search.create({
                    type: 'customrecord_paystand_config',
                    filters: ['custrecord_ps_subsidiaries', 'anyof', subsidiaryId],
                    columns: ['custrecord_ps_pro_fees_account', 'custrecord_ps_undep_account', 'custrecord_ps_ar_account', 'custrecord_ps_other_inc_account']
                }).run().each(function (result) {
                    foundPayStandAccounts.payStandProcessorFeeAccountId = +result.getValue(result.columns[0]);
                    foundPayStandAccounts.unDepositedFundsAccountId = +result.getValue(result.columns[1]);
                    foundPayStandAccounts.accountsReceivableAccountId = +result.getValue(result.columns[2]);
                    foundPayStandAccounts.otherIncomeAccountId = +result.getValue(result.columns[3]);
                    return false; // Just return the first result.
                });
                return JSON.stringify(foundPayStandAccounts);
            }
        }));
        // Don't cache unfound Currency Codes
        if (payStandAccounts.payStandProcessorFeeAccountId === -1 || payStandAccounts.unDepositedFundsAccountId === -1) {
            lookupCache.remove({
                key: subsidiaryId.toString()
            });
        }
        //noinspection JSUnusedLocalSymbols
        return payStandAccounts;
    };
    exports.getCurrencyId = function (currencyCode) {
        var lookupCache = cache.getCache({ name: 'CURRENCY_CACHE2' }), foundInternalId = +lookupCache.get({
            key: currencyCode,
            loader: function () {
                var isMultiCurrency = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                // Default currencyCode is USD = 1
                var recordId = isMultiCurrency ? '-1' : '1';
                if (isMultiCurrency) {
                    search.create({
                        type: search.Type.CURRENCY,
                        filters: ['symbol', 'is', currencyCode]
                    }).run().each(function (result) {
                        recordId = result.id;
                        return false; // Just return the first result.
                    });
                }
                return recordId;
            }
        });
        // Don't cache unfound Currency Codes
        if (foundInternalId === -1) {
            lookupCache.remove({
                key: currencyCode
            });
        }
        //noinspection JSUnusedLocalSymbols
        return foundInternalId;
    };
    var clearFlag = function (clearFlagArgs) {
        var i = clearFlagArgs.transaction.getLineCount({ sublistId: clearFlagArgs.sublistId }) - 1;
        while (i > 0 || i === 0) {
            clearFlagArgs.transaction.selectLine({ sublistId: clearFlagArgs.sublistId, line: i });
            clearFlagArgs.transaction.setCurrentSublistValue({
                sublistId: clearFlagArgs.sublistId,
                fieldId: clearFlagArgs.flagFieldId,
                value: clearFlagArgs.flagValue
            });
            clearFlagArgs.transaction.commitLine({ sublistId: clearFlagArgs.sublistId });
            i = i - 1;
        }
    };
    var isOneWorld = function () {
        var accountingPreferences = config.load({ type: config.Type.ACCOUNTING_PREFERENCES });
        var maxSub = +accountingPreferences.getValue({ fieldId: 'MAXSUBSIDIARIES' });
        return !isNaN(maxSub);
    };
    var netSuiteDate = function (payStandDate) {
        var parts = payStandDate.split('-');
        var year = parts[0];
        var month = +parts[1].toString();
        var day = +parts[2].split('T')[0].toString();
        log.audit('netSuiteDate', month + "/" + day + "/" + year);
        return new Date(month + "/" + day + "/" + year);
    };
    var AUTOPAY_STATUS;
    (function (AUTOPAY_STATUS) {
        AUTOPAY_STATUS[AUTOPAY_STATUS["Ineligible"] = 1] = "Ineligible";
        AUTOPAY_STATUS[AUTOPAY_STATUS["Eligable"] = 2] = "Eligable";
        AUTOPAY_STATUS[AUTOPAY_STATUS["InProgress"] = 3] = "InProgress";
        AUTOPAY_STATUS[AUTOPAY_STATUS["Success"] = 4] = "Success";
        AUTOPAY_STATUS[AUTOPAY_STATUS["Failed"] = 5] = "Failed";
    })(AUTOPAY_STATUS || (AUTOPAY_STATUS = {}));
});

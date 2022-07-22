/**
 * Module Description...
 *
 * @copyright 2020 PayStand Inc.
 * @author Alexis Silva bsilva@paystand.com
 *
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType plugintypeimpl
 */
 define(["require", "exports", "N/record", "N/search", "N/log", "N/runtime", "/SuiteBundles/Bundle 235016/PayStand/PayStand_TransferReportRequest", "/SuiteBundles/Bundle 235016/PayStand/PayStand_Event", "/SuiteBundles/Bundle 235016/PayStand/PayStand", "/SuiteBundles/Bundle 235016/PayStand/big-js", "/SuiteBundles/Bundle 235016/PayStand/lodash", "/SuiteBundles/Bundle 235016/PayStand/PayStand_Error"], function (require, exports, record, search, log, runtime, PayStand_TransferReportRequest_1, PayStand_Event_1, PayStand_1, Big, _, PayStand_Error_1) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.processDeposit = void 0;
    var NOTETYPE;
    (function (NOTETYPE) {
        NOTETYPE[NOTETYPE["NOTE"] = 7] = "NOTE";
    })(NOTETYPE || (NOTETYPE = {}));
    // noinspection JSUnusedGlobalSymbols
    exports.processDeposit = function (unprocessedTransferReportRequest, context) {
        log.debug('PI unprocessedTransferReportRequest:', unprocessedTransferReportRequest);
        var payStand = new PayStand_1.PayStand({ customerId: unprocessedTransferReportRequest.customerId });
        payStand.getTransferReport({
            transferId: unprocessedTransferReportRequest.transferReportId,
            success: function (transferReport) {
                log.debug('summarize - transferReport: getTransferReport', transferReport);
                var dateCreated = '';
                var psBankId = '';
                payStand.getTransfer({
                    transferId: unprocessedTransferReportRequest.transferReportId,
                    success: function (transfer) {
                        log.debug('summarize - transfer: getTransferReport', transfer);
                        dateCreated = transfer.created;
                        psBankId = transfer.bankId;
                    },
                    fail: function (connectResponse) {
                        throw connectResponse.body;
                    }
                });
                var nsAccount = searchNSAccount(psBankId);
                var bankAccount = +payStand.BankAccount;
                log.debug('nsAccount', nsAccount);
                log.debug('bankAccount', bankAccount);
                if (nsAccount) {
                    bankAccount = +nsAccount;
                }
                log.debug('summarize - Info', 'bankAccount: ' + bankAccount + '</br>' +
                    'externalid: ' + transferReport.id + '</br>');
                try {
                    var deposit_1 = record.create({
                        type: record.Type.DEPOSIT,
                        isDynamic: true,
                        defaultValues: {
                            account: bankAccount,
                            disablepaymentfilters: true
                        }
                    });
                    deposit_1.setValue({ fieldId: 'externalid', value: transferReport.id });
                    deposit_1.setValue({ fieldId: 'trandate', value: new Date(dateCreated) });
                    var feesProcessed_1 = [];
                    context.output.iterator().each(function (resourceType, value) {
                        var _a;
                        var transferReportEntryResult = JSON.parse(value);
                        log.debug('summarize - type: ' + resourceType + ' > Entry Result: ', transferReportEntryResult);
                        var customer = _.get(transferReportEntryResult, 'relatedTransactionDetails.customer');
                        switch (resourceType) {
                            case 'payment':
                                if (transferReportEntryResult.useInDeposit) {
                                    matchTransaction({
                                        netSuiteTransaction: transferReportEntryResult.transactionDetails,
                                        deposit: deposit_1,
                                        key: resourceType,
                                        resourceType: transferReportEntryResult.resourceType,
                                        resourceId: transferReportEntryResult.resourceId,
                                        transferId: transferReportEntryResult.transferId
                                    });
                                    if (transferReportEntryResult.transactionDetails.isCashSale && transferReportEntryResult.transactionDetails.cashSaleDepositID > 0) {
                                        var foundDepositLine = deposit_1.findSublistLineWithValue({ sublistId: 'payment', fieldId: 'id', value: "" + transferReportEntryResult.transactionDetails.cashSaleDepositID });
                                        log.debug('foundDepositLine CS --- ', foundDepositLine);
                                        if (foundDepositLine !== -1) {
                                            log.audit('transferReportEntryResult.transactionDetails.cashSaleDepositSettlementAmount', transferReportEntryResult.transactionDetails.cashSaleDepositSettlementAmount);
                                            deposit_1.selectLine({ sublistId: 'payment', line: foundDepositLine });
                                            var isMultiCurrency = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                                            if (isMultiCurrency) {
                                                deposit_1.setCurrentSublistValue({ sublistId: 'payment', fieldId: 'paymentamount', value: transferReportEntryResult.transactionDetails.cashSaleDepositSettlementAmount });
                                            }
                                            else {
                                                deposit_1.setCurrentSublistValue({ sublistId: 'payment', fieldId: 'amount', value: transferReportEntryResult.transactionDetails.cashSaleDepositSettlementAmount });
                                            }
                                            deposit_1.setCurrentSublistValue({ sublistId: 'payment', fieldId: 'deposit', value: true });
                                            deposit_1.commitLine({ sublistId: 'payment' });
                                        }
                                        else {
                                            log.error('Transaction not available in NetSuite CS', transferReportEntryResult.transactionDetails);
                                        }
                                    }
                                }
                                if (transferReportEntryResult.adjustmentAmount) {
                                    addAdjustment({
                                        transferReportEntryResult: transferReportEntryResult,
                                        deposit: deposit_1,
                                        amount: transferReportEntryResult.adjustmentAmount,
                                        account: payStand.PartialPaymentAccount,
                                        netSuiteTransaction: transferReportEntryResult.transactionDetails,
                                        resourceType: resourceType
                                    });
                                }
                                if (transferReportEntryResult.cashBackAmount) {
                                    if (!customer) {
                                        transferReportEntryResult.transactionDetails.customer = transferReportEntryResult.payerName;
                                    }
                                    addCashBack({
                                        transferReportEntryResult: transferReportEntryResult,
                                        deposit: deposit_1,
                                        amount: transferReportEntryResult.cashBackAmount,
                                        account: payStand.PartialPaymentAccount,
                                        netSuiteTransaction: transferReportEntryResult.transactionDetails,
                                        resourceType: resourceType
                                    });
                                }
                                break;
                            case 'refund':
                                if (transferReportEntryResult.useInDeposit) {
                                    if (transferReportEntryResult.resourceStatus === 'reversed') {
                                        addAdjustment({
                                            transferReportEntryResult: transferReportEntryResult,
                                            deposit: deposit_1,
                                            amount: +transferReportEntryResult.transferAmount,
                                            account: payStand.AdjustmentAccount,
                                            netSuiteTransaction: transferReportEntryResult.relatedTransactionDetails,
                                            resourceType: resourceType
                                        });
                                    }
                                    else {
                                        matchTransaction({
                                            netSuiteTransaction: transferReportEntryResult.transactionDetails,
                                            deposit: deposit_1,
                                            key: resourceType,
                                            resourceType: transferReportEntryResult.resourceType,
                                            resourceId: transferReportEntryResult.resourceId,
                                            transferId: transferReportEntryResult.transferId
                                        });
                                    }
                                }
                                break;
                            case 'adjustment':
                                if (!customer) {
                                    transferReportEntryResult.relatedTransactionDetails.customer = transferReportEntryResult.payerName;
                                }
                                addAdjustment({
                                    transferReportEntryResult: transferReportEntryResult,
                                    deposit: deposit_1,
                                    amount: +transferReportEntryResult.transferAmount,
                                    account: payStand.AdjustmentAccount,
                                    netSuiteTransaction: transferReportEntryResult.relatedTransactionDetails,
                                    resourceType: resourceType
                                });
                                break;
                            case 'dispute':
                                var skipDisputeCashBack = false;
                                if (!customer) {
                                    transferReportEntryResult.relatedTransactionDetails.customer = transferReportEntryResult.payerName;
                                }
                                if (!skipDisputeCashBack) {
                                    addCashBack({
                                        transferReportEntryResult: transferReportEntryResult,
                                        deposit: deposit_1,
                                        amount: +transferReportEntryResult.transferAmount,
                                        account: payStand.DisputeAccount,
                                        netSuiteTransaction: transferReportEntryResult.relatedTransactionDetails,
                                        resourceType: resourceType
                                    });
                                }
                                break;
                            case 'fee':
                                var skipCashBack = false;
                                if (!customer) {
                                    transferReportEntryResult.relatedTransactionDetails.customer = transferReportEntryResult.payerName;
                                }
                                var sameAmount = false;
                                if (_.get(transferReportEntryResult, 'transferAmount') && _.get(transferReportEntryResult, 'transactionDetails.amount')) {
                                    sameAmount = Big(+transferReportEntryResult.transferAmount).eq(Big(+transferReportEntryResult.transactionDetails.amount));
                                }
                                var alreadyProccessed = _.includes(feesProcessed_1, _.get(transferReportEntryResult, 'transactionDetails.id'));
                                transferReportEntryResult.useInDeposit = sameAmount && !alreadyProccessed;
                                if (transferReportEntryResult.useInDeposit) {
                                    skipCashBack = matchTransaction({
                                        netSuiteTransaction: transferReportEntryResult.transactionDetails,
                                        deposit: deposit_1,
                                        key: resourceType,
                                        resourceType: transferReportEntryResult.resourceType,
                                        resourceId: transferReportEntryResult.resourceId,
                                        transferId: transferReportEntryResult.transferId
                                    });
                                }
                                if (!skipCashBack) {
                                    addCashBack({
                                        transferReportEntryResult: transferReportEntryResult,
                                        deposit: deposit_1,
                                        amount: +transferReportEntryResult.transferAmount,
                                        account: resourceType === 'fee' ? payStand.PayStandFeesAccount : payStand.DisputeAccount,
                                        netSuiteTransaction: transferReportEntryResult.relatedTransactionDetails,
                                        resourceType: resourceType
                                    });
                                }
                                else {
                                    // If there is a Fee transaction in Netsuite, we search for their related Payment details
                                    var transactionType = transferReportEntryResult.transactionDetails.type;
                                    var transactionId = transferReportEntryResult.transactionDetails.id;
                                    var payment = getRelatedPaymentDetails(transactionType, transactionId);
                                    // We want to check if there is feeSplit object before trying to retrieve attributes from it
                                    if (payment && payment.feeSplit) {
                                        var payerTotalFees = (_a = payment.feeSplit || {}, _a.payerTotalFees), networkFees = _a.networkFees, feeSplitType = _a.feeSplitType, merchantTotalFees = _a.merchantTotalFees;
                                        // If convenience fees are active AND convenience fee is less than actual Paystand Fee
                                        if (feeSplitType === 'recoup_custom_of_subtotal' && +payerTotalFees < +networkFees) {
                                            // We create a Deposit cash back for the pending fee amount (merchantTotalFees)
                                            addCashBack({
                                                transferReportEntryResult: transferReportEntryResult,
                                                deposit: deposit_1,
                                                amount: +merchantTotalFees * -1,
                                                account: payStand.PayStandFeesAccount,
                                                netSuiteTransaction: transferReportEntryResult.relatedTransactionDetails,
                                                resourceType: resourceType
                                            });
                                        }
                                    }
                                }
                                if (_.get(transferReportEntryResult, 'transactionDetails.id')) {
                                    feesProcessed_1.push(transferReportEntryResult.transactionDetails.id);
                                }
                                break;
                        }
                        return true;
                    });
                    var depositId = deposit_1.save();
                    log.debug('summarize - deposit Id', depositId);
                    var depositResult = record.load({ type: record.Type.DEPOSIT, id: depositId });
                    var totalDeposit = depositResult.getValue({ fieldId: 'total' }).toString();
                    if (!+Big(totalDeposit).eq(+transferReport.amount)) {
                        // TODO: Alert someone that the Transfer Report didn't match the generated Deposit
                        log.error("The generated Deposit total " + totalDeposit, "The Transfer Report amount: " + transferReport.amount);
                        // Its critical that we delete the Bank Deposit so our acccounting matchs Paystand.
                        record.delete({
                            type: record.Type.DEPOSIT,
                            id: depositId
                        });
                        PayStand_TransferReportRequest_1.updateTransferRequestRecord(unprocessedTransferReportRequest.transferReportRequestId, PayStand_Event_1.Status.Error, "Deleted generated deposit, The Transfer Report amount: " + transferReport.amount + " and the total is: " + totalDeposit);
                        // TODO: Need to unwind any changes done to the Payment records as well.  I va!
                    }
                    else {
                        PayStand_TransferReportRequest_1.updateTransferRequestRecord(unprocessedTransferReportRequest.transferReportRequestId, PayStand_Event_1.Status.Processed, 'Process finished, deposit attached', depositId);
                        /*trigger the not schedule deployment, so the process can continue, only if the mr not fail and we have a deposit done.*/
                        PayStand_TransferReportRequest_1.processTransferReportRequests();
                    }
                }
                catch (ex) {
                    log.error('summarize - create deposit', ex);
                    log.error('summarize - create deposit ex.message', ex.message);
                    log.debug('in unprocessedTransferReportRequest', unprocessedTransferReportRequest);
                    PayStand_TransferReportRequest_1.updateTransferRequestRecord(unprocessedTransferReportRequest.transferReportRequestId, PayStand_Event_1.Status.Error, ex.message.slice(0, 99990) + '...');
                }
            },
            fail: function (connectResponse) {
                PayStand_TransferReportRequest_1.updateTransferRequestRecord(unprocessedTransferReportRequest.transferReportRequestId, PayStand_Event_1.Status.Error, "Error on connection : " + connectResponse.body);
                throw connectResponse.body;
            }
        });
    };
    var matchTransaction = function (options) {
        var matched = false;
        // (Transaction section) match with a Transaction
        // aca tengo que setear el amount si la multicurrency esta habilitada!
        if (options.netSuiteTransaction && options.netSuiteTransaction.id > 0) {
            var foundDepositLine = options.deposit.findSublistLineWithValue({ sublistId: 'payment', fieldId: 'id', value: "" + options.netSuiteTransaction.id });
            log.debug('foundDepositLine --- ', foundDepositLine);
            if (foundDepositLine !== -1) {
                var tran_settlementAmount = options.netSuiteTransaction.settlementAmount;
                var tran_cashSaleDepositSettlementAmount = options.netSuiteTransaction.cashSaleDepositSettlementAmount;
                log.debug('tran_settlementAmount --- ', tran_settlementAmount);
                log.debug('tran_cashSaleDepositSettlementAmount --- ', tran_cashSaleDepositSettlementAmount);
                if (options.netSuiteTransaction.type === 'cashsale' && tran_cashSaleDepositSettlementAmount > 0) {
                    log.debug('options.netSuiteTransaction.type --- ', options.netSuiteTransaction.type);
                    tran_settlementAmount = +Big(tran_settlementAmount).minus(Big(tran_cashSaleDepositSettlementAmount));
                }
                log.debug('tran_settlementAmount --- ', tran_settlementAmount);
                options.deposit.selectLine({ sublistId: 'payment', line: foundDepositLine });
                var isMultiCurrency = runtime.isFeatureInEffect({ feature: 'MULTICURRENCY' });
                if (isMultiCurrency) {
                    options.deposit.setCurrentSublistValue({ sublistId: 'payment', fieldId: 'paymentamount', value: tran_settlementAmount });
                }
                else {
                    options.deposit.setCurrentSublistValue({ sublistId: 'payment', fieldId: 'amount', value: tran_settlementAmount });
                }
                options.deposit.setCurrentSublistValue({ sublistId: 'payment', fieldId: 'deposit', value: true });
                options.deposit.commitLine({ sublistId: 'payment' });
                matched = true;
            }
            else {
                log.error('Transaction not available in NetSuite', options.netSuiteTransaction);
            }
        }
        else {
            // TODO: What should I do here?  throw an execption?  Reminder, there's no real responses back to PayStand on this failure.
            log.error('Transaction was not found in NetSuite', options.netSuiteTransaction);
            var resourceType = options.resourceType;
            var resourceId = options.resourceId;
            PayStand_Error_1.errorHandler({
                errorType: PayStand_Error_1.ERROR_TYPE.validationError,
                ref: 'ecd91fs548ch424b9846b6086d5dc3ac',
                explanation: "Transaction was not found in NetSuite. resourceType: " + resourceType.replace(/"/g, '') + ", resourceId: " + resourceId.replace(/"/g, '')
            });
        }
        return matched;
    };
    var addCashBack = function (options) {
        // (Cash Back section)
        log.debug('Adding line to CASH BACK', options);
        log.debug('Adding line to CASH BACK - Amount', options.amount * -1);
        options.deposit.selectNewLine({ sublistId: 'cashback' });
        if (options.transferReportEntryResult.netsuiteCustomerId && options.transferReportEntryResult.netsuiteCustomerId > -1) {
            options.deposit.setCurrentSublistValue({ sublistId: 'cashback', fieldId: 'entity', value: options.transferReportEntryResult.netsuiteCustomerId });
        }
        options.deposit.setCurrentSublistValue({ sublistId: 'cashback', fieldId: 'amount', value: options.amount * -1 });
        options.deposit.setCurrentSublistValue({ sublistId: 'cashback', fieldId: 'account', value: options.account });
        options.deposit.setCurrentSublistValue({ sublistId: 'cashback', fieldId: 'department', value: 50 });
        if (options.netSuiteTransaction && options.netSuiteTransaction.id > 0) {
            var tranid = options.netSuiteTransaction.tranid;
            if (!tranid) {
                tranid = options.netSuiteTransaction.id;
            }
            createUserNote({
                externalId: options.transferReportEntryResult.resourceId,
                recordId: options.netSuiteTransaction.id,
                title: "Paystand " + options.resourceType,
                note: "A " + options.resourceType + " of " + options.amount * -1
            });
            options.deposit.setCurrentSublistValue({ sublistId: 'cashback', fieldId: 'refnum', value: options.netSuiteTransaction.tranid });
            options.deposit.setCurrentSublistValue({ sublistId: 'cashback', fieldId: 'memo', value: options.resourceType + " : Related to " + options.netSuiteTransaction.type + " : " + tranid + " by " + options.netSuiteTransaction.customer });
        }
        options.deposit.commitLine({ sublistId: 'cashback' });
    };
    var addAdjustment = function (options) {
        // (Other Deposits section)
        log.debug('Adding line to OTHER', options);
        options.deposit.selectNewLine({ sublistId: 'other' });
        if (options.transferReportEntryResult.netsuiteCustomerId && options.transferReportEntryResult.netsuiteCustomerId > -1) {
            options.deposit.setCurrentSublistValue({ sublistId: 'other', fieldId: 'entity', value: options.transferReportEntryResult.netsuiteCustomerId });
        }
        options.deposit.setCurrentSublistValue({ sublistId: 'other', fieldId: 'amount', value: options.amount });
        options.deposit.setCurrentSublistValue({ sublistId: 'other', fieldId: 'account', value: options.account });
        if (options.transferReportEntryResult.resourceDescription) {
            options.deposit.setCurrentSublistValue({ sublistId: 'other', fieldId: 'memo', value: "" + options.transferReportEntryResult.resourceDescription });
        }
        options.deposit.commitLine({ sublistId: 'other' });
    };
    var getRelatedPaymentDetails = function (transactionType, transactionId) {
        var payment;
        search.create({
            type: transactionType,
            columns: [
                {
                    name: 'custrecord_ps_event_payload',
                    join: 'custbody_paystand_event'
                }
            ],
            filters: [search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: transactionId
                })]
        }).run().each(function (result) {
            var rawResult = result.getValue(result.columns[0]);
            if (typeof rawResult === 'string') {
                var rawPaymentPayload = JSON.parse(rawResult);
                payment = rawPaymentPayload.payment;
                return true;
            }
        });
        return payment;
    };
    var createUserNote = function (details) {
        var userNote = record.create({
            type: record.Type.NOTE,
            isDynamic: true
        });
        userNote.setValue({ fieldId: 'externalId', value: details.externalId });
        userNote.setValue({ fieldId: 'transaction', value: "" + details.recordId });
        userNote.setValue({ fieldId: 'title', value: details.title });
        userNote.setValue({ fieldId: 'note', value: details.note });
        userNote.setValue({ fieldId: 'notetype', value: NOTETYPE.NOTE });
        try {
            userNote.save();
        }
        catch (_a) {
        }
    };
    var searchNSAccount = function (psBankId) {
        var nsAccountId = '';
        try {
            if (psBankId) {
                search.create({
                    type: search.Type.ACCOUNT,
                    filters: ['custrecord_ps_bank_id', 'is', psBankId]
                }).run().each(function (result) {
                    nsAccountId = result.id;
                    return false;
                });
            }
        }
        catch (error) {
            log.debug('error', error);
        }
        return nsAccountId;
    };
});
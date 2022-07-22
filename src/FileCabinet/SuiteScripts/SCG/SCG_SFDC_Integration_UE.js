/**
 * Set links on Sales Orders, update Customer financial info, set timestamp on
 * records to be processed via MR, monitor credits and payments for related
 * invoice updates like status
 *
 * @author Andrew Hadfield - SaaS Consulting Group
 *
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/record', './SCG_SFDC_LB', 'N/search', 'N/config', 'N/task'],

function(runtime, record, lib, search, config, task) {
	var SCG_USER_EMAIL = 'netsuite_team+attentive_mobile@saascg.com';
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {
    	try {
    		var exeContext = runtime.executionContext;
    		if (exeContext === runtime.ContextType.USER_INTERFACE) {
    			var sfUrl;
        		var rec = scriptContext.newRecord;
        		var generalPref = config.load({ type: config.Type.COMPANY_PREFERENCES });
        		var envType = runtime.envType;
        		if (envType === runtime.EnvType.SANDBOX) {
        			sfUrl = generalPref.getValue('custscript_scg_sf_sand_url');
        		}
        		else {
        			sfUrl = generalPref.getValue('custscript_scg_sf_prod_url');
        		}
        		
        		if (rec.type === record.Type.SALES_ORDER) {
        			var oppId = rec.getValue('custbody_scg_sf_opp_id');
        			if (oppId) {
        				sfUrl += 'Opportunity/' + oppId + '/view';
            			rec.setValue('custbody_scg_sf_link', sfUrl);
        			}
        		}
    		}
    	}
    	catch (ex) {
    		lib.errorLog(ex);
    	}

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {
    	try {
    		var contextType = scriptContext.type;
    		if (contextType === scriptContext.UserEventType.CREATE || contextType === scriptContext.UserEventType.EDIT || contextType === scriptContext.UserEventType.XEDIT) {
    			var rec = scriptContext.newRecord;
    			var exeContext = runtime.executionContext;
        		var userObj = runtime.getCurrentUser();
            	var userEmail = userObj.email;
            	if (contextType === scriptContext.UserEventType.CREATE) {
            		rec.setValue({ fieldId: 'custbody_scg_sf_fin_tran_custrecord', value: null });
				}
				if (userEmail !== SCG_USER_EMAIL || (userEmail === SCG_USER_EMAIL && exeContext !== runtime.ContextType.WEBSERVICES)) { //allow other edits for testing
					if (rec.type === record.Type.CUSTOMER) {
						if (contextType !== scriptContext.UserEventType.CREATE) {
							updateCustomerValues(rec);
						}
					}
					else if (rec.type === record.Type.INVOICE || rec.type === record.Type.CUSTOMER_PAYMENT || rec.type === record.Type.CREDIT_MEMO) {
						var timestamp = lib.getDateTimeTz();
						rec.setValue({ fieldId: 'custbody_scg_sf_date_time', value: timestamp });
					}
				}
    		}
    	}   	
    	catch (ex) {
    		lib.errorLog(ex);
    	}
    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	try {
    		var contextType = scriptContext.type;
    		if (contextType === scriptContext.UserEventType.CREATE || contextType === scriptContext.UserEventType.EDIT || contextType === scriptContext.UserEventType.XEDIT) {
				var entityId, entityLookup, entityRec;
				var rec = scriptContext.newRecord;
				if (rec.type === record.Type.INVOICE || rec.type === record.Type.CUSTOMER_PAYMENT || rec.type === record.Type.CREDIT_MEMO) { // Financial Transactions
					entityId = (rec.type === record.Type.CUSTOMER_PAYMENT) ? rec.getValue('customer') : rec.getValue('entity');
					entityLookup = search.lookupFields({ type: record.Type.CUSTOMER, id: Number(entityId), columns: ['custentity_scg_sf_account_id'] });
					if (entityLookup.custentity_scg_sf_account_id) {
						if (!rec.id && rec.type === record.Type.CUSTOMER_PAYMENT) { // If only credits used, actually no id or new record just application of credit memo
							log.debug({ title: 'payment with no id'});
							for (var x = 0; x < rec.getLineCount('credit'); x++) {
								var apply = rec.getSublistValue({ sublistId: 'credit', fieldId: 'apply', line: x});
								if (apply === true) {
									var applyType = rec.getSublistValue({ sublistId: 'credit', fieldId: 'trantype', line: x});
									if (applyType === 'CustCred') {
										var applyId = rec.getSublistValue({ sublistId: 'credit', fieldId: 'internalid', line: x});
										var params = {};
										params.type = record.Type.CREDIT_MEMO;
										params.id = applyId;
										params.isCreate = false;
										var finTranId = lib.processFinTran(params);
										log.debug({ title:'applied to credit memo finTranId', details: finTranId });
									}
								}
							}
						}
						if (rec.type === record.Type.CUSTOMER_PAYMENT || rec.type === record.Type.CREDIT_MEMO) { // Handle applied to invoices
							for (var x = 0; x < rec.getLineCount('apply'); x++) {
								var apply = rec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: x});
								if (apply === true) {
									var applyType = rec.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: x});
									if (applyType === 'CustInvc') {
										var applyId = rec.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: x});
										var params = {};
										params.type = record.Type.INVOICE;
										params.id = applyId;
										params.isCreate = false;
										var finTranId = lib.processFinTran(params);
										log.debug({ title:'applied to invoice finTranId', details: finTranId });
									}
								}
							}
						}
						entityRec = record.load({ type: record.Type.CUSTOMER, id: entityId });
						entityRec = updateCustomerValues(entityRec);
						entityRec.save();
						log.debug({ title: 'customer updated', details: entityId });
					}
					//Workflow was not triggering UE so added credited in full functionality here, not just for SF customers
					if (rec.type === record.Type.CREDIT_MEMO) {
						for (var x = 0; x < rec.getLineCount('apply'); x++) {
							var apply = rec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: x});
							if (apply === true) {
								var applyType = rec.getSublistValue({ sublistId: 'apply', fieldId: 'trantype', line: x});
								if (applyType === 'CustInvc') {
									var applyId = rec.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: x});
									var pmtAmount = rec.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: x});
									var invTotal = rec.getSublistValue({ sublistId: 'apply', fieldId: 'total', line: x});
									//log.debug({ title: 'amounts', details: pmtAmount + ', ' + invTotal});
									if (pmtAmount === invTotal)
										record.submitFields({ type: record.Type.INVOICE, id: applyId, values: {custbody_scg_credited_in_full: true} });
								}
							}
						}
					}
				}
				if (rec.type === record.Type.SALES_ORDER && contextType === scriptContext.UserEventType.CREATE) {
					entityId = rec.getValue('entity');
					entityLookup = search.lookupFields({ type: record.Type.CUSTOMER, id: entityId, columns: ['custentity_scg_sf_account_id'] });
					if (entityLookup.custentity_scg_sf_account_id) {
						entityRec = record.load({ type: record.Type.CUSTOMER, id: entityId});
						entityRec = updateCustomerValues(entityRec);
						entityRec.save();
						log.debug({ title: 'customer updated so create', details: entityId });
					}
				}
    		}	
    	}
    	catch (ex) {
    		lib.errorLog(ex);
    	}
    }
    function updateCustomerValues(customerRecord) {
    	var customerId = customerRecord.id;
		var overdueBal = lib.getFxOverdueBalance(customerId);
		var totalInvoiced = lib.getFxTotalInvoiced(customerId);
		var totalCredits = lib.getFxTotalCredits(customerId);
		var totalPaid = lib.getFxTotalPaid(customerId);
		var timestamp = lib.getDateTimeTz();
		customerRecord.setValue({ fieldId: 'custentity_scg_sf_date_time', value: timestamp });
		customerRecord.setValue({ fieldId: 'custentity_scg_sf_overdue_bal', value: overdueBal });
		customerRecord.setValue({ fieldId: 'custentity_scg_sf_total_invcd', value: totalInvoiced });
		customerRecord.setValue({ fieldId: 'custentity_scg_sf_total_cred', value: totalCredits });
		customerRecord.setValue({ fieldId: 'custentity_scg_sf_total_paid', value: totalPaid });
		return customerRecord;
	}
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});

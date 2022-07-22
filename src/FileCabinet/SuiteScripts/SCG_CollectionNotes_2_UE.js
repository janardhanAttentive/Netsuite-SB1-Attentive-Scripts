/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     21 Jan 2021     Doug Humberd     Handles User Events on Collection Notes Records
 *                          Doug Humberd     Copies the Collection Notes Record to Additional Invoices, unchecks older Follow Up Completed checkboxes
 * 
 */
define(['N/record', 'N/search', 'N/runtime'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, runtime) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(context) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(context) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {
    	
    	try{
    		am_cn_copyToInvs(context);
    	}catch(e){
    		am_cn_logError(e);
    	}

    }
    
    
    
    
    
    /**
     * Copies the Collection Notes Record to Additional Invoices
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     * @Since 2015.2
     */
    function am_cn_copyToInvs(context){
    	
    	//log.debug('copyToInvs Context Type', context.type);
    	//log.debug('Context Object', context);
    	
    	//Run on Create or Edit
    	if (context.type != 'create' && context.type != 'edit'){
    	//if (context.type != 'create'){
    		return;
    	}
    	
    	log.debug('copyToInvs', 'START');
    	
    	var remUsage = runtime.getCurrentScript().getRemainingUsage();
    	log.debug('Remaining Governance Units', remUsage);
    	
    	var cnRec = context.newRecord;
    	var cnId = context.newRecord.id;
    	log.debug('Collection Notes ID', cnId);
    	
    	var copyTo = cnRec.getValue({
    	    fieldId: 'custrecord_scg_copyto'
    	});
    	log.debug('Copy To', copyTo);
    	
    	if (copyTo == false){
    		log.debug('Copy To Not Checked', 'EXIT');
    		return;
    	}
    	
    	
    	//Get Values from Collection Notes Record
    	var reporter = cnRec.getValue({
    	    fieldId: 'custrecord_scg_cn_reporter'
    	});
    	
    	var followUpDate = cnRec.getValue({
    	    fieldId: 'custrecord_scg_cn_follow_up_date'
    	});
    	
    	var notes = cnRec.getValue({
    	    fieldId: 'custrecord_scg_cn_notes'
    	});
    	
    	var promPayDate = cnRec.getValue({
    	    fieldId: 'custrecord_sc_cn_payment_date'
    	});
    	
    	var methOfComm = cnRec.getValue({
    	    fieldId: 'custrecord_scg_cn_method_comm'
    	});
    	
    	var status = cnRec.getValue({
    	    fieldId: 'custrecord_scg_cn_status'
    	});
    	
    	var dateCreated = cnRec.getValue({
    	    fieldId: 'custrecord_scg_cn_date_created'
    	});
    	
    	var collProb = cnRec.getValue({
    	    fieldId: 'custrecord_collection_probability'
    	});
    	
    	//var issueType = cnRec.getValue({
    	    //fieldId: 'custrecord_scg_collection_issue_type'
    	//});
    	
    	//var customer = cnRec.getValue({
    	    //fieldId: 'custrecord_scg_customer'
    	//});
    	
    	
    	log.debug('Reporter', reporter);
    	log.debug('Follow Up Date', followUpDate);
    	log.debug('Notes', notes);
    	log.debug('Promised Payment Date', promPayDate);
    	log.debug('Method of Communication', methOfComm);
    	log.debug('Status', status);
    	log.debug('Date Created', dateCreated);
    	log.debug('Collection Probability', collProb);
    	//log.debug('Issue Type', issueType);
    	//log.debug('Customer', customer);
    	
    	
    	
    	var copyToInvs = cnRec.getValue({
    	    fieldId: 'custrecord_scg_copy_to_invs'
    	});
    	log.debug('Copy To Invoices', copyToInvs);
    	
    	var copyToInvLength = copyToInvs.length;
    	log.debug('Copy To Invs Length', copyToInvLength);
    	

    	
    	for (var i = 0; i < copyToInvLength; i++){
    		
    		var invId = copyToInvs[i];
    		log.debug('Invoice Id', invId);
    		
    		//***************************************************************************
    		
    		//Create New Collection Notes Record
    		var collectionNotesRecord = record.create({
    		       type: 'customrecord_scg_collection_note',
    		       isDynamic: true
    		       //defaultValues: {
    		    	   //custrecord_scg_cn_transaction : invId
    		       //}
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_transaction',
    		    value: invId,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_reporter',
    		    value: reporter,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_follow_up_date',
    		    value: followUpDate,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_notes',
    		    value: notes,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_sc_cn_payment_date',
    		    value: promPayDate,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_method_comm',
    		    value: methOfComm,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_status',
    		    value: status,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_scg_cn_date_created',
    		    value: dateCreated,
    		    ignoreFieldChange: true
    		});
    		
    		collectionNotesRecord.setValue({
    		    fieldId: 'custrecord_collection_probability',
    		    value: collProb,
    		    ignoreFieldChange: true
    		});
    		
    		//collectionNotesRecord.setValue({
    		    //fieldId: 'custrecord_scg_collection_issue_type',
    		    //value: issueType,
    		    //ignoreFieldChange: true
    		//});
    		
    		//collectionNotesRecord.setValue({
    		    //fieldId: 'custrecord_scg_customer',
    		    //value: customer,
    		    //ignoreFieldChange: true
    		//});
    		
    		var recordId = collectionNotesRecord.save({
    		    enableSourcing: true,
    		    ignoreMandatoryFields: true
    		});
    		log.debug('recordId (Created Collection Note Id)', recordId);
    		
    		//***************************************************************************
    		
    		//Update the Invoice Fields
    		var invoiceId = record.submitFields({
        	    type: 'invoice',
        	    id: invId,
        	    values: {
        	        'custbody_collection_probability': collProb,
    	        	'custbody_scg_cn_date': dateCreated,
    	        	'custbody_scg_cn_follow_up_date': followUpDate,
    	        	'custbody_scg_cn_notes': notes,
    	        	'custbody_scg_cn_payment_date': promPayDate,
    	        	'custbody_scg_cn_reporter': reporter,
    	        	'custbody_scg_cn_col_note_status': status,
    	        	'custbody_scg_cn_method_comm': methOfComm
        	    }
        	});
    		log.debug('invoiceId (Invoice Updated with CN Fields)', invoiceId);
    		
    		//***************************************************************************
    		
    		//Update the Follow Up Completed Values on all previous Collection Notes
    		log.debug('Update Follow Up Completed Checkboxes', 'UPDATE FOLLOW UP');
        	
        	//Identity Other Collection Note Records to be Updated
          	var getOtherCollNotesSearch = search.create({
          		type:'customrecord_scg_collection_note',
          		columns: ['internalid'],
          		filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_scg_cn_transaction', 'anyof', invId],
                    'AND', 
                    ['internalid', 'noneof', recordId],
                    'AND',
                    ['custrecord_scg_cn_follow_up_done', 'is', 'F']
                ]
          	});
          	
          	var result = getOtherCollNotesSearch.run();
          	
          	if (!result){
          		return;
          	}
          	
          	var resultRange = result.getRange({
                start: 0,
                end: 1000
          	});
          	
          	for (var x = 0; x < resultRange.length; x++){
          		
          		var otherColNoteId = resultRange[x].getValue({
                    name: 'internalid'
          		});
          		log.debug('Other Collection Note ID from Result ' + x, otherColNoteId);
          		
          		log.debug('Check off Follow Up Completed', 'CHECK');
          		var updatedOtherRec = record.submitFields({
          	        type: 'customrecord_scg_collection_note',
          	        id: otherColNoteId,
          	        values: {
          	        	'custrecord_scg_cn_follow_up_done' : true
          	        }
          	      });
          		
          	}//End for i loop
    		
    		//***************************************************************************
    		
    	}//End for i loop
    	
    	
    	
    	//Remove the 'Copy To' and 'Copy to Invs' values from the Collection Note Record
    	var collNotesId = record.submitFields({
    	    type: 'customrecord_scg_collection_note',
    	    id: cnId,
    	    values: {
    	        'custrecord_scg_copyto': false,
	        	'custrecord_scg_copy_to_invs': ''
    	    }
    	});
    	//log.debug('collNotesId', collNotesId);
    	
    	var remUsage = runtime.getCurrentScript().getRemainingUsage();
    	log.debug('Remaining Governance Units', remUsage);
    	
    	log.debug('copyToInvs', 'END');
    	
    }
    
    
    
    
    
    
    
    
    function isEmpty(stValue)
    { 
        if ((stValue == '') || (stValue == null) ||(stValue == undefined))
        {
            return true;
        }
        
        return false;
    }  

    
    

    return {
        //beforeLoad: beforeLoad,
        //beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});





/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord creditmemo, customerpayment, journalentry
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function am_cn_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}




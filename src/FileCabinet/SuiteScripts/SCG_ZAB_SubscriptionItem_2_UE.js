/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     07 Apr 2021     Doug Humberd     Handles User Events on ZAB Subscription Item Records
 *                          Doug Humberd     Calculates and sets the 'End Date' field when MTM is checked and Free Trial End Date is empty (on Subscription record)
 * 1.05     12 May 2021     Doug Humberd     Updated 'am_zsi_setEndDate_MTM' to check Promotional Credit checkbox prior to setting End Date
 * 1.10     30 Mar 2022     Doug Humberd     Updated to use Created Date instead of Start Date when calculating End Date
 * 1.15     22 Apr 2022     Doug Humberd     Updated 'am_zsi_setEndDate_MTM' to not run if Free Trial Offset Item = 'Yes' (Text value)
 * 
 */
define(['N/record', 'N/runtime', 'N/search', 'N/email', 'N/render', 'N/format'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, email, render, format) {
   
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
    	
    	try{
    		am_zsi_setEndDate_MTM(context);
    	}catch(e){
    		am_zsi_logError(e);
    	}

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

    }

    
    
    
    
    
    function am_zsi_setEndDate_MTM(context){
    	
    	//Run on Create
    	//if (context.type != 'create' && context.type != 'edit'){//TEMP CODE
    	if (context.type != 'create'){
    		return;
    	}
    	
    	var zsiRec = context.newRecord;
    	//var zsId = zsiRec.id;
    	
    	
    	//Do not run function if Free Trial Offset Item = Yes
    	var freeTrialOffsetItem = zsiRec.getValue({
    		fieldId: 'custrecord_att_si_free_trial_offset'
    	});
    	log.debug('Free Trial Offset Item', freeTrialOffsetItem);
    	
    	if (freeTrialOffsetItem == 'Yes' || freeTrialOffsetItem == 'yes'){
    		log.debug('Free Trial Offset Item = Yes', 'EXIT');
    		return;
    	}
    	
    	
    	var promCredit = zsiRec.getValue({
    		fieldId: 'custrecordatt_si_promotional_credit'
    	});
    	log.debug('Promotional Credit', promCredit);
    	
    	
    	var zabSubscr = zsiRec.getValue({
    		fieldId: 'custrecordzab_si_subscription'
    	});
    	log.debug('ZAB Subscription', zabSubscr);
    	
    	
    	//Lookup Values from the ZAB Subscription Record
		var zsFields = search.lookupFields({
    	    type: 'customrecordzab_subscription',
    	    id: zabSubscr,
    	    //columns: ['custrecord_scg_mtm', 'custrecord_att_s_free_trial_end_date', 'custrecord_att_s_actual_trial_end_date', 'custrecord_scg_s_promo_credit_end_date']
    	    columns: ['custrecord_scg_mtm', 'custrecord_scg_s_promo_credit_end_date']
    	});
    	log.debug('ZAB Subscription Fields', zsFields);
    	
		var mtm = zsFields.custrecord_scg_mtm;
    	log.debug('MTM', mtm);
    	
    	//var freeTrial = '';
    	//if (!isEmpty(zsFields.custrecord_att_s_free_trial_end_date)){
    		//freeTrial = zsFields.custrecord_att_s_free_trial_end_date;
    	//}
    	//log.debug('Free Trial End Date', freeTrial);
    	
    	//var actualTrial = '';
    	//if (!isEmpty(zsFields.custrecord_att_s_actual_trial_end_date)){
    		//actualTrial = zsFields.custrecord_att_s_actual_trial_end_date;
    	//}
    	//log.debug('Actual Trial End Date', actualTrial);
    	
    	var promCredEndDate = '';
    	if (!isEmpty(zsFields.custrecord_scg_s_promo_credit_end_date)){
    		promCredEndDate = zsFields.custrecord_scg_s_promo_credit_end_date;
    	}
    	log.debug('Promotional Credit End Date', promCredEndDate);
    	
    	
    	//if (mtm == true && (isEmpty(freeTrial) || (!isEmpty(freeTrial) && !isEmpty(actualTrial)))){
    	if (mtm == true){
    		
    		if (promCredit == false){
    			
    			var dateOK = 'N';
    			
    			var startDate = zsiRec.getValue({
            		fieldId: 'custrecordzab_si_start_date'
            	});
            	log.debug('Start Date', startDate);
            	
            	var createdDate = new Date();
            	log.debug('Created Date', createdDate);
            	
            	//if (isEmpty(startDate)){
            		//log.debug('Start Date Empty', 'EXIT');
            		//return;
            	//}
            	
            	//var day = startDate.getDate();
            	var day = createdDate.getDate();
            	log.debug('Day of Month', day);
            	
            	var endDate;
            	
            	
            	//Set End Date to End of Month
            	if (day == '1'){
            		
            		//Set the transaction date (obj) to a string
            		endDate = format.format({
            			//value : startDate,
            			value : createdDate,
            			type : format.Type.DATE
            		});
            		//log.debug('End Date (formatted from startDate object)', endDate);
            		log.debug('End Date (formatted from createdDate object)', endDate);
            		
            		//Put End Date in NS Date Object
            		var date = new Date(endDate);
            		log.debug('date obj', date);
            		
            		//Change the object the the last day of the month
            		date.setMonth(date.getMonth() + 1);
            		date.setDate(date.getDate() - 1);
            		log.debug('date obj last of month', date);
            		
            		log.debug('dateOK before while', dateOK);
            		while(dateOK != 'Y'){
            			
            			if (date > startDate){
            				dateOK = 'Y';
            			}else{
            				//date.setDate(1);
            				date.setDate(date.getDate() + 1);
                    		date.setMonth(date.getMonth() + 1);
                    		date.setDate(date.getDate() - 1);
                    		log.debug('recalculated (new) date obj last of month', date);
            			}
            			log.debug('dateOK inside while', dateOK);
            			
            		}
            		
            		//Set the New Date Object (last of month) to a string
            		endDate = format.format({
            			value : date,
            			type : format.Type.DATE
            		});
            		log.debug('Last of Month (reformatted)', endDate);
            		
            		//Parse the string prior to writing to transaction record
            		endDate = format.parse({
            		value : endDate,
            		type : format.Type.DATE
            		});
            		log.debug('End Date After parse', endDate);
            		
            	}else{
            		
            		//Set the transaction date (obj) to a string
            		endDate = format.format({
            			//value : startDate,
            			value : createdDate,
            			type : format.Type.DATE
            		});
            		//log.debug('End Date (formatted from startDate object)', endDate);
            		log.debug('End Date (formatted from createdDate object)', endDate);
            		
            		//Put End Date in NS Date Object
            		var date = new Date(endDate);
            		log.debug('date obj', date);
            		
            		//Change the object the the last day of the month
            		date.setDate(1);
            		date.setMonth(date.getMonth() + 1);
            		date.setDate(date.getDate() - 1);
            		log.debug('date obj last of month', date);
            		
            		log.debug('dateOK before while', dateOK);
            		while(dateOK != 'Y'){
            			
            			if (date > startDate){
            				dateOK = 'Y';
            			}else{
            				//date.setDate(1);
            				date.setDate(date.getDate() + 1);
                    		date.setMonth(date.getMonth() + 1);
                    		date.setDate(date.getDate() - 1);
                    		log.debug('recalculated (new) date obj last of month', date);
            			}
            			log.debug('dateOK inside while', dateOK);
            			
            		}
            		
            		//Set the New Date Object (last of month) to a string
            		endDate = format.format({
            			value : date,
            			type : format.Type.DATE
            		});
            		log.debug('Last of Month (reformatted)', endDate);
            		
            		//Parse the string prior to writing to transaction record
            		endDate = format.parse({
            		value : endDate,
            		type : format.Type.DATE
            		});
            		log.debug('End Date After parse', endDate);
            		
            	}
            	
            	
            	//Set the End Date on the ZAB Subscription Record (Calculated Value)
            	zsiRec.setValue({
            	    fieldId: 'custrecordzab_si_end_date',
            	    value: endDate,
            	    ignoreFieldChange: true
            	});
    			
    		}else{//promCredit == true
    			
    			
    			//Put End Date in NS Date Object
        		var date = new Date(promCredEndDate);
        		log.debug('date obj', date);
        		
        		//Set the New Date Object (Promotional Credit End Date) to a string
        		endDate = format.format({
        			value : date,
        			type : format.Type.DATE
        		});
        		log.debug('Promotional Credit End Date (reformatted)', endDate);
        		
        		//Parse the string prior to writing to transaction record
        		endDate = format.parse({
        		value : endDate,
        		type : format.Type.DATE
        		});
        		log.debug('End Date After parse', endDate);
    			
    			
    			//Set the End Date on the ZAB Subscription Record (Promotional Credit End Date Value)
            	zsiRec.setValue({
            	    fieldId: 'custrecordzab_si_end_date',
            	    value: endDate,
            	    ignoreFieldChange: true
            	});
    			
    		}//End if (promCredit == true)

        	
    	}//End if (mtm == true && isEmpty(freeTrial))
    	
    	
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
        beforeSubmit: beforeSubmit,
        //afterSubmit: afterSubmit
    };
    
});





/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord customer
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function am_zsi_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}




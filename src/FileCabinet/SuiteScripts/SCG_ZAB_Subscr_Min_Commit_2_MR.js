/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Apr 2021     Doug Humberd     Sets Minimum Commitment Fields on the ZAB Subscription Record
 * 1.05       13 May 2021     Doug Humberd     Updated to add controls for blank values on the Subscription Record
 * 1.10       17 May 2021     Doug Humberd     Updated to incluce # of Periods logic, and functionality to keep the script from processing at the beginning of the month
 * 
 */
define(['N/record', 'N/runtime', 'N/search', 'N/format'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search, format) {
	
	const DAY_TO_RESUME_ID = '1';//Custom Record ID: Day of Month to Resume Min Commit Script
	
    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
    	
    	try {
            var zabSubscrSearch = search.load({
                id: 'customsearch_scg_zab_min_commit_current'
            });
            return zabSubscrSearch;
        } catch (error) {
            throw error.message;
        }

    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
    	
    	var searchResult = JSON.parse(context.value);
    	//log.debug('searchResult', searchResult);
        context.write({
            key: searchResult.id, 
            //value: searchResult.internalid.revenueArrangement
        });
        
        log.debug('ZAB_Subscr_Min_Commit_MR', 'START');
        
        
        //Compare today's date (day of month) with the value from the custom record
        //Do not run if the day is less than the custom record value
        var today = new Date();
        var day = today.getDate();
        log.debug('Current Day of Month', day);
        
        
        var customRecFields = search.lookupFields({
		    type: 'customrecord_scg_day2resume_mincommitscr',
		    id: DAY_TO_RESUME_ID,
		    columns: ['custrecord_scg_day2resume_mincommitscr']
		});
		log.debug('customRecFields', customRecFields);
		
		var dayToResume = '';
		if (!isEmpty(customRecFields.custrecord_scg_day2resume_mincommitscr)){
			dayToResume = customRecFields.custrecord_scg_day2resume_mincommitscr;
		}
		log.debug('Day to Resume Processing', dayToResume);
		
		//If Day to Resume value not found, set to 1 (No blackout period)
		if (dayToResume == ''){
			dayToResume = '1';
		}
        
        
		if (Number(day) < Number(dayToResume)){
			log.debug('Today < Day to Resume', 'DO NOT PROCESS - BLACKOUT PERIOD');
			return;
		}
        
		
		log.debug('Today >= Day to Resume', 'CONTINUE WITH PROCESSING');
        
        
        var zsId = context.key;
        var minAmt = searchResult.values['custrecordzab_minc_amount.CUSTRECORDZAB_MINC_SUBSCRIPTION'];
        var minStart = searchResult.values['custrecordzab_minc_start_date.CUSTRECORDZAB_MINC_SUBSCRIPTION'];
        var minEnd = searchResult.values['custrecordzab_minc_end_date.CUSTRECORDZAB_MINC_SUBSCRIPTION'];
        var numPds = searchResult.values['custrecord_scg_no_periods.CUSTRECORDZAB_MINC_SUBSCRIPTION'];
        
        log.debug('ZAB Subscription Id', zsId);
    	log.debug('Minimum Amount', minAmt);
    	log.debug('Minimum Start Date', minStart);
    	log.debug('Minimum End Date', minEnd);
    	log.debug('# of Periods', numPds);
    	
    	//TEMP CODE
    	//if (zsId != '2141'){
    		//return;
    	//}
    	
    	
    	try{
        	
        	var zsRec = record.load({
        		type: 'customrecordzab_subscription',
        		id: zsId,
        		isDynamic: false,
        	});
			
			log.debug('zsId',zsId);
        	
        	var zsMinAmt = zsRec.getValue({
    		    fieldId: 'custrecordatt_s_min_commit_amt'
    		});
    		log.debug('ZAB Subscription Min Commit Amt', zsMinAmt);
    		
    		var zsMinStart = zsRec.getValue({
    		    fieldId: 'custrecord_s_minc_sub_start_date'
    		});
    		log.debug('ZAB Subscription Min Commit Start Date', zsMinStart);
    		
    		var zsMinEnd = zsRec.getValue({
    		    fieldId: 'custrecord_s_minc_sub_end_date'
    		});
    		log.debug('ZAB Subscription Min Commit End Date', zsMinEnd);
    		
    		var zsNumPds = zsRec.getValue({
    		    fieldId: 'custrecord_scg_min_commit_per'
    		});
    		log.debug('ZAB Subscription # of Min Commit Periods', zsNumPds);
    		

    		
    		//Set the Start Date (obj) to a string
    		if (!isEmpty(zsMinStart)){
    			
    			zsms = format.format({
        			value : zsMinStart,
        			type : format.Type.DATE
        		});
    			log.debug('ZS Start Date as a String', zsms);
    			
    		}
			
			
			//Set the End Date (obj) to a string
    		if (!isEmpty(zsMinEnd)){
    			
    			zsme = format.format({
        			value : zsMinEnd,
        			type : format.Type.DATE
        		});
    			log.debug('ZS End Date as a String', zsme);
    			
    		}
    		
			
    		
    		//Update the ZAB Subscription Record if any mismatches are found
    		if (Number(zsMinAmt) != Number(minAmt) || zsMinStart != minStart || zsMinEnd != minEnd || zsNumPds != numPds){

    			log.debug('Search Value(s) Not Matching Values on ZAB Subscription', 'UPDATE ZAB SUBSCRIPTION');
    				
    				
				//Put MinStart into an Object
    			var sdate = new Date(minStart);
    			
    			//Set the Date (obj) to a string
    			minStart = format.format({
        			value : sdate,
        			type : format.Type.DATE
        		});
				
				//Parse the date strings prior to writing to zab subscription record
    			minStart = format.parse({
	    		value : minStart,
	    		type : format.Type.DATE
	    		});
				
				log.debug('MinStart (After Parse)', minStart);
				
				
				//Put MinEnd into an Object
    			var edate = new Date(minEnd);
    			
    			//Set the Date (obj) to a string
    			minEnd = format.format({
        			value : edate,
        			type : format.Type.DATE
        		});
				
				//Parse the date string prior to writing to zab subscription record
    			minEnd = format.parse({
	    		value : minEnd,
	    		type : format.Type.DATE
	    		});
				
				log.debug('MinEnd (After Parse)', minEnd);
				
				
				//Write the Fields to the ZAB Subscription Record
				zsRec.setValue({
				    fieldId: 'custrecordatt_s_min_commit_amt',
				    value: minAmt,
				    ignoreFieldChange: true
				});
				
				zsRec.setValue({
				    fieldId: 'custrecord_s_minc_sub_start_date',
				    value: minStart,
				    ignoreFieldChange: true
				});
				
				zsRec.setValue({
				    fieldId: 'custrecord_s_minc_sub_end_date',
				    value: minEnd,
				    ignoreFieldChange: true
				});
				
				zsRec.setValue({
				    fieldId: 'custrecord_scg_min_commit_per',
				    value: numPds,
				    ignoreFieldChange: true
				});
				
				
				
				//Search for and Update the 'Min Commit True-Up' item tied to the ZAB Subscription
				var zsiSearch = search.create({
    				type:'customrecordzab_subscription_item',
    				columns: [
    				          search.createColumn({
    				        	  name: 'internalid'
			        		  })
    				          ],
    	            filters: [
    	                ['custrecordzab_si_subscription', 'anyof', zsId],
    	                'AND',
    	                ['name', 'is', 'Min Commit True-up']
    	            ]
    			});
    			
    			var result = zsiSearch.run();
    			log.debug('zsiSearch Results', result);
				
    			var resultRange = result.getRange({
    		        start: 0,
    		        end: 1000
    		    });
    			
    			var resultLength = resultRange.length;
    			log.debug('Result Length', resultLength);
				
    			var minCommTruUpId = resultRange[0].getValue({
		            name: 'internalid'
		        });
    			
    			log.debug('Min Commit True Up Id for Subscr: ' + zsId, minCommTruUpId);
				
				
    			
				//Update the Min Commit True Up Item, if found, based on the # of Periods value, if found
    			if (!isEmpty(minCommTruUpId) && !isEmpty(numPds)){
    				
    				var chrgSched;
    				
    				switch(numPds){
    				
    				case '1'://Monthly
    					chrgSched = '9';
    					break;
    				case '2'://2 mo (chg/bill)
    					chrgSched = '16';
    					break;
    				case '3'://3 mo (chg/bill)
    					chrgSched = '15';
    					break;
    				case '6'://Semi-Annual
    					chrgSched = '13';
    					break;
    				case '12'://Annual
    					chrgSched = '18';
    					break;
					
    				}
    				log.debug('Set Charge Schedule to:', chrgSched);
    				
    				
    				record.submitFields({
    				    type: 'customrecordzab_subscription_item',
    				    id: minCommTruUpId,
    				    values: {
    				        'custrecordzab_si_charge_schedule': chrgSched
    				    }
    				});
    				
    				
    			}//End if (!isEmpty(minCommTruUpId) && !isEmpty(numPds))
				
				
				
				var recordId = zsRec.save({
				    enableSourcing: true,
				    ignoreMandatoryFields: true
				});
				
    			
    		}
        	
    		
    	}catch(e){
    		
    		am_zs_logError(e)
    		
    	}
    	
    	
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    	
    	/*
    	
    	var elmtId = context.key;
    	
    	if (elmtId == '1400919'){//TEMP
    		log.debug('Element ID', elmtId);//TEMP
    		
    	}//TEMP
    	
    	*/
    	

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
    	
    	handleErrors(summary);
        handleSummaryOutput(summary.output);
        // *********** HELPER FUNCTIONS ***********
        function handleErrors(summary) {
            var errorsArray = getErrorsArray(summary);
            if (!errorsArray || !errorsArray.length) {
                log.debug('No errors encountered');
                return;
            }
            for (var i in errorsArray) {
                log.error('Error ' + i, errorsArray[i]);
            }
            if (errorsArray && errorsArray.length) {
                //
                // INSERT YOUR CODE HERE
                //
            }
            return errorsArray;
            // *********** HELPER FUNCTIONS ***********
            function getErrorsArray(summary) {
                var errorsArray = [];
                if (summary.inputSummary.error) {
                    log.audit('Input Error', summary.inputSummary.error);
                    errorsArray.push('Input Error | MSG: ' + summary.inputSummary.error);
                }
                summary.mapSummary.errors.iterator().each(
                    function (key, e) {
                        var errorString = getErrorString(e);
                        log.audit('Map Error', 'KEY: ' + key + ' | ERROR: ' + errorString);
                        errorsArray.push('Map Error | KEY: ' + key + ' | ERROR: ' + errorString);
                        return true; // Must return true to keep
                        // looping
                    });
                summary.reduceSummary.errors.iterator().each(
                    function (key, e) {
                        var errorString = getErrorString(e);
                        log.audit('Reduce Error', 'KEY: ' + key + ' | MSG: ' + errorString);
                        errorsArray.push('Reduce Error | KEY: ' + key + ' | MSG: ' + errorString);
                        //						UpdateStatus(key, 3, errorString);
                        return true; // Must return true to keep
                        // looping
                    });
                return errorsArray;
                // *********** HELPER FUNCTIONS ***********
                function getErrorString(e) {
                    var errorString = '';
                    var errorObj = JSON.parse(e);
                    if (errorObj.type == 'error.SuiteScriptError' || errorObj.type == 'error.UserEventError') {
                        errorString = errorObj.name + ': ' + errorObj.message;
                    } else {
                        errorString = e;
                    }
                    return errorString;
                }
            }
        }
        function handleSummaryOutput(output) {
            var contents = '';
            output.iterator().each(function (key, value) {
                contents += (key + ' ' + value + '\n');
                return true;
            });
            if (contents) {
                log.debug('output', contents);
            }
        }
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
        getInputData: getInputData,
        map: map,
        //reduce: reduce,
        summarize: summarize
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
function am_zs_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
}






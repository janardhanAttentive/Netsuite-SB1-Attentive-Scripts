/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 1.00     03 Nov 2021     Doug Humberd     Adds a new value to the Custom List 'Date of credit list' on a monthly basis (on 1st of month)
 * 											 If there are more than 18 list values, the oldest value is set to Inactive
 * 
 */
define(['N/record', 'N/search'],

function(record, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} context
     * @param {string} context.type - The context in which the script is executed. It is one of the values from the context.InvocationType enum.
     * @Since 2015.2
     */
    function execute(context) {
    	
    	log.debug('updateList', 'START');
    	
    	var date = new Date();
    	log.debug('date', date);
    	
    	var monthText;
    	var month = date.getMonth() + 1;
    	var year = date.getFullYear();
    	log.debug('Month = ' + month, 'Year = ' + year);
    	
    	switch(month){
    	
    	case 1://January
    		monthText = 'Jan';
    		break;
    	case 2://February
    		monthText = 'Feb';
    		break;
    	case 3://March
    		monthText = 'Mar';
    		break;
    	case 4://April
    		monthText = 'Apr';
    		break;
    	case 5://May
    		monthText = 'May';
    		break;
    	case 6://June
    		monthText = 'Jun';
    		break;
    	case 7://July
    		monthText = 'Jul';
    		break;
    	case 8://August
    		monthText = 'Aug';
    		break;
    	case 9://September
    		monthText = 'Sep';
    		break;
    	case 10://October
    		monthText = 'Oct';
    		break;
    	case 11://November
    		monthText = 'Nov';
    		break;
    	case 12://December
    		monthText = 'Dec';
    		break;
    	
    	}//End Switch Case
    	
    	log.debug('Month Text', monthText);
    	
    	var nameValue = monthText + ' ' + year;
    	log.debug('Name Value', nameValue);
    	
    	
    	
    	//Create New 'Date Of Credit List' Value 
    	var dateOfCreditListValue = record.create({
	       type: 'customlist_scg_date_of_credit',
	       isDynamic: true
    	});
    	
    	dateOfCreditListValue.setValue({
    		fieldId: 'name',
    		value: nameValue
		});
    	
    	var listId = dateOfCreditListValue.save({
    	    enableSourcing: false,
    	    ignoreMandatoryFields: true
    	});
    	
    	log.debug('Internal ID - New List Value', listId);
    	
    	
    	
    	//Get All 'Date Of Credit List' Values
    	var customListSearch = search.create({
      		type:'customlist_scg_date_of_credit',
      		columns: 
      			[
      			 search.createColumn({
      				 name: 'internalid',
      				 sort: search.Sort.ASC,
      			 }),
      			 search.createColumn({name: 'name'})
      			 ],
      		filters: [
                ['isinactive', 'is', 'F']
                //'AND',
                //['custrecord_scg_cter_transaction', 'anyof', timeId]
            ]
      	});
      	
      	var result = customListSearch.run();
      	
      	var resultRange = result.getRange({
            start: 0,
            end: 100
      	});
      	log.debug('Result Range', resultRange);
      	
      	var resultLength = resultRange.length;
      	log.debug('Result Length', resultLength);
      	
      	//If more than 24 results, make the oldest record inactive
      	if (resultLength > 24){
      		
      		var recId = resultRange[0].getValue({
	            name: 'internalid'
	        });
  			
  			var listValue = resultRange[0].getValue({
	            name: 'name'
	        });
  			
  			log.debug('List Internal Id', recId);
  			log.debug('List Name Value', listValue);
  			
  			
  			//Load the Oldest Custom List Value, set Inactive
  	    	var inactivateListRecord = record.load({
  	    	    type: 'customlist_scg_date_of_credit',
  	    	    id: recId,
  	    	    isDynamic: true
  	    	});
  	    	log.debug('Custom List Record', inactivateListRecord);
  	    	
  	    	inactivateListRecord.setValue({
  	    		fieldId: 'isinactive',
  	    		value: true
  			});
  	    	
  	    	var inactivateListId = inactivateListRecord.save({
  	    	    enableSourcing: false,
  	    	    ignoreMandatoryFields: true
  	    	});
  	    	
  	    	log.debug('Internal ID - Inactivated List Value', inactivateListId);
  			
      		
      	}
    	
    	
    }

    return {
        execute: execute
    };
    
});

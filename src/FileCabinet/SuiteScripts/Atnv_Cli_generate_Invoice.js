/**
 * Script Type: Client Script 
 * File Name: 	.js
 *
 * Description: Adding the 
 * 
 * Date			Author	Remarks
 * 
 * 
 */


/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/record','N/url','N/https','N/currentRecord','N/format'],
  function(record, url, https, currentRecord, format) {

    function pageInit() {
    }
 function fieldChanged(context) {

        var strFieldName = context.fieldId;
        var currentRecord = context.currentRecord;
		var getcusId = '';
		var getEntityId = '';
		var getRecordId = '';
		var suiteletlink = url.resolveScript({
            scriptId: 'customscript_atnv_sui_generate_invoice',
            deploymentId: 'customdeploy_atnv_sui_generate_invoice'
        });
		
		if (strFieldName == 'custpage_trans_date' || strFieldName == 'custpage_trans_to_date')
		{	 
			getTransDate = currentRecord.getValue({
                fieldId: 'custpage_trans_date'
            });
			getTransToDate = currentRecord.getValue({
                fieldId: 'custpage_trans_to_date'
            });
			if(getTransDate)
			{
				getTransDate = format.format({value:getTransDate, type: format.Type.DATE});
					   				log.debug('getTransDate 2',getTransDate);
			}
			
		    if(getTransToDate)
			{
				getTransToDate = format.format({value:getTransToDate, type: format.Type.DATE});
					   				log.debug('getTransToDate 2',getTransToDate);
			}
			/*
			getEntityId = currentRecord.getValue({
                fieldId: 'custpage_entity_id'
            });
			getRecordId = currentRecord.getValue({
                fieldId: 'custpage_record_id'
            });
			*/
						 setWindowChanged(window, false);
        window.location.replace(suiteletlink + "&custpage_trans_date=" + getTransDate+ "&custpage_trans_to_date=" + getTransToDate);

		}
		/*
	   if (strFieldName == 'custpage_trans_date')
		{
			 getcusId = currentRecord.getValue({
                fieldId: 'custpage_customer_id'
            });
			getTransDate = currentRecord.getValue({
                fieldId: 'custpage_trans_date'
            });
			/*
			getEntityId = currentRecord.getValue({
                fieldId: 'custpage_entity_id'
            });
			getRecordId = currentRecord.getValue({
                fieldId: 'custpage_record_id'
            });
			
						 setWindowChanged(window, false);
        window.location.replace(suiteletlink + "&custpage_customer_id=" + getcusId + "&custpage_trans_date=" + getTransDate);

		}
		*/
 }
    function onClick_button(entityId,record_id) {		// On click of Reset Button				
			var suitelet = url.resolveScript({
            scriptId: 'customscript_ns_sui_add_mutiple_quotes',
            deploymentId: 'customdeploy_ns_sui_add_mutiple_quotes',
			params: {'entityId': entityId, 'record_id': record_id},
            returnExternalUrl: false,
        	});
			//Set window position values
	var leftPosition, topPosition;
    	leftPosition = (window.screen.width / 2) - ((600 / 2) + 10);
    	topPosition = (window.screen.height / 2) - ((600 / 2) + 50);
	
  	//Define the window
	var params = 'height=' + 500 + ' , width=' + 800;
	params += ' , left=' + leftPosition + ", top=" + topPosition;
	params += ' ,screenX=' + leftPosition + ' ,screenY=' + topPosition;
	params += ', status=no'; 
	params += ' ,toolbar=no';
	params += ' ,menubar=no';
	params += ', resizable=yes'; 
	params += ' ,scrollbars=no';
	params += ' ,location=no';
	params += ' ,directories=no';
	
		 window.open(suitelet, "New Window Title", params); 

	return false;				
    }
	
	 function onClick_addlines(TransactionData)                           // On click of Cancel Button
	        {
          
							var myRecord = currentRecord.get();
							log.debug('myRecord',myRecord);
          //  var currentRecord = context.currentRecord;
			//				log.debug('currentRecord',currentRecord);

				alert('test for log');
				
				log.debug({
						title: 'Transaction_data client Script',
						details: TransactionData
							  });
				log.debug('count client', TransactionData.length);
				
				var TransactionData1 = JSON.parse(TransactionData);
				
	       
									log.debug('count client 2', TransactionData1.length);
				    

			//	for (var i = 0; i < TransactionData1.length; i++) 
			//	{
				var line = TransactionData1[0];	
				log.debug({
						title: 'line.itemid',
						details: line.itemid
							  });
				myRecord.selectNewLine({ sublistId: 'item' });
               myRecord.setCurrentSublistValue({
                         sublistId: 'item',
                         fieldId: 'item',
                         value: line.itemid
                         });
			  myRecord.setCurrentSublistValue({
                         sublistId: 'item',
                         fieldId: 'amount',
                         value: 100
                         });
				myRecord.commitLine({ sublistId: 'item'});	

			//	}
				          
             				//             window.close();	

			}
	
	        function onClick_cancel()                           // On click of Cancel Button
	        {
             window.close();	
			}
			
    return {
      pageInit: pageInit,
      onClick_button: onClick_button,
	  onClick_cancel: onClick_cancel,
	  onClick_addlines: onClick_addlines,
	  fieldChanged: fieldChanged
	  };
});
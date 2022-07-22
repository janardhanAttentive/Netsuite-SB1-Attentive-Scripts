/**
 * Copyright (c) 1998-2021 Oracle NetSuite GBU, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Oracle NetSuite GBU, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Oracle NetSuite GBU.
 */
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 2.x       11-April-2020     Janardhan S
 *
 */

define(['N/error', 'N/record', 'N/search', 'N/runtime', 'N/email'], invsnap_adjust);

function invsnap_adjust(error, record, search, runtime, email) {
 // Start Of GetInput Data
    function getInputData(context) {

        try {
			var mapArray = new Object();
                 var scriptObj = runtime.getCurrentScript();
					 mapArray = scriptObj.getParameter({name: 'custscript_atnv_get_sales_order_param'});
					 var jsonData = JSON.parse(mapArray);
					  log.debug({
                    title: 'map reduce mapArray',
                    details: jsonData
                           });
			return jsonData;
           } 
		catch (error) {
            log.error({ title: 'error', details: error });
            throw error;
        }
    }
	
	function reduce(context)
	{
		try {
			 log.debug({
                    title: 'map reduce values',
                    details: 'test for reduce'
			  });
			
			  var values=JSON.parse(context.values[0]);
			  
			  log.debug({
                    title: 'map reduce values',
                    details: values.getSoInternalId
			  });
			  
			  var objRecord = record.transform({
								fromType: record.Type.SALES_ORDER,
								fromId: values.getSoInternalId,
								toType: record.Type.INVOICE,
								isDynamic: true,
								});
		             var recordId = objRecord.save();
					log.debug({
                    title: 'map reduce recordId',
                    details: recordId
			  });
			        
											
				 context.write(context.key, context.values.length);							
			  
		}
		catch (error) {
			
			var rec = record.create({
							type: 'customrecord_error_rec_invoice_generate',
							isDynamic: true
							});
							rec.setValue({
							fieldId: 'custrecord_atnv_sales_order_id',
							value: values.getSoInternalId
							});
							rec.setValue({
							fieldId: 'custrecord_atnv_error_name',
							value: error.name
							});
							rec.setValue({
							fieldId: 'custrecord_atnv_error_message',
							value: error.message
							});
				var recordId = rec.save();
        //    throw error;
        }
		
	}

	 // Summarize the Results
    function summarize(summary) {
        try {
			var getUser = runtime.getCurrentUser().id;
					log.audit('Summary Time','getUser: '+getUser);
	 var totalRecordsUpdated = 0;
                summary.output.iterator().each(function (key, value)
                    {
                    totalRecordsUpdated += parseInt(value);
                    return true;
                    });
		log.audit('Summary Time','Total Seconds: '+summary.seconds);
    	log.audit('Summary Usage', 'Total Usage: '+summary.usage);
    	log.audit('Summary Yields', 'Total Yields: '+summary.yields);
                log.audit({
                    title: 'Total records updated',
                    details: totalRecordsUpdated
                });
				
				email.send({
						author: 64792,
						recipients: getUser,
						subject: 'Invoice Generation Process Completed',
						body: 'Invoice Generation Process Completed, Successfull Count '+ totalRecordsUpdated,
						});
        } catch (error) {
            log.error({ title: 'mapReduce.summarize', details: error });
            throw error;
        }
    }
	 return {
        getInputData: getInputData,
		reduce: reduce,
        summarize: summarize
    };
}
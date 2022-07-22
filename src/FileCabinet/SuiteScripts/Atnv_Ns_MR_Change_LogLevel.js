/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/**
 * Module Description
 * 
 * Version    Date                       Author           Remarks
 *  2.x       March,07-2022             
 *
 */

define(['N/https', 'N/error', 'N/record', 'N/search', 'N/runtime', 'N/encode', 'N/format', 'N/file'],

function (https, error, record, search, runtime, encode, format, file) {

 // Start Of GetInput Data
    function getInputData(context) {
        try {
			var scriptObj = runtime.getCurrentScript();
				var scriptDeploy_Search = scriptObj.getParameter({
					name: 'custscript_atnv_param_script_depl_search'
				});
			 var scriptDeploy_SearchObj =  search.load({
										id: scriptDeploy_Search
											}); 
                return scriptDeploy_SearchObj;          
       } 
		catch (error) {
            log.error({ title: 'error', details: error });
            throw error;
        }
    }

    // Start Of Reduce
	  function reduce(context) {
        try { 
		
		var values = JSON.parse(context.values[0]);
					log.debug({ title: 'values', details:values });
		var scriptDeploy_Id = values.id;
		var getRecordType = values.recordType;
							log.debug({ title: 'scriptDeploy_Id', details:scriptDeploy_Id });
					log.debug({ title: 'getRecordType', details:getRecordType });


				var id = record.submitFields({
								type: getRecordType,
								id: scriptDeploy_Id,
								values: {
								loglevel: 'ERROR'
								},
								options: {
								enableSourcing: false,
								ignoreMandatoryFields : true
								}
								});
						
						
					context.write(context.key, context.values.length);
		}
         catch (error) {
            log.error({ title: 'error', details: error });
            throw error;
        }
    }
	

	 // Summarize the Results
    function summarize(summary) {
        try {
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
);

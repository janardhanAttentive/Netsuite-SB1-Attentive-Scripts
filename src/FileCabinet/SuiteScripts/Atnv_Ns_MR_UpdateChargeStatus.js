/**
 * Script Type: Map/Reduce
 * File Name: Atnv_Ns_MR_UpdateChargeStatus.js
 * Script:	ATNV | MR | Update Charge Status   [customscript_atnv_mr_update_chargestatus]
 * 				Parameter: custscript_atnv_param_saved_search
 * Deployment:	ATNV | MR | Update Charge Status   [customdeploy_atnv_mr_update_chargestatus]
 *
 * Description: This Script Updates 
 * 
 * Date			Author	Remarks
 * 
 * 
 */

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error'],
	function (search, record, email, runtime, error) {
		// Start Of GetInput Data
		function getInputData(context) {
			try {
				var scriptObj = runtime.getCurrentScript();
				var zabChargeSearch = scriptObj.getParameter({
					name: 'custscript_atnv_param_saved_search'
				});
			 var zabSearchObj =  search.load({
										id: zabChargeSearch
											}); 
                return zabSearchObj;
			} catch (error) {
				log.error({
					title: 'error',
					details: error
				});
				throw error;
			}
		}


		function reduce(context) {
			try {
				var values = JSON.parse(context.values[0]);
				log.debug('values',values);
				
				var zabId = values.id;
				var recType = values.recordType;
								log.debug('values',values);
								log.debug('recType',recType);
								log.debug('zabId',zabId);


				record.submitFields({
							type: recType,
							id: zabId,
							values: {
							     custrecordzab_c_status: 5
							},
							options: {
								enableSourcing: false,
								ignoreMandatoryFields : true
							}
							});
								
				context.write(context.key, context.values.length);

			} catch (error) {

				log.error({
					title: 'mapReduce.summarize',
					details: error
				});
				throw error;
			}

		}

		// Summarize the Results
		function summarize(summary) {
			try {
				var totalRecordsUpdated = 0;
				summary.output.iterator().each(function (key, value) {
					totalRecordsUpdated += parseInt(value);
					return true;
				});
				log.audit('Summary Time', 'Total Seconds: ' + summary.seconds);
				log.audit('Summary Usage', 'Total Usage: ' + summary.usage);
				log.audit('Summary Yields', 'Total Yields: ' + summary.yields);
				log.audit({
					title: 'Total records updated',
					details: totalRecordsUpdated
				});
			} catch (error) {
				log.error({
					title: 'mapReduce.summarize',
					details: error
				});
				throw error;
			}
		}
		return {
			getInputData: getInputData,
			reduce: reduce,
			summarize: summarize
		};
	});
/**
 * Script Type: Map Reduce
 * File Name: Atnv_MR_Update_Zab_Subscription_DataBase_Id.js 
 * Script:	Atnv | MR | Add Missing Database Id to Subscriptions   [customscript_atnv_mr_updte_zab_subsdatas]
 * 				Parameter: custscript_atnv_database_update_customer
 * Deployment:	Atnv | MR | Update Zab Subs DataBase Id   [customdeploy_atnv_mr_updte_zab_subsdatas]
 * Search : internal ID 1214 
 * Description: This Script Updates the Zab Subscription Database Id when not equal to Database ID on Customer record.
 * Ticket: FSP-96 
 * * 
 * Date			Author	            Remarks				Version
 * 05-20-2022   Janardhan S			Initial				1.0
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
				var cusSearch = scriptObj.getParameter({
					name: 'custscript_atnv_database_update_customer'
				});
			 var cusSearchObj =  search.load({
										id: cusSearch
											}); 
                return cusSearchObj;
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
			//	var cusDataBaseId = values.values.custentity_scg_db_id;
				var cusDataBaseId = values.values["custentity_scg_db_id.CUSTRECORDZAB_S_CUSTOMER"];
												log.debug('cusDataBaseId',cusDataBaseId);

              
 				record.submitFields({
							type: recType,
							id: zabId,
							values: {
							     custrecord_scg_db_id: cusDataBaseId
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
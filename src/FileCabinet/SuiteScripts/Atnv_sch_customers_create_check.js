/**
 * Script Type: Scheduled
 * File Name: Atnv_sch_customers_create_check.js 
 * Script:	Atnv |SCH|No Customers Synch Past 3 days   [customscript_atnv_sch_customer_create_ch]
 * 				Parameter: custscript_atnv_cus_create_check
 * Deployment:	Atnv |SCH|No Customers Synch Past 3 days   [customdeploy_atnv_sch_customer_create_ch]
 * Search : internal ID 1206 
 * Description: This Script Checks if there are New Customers created for the Past 3 days - if there are no new Customers Created triggers an email
 * Ticket: FSP-121 
 * * 
 * Date			Author	            Remarks				Version
 * 05-23-2022   Janardhan S			Initial				1.0
 * 
 */



/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * 
 * Version  Date            Author           Remark
 * 
 */
define(['N/record', 'N/search', 'N/email', 'N/runtime'],

function(record, search, email, runtime) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} context
     * @param {string} context.type - The context in which the script is executed. It is one of the values from the context.InvocationType enum.
     * @Since 2015.2
     */
    function execute(context) {
    	try {
			
			var scriptObj = runtime.getCurrentScript();
				var cusSearch = scriptObj.getParameter({
					name: 'custscript_atnv_cus_create_check'
				});
			 var cusSearchObj =  search.load({
										id: cusSearch
											}); 
var searchResultCount = cusSearchObj.runPaged().count;
log.debug("customerSearchObj result count",searchResultCount);
                if(searchResultCount  == 0)
				{
					
					var customerSearchObj = search.create({
									   type: "customer",
									   filters:
									   [
										  ["isinactive","any",""]
									   ],
									   columns:
									   [ search.createColumn({
												 name: "altname",
												 summary: "MAX",
												 label: "Name"
											  }),
										  search.createColumn({
											 name: "datecreated",
											 summary: "MAX",
											 label: "Date Created"
										  })
									   ]
									});
									var cusName;
									var lastDateCreated;
							var searchResultCount = customerSearchObj.runPaged().count;
							log.debug("customerSearchObj result count",searchResultCount);
							customerSearchObj.run().each(function(result){
							   // .run().each has a limit of 4,000 results
							    lastDateCreated = result.getValue({
											 name: "datecreated",
											 summary: "MAX",
											 label: "Date Created"
										  });
						        cusName =   result.getValue({
												 name: "altname",
												 summary: "MAX",
												 label: "Name"
											  });
								log.debug('lastDateCreated',lastDateCreated);
								log.debug('cusName',cusName);	  
								
							});

					email.send({
							author: 69923,
							recipients: 10,
							subject: 'No Customers Created for the Past 3 days',
							body: 'There are No Customers Created for the Past 3 days - Last Customer Created was ' + cusName + ' at ' + lastDateCreated
							});
				}

		}catch (error) {

				log.error({
					title: 'Catch Error',
					details: error
				});
				throw error;
			}			
      		
      	}

    return {
        execute: execute
    };
    
});

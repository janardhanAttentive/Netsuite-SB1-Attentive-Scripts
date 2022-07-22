/**
 * Script Type: User Event
 * File Name: Atnv_UE_Update_CRM_Synch.js
 * Script: ATNV | UE | Update Inv CRM Synch [customscript_atnv_ue_updte_inv_crm_synch]
 * Deployment:  ATNV | UE | Update Inv CRM Synch [customdeploy_atnv_ue_updte_inv_crm_synch]
 *
 * Description:
 *
 * Version             Date                Author                  Remarks
 *  1.00                   14-06-2022         Janardhan            This Script Updates the Prevent CRM Synch Field on the Invoice Record if Partner 
 *                                                                 Event Sponsorship Item Exists on the Invoice Record
 *                                       
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/format','N/search','N/url'],
function(record, runtime, format, search, url) {
	
	function beforeLoad(scriptContext) {
		try{
			if ( scriptContext.type == scriptContext.UserEventType.COPY)
			{
				var objRecord = scriptContext.newRecord;
				log.debug('test for log','test for log');
					objRecord.setValue('custbody_prevent_crm_synch',false)
			}

		}
		catch (error) {
				log.error({
					title: 'Catch Error',
					details: error
				});
				throw error;
			}	
	}

    function beforeSubmit(scriptContext) {
		try{

	 if (scriptContext.type == scriptContext.UserEventType.CREATE)
		  {
				var objRecord = scriptContext.newRecord;
				var record_id  = objRecord.id;
				var entityId = objRecord.getValue('entity');
				var getSubsidiary = objRecord.getValue('subsidiary');
				var getItem ;
				var getItemCheck;
				var itemCheck = false;

				var intLinecount = objRecord.getLineCount({
				sublistId: 'item'
				});

			   for (var i = 0; i < intLinecount; i++)
				{
				getItem = objRecord.getSublistValue({
				sublistId: 'item',
				fieldId: 'item',
				line: i
				});
				
				if(getItem == 317 || getItem == 452)
				{
					itemCheck = true;
					break;
				}

				}
			 if(itemCheck == true)
			 {
				objRecord.setValue('custbody_prevent_crm_synch',true); 
			 }
		  }
				
		}
		catch (error) {
				log.error({
					title: 'Catch Error',
					details: error
				});
				throw error;
			}	
				
		
// }
         }


   
    return {
		beforeLoad : beforeLoad,
        beforeSubmit : beforeSubmit    
    };
   
});
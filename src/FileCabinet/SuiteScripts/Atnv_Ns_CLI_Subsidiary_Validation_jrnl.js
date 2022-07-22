/**
* Copyright (c) 1998-2020 Oracle NetSuite GBU, Inc.
* 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
* All Rights Reserved.
*
* This software is the confidential and proprietary information of
* Oracle NetSuite GBU, Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with Oracle NetSuite GBU.
**/

/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 /**
 * Module Description
 * 
 * Version    Date                       Author                  Remarks
 *  2.0       March,15-2022              Janardhan S             This Script Populates an alert if subsidiary is Selected All on the  Record
 *
 */

		define(['N/https','N/error','N/runtime','N/url','N/currentRecord','N/log','N/search','N/ui/message'],
		function (https,error,runtime,url,currentRecord,log,search,message) {

				
				function validateField(context) {
					try
					{
						var currentRecord = context.currentRecord;
						var fieldName = context.fieldId;
						var line = context.line;
						
				var scriptObj = runtime.getCurrentScript();
				var getSubs_param = scriptObj.getParameter({
					name: 'custscript_atnv_param_check_subs_valid'
				});
						if (fieldName === 'subsidiary') {
					var recordType = currentRecord.type;
						log.debug('recordType',recordType);
					          var getSubsidiary  =  currentRecord.getValue({fieldId: 'subsidiary'});
							  if(recordType == 'customer' || recordType == 'vendor')
							  {
								   if(getSubsidiary == getSubs_param || getSubsidiary == 3 || getSubsidiary == 4)
							        {
								  alert('You can not create a Customer or Vendor in this Subsidiary.');
								  return false;
							        }
							  }
							  else{
								   if(getSubsidiary == getSubs_param)
									 {
									  alert('You can not post to this Subsidiary. Please post to another Subsidiary. Or contact the system administrator for more assistance.');
									  return false;
									 }
							  }
							 
								
						}
					}
					catch(e)
					{
						logError(e);
					}
						return true;
	}
	
	// Error Function
	function logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		log.error('System Error', e.getCode() + '\n' + e.getDetails());
		//alert(e.getCode() + '\n' + e.getDetails());
	} else {
		log.error('Unexpected Error', e.toString());
		//alert(e.toString());
	}
               }
return {
validateField: validateField
};
});
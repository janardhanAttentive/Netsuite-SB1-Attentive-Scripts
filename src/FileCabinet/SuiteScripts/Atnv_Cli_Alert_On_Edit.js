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
 *  2.0       March,15-2022              Janardhan S             This Script Populates an alert if subsidiary is Selected All on the Journal Entry Record
 *
 */

		define(['N/https','N/error','N/runtime','N/url','N/currentRecord','N/log','N/search','N/ui/message','N/ui/dialog','N/record'],
		function (https,error,runtime,url,currentRecord,log,search,message,dialog,record) {

				
				function saveRecord(context) {
						var currentRecord = context.currentRecord;
						var recordId  = currentRecord.id;
						log.debug('recordId',recordId);
						var recordType = currentRecord.type;
						log.debug('recordType',recordType);

					    var objRecord = record.load({
									type: recordType,
									id: recordId,
									isDynamic: true,
									});
							var getNotes = objRecord.getValue('custrecord_atnv_notes_to_record');
							var getCurrentNotes = currentRecord.getValue('custrecord_atnv_notes_to_record');
							
							if(getCurrentNotes == getNotes)
							{
								dialog.alert({
										title: 'Edit Reason',
										message: 'Please Update the Notes for the reason of Edit'
										});
                              return false;
							}
						
						return true;
						}
return {
saveRecord: saveRecord
};
});
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
 *  2.0       March,15-2022              Janardhan S             This Script triggers when Some one is edited the form and not Updated the Notes.
 *
 */

		define(['N/https','N/error','N/runtime','N/url','N/currentRecord','N/log','N/search','N/ui/message','N/ui/dialog','N/record'],
		function (https,error,runtime,url,currentRecord,log,search,message,dialog,record) {

				
				function pageInit(context) {
						var currentRecord = context.currentRecord;
						var form = context.form;
						
	                 var getNotes = form.addField({
									id: 'custpage_notes',
									type: serverWidget.FieldType.TEXT,
									label: ' Edit Notes'});
									getNotes.layoutType = serverWidget.FieldLayoutType.NORMAL;
									getNotes.updateBreakType = serverWidget.FieldBreakType.STARTCOL;
									getNotes.isMandatory = true;
						
						}
return {
pageInit: pageInit
};
});
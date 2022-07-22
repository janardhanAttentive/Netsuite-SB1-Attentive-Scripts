/**
 * Copyright (c) 1998-2013 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * NetSuite, Inc. ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with NetSuite.
 */		
	/**
	 * File Name:  .js
	 * Script Id:     
	 * Deployment Id: 
	 *
	 *
	 * Date            Author         Remarks
	 *                                 
	 */
	/**
	 *@NApiVersion 2.x
	 *@NScriptType Suitelet
	 */
	 define(['N/record', 'N/runtime', 'N/error', 'N/search', 'N/task', 'N/ui/serverWidget', 'N/ui/dialog', 'N/redirect', 'N/format', 'N/url'],
		function(record, runtime, error, search, task, serverWidget, dialog, redirect, format, url) {
			function onRequest(context) {
			//	try
			//	{			 
					var request = context.request;
					var response = context.response;
					
			//    var getEntity_id = context.request.parameters.custpage_customer_id;
				var getTransationDate = context.request.parameters.custpage_trans_date;
				var getTransationToDate = context.request.parameters.custpage_trans_to_date;
				
			//	log.debug('getEntity_id',getEntity_id);
				log.debug('getTransationDate',getTransationDate);
					
				 
				 
					if (request.method == 'GET')
					{
						
				//	form.clientScriptModulePath = '../ClientScripts/SC_CLI_Modify_UBP_USP.js';
						
						var form = serverWidget.createForm({title: 'Invoice Sales Orders',hideNavBar: false});
						
							form.clientScriptFileId  = 899691;
						
		//  var fldCustomer = form.addField({id: 'custpage_customer_id',type: serverWidget.FieldType.SELECT,source:'customer',label: 'Customer'});
		  
		   //     if(getEntity_id)
			//			{
			//			  fldCustomer.defaultValue = getEntity_id;	
			//			}
		  var fldDate = form.addField({id: 'custpage_trans_date',type: serverWidget.FieldType.DATE,label: 'From Date'});
		  var toDate = form.addField({id: 'custpage_trans_to_date',type: serverWidget.FieldType.DATE,label: 'To Date'});

						if(getTransationDate)
						{
							var getTransationDate1 = format.parse({value:getTransationDate, type: format.Type.DATE});
					   				log.debug('getTransationDate 2',getTransationDate1);
						  fldDate.defaultValue = getTransationDate1;	
						}

                       if(getTransationToDate)
						{
							var getTransationToDate1 = format.parse({value:getTransationToDate, type: format.Type.DATE});
					   				log.debug('getTransationToDate1 2',getTransationToDate1);
						  toDate.defaultValue = getTransationToDate1;	
						}										
						
				/*
					
				 form.addField({id: 'custpage_entity_id',type: serverWidget.FieldType.INTEGER,label: 'Customer Id'}); 		
				    form.getField({id: 'custpage_entity_id'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});						
				    form.updateDefaultValues({custpage_entity_id : entity_id});
          var getDocNumberQuote =form.addField({id: 'custpage_quote_doc_number',type: serverWidget.FieldType.TEXT,label: 'Quote Document Number'});
		  
		   if(getDocumentNumber)
			     {
			  getDocNumberQuote.defaultValue = getDocumentNumber;
			     }
           */
		   
					var sblstConfig = buildConfigSublist({
					form: form
						});
				
					var TransactionData = getData(getTransationDate,getTransationToDate);
				log.debug({title: 'Transaction_data',details: JSON.stringify(TransactionData)});
				
				
				var getCount;

				//POPULATE SUBLIST
				for (var i = 0; i < TransactionData.length; i++) {
					
					   //getCount = i+1;

					var line = TransactionData[i];
						   sblstConfig.setSublistValue({id: 'custpage_serial_number',line: i,value: JSON.stringify(i+1)});
										
					  if(line.internalid != '')
					  {
					    sblstConfig.setSublistValue({id: 'custpage_so_internalid',line: i,value: line.internalid});
					  }
					    if(line.soDocNumber != '')
					  {
					     sblstConfig.setSublistValue({id: 'custpage_so_document_number',line: i,value: line.soDocNumber});
					  }
					  if(line.tranDate != '')
					  {
					     sblstConfig.setSublistValue({id: 'custpage_order_date',line: i,value: line.tranDate});
					  }
					  if(line.getCustomer != '')
					  {
						   sblstConfig.setSublistValue({id: 'custpage_customer',line: i,value: line.getCustomer});
					  }
					   
					   if(line.getCurrency != '')
					  {
						   sblstConfig.setSublistValue({id: 'custpage_currency',line: i,value: line.getCurrency});
					  }
					  if(line.getMemo != '')
					  {
						   sblstConfig.setSublistValue({id: 'custpage_memo',line: i,value: line.getMemo});
					  }
				}	
				
						 form.addSubmitButton({label: 'Generate Invoice'});
						// form.addButton({id :'custpage_cancel',label: 'Cancel',functionName : "onClick_cancel();"});
						response.writePage(form);
						
					}
	else{
              try{
				  
	  					 var sched_param = [];	
             var lineCount = context.request.getLineCount({
                             group: 'custpage_get_sales_order_list'
                             });
            
            for (var i = 0; i < lineCount; i++) {
        var getBillcheckbox = context.request.getSublistValue({group: 'custpage_get_sales_order_list',name: 'custpage_generate_bill',line: i});
                if(getBillcheckbox === 'T')
                 {
		
		var getSoInternalId =  context.request.getSublistValue({group: 'custpage_get_sales_order_list',name: 'custpage_so_internalid',line: i});
		var getDocumentNumber =  context.request.getSublistValue({group: 'custpage_get_sales_order_list',name: 'custpage_so_document_number',line: i});
        var getOrderDate = context.request.getSublistValue({group: 'custpage_get_sales_order_list',name: 'custpage_order_date',line: i});
		var getCustomer = context.request.getSublistValue({group: 'custpage_get_sales_order_list',name: 'custpage_customer',line: i});
            
		            log.debug({title: 'getSoInternalId',details: getSoInternalId});
					log.debug({title: 'getDocumentNumber',details: getDocumentNumber});
                    log.debug({title: 'getOrderDate',details: getOrderDate});
                    log.debug({title: 'getCustomer',details: getCustomer});
                    
					
				 sched_param.push({
					 getSoInternalId:getSoInternalId,
                    getDocumentNumber:getDocumentNumber,
					getOrderDate:getOrderDate,
                    getCustomer:getCustomer
				 });
				 
							
	      }
       }
	  
	         sched_param  = JSON.stringify(sched_param);
			       log.debug({title: 'sched_param',details: sched_param});
				   
		var schedTask = task.create({
			taskType: task.TaskType.MAP_REDUCE,
			scriptId: 'customscript_atnv_mr_create_invoice',
			params: {'custscript_atnv_get_sales_order_param': sched_param}
			});
			var schTaskId = schedTask.submit();
			var taskStatus = task.checkStatus(schTaskId);
			log.debug('taskStatus', taskStatus);
			
			var form = serverWidget.createForm({title: 'Sales Orders Getting Processed',hideNavBar: false});
			// var html = 'Sales Orders Getting Processed';
    
	response.writePage(form);
         return;
 }
 catch(e)
 {
  log.error({
                    title: 'Error',
                    details: e
                });
 }
   }		
/*   
					}
		catch (e){
					var errString =  e.name + ' : ' + e.message;
					log.error({ title: 'NS | SL | Modify UBP USP', details: errString });
					var msg = 'OOPS. Something didnt work :(';
					if ( errString != null ){
						msg += '<br>' + errString;
					}
					var form = serverWidget.createForm({ title: msg });                
					context.response.writePage(form);
				}
				*/
				return;
			}
			
			function DateNow()
			{
					var today = new Date();
					var dd = today.getDate();
					var mm = today.getMonth()+1;
					var yyyy = today.getFullYear();
					today = dd+'/'+mm+'/'+yyyy; // change the format depending on the date format preferences set on your account
					return today;
					  }
			
			function _logValidation(value) {
				if (value != null && value != '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
					return true;
				} else {
					return false;
				}
			}
			
			// Get Data
	function getData(fldDate,ToDate) {
		  try{
	var data =[];
			var arrColumns = [];

			
		  arrColumns.push(search.createColumn({name: "internalid", label: "Internal ID"}));
		  arrColumns.push(search.createColumn({name: "tranid", label: "Document Number"}));
		  arrColumns.push(search.createColumn({name: "trandate",sort: search.Sort.ASC,label: "Tran Date"}));
		  arrColumns.push(search.createColumn({name: "entity",label: "Customer"}));
		  arrColumns.push(search.createColumn({name: "currency",label: "Currency"}));
		  arrColumns.push(search.createColumn({name: "memo",label: "Memo"}));


			var objSearch = search.create({
				type: 'salesorder',
				filters:    [
							  ["type","anyof","SalesOrd"], 
								  "AND", 
								  ["mainline","is","T"],
								  "AND", 
								  ["status","anyof","SalesOrd:F","SalesOrd:E"]
                       // ["trandate","within","1/1/2022","5/4/2022"]

							],
				columns: arrColumns
			});
			
			if(fldDate && ToDate)
				 {
	          var filters = objSearch.filters; //reference Search.filters object to a new variable
                var getTranDate = search.createFilter({ //create new filter
                    name: 'trandate',
                    operator: 'within',
                    values: [fldDate,ToDate]
                });
                filters.push(getTranDate); //add the filter using .push() method 
				 }
		      else if(fldDate)
				 {
	          var filters = objSearch.filters; //reference Search.filters object to a new variable
                var getTranDate = search.createFilter({ //create new filter
                    name: 'trandate',
                    operator: 'onorafter',
                    values: fldDate
                });
                filters.push(getTranDate); //add the filter using .push() method 
				 }
				else if(ToDate)
				 {
	          var filters = objSearch.filters; //reference Search.filters object to a new variable
                var getTranDate = search.createFilter({ //create new filter
                    name: 'trandate',
                    operator: 'onorbefore',
                    values: ToDate
                });
                filters.push(getTranDate); //add the filter using .push() method 
				 }
				var resultSet = objSearch.run();
				// now take the first portion of data.
		var currentRange = resultSet.getRange({
				start : 0,
				end : 1000
		});
		
		var i = 0;  // iterator for all search results
		var j = 0;  // iterator for current result range 0..999

		while ( j < currentRange.length ) {
			// take the result row
			var result = currentRange[j];
			var objLine = {
						internalid:result.getValue('internalid'),
						soDocNumber: result.getValue('tranid'),
						tranDate: result.getValue('trandate'),
						getCustomer: result.getValue('entity'),
						getCurrency: result.getText('currency'),
						getMemo: result.getValue('memo')
						 };
			   data.push(objLine);
			
			// finally:
			i++; j++;
			if( j==1000 ) {   // check if it reaches 1000
				j=0;          // reset j an reload the next portion
				currentRange = resultSet.getRange({
					start : i,
					end : i+1000
				});
			}
		}
			return data;
	 }
	 catch(e)
		   {
	  log.error({
						title: 'Error',
						details: e
					});
		   }
		}
			
			
	function buildConfigSublist(dataIn) {
	try{
		
			var sblstConfig = dataIn.form.addSublist({id: 'custpage_get_sales_order_list',type: serverWidget.SublistType.LIST,label: 'Orders'});
			
			sblstConfig.addMarkAllButtons();

			//-------------------------------------------------------
			sblstConfig.addField({id: 'custpage_generate_bill',type: serverWidget.FieldType.CHECKBOX,label: 'Bill'});

			//-------------------------------------------------------
				
				
		    sblstConfig.addField({id: 'custpage_serial_number',type: serverWidget.FieldType.TEXT,label: 'Serial No'});
			sblstConfig.getField({id: 'custpage_serial_number'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
				
			sblstConfig.addField({id: 'custpage_so_internalid',type: serverWidget.FieldType.TEXT,label: 'Sales Order No'});
			sblstConfig.getField({id: 'custpage_so_internalid'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
								
						
			sblstConfig.addField({id: 'custpage_so_document_number',type: serverWidget.FieldType.TEXT,label: 'Document No'});
			sblstConfig.getField({id: 'custpage_so_document_number'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			
			sblstConfig.addField({id: 'custpage_order_date',type: serverWidget.FieldType.DATE,label: 'Order Date'});
			sblstConfig.getField({id: 'custpage_order_date'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			
			sblstConfig.addField({id:"custpage_customer", type:"select", label:"Customer", source:"customer"});
			sblstConfig.getField({id: 'custpage_customer'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			
	        sblstConfig.addField({id: 'custpage_currency',type: serverWidget.FieldType.TEXT,label: 'Currency'});
			sblstConfig.getField({id: 'custpage_currency'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
			
			sblstConfig.addField({id: 'custpage_memo',type: serverWidget.FieldType.TEXT,label: 'Memo'});
			sblstConfig.getField({id: 'custpage_memo'}).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
		
		return sblstConfig;
	}
	catch(e)
		   {
	  log.error({
						title: 'Error',
						details: e
					});
		   }
		}
		
			
			return {
				onRequest: onRequest
			};
		});
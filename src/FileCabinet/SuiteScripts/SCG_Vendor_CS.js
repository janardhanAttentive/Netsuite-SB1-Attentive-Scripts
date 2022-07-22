/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Dec 2020     Doug Humberd     Handles client events on Vendor records
 *                            Doug Humberd     Validates the user's role prior to allowing the 'Vendor Approved' box to be checked
 *                            Doug Humberd     Added Vendor Change Details functions
 * 1.05       18 Jan 2021     Doug Humberd     Updated 'am_ven_vendorApproved' with new permissions (Attentive Mobile Accountant)
 * 1.10       18 Jan 2021     Doug Humberd     Updated for changes to "Vendor Creation Details" (from Vendor Change Details)
 *
 */


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord vendor
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function am_ven_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
		alert(e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
		alert(e.toString());
	}
}


/**
 * Performs actions once the page is fully loaded in the browser
 *  
 * @param {String} type Operation types: create, copy, edit
 * @returns {Void}
 */
function am_ven_pageInit(type) {
	try {
		//am_ven_pageInitFunction(type);
	} catch (e) {
		am_ven_logError(e);
		throw e;
	}
}


/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord vendor
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_ven_fieldChanged(type, name, linenum) {
	try {
		am_ven_vendorApproved(type, name, linenum);
		//am_ven_vendorNameAddrChgd(type, name, linenum);
		//am_ven_vendorBankInfoChgd(type, name, linenum)
	} catch (e) {
		am_ven_logError(e);
		throw e;
	}
}




/**
 * Performs actions following a field change after all of the field's 
 * child field values are sourced from the server.
 *  
 * @param {String} name The name of the field that changed
 * @param {String} type The sublist type
 * @returns {Void}
 */
function am_ven_postSourcing(name, type) {
	try {
		//am_ven_postSourcingFunction(type);
	} catch (e) {
		am_ven_logError(e);
		throw e;
	}
}


/**
 * Handles validation prior to the form being submitted to the server
 *  
 * @param {Boolean}
 */
function am_ven_saveRecord() {
	try {
		var retVal = false;
		//retVal = am_ven_validateChangeDetailRecord();
		//retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
	} catch (e) {
		am_ven_logError(e);
		throw e;
	}
}





/**
 * Checks the Vendor Approved checkbox when the "Approve Vendor" button is clicked 
 *
 * @appliedtorecord vendor
 *
 */
function am_ven_approveVendor(){
	
	var vendId = nlapiGetRecordId();
	
	var venChgDetReq = nlapiLookupField('vendor', vendId, 'custentity_scg_vend_crtn_det_req');
	
	if (venChgDetReq == 'T'){
		alert ('This Vendor cannot be approved as a required Vendor Creation Details record is missing.');
		return;
	}
	
	//nlapiSubmitField('vendor', vendId, ['custentity_scg_new_vendor_record', 'custentity_scg_vendor_approved', 'custentity_scg_name_addr_chgd', 'custentity_scg_bank_details_chgd', 'custentity_update_made_by'], ['F', 'T', 'F', 'F', '']);
	nlapiSubmitField('vendor', vendId, ['custentity_scg_vendor_approved'], ['T']);
	
	window.location = nlapiResolveURL('SUITELET', 'customscript_scg_approvevendor_sl', 'customdeploy_scg_approvevendor_sl') + '&vendid=' + vendId;
	
}







/**
 * Validates the user's role prior to allowing the 'Vendor Approved' box to be checked 
 *
 * @appliedtorecord vendor
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_ven_vendorApproved(type, name, linenum){
	
	if (name == 'custentity_scg_vendor_approved'){//Vendor Approved
		
		var urole = nlapiGetRole();
		var moveOn = 'T';
		
		var venAppvd = nlapiGetFieldValue('custentity_scg_vendor_approved');
		
		if (venAppvd == 'T' && (urole != '3' && urole != '1020')){//1020 = Attentive Mobile Accountant
		//if (venAppvd == 'T' && (urole != '3')){
			alert ('Your user role is restricted from Approving this Vendor Record');
			nlapiSetFieldValue('custentity_scg_vendor_approved', 'F');
			moveOn = 'F';
		}
		
		if (moveOn == 'T' && venAppvd == 'T'){
			
			var vendId = nlapiGetRecordId();
			
			var venChgDetReq = nlapiLookupField('vendor', vendId, 'custentity_scg_vend_crtn_det_req');
				
			if (venChgDetReq == 'T'){
				alert ('This Vendor cannot be approved as a required Vendor Creation Details record is missing.');
				nlapiSetFieldValue('custentity_scg_vendor_approved', 'F');
				moveOn = 'F';
			}
			
			//if (moveOn == 'T'){
				//nlapiSetFieldValue('custentity_scg_new_vendor_record', 'F');
				//nlapiSetFieldValue('custentity_scg_name_addr_chgd', 'F');
				//nlapiSetFieldValue('custentity_scg_bank_details_chgd', 'F');
				//nlapiSetFieldValue('custentity_update_made_by', '');
			//}
			
		}
		
	}
	
}







/**
 * Captures changes to the Company Name (Legal Name) or the default address on the vendor record.  A Vendor Change Details record is required if Company Name or Address is modified 
 *
 * @appliedtorecord vendor
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_ven_vendorNameAddrChgd(type, name, linenum){
	
	if (name == 'companyname' || name == 'defaultaddress'){
		
		var userID = nlapiGetUser();
		
		//Check to see if Vendor was previously approved.  If yes, unapprove and flag to send re-approval email
		//Check to see if Vendor was previously approved.  If yes, unapprove
		var currentApprvlStatus = nlapiGetFieldValue('custentity_scg_vendor_approved');
		if (currentApprvlStatus == 'T'){
			nlapiSetFieldValue('custentity_scg_vendor_approved', 'F');
			//nlapiSetFieldValue('custentity_scg_send_reappvl_email', 'T');
		}
		
		//Update fields indicating a Name Change occurred on Vendor Record
        nlapiSetFieldValue('custentity_scg_name_addr_chgd', 'T');
        nlapiSetFieldValue('custentity_update_made_by', userID);
		
	}//End if (name == 'companyname' || name == 'defaultaddress')
	
}






/**
 * Captures changes to the Company Name (Legal Name) or the default address on the vendor record.  A Vendor Change Details record is required if Company Name or Address is modified 
 *
 * @appliedtorecord vendor
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_ven_vendorBankInfoChgd(type, name, linenum){
	
	if (name == 'bankname' || name == 'banknumber' || name == 'accountnumber'){
		
		var userID = nlapiGetUser();
		
		//Check to see if Vendor was previously approved.  If yes, unapprove and flag to send re-approval email
		//Check to see if Vendor was previously approved.  If yes, unapprove
		var currentApprvlStatus = nlapiGetFieldValue('custentity_scg_vendor_approved');
		if (currentApprvlStatus == 'T'){
			nlapiSetFieldValue('custentity_scg_vendor_approved', 'F');
			//nlapiSetFieldValue('custentity_scg_send_reappvl_email', 'T');
		}
		
		//Update fields indicating a Bank Info Change occurred on Vendor Record
        nlapiSetFieldValue('custentity_scg_bank_details_chgd', 'T');
        nlapiSetFieldValue('custentity_update_made_by', userID);
		
	}//End if (name == 'bankname' || name == 'banknumber' || name == 'accountnumber')
	
}










function am_ven_validateChangeDetailRecord(){
	
	var retVal = true;
	
	//Allow Save if Send Banking / Address Confirmation Email is checked
	//var confEmail = nlapiGetFieldValue('custentity_scg_send_bank_info_conf_email');
	//if (confEmail == 'T'){
		//return retVal;
	//}
	
	//Allow Save if New Vendor Record is checked
	var newVendRec = nlapiGetFieldValue('custentity_scg_new_vendor_record');
	if (newVendRec == 'T'){
		return retVal;
	}
	
	//var addrBankChg = nlapiGetFieldValue('custentity_scg_addr_bank_details_chgd');
	var addrChg = nlapiGetFieldValue('custentity_scg_name_addr_chgd');
	var bankInfoChg = nlapiGetFieldValue('custentity_scg_bank_details_chgd');
	//var emailChg = nlapiGetFieldValue('custentity_scg_email_addr_updated');
	//var newVendRec = nlapiGetFieldValue('custentity_scg_new_vendor_record');
	
	//if (addrChg == 'T' || bankInfoChg == 'T' || emailChg == 'T' || newVendRec == 'T'){
	if (addrChg == 'T' || bankInfoChg == 'T'){
		
		var vendId = nlapiGetRecordId();
		
		if (isEmpty(vendId)){
			return retVal;
		}
		
		var found = 'F';
		
		var date = new Date();
		//var day = date.getDate();
		//var month = date.getMonth();
		//month++;
		//var year = date.getFullYear();
		//var dateFormatted = month + '/' + day + '/' + year;
		var dateFormatted = nlapiDateToString(date, 'date');
		//alert ('Formatted Date = ' + dateFormatted);
		
		var searchresults = getVendChgRecs(vendId);
		
		if (searchresults){
			
			for (var i = 0; i < searchresults.length; i++){
				
				var dateCreated = searchresults[i].getValue('created');
				//alert ('Date Created = ' + dateCreated);
				
				if (dateCreated.indexOf(dateFormatted) >= 0){
					//alert ('Got a hit');
					found = 'T';
					break;
				}
				
			}
			
		}
		
		if (found == 'F'){
			//if (addrChg == 'T' || bankInfoChg == 'T' || emailChg == 'T'){
			if (addrChg == 'T' || bankInfoChg == 'T'){
				//alert ('Either the name, the billing address, or the banking details, has changed.\n\nSaving the Vendor is not permitted until a Vendor Change Details Record is entered with details of the change.\n\nPlease navigate to the Custom tab to enter the appropriate information.\n');
				nlapiSetFieldValue('custentity_scg_vend_chg_det_req', 'T');
				//retVal = false;
				//return retVal;
			}
			
			//if (newVendRec == 'T'){
				//alert ('This is a new vendor record.\n\nSaving the record is not permitted until a Vendor Change Details Record is entered with details of the change.\n\nPlease navigate to the Custom tab to enter the appropriate information.\n');
				//nlapiSetFieldValue('custentity_scg_vend_chg_det_req', 'T');
				//retVal = false;
				//return retVal;
			//}
			
		}
		
		//retVal = false;//TEMP CODE
		//return retVal;//TEMP CODE
		
	}
	
	return retVal;
	
}



function getVendChgRecs(vendId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	filters.push(new nlobjSearchFilter('custrecord_scg_vcd_vendor', null, 'anyof', vendId));
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('created', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('customrecord_scg_vendor_chg_details', null, filters, columns);
	  
	// Return
	return results;
	
}





function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  





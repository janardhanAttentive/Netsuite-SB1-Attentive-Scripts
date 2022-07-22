/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Dec 2020     Doug Humberd     Checks to see if the Vendor Record has been Approved prior to allowing transactions to be created for that vendor
 *                            Doug Humberd     Added pageInit function to check if Vendor has been Approved prior to allowing transaction to be created for that vendor
 *
 */


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord vendorbill, check, vendorpayment
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function am_chkVenApvd_logError(e) {
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
function am_chkVenApvd_pageInit(type) {
	try {
		am_chkVenApvd_chkVendorAppvd(type);
		//am_chkVenApvd_pageInitFunction(type);
	} catch (e) {
		am_chkVenApvd_logError(e);
		throw e;
	}
}


/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord vendorbill, check, vendorpayment
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_chkVenApvd_fieldChanged(type, name, linenum) {
	try {
		am_chkVenApvd_checkIfVendorApproved(type, name, linenum);
	} catch (e) {
		am_chkVenApvd_logError(e);
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
function am_chkVenApvd_postSourcing(name, type) {
	try {
		//am_chkVenApvd_postSourcingFunction(type);
	} catch (e) {
		am_chkVenApvd_logError(e);
		throw e;
	}
}


/**
 * Handles validation prior to the form being submitted to the server
 *  
 * @param {Boolean}
 */
function am_chkVenApvd_saveRecord() {
	try {
		var retVal = false;
		//retVal = am_chkVenApvd_saveRecordFunction();
		retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
	} catch (e) {
		am_chkVenApvd_logError(e);
		throw e;
	}
}





/**
 * Validates the user's role prior to allowing the 'Vendor Approved' box to be checked 
 *
 * @appliedtorecord vendorbill, check, vendorpayment
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_chkVenApvd_checkIfVendorApproved(type, name, linenum){
	
	if (name == 'entity'){
		
		var recType = nlapiGetRecordType();
		//alert ('Record Type = ' + recType);
		
		//if (recType == 'purchaseorder' || recType == 'vendorbill' || recType == 'vendorpayment' || recType == 'check'){
		if (recType == 'vendorbill' || recType == 'vendorpayment' || recType == 'check'){
			
			var entId = nlapiGetFieldValue('entity');
			
			if (isEmpty(entId)){
				return;
			}
			
			var entText = nlapiGetFieldText('entity');
			
			var vendApvd = nlapiLookupField('vendor', entId, 'custentity_scg_vendor_approved');
			
			if (vendApvd != null && vendApvd == 'F'){//null = not a vendor, F = not approved
				alert ('Transactions are not allowed for vendor "' + entText + '",\nas it has not been approved.\n');
				nlapiSetFieldValue('entity', '');
			}
			
		}
		
	}
	
}





/**
 * Checks to see if vendor is approved before allowing transactions to be created
 *  
 * @param {String} type Operation types: create, copy, edit
 * @returns {Void}
 */
function am_chkVenApvd_chkVendorAppvd(type){
	
	var recType = nlapiGetRecordType();
	
	//if (recType == 'purchaseorder' || recType == 'vendorbill' || recType == 'vendorpayment'){
	if (recType == 'vendorbill' || recType == 'vendorpayment'){
		
		var entId = nlapiGetFieldValue('entity');
		
		if (!isEmpty(entId)){
			
			var entText = nlapiGetFieldText('entity');
			var entRecType = nlapiGetFieldValue('custbody_scg_entity_rec_type');
			//alert ('entRecType = ' + entRecType);
			
			var vendApvd = nlapiLookupField('vendor', entId, 'custentity_scg_vendor_approved');
			//var vendApvd = nlapiGetFieldValue('custbody_is_approved_vendor');
			
			//if (vendApvd != null && vendApvd == 'F'){//null = not a vendor, F = not approved
			if (entRecType == 'Vendor' && vendApvd == 'F'){//Entity Record Type must be a vendor, F = not approved
				alert ('Transactions are not allowed for vendor "' + entText + '",\nas it has not been approved.\n');
				nlapiSetFieldValue('entity', '');
			}
			
		}
		
	}
	
}






function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  





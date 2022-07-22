/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Dec 2020     Doug Humberd     Handles client events on Vendor Change Details records
 *                            Doug Humberd	   Updated to account for VCD records that are edited
 * 1.05       18 Jan 2021     Doug Humberd     Updated for changes to "Vendor Creation Details" (from Vendor Change Details)
 *
 */


/**
 * Logs an exception to the script execution log
 * 
 * @appliedtorecord customrecord_scg_vendor_chg_details
 * 
 * @param {String} e Exception
 * @returns {Void}
 */
function am_vcd_logError(e) {
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
function am_vcd_pageInit(type) {
	try {
		//am_vcd_pageInitFunction(type);
	} catch (e) {
		am_vcd_logError(e);
		throw e;
	}
}


/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord customrecord_scg_vendor_chg_details
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_vcd_fieldChanged(type, name, linenum) {
	try {
		//am_vcd_fieldChangedFunction(type, name, linenum);
	} catch (e) {
		am_vcd_logError(e);
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
function am_vcd_postSourcing(name, type) {
	try {
		//am_vcd_postSourcingFunction(type);
	} catch (e) {
		am_vcd_logError(e);
		throw e;
	}
}


/**
 * Handles validation prior to the form being submitted to the server
 *  
 * @param {Boolean}
 */
function am_vcd_saveRecord() {
	try {
		var retVal = false;
		retVal = am_vcd_uncheckVendCreationDetailReq();
		//retVal = (retVal) ? am_vcd_uncheckVendChangeDetailReq() : false;
		//retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
	} catch (e) {
		am_vcd_logError(e);
		throw e;
	}
}




function am_vcd_uncheckVendCreationDetailReq(){
	
	var retVal = true;
	
	var vcdId = nlapiGetRecordId();
	
	//Validate that all required fields have values, else do not save
	var vendId = nlapiGetFieldValue('custrecord_scg_vcd_vendor');
	var effDate = nlapiGetFieldValue('custrecord_scg_vcd_eff_date');
	//var chgType = nlapiGetFieldValue('custrecord_scg_vcd_chg_type');
	var creationJust = nlapiGetFieldValue('custrecord_scg_vcd_creation_jutification');
	//var reqChgs = nlapiGetFieldValue('custrecord_scg_vcd_req_chgs');
	var vendDoc = nlapiGetFieldValue('custrecord_scg_vcd_doc_from_vendor');
	
	if (isEmpty(vendId) || isEmpty(effDate) || isEmpty(creationJust) || isEmpty(vendDoc)){
		alert ('Please make sure values are entered for required fields:\n\nEffective Date\nCreation Justification\nDocumentation from Vendor');
		//alert ('Please make sure values are entered for required fields:\n\nDocumentation from Vendor');
		retVal = false;
		return retVal;
	}
	
	if (isEmpty(vcdId)){//If Empty, create mode
		
		nlapiSubmitField('vendor', vendId, 'custentity_scg_vend_crtn_det_req', 'F');
		//var vendRec = nlapiLoadRecord('vendor', vendId, {recordmode: 'dynamic'});
		//vendRec.setFieldValue('custentity_scg_vend_chg_det_req', 'F');
		//nlapiSubmitRecord(vendRec);
		
	}else{//edit mode
		
		var date = new Date();
		//var day = date.getDate();
		//var month = date.getMonth();
		//month++;
		//var year = date.getFullYear();
		//var dateFormatted = month + '/' + day + '/' + year;
		var dateFormatted = nlapiDateToString(date, 'date');
		
		var dateCreated = nlapiLookupField('customrecord_scg_vendor_crtn_details', vcdId, 'created');
		
		if (dateCreated.indexOf(dateFormatted) >= 0){
			//alert ('Got a hit');
			nlapiSubmitField('vendor', vendId, 'custentity_scg_vend_crtn_det_req', 'F');
			//var vendRec = nlapiLoadRecord('vendor', vendId, {recordmode: 'dynamic'});
			//vendRec.setFieldValue('custentity_scg_vend_chg_det_req', 'F');
			//nlapiSubmitRecord(vendRec);
		}
		
	}
	
	return retVal;
	
}




function isEmpty(stValue)
{ 
    if ((stValue == '') || (stValue == null) ||(stValue == undefined))
    {
        return true;
    }
    
    return false;
}  



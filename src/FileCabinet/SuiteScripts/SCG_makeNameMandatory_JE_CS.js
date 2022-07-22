/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       03 Mar 2021     Doug Humberd     Makes 'Name' mandatory if Account Type = Accounts Payable, Accounts Receivable, or Deferred Revenue
 * 1.05       30 Mar 2021     Doug Humberd     Updated to only trigger for accounts 11010 and 20010, not all AP and AR Accts.  Keep Deferred Revenue (all)
 *
 */

/**
 * Constants
 */
const ACCOUNTS_RECEIVABLE = '517';//Acount: 11010 Accounts Receivable
const ACCOUNTS_PAYABLE_VENDOR = '520';//Acount: 20010 Accounts Payable - Vendor


 /**
 * Logs an exception to the script execution log
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 * @param {String} e Exception
 * @returns {Void}
 */
function am_mnm_logError (e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error',
			e.getCode() + '\n' + e.getDetails());
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
function am_mnm_pageInit (type) {
	try {
		//am_mnm_pageInitFunction(type);
	} catch (e) {
		am_mnm_logError(e);
		throw e;
	}
}

/**
 * Performs actions when a field is changed in the user's browser
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 * @param {String} type Sublist internal id
 * @param {String} name Field internal id
 * @param {Number} linenum Optional line item number, starts from 1
 * @returns {Void}
 */
function am_mnm_fieldChanged (type, name, linenum) {
	try {
		//am_mnm_fieldChangedFunction(type, name, linenum);
	} catch (e) {
		am_mnm_logError(e);
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
function am_mnm_postSourcing (name, type) {
	try {
		//am_mnm_postSourcingFunction(name, type);
	} catch (e) {
		am_mnm_logError(e);
		throw e;
	}
}



/**
 * Performs actions prior to a line being added to a sublist
 *
 * @param {String} type - the sublist internal id
 * @returns {Void}
 */
function am_mnm_validateLine(type) {
	try {
		var retValue = false;
		retValue = am_mnm_makeNameMandatory(type);
		//retValue = (retValue) ? am_mnm_validateLineFunction(type) : false;
		//retValue = (retValue) ? true /* replace with additional function_name() */ : false;
		//am_mnm_validateLineFunction(type);
		return retValue;
	} catch (e) {
		am_mnm_logError(e);
		throw e;
	}
}



/**
 * Performs actions after a line is added to a sublist
 *
 * @param {String} type - the sublist internal id
 * @returns {Void}
 */
function am_mnm_recalc(type) {
	try {
		//am_mnm_recalcFunction(type);
	} catch (e) {
		am_mnm_logError(e);
		throw e;
	}
}






/**
 * Handles validation prior to the form being submitted to the server
 *
 * @returns {Boolean}
 */
function am_mnm_saveRecord () {
	try {
		var retVal = false;
		//retVal = am_mnm_saveRecordFunction();
		//retVal = (retVal) ? true /* replace with additional function_name() */ : false;
		return retVal;
	} catch (e) {
		am_mnm_logError(e);
		throw e;
	}
}




function isEmpty (stValue) {
	if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
		return true;
	}

	return false;
}  



/**
 * Alerts user if the Name field is empty on a line where Account Type = Accounts Payable or Accounts Receivable
 *
 * @appliedtorecord journalentry advintercompanyjournalentry
 *
 */
function am_mnm_makeNameMandatory(type){
	
	var recType = nlapiGetRecordType();
	//alert ('Record Type = ' + recType);
		
		
	if (recType == 'journalentry' || recType == 'advintercompanyjournalentry'){
		
		//alert (recType + ' code');
		
		var account = nlapiGetCurrentLineItemValue('line', 'account');
		
		var acctType = nlapiGetCurrentLineItemValue('line', 'accounttype');
		//alert ('Account Type = ' + acctType);
		
		var name = nlapiGetCurrentLineItemValue('line', 'entity');
		
		//if ((acctType == 'AcctRec' || acctType == 'AcctPay' || acctType == 'DeferRevenue') && isEmpty(name)){
		if ((account == ACCOUNTS_RECEIVABLE || account == ACCOUNTS_PAYABLE_VENDOR || acctType == 'DeferRevenue') && isEmpty(name)){

			alert ('\nName is Required for this line.\n\nPlease enter a value in the Name column.\n');
			
			retValue = false;
			return retValue;
			
		}//End if ((acctType == 'AcctRec' || acctType == 'AcctPay' || acctType == 'DeferRevenue') && isEmpty(name))
		
	}//End if (recType == 'journalentry' || recType == 'advintercompanyjournalentry')
		
	
	
	retValue = true;
	return retValue;
	
}





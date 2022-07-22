/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Dec 2020     Doug Humberd     Redirects back to the vendor record after the Vendor is approved
 *
 */


/**
 * Redirects back to the vendor record after the Vendor is approved when the Approve Vendor button is clicked
 * 
 * @appliedtorecord vendor
 * 
 * @param {Object} request The Suitelet request object
 * @param {Object} response The Suitelet response object
 * @returns {Void}
 */
function am_ven_approveVendorButton(request, response) {
	try {
		// Get the Vendor Bill ID
		var venId = request.getParameter('vendid');
		var userId = nlapiGetContext().getUser();
		//var buttonId = request.getParameter('buttonid');
		//nlapiLogExecution('debug', 'vbId', vbId);
		//nlapiLogExecution('debug', 'userId', userId);
		if (!venId) {
			throw nlapiCreateError('MISSING_RECORD_ID', 'No Vendor ID was received', false);
		}
		//if (!buttonId) {
			//throw nlapiCreateError('MISSING_BUTTON_ID', 'No Button ID was received', false);
		//}
		
		// Redirect user to the updated record
		nlapiSetRedirectURL('RECORD', 'vendor', venId);
	} catch(e) {
		if (e instanceof nlobjError) {
			nlapiLogExecution( 'ERROR', 'system error', e.getCode() + '\n' + e.getDetails() );
			throw e;
		} else {
			nlapiLogExecution( 'ERROR', 'unexpected error', e.toString() );
			throw e;
		}
	}
}
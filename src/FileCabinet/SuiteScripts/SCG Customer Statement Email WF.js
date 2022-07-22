/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       14 Jan 2021     Doug Humberd	   Send email to dunning email or native email address using the template parameter given on the workflow action
 *                                             CC addresses stored / configured within the WF Action script
 *                                             All Overdue Invoices and a Customer Statement attached to the email
 * 1.05       12 Feb 2021     Doug Humberd     Added Script parameter - CC Client Alias Email
 *                                             Updated to include Invoices with Due Date on or before 5 days from now (changed from Days Overdue > 0)
 * 1.10       21 May 2021     Doug Humberd     Updated to use "Billing Contact Email" instead of native 'Email' field
 *
 */

/**
 * Constants
 */

//const ACCOUNTS_RECEIVABLE_EMPLOYEE = '4224';
//const REPLY_TO_EMAIL = 'accounts.receivable@company.com';

/**
 * Populates the Free FOrm Address field on the WF Send Email action
 * 
 * @returns {Void} Any or no return value
 */
function am_cust_dunning_email_wfAction() {
	try{
		
		// Initialize Values
		var custId = nlapiGetRecordId();
		var dunningEmail = nlapiGetFieldValue('custentity_dunning_emails');
		//var email = nlapiGetFieldValue('email');
		var email = nlapiGetFieldValue('custentity_scg_billing_contact_email');
		var acctExec = nlapiGetFieldValue('salesrep');
		var clntAliasEmail = nlapiGetFieldValue('custentity_scg_client_alias_email');
		var recipient = null;
		var cc = null;
		var attachments = [];
		
		nlapiLogExecution('DEBUG', 'CustID: ' + custId, 'Sales Rep: ' + acctExec);
		nlapiLogExecution('DEBUG', 'Dunning Email', dunningEmail);
		nlapiLogExecution('DEBUG', 'Email', email);
		
		
		//var transId = nlapiGetRecordId();
		//var transType = nlapiGetRecordType();
		//var transRec = nlapiLoadRecord(transType, transId);
		//var customerId = transRec.getFieldValue('entity');
		//var dunningEmail = nlapiLookupField('customer', customerId, 'custentity_dunning_emails');
		//var acctExec = transRec.getFieldValue('salesrep');
		//var useQuickBooksInv = transRec.getFieldValue('custbody_scg_use_quickbooks_invoice');
		//var rvp = transRec.getFieldValue('custbody_rvpso');
		//var csr = transRec.getFieldValue('custbody_csa');
		
		
		//nlapiLogExecution('DEBUG', 'Initialize Values', 'Record Type: ' + transType + " Record Id: " + transId + ' Customer Id: ' + customerId + ' Dunning Email: '+ dunningEmail);
		
		// Get Parameters
		var emailTemplate = nlapiGetContext().getSetting('SCRIPT', 'custscript_cust_dunning_email_template');
		var emailAuthor = nlapiGetContext().getSetting('SCRIPT', 'custscript_cust_dunning_email_author');
		var ccAcctExec = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_cc_acct_exec');
		var addlEmailCC1 = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_addl_email_cc_1');
		var addlEmailCC2 = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_addl_email_cc_2');
		var addlEmailCC3 = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_addl_email_cc_3');
		var addlEmailCC4 = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_addl_email_cc_4');
		//var addlEmailCC5 = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_addl_email_cc_5');
		var ccClientAliasEmail = nlapiGetContext().getSetting('SCRIPT', 'custscript_custdunn_cc_clnt_alias_email');
		
		
		//Generate Statement PDF
		var today = new Date();
		var date = nlapiDateToString(today, 'date');
		nlapiLogExecution('DEBUG', 'date', date);
		
		var sdate = new Array();
		//sdate.startdate = '02/07/2008';
		sdate.statementdate = date;
		sdate.openonly = 'T';
		
		var pdfStmtFile = nlapiPrintRecord('STATEMENT', custId, 'PDF', sdate);
		
		attachments.push(pdfStmtFile);
		
		
		//Generate Overdue Invoice PDFs
		var searchresults = getOverdueInvs(custId);
		
		if (searchresults){
			
			var odInvCount = 0;
			
			for (var x = 0; x < searchresults.length; x++){
				
				var invId = searchresults[x].getValue('internalid');
				
				var pdfFile = nlapiPrintRecord('TRANSACTION', invId, 'PDF', null);
				attachments.push(pdfFile);
				
				odInvCount = odInvCount + 1;
				
			}//End for x loop
			
			nlapiLogExecution('DEBUG', 'Number of Invoice PDFs Attached', odInvCount);
			
		}//End if (searchresults)
		
		
    	//var pdfFile = nlapiPrintRecord('TRANSACTION', transId, 'PDF', null);

		
		// Merge email
		var emailMerger = nlapiCreateEmailMerger(emailTemplate);
		//emailMerger.setTransaction(transId);
		emailMerger.setEntity('customer',custId);
		
		var mailRec = emailMerger.merge();
		var emailSubject = mailRec.getSubject();
		var emailBody = mailRec.getBody();
		
		nlapiLogExecution('DEBUG', 'Email Template', 'Template: '+ emailTemplate+ ' Subject: '+emailSubject);
		
		// If the dunning email has a value then send email to it
		if(dunningEmail != null && dunningEmail != ""){
			
			nlapiLogExecution('DEBUG', 'Dunning Email Before Clean Up', dunningEmail);
			
			//Clean up Dunning Email List, if necessary
			while (dunningEmail.indexOf(' ') != -1){
				dunningEmail = dunningEmail.replace(' ', '');
			}
			while (dunningEmail.indexOf(',') != -1){
				dunningEmail = dunningEmail.replace(',', ';');
			}
			while (dunningEmail.indexOf('#') != -1){
				dunningEmail = dunningEmail.replace('#', '');
			}
			while (dunningEmail.indexOf('<') != -1){
				dunningEmail = dunningEmail.replace('<', '');
			}
			while (dunningEmail.indexOf('>') != -1){
				dunningEmail = dunningEmail.replace('>', '');
			}
			while (dunningEmail.indexOf('@@') != -1){
				dunningEmail = dunningEmail.replace('@@', '@');
			}
			while (dunningEmail.indexOf('*') != -1){
				dunningEmail = dunningEmail.replace('*', '');
			}
			while (dunningEmail.indexOf('!') != -1){
				dunningEmail = dunningEmail.replace('!', '');
			}
			while (dunningEmail.indexOf('%') != -1){
				dunningEmail = dunningEmail.replace('%', '');
			}
			while (dunningEmail.indexOf('&') != -1){
				dunningEmail = dunningEmail.replace('&', '');
			}
			while (dunningEmail.indexOf('\r') != -1){
				dunningEmail = dunningEmail.replace('\r', ';');
			}
			while (dunningEmail.indexOf('\n') != -1){
				dunningEmail = dunningEmail.replace('\n', '');
			}
			
			
			// Set recipient
			recipient = dunningEmail.split(';');
			
			nlapiLogExecution('DEBUG', 'Recipient Set to Array', 'Array: '+ recipient + ' Recipient Array length: ' + recipient.length);
			
		} else{
			
			//nlapiLogExecution('DEBUG', 'No Dunning Email', 'Use Native Email');
			nlapiLogExecution('DEBUG', 'No Dunning Email', 'Use Billing Contact Email');
			
			//var invEmails = transRec.getFieldValue('custbody_invoice_email_address_list');
			
			// If Email is null then end script
			if (isEmpty(email)){
				return;
			}
			
			//nlapiLogExecution('DEBUG', 'Initial Invoice Emails', invEmails);
			
			// Invoice Emails may have spaces or ; between emails, replace these with a comma
			//invEmails = invEmails.replace(", ", ",");
			//invEmails = invEmails.replace(" ", ",");
			//invEmails = invEmails.replace(";", ",");
			
			//nlapiLogExecution('DEBUG', 'After Replace', invEmails);
			
			//recipient = invEmails.split(",");
			
			
			//Clean up Billing Contact Email List, if necessary
			while (email.indexOf(' ') != -1){
				email = email.replace(' ', '');
			}
			while (email.indexOf(',') != -1){
				email = email.replace(',', ';');
			}
			while (email.indexOf('#') != -1){
				email = email.replace('#', '');
			}
			while (email.indexOf('<') != -1){
				email = email.replace('<', '');
			}
			while (email.indexOf('>') != -1){
				email = email.replace('>', '');
			}
			while (email.indexOf('@@') != -1){
				email = email.replace('@@', '@');
			}
			while (email.indexOf('*') != -1){
				email = email.replace('*', '');
			}
			while (email.indexOf('!') != -1){
				email = email.replace('!', '');
			}
			while (email.indexOf('%') != -1){
				email = email.replace('%', '');
			}
			while (email.indexOf('&') != -1){
				email = email.replace('&', '');
			}
			while (email.indexOf('\r') != -1){
				email = email.replace('\r', ';');
			}
			while (email.indexOf('\n') != -1){
				email = email.replace('\n', '');
			}
			
			
			// Set recipient
			recipient = email.split(';');
			
			nlapiLogExecution('DEBUG', 'Recipient Set to Array', 'Array: '+ recipient + ' Recipient Array length: ' + recipient.length);
			
			
			//recipient = email;
			
			//nlapiLogExecution('DEBUG', 'Recipient Set to Native Email', recipient);
			//nlapiLogExecution('DEBUG', 'Recipient Set to Billing Contact Email', recipient);
			//nlapiLogExecution('DEBUG', 'Recipient Set to Array', 'Array: '+ recipient + ' Recipient Array length: ' + recipient.length);
			
		}
		
		//Determine if any additional emails are to be cc'd
		var additionalEmails = null;
		
		if (ccAcctExec == 'T' && (acctExec != '' && acctExec != null)){
			var acctExecEmail = nlapiLookupField('employee', acctExec, 'email');
			if (additionalEmails == null){
				additionalEmails = acctExecEmail;
			}else{
				additionalEmails = additionalEmails + ',' + acctExecEmail;
			}
		}
		

		
		if (addlEmailCC1 != '' && addlEmailCC1 != null){
			var addlCC1Email = nlapiLookupField('employee', addlEmailCC1, 'email');
			if (additionalEmails == null){
				additionalEmails = addlCC1Email;
			}else{
				additionalEmails = additionalEmails + ',' + addlCC1Email;
			}
		}
		
		if (addlEmailCC2 != '' && addlEmailCC2 != null){
			var addlCC2Email = nlapiLookupField('employee', addlEmailCC2, 'email');
			if (additionalEmails == null){
				additionalEmails = addlCC2Email;
			}else{
				additionalEmails = additionalEmails + ',' + addlCC2Email;
			}
		}
		
		if (addlEmailCC3 != '' && addlEmailCC3 != null){
			var addlCC3Email = nlapiLookupField('employee', addlEmailCC3, 'email');
			if (additionalEmails == null){
				additionalEmails = addlCC3Email;
			}else{
				additionalEmails = additionalEmails + ',' + addlCC3Email;
			}
		}
		
		if (addlEmailCC4 != '' && addlEmailCC4 != null){
			var addlCC4Email = nlapiLookupField('employee', addlEmailCC4, 'email');
			if (additionalEmails == null){
				additionalEmails = addlCC4Email;
			}else{
				additionalEmails = additionalEmails + ',' + addlCC4Email;
			}
		}
		
		//if (addlEmailCC5 != '' && addlEmailCC5 != null){
			//var addlCC5Email = nlapiLookupField('employee', addlEmailCC5, 'email');
			//if (additionalEmails == null){
				//additionalEmails = addlCC5Email;
			//}else{
				//additionalEmails = additionalEmails + ',' + addlCC5Email;
			//}
		//}
		
		if (ccClientAliasEmail == 'T' && (clntAliasEmail != '' && clntAliasEmail != null)){
			if (additionalEmails == null){
				additionalEmails = clntAliasEmail;
			}else{
				additionalEmails = additionalEmails + ',' + clntAliasEmail;
			}
		}
		
		if (additionalEmails != null){
			cc = additionalEmails.split(",");
		}
		
		if (cc != null){
			nlapiLogExecution('DEBUG', 'CCs Set to Array', 'Array: '+ cc + ' CCs Array length: ' + cc.length);
		}else{
			nlapiLogExecution('DEBUG', 'No CCs', 'No CCs');
		}
		
		// Send Email if there is a recipient
		if(recipient != null){
			
			var records = new Object();
			//records['transaction'] = transId;
			records['entity'] = custId;
			
			//nlapiSendEmail(ACCOUNTS_RECEIVABLE_EMPLOYEE, recipient, emailSubject, emailBody, null, null, records, pdfFile, true, false, REPLY_TO_EMAIL);
			nlapiSendEmail(emailAuthor, recipient, emailSubject, emailBody, cc, null, records, attachments, true, false);
		
			nlapiLogExecution('DEBUG', 'Send Email', 'Email sent to recipient (' + recipient + ') with email subject (' + emailSubject + ') and email body (' + emailBody + ')');
		}
		
		
	} catch(e) {
		am_email_logError(e);
		throw e;
	}
	
}



function getOverdueInvs(custId){
	
	//Define filters
	var filters = new Array();
	filters.push(new nlobjSearchFilter('name', null, 'anyof', custId));
	filters.push(new nlobjSearchFilter('mainline', null, 'is', 'T'));
	filters.push(new nlobjSearchFilter('status', null, 'anyof', 'CustInvc:A'));//Open
	//filters.push(new nlobjSearchFilter('daysoverdue', null, 'greaterthan', '0'));
	filters.push(new nlobjSearchFilter('duedate', null, 'onorbefore', 'fivedaysfromnow'));
	
	  
	// Define columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid', null, null));
	  
	// Get results
	var results = nlapiSearchRecord('invoice', null, filters, columns);
	  
	// Return
	return results;
	
}




/**
 * Writes an error message to the Script Execution Log
 * 
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 * 
 * @returns {Void}
 */
function am_email_logError(e) {
	// Log the error based on available details
	if (e instanceof nlobjError) {
		nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
	} else {
		nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
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





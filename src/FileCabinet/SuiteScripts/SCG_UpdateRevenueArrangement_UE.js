/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       24 May 2021     Doug Humberd     Copies Rev Rec date changes from Sales Transactions (SO) to Revenue Arrangement
 *
 */


/***********************************
 * Constants
 *
 ***********************************/


/**
 * Performs actions immediately before a record is served to a client.
 *
 * @appliedtorecord sales order
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function am_updRA_beforeLoad(type, form, request){
    try {
        //am_updRA_beforeLoadScript(type, form, request);
    } catch (e) {
        am_updRA_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord sales order
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function am_updRA_beforeSubmit(type) {
    nlapiLogExecution('DEBUG', 'Before Submit - Type: ' + type, '');
    try {
    	//am_updRA_beforeSubmitScript(type);
    } catch (e) {
        am_updRA_logError(e);
        throw e;
    }
}


/**
 * Performs actions immediately following a write event on a record.
 *
 * @appliedtorecord sales order
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderprojects (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function am_updRA_afterSubmit(type) {
    nlapiLogExecution('DEBUG', 'After Submit - Type: ' + type, '');
    try {
        scg_ra_updateRevenueArrangement(type);
    } catch (e) {
        am_updRA_logError(e);
        throw e;
    }
}


/**
 * Writes an error message to the Script Execution Log
 *
 * @param {nlobjError} e - The NetSuite Error object passed in from the calling function
 *
 * @returns {Void}
 */
function am_updRA_logError(e) {
    // Log the error based on available details
    if (e instanceof nlobjError) {
        nlapiLogExecution('ERROR', 'System Error', e.getCode() + '\n' + e.getDetails());
    } else {
        nlapiLogExecution('ERROR', 'Unexpected Error', e.toString());
    }
}




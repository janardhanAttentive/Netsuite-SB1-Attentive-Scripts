function onclick_print_invoice(){
    var recId = nlapiGetRecordId();
    var recType = nlapiGetRecordType();
    var newURL = nlapiResolveURL('SUITELET', 'customscript_scg_print_invoice_sl', 'customdeploy1') + '&type='+recType+'&id='+recId;
    window.open(newURL, '_blank');
}
function onclick_send_email(){
    var strWindowFeatures = "location=yes,height=600,width=900,scrollbars=yes,status=yes";
    var recId = nlapiGetRecordId();
    var recType = nlapiGetRecordType();
    var newURL = nlapiResolveURL('SUITELET', 'customscript_atnv_invoice_email_sl', 'customdeploy1') + '&type='+recType+'&recordId='+recId;
    window.open(newURL, "_blank", strWindowFeatures);
}
function pageInit(type){
    if( type == 'copy' ) {
        nlapiSetFieldValue('custbody_invoice_delivery_date', '');
        nlapiSetFieldValue('custbody_scg_sf_date_time', '');
        nlapiSetFieldValue('custbody_paystand_payment_partial_amt', '');
        nlapiSetFieldValue('custbody_scg_sf_paid_date', '');
    }
}
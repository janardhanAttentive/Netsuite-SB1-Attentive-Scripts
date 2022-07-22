/**
 *
 * @NApiVersion 2.0
 * @NScriptType usereventscript
 * @author Robert Fugate
 */
define(['N/record', 'N/runtime', 'N/search'], function (record, runtime, search) {

    function beforeSubmit(context) {

        var newObj = context.newRecord;

      
      
        var billingPlan = newObj.getValue({
            fieldId: 'custrecord_scg_billing_plan'
        })
        var carrierFees = newObj.getValue({
            fieldId: 'custrecord_scg_bill_carrier_fees'
        })
        var custId = newObj.getValue({
            fieldId: 'custrecordzab_s_customer'
        })
        var custRec = record.load({
            type: record.Type.CUSTOMER,
            id: custId
        })
        custRec.setValue({
            fieldId: 'custentity_scg_billing_plan',
            value: billingPlan
        })
        custRec.setValue({
            fieldId: 'custentity_scg_bill_carrier_fees',
            value: carrierFees
        })
      
      log.debug('Script Fired', billingPlan);
      
        custRec.save();

       

    }






    function isNullorEmpty(checkVal){
        if(checkVal != null && checkVal != undefined && checkVal != ''){
            return false;
        }
        else{
            return true;
        }
    };

    return {
        beforeSubmit: beforeSubmit
    };
});

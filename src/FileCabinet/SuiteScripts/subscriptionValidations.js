/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define(['N/record', 'N/log'], function(record, log) {
    function beforeLoad(context) {
        
    }

    function beforeSubmit(context) 
    {
        var rec = context.newRecord;
        var startdate = rec.gtValue('custrecordzab_s_start_date');
        var enddate = rec.getValue('custrecordzab_s_end_date');
        var diff = date_difference(startdate, enddate);
        log.debug('days diff',diff);

        /*
        if (context.type !== context.UserEventType.CREATE)
            return;
        var customerRecord = context.newRecord;
        customerRecord.setValue('comments', 'Please follow up with this customer!');
        if (!customerRecord.getValue('category')) {
            throw error.create({ // you can change the type of error that is thrown, as long as you throw an error
                name: 'MISSING_CATEGORY',
                message: 'Please enter a category.'
            })
        }*/
    }
function date_difference(date1, date2) {
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Get 1 day in milliseconds
    return diffDays;
}
    function afterSubmit(context) {
       
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
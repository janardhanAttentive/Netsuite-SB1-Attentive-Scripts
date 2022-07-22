/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
/**
 *
 * Date             Author
 * 2/22/2021        Josh Westbury
 */
define(['N/record', 'N/log'], function (record, log) {
    var exports = {};
    function afterSubmit(context) {
        if (
            context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT
        )
            return;
        log.debug('SCRIPT START');
        const custId = context.newRecord.id;
        const custRec = record.load({
            type: 'customer',
            id: custId,
            isDynamic: false,
        });
        const isInactive = custRec.getValue('isinactive');
        if (isInactive) return;
        let dbId = custRec.getValue('custentity_scg_db_id');
        log.debug('Database ID', dbId);
        custRec.setValue({
            fieldId: 'externalid',
            value: parseInt(dbId),
        });
        const externalId = custRec.getValue('externalid');
        log.debug('EXTERNAL ID', externalId);
        custRec.save();
    }
    exports.afterSubmit = afterSubmit;
    return exports;
});

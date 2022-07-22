/**
 *@NApiVersion 2.x
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
        var custId = context.newRecord.id;
        var custRec = record.load({
            type: 'customrecord_att_carrier_fee_table',
            id: custId,
            isDynamic: false,
        });
        var isInactive = custRec.getValue('isinactive');
        if (isInactive) return;
        var name = custRec.getValue('name');
        custRec.setValue({
            fieldId: 'externalid',
            value: name,
        });
        custRec.save();
    }
    exports.afterSubmit = afterSubmit;
    return exports;
});
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record'],
    /**
 * @param{record} record
 */
    (record) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            if(scriptContext.type !== scriptContext.InvocationType.ON_DEMAND) return;

            try{
                

                let je2 = record.load({
                    type:'journalentry',
                    id:47047,
                    isDynamic:false
                });
                
                je2.setSublistValue({
                    sublistId:'line',
                    fieldId:'entity',
                    line:8275,
                    value:13
                });
                je2.setSublistValue({
                    sublistId:'line',
                    fieldId:'entity',
                    line:8286,
                    value:13
                });
                je2.setSublistValue({
                    sublistId:'line',
                    fieldId:'entity',
                    line:8310,
                    value:13
                });
                je2.save();

            }catch (e) {
                log.error({
                    title:'Error',
                    details:e
                });
            }


        }

        return {execute:execute}

    });

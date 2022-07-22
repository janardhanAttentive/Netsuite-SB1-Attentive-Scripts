/**
 *
 * @NApiVersion 2.0
 * @NScriptType usereventscript
 * @author Seungyeon Shin
 */
define ( ['N/record', 'N/runtime'] ,
    function(record, runtime) {
        function beforeLoad(context) {
            var newObj = context.newRecord;
            var myScript = runtime.getCurrentScript();
            var envType = runtime.envType;
            log.debug('envType', envType);
            log.debug('newObj', newObj);
            log.debug('newObj.type', newObj.type);
            log.debug('newObj.id', newObj.id);

            var prodUrl = myScript.getParameter('custscript_scg_salesforce_prod_url');
            var sbxURl = myScript.getParameter('custscript_scg_salesforce_sbx_url');
            var idField = myScript.getParameter('custscript_scg_sf_id_field');
            var linkField = myScript.getParameter('custscript_scg_sf_link_field');
            log.debug('prodUrl', prodUrl);
            log.debug('sbxURl', sbxURl);
            log.debug('idField', idField);
            log.debug('linkField', linkField);

            var accountId = newObj.getValue({
                fieldId: idField
            });
            log.debug('accountId', accountId);

            if (!isEmpty(accountId)){
                if (envType == runtime.EnvType.PRODUCTION) {
                    var linkFieldStr = prodUrl + accountId;
                    log.debug('prod linkFieldStr', linkFieldStr);
                    newObj.setValue({
                        fieldId: linkField,
                        value: linkFieldStr,
                        ignoreFieldChange: true
                    });
                }
                else {
                    var linkFieldStr = sbxURl + accountId;
                    log.debug('sbx linkFieldStr', linkFieldStr);
                    newObj.setValue({
                        fieldId: linkField,
                        value: linkFieldStr,
                        ignoreFieldChange: true
                    });
                }
            }
        }
        return {
            beforeLoad: beforeLoad
        };

        function isEmpty(stValue) { 
            if ((stValue == '') || (stValue == null) ||(stValue == undefined)) {
                return true;
            }
            return false;
        };
    });
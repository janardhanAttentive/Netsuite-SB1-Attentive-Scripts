/**
 *
 * @NApiVersion 2.0
 * @NScriptType usereventscript
 * @author Robert Fugate
 */
define ( ['N/record', 'N/runtime', 'N/search'] ,
    function(record, runtime, search) {
        function beforeSubmit(context) {
            var newObj = context.newRecord;
          	if (context.type !== context.UserEventType.CREATE){
  return;
}
          	var isBundle = false;
            var zabSub = newObj.getValue({
                fieldId: 'custbody_scg_zab_subscription_id'
            })
            if(isNullorEmpty(zabSub)){
              return;
            }
            var lineCount = newObj.getLineCount({
                sublistId: 'item'
            })
            var zabSubItemSearch = search.load({
              id: 'customsearch_scg_ue_find_zab_sub_items'
            })
            var filter = zabSubItemSearch.filters;
          	log.debug('Filter', filter)
          	filter.push(search.createFilter({
            	name: 'custrecordzab_si_subscription',
            	operator: search.Operator.IS,
            	values: [zabSub]
          	}));
          	filter.push(search.createFilter({
              	name: 'custrecordzab_si_item',
              	operator: search.Operator.IS,
              	values: [19]
            }));
          	zabSubItemSearch.filters = filter;
          	var foundRecords = zabSubItemSearch.run().getRange({
              	start: 0,
              	end: 1000
            });
          	log.debug('Found Records', foundRecords)
          	if(!isNullorEmpty(foundRecords[0])){
              isBundle = foundRecords[0].getValue({
                    name: 'custrecord_att_si_bundle'
              })
            }
            for(var t = 0; t < lineCount; t++){
                var currZone = newObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcolatt_zone_type',
                    line: t
                })
                if(!isNullorEmpty(currZone)){
                  newObj.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_scg_bundle_line',
                    line: t,
                    value: true
                })
                }

            }
        }
        return {
            beforeSubmit: beforeSubmit
        };

        function isNullorEmpty(checkVal){
            if(checkVal != null && checkVal != undefined && checkVal != ''){
                return false;
            }
            else{
                return true;
            }
        };
    });
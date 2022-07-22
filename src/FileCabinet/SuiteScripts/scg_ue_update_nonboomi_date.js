/**
 *
 * @NApiVersion 2.0
 * @NScriptType usereventscript
 * @author Seungyeon Shin
 */
define ( ['N/record', 'N/runtime'] ,
    function(record, runtime) {
        function beforeSubmit(context) {
            if (context.type == 'create' || context.type == 'edit'){
            	var scriptObj = runtime.getCurrentScript();
            	var SCG_USER_EMAIL = scriptObj.getParameter('custscript_scg_email_address');
				var exeContext = runtime.executionContext;
				var userObj = runtime.getCurrentUser();
				var userEmail = userObj.email;

            	log.debug('SCG_USER_EMAIL', SCG_USER_EMAIL);
            	log.debug('userEmail', userEmail);
            	log.debug('exeContext', exeContext);

				if (userEmail !== SCG_USER_EMAIL || (userEmail === SCG_USER_EMAIL && exeContext !== runtime.ContextType.WEBSERVICES)) {
					// Populate a DateTime field with current timestamp from function below
					var dateTime = scriptObj.getParameter('custscript_scg_timestamp_field');
					log.debug('dateTime', dateTime);

	                var myRec = context.newRecord;
	                var myDate = new Date();
	                log.debug('myDate', myDate);

	                myRec.setValue(dateTime, myDate);
	            }
            }
        }
        return {
            beforeSubmit: beforeSubmit
        };

        function isEmpty(stValue) { 
            if ((stValue == '') || (stValue == null) ||(stValue == undefined)) {
                return true;
            }
            return false;
        };

		function getDateTimeTz() {
			var date = new Date();
			var dateTimeStr = format.format({ value: date, type: format.Type.DATETIMETZ });
			var dateTimeRaw = format.parse({ value: dateTimeStr, type: format.Type.DATETIMETZ });
			return dateTimeRaw;
		};
    });
/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope public
 */
define(['N/search', 'N/record'],
    function (search,record) {






        function getInputData() {
            try {



                var zabSearch = search.load({
                    id: 'customsearch_scg_zab_for_cust_data'
                });
                return zabSearch;

            } catch (error) {
                throw error.message;
            }
        }

        function map(context) {
            var searchResult = JSON.parse(context.value);

            context.write({
                key: searchResult.id

            });


        }
        function reduce(context) {


                        var zabId = context.key;
 
            var newObj = record.load({
                type: 'customrecordzab_subscription',
                id: zabId
            });
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

        function summarize(summary) {


            handleErrors(summary);
            handleSummaryOutput(summary.output);

            // *********** HELPER FUNCTIONS ***********

            function handleErrors(summary) {
                var errorsArray = getErrorsArray(summary);
                if (!errorsArray || !errorsArray.length) {
                    log.debug('No errors encountered');
                    return;
                }

                for (var i in errorsArray) {
                    log.error('Error ' + i, errorsArray[i]);
                }

                if (errorsArray && errorsArray.length) {
                    //
                    // INSERT YOUR CODE HERE
                    //

                }

                return errorsArray;

                // *********** HELPER FUNCTIONS ***********
                function getErrorsArray(summary) {
                    var errorsArray = [];

                    if (summary.inputSummary.error) {
                        log.audit('Input Error', summary.inputSummary.error);
                        errorsArray.push('Input Error | MSG: ' + summary.inputSummary.error);
                    }
                    summary.mapSummary.errors.iterator().each(
                        function (key, e) {
                            var errorString = getErrorString(e);
                            log.audit('Map Error', 'KEY: ' + key + ' | ERROR: ' + errorString);
                            errorsArray.push('Map Error | KEY: ' + key + ' | ERROR: ' + errorString);
                            return true; // Must return true to keep
                            // looping
                        });

                    summary.reduceSummary.errors.iterator().each(
                        function (key, e) {
                            var errorString = getErrorString(e);
                            log.audit('Reduce Error', 'KEY: ' + key + ' | MSG: ' + errorString);
                            errorsArray.push('Reduce Error | KEY: ' + key + ' | MSG: ' + errorString);


                            //            UpdateStatus(key, 3, errorString);

                            return true; // Must return true to keep
                            // looping
                        });

                    return errorsArray;

                    // *********** HELPER FUNCTIONS ***********
                    function getErrorString(e) {
                        var errorString = '';
                        var errorObj = JSON.parse(e);
                        if (errorObj.type == 'error.SuiteScriptError' || errorObj.type == 'error.UserEventError') {
                            errorString = errorObj.name + ': ' + errorObj.message;
                        } else {
                            errorString = e;
                        }
                        return errorString;
                    }
                }
            }

            function handleSummaryOutput(output) {
                var contents = '';
                output.iterator().each(function (key, value) {
                    contents += (key + ' ' + value + '\n');
                    return true;
                });
                if (contents) {
                    log.debug('output', contents);
                }
            }

        }

        function isNullorEmpty(checkVal) {
            if (checkVal != null && checkVal != undefined && checkVal != '') {
                return false;
            } else {
                return true;
            }
        };




        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    }
);
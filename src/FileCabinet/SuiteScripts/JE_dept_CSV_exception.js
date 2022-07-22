/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define(['N/record', 'N/search', 'N/error'], function(record, search, error) {
    function beforeSubmit(context)
    {
            var journalEntry = context.newRecord;
          //  journalEntry.setValue('comments', 'Please follow up with this customer!');
            var lineCount = journalEntry.getLineCount({
                sublistId : 'line'
            });

            log.debug('linecount', lineCount);

            for(var i = 0 ; i < lineCount; i++)
            {
                var accountId = journalEntry.getSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    line: i
                });
                log.debug('accountId',accountId);

                var accountName = search.lookupFields({
                    type: search.Type.ACCOUNT,
                    id: accountId,
                    columns: ['number']
                   });

                var accountNumber = Number(accountName.number);
                log.debug('accountNumber',accountNumber);

                if(accountNumber >= 50000 )
                {
                    var dept =  journalEntry.getSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        line: i
                    });
                  log.debug('dept',dept);
                    if(!dept)
                    {
                      var err = error.create({name: 'MISSING_DEPARTMENT', message: 'Please enter department value'});
                      throw err.message;
                    }
                }      
            }
        
    }

    
    return {
 		beforeSubmit: beforeSubmit,
    };
});
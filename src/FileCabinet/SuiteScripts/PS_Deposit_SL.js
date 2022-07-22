/**
 * @NScriptType Suitelet
 * @NApiVersion 2.1
 */
define(['N/file'], (file) => {
    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                const file_id = context.request.parameters.file;
                let result = [];

                if (file_id) {
                    const file_obj = file.load({
                        id: file_id
                    });

                    log.debug('Data', JSON.stringify(result));

                    var iterator = file_obj.lines.iterator();

                    //Skip the first line (CSV header)
                    iterator.each(function () {return false;});
                    iterator.each(function (line) {
                        var lineValues = line.value.split(',');
                        
                        result.push({
                            id             : lineValues[5],
                            paymentId      : lineValues[33],//32 or 49
                            refundId       : lineValues[34],//33 or 50
                            type           : lineValues[4],
                            transferAmount : Number(lineValues[16]),//16 or 12
                            entryAmount    : Number(lineValues[17]),//17 or 13
                            isSplit        : Number(lineValues[16]) !== Number(lineValues[17]),//16 and 17 or 12 and 13
                            fee            : Number(lineValues[9])
                        });

                        return true;
                    });

                    log.debug('result', JSON.stringify(result));
                }

                context.response.write(JSON.stringify(result));
            }
        }
        catch (e) {
            log.error('Error', JSON.stringify(e));
        }
    };

    return {
        onRequest
    };
});
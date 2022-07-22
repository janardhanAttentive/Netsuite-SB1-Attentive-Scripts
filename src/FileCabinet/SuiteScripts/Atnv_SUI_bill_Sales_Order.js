/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(['N/render', 'N/search', 'N/record', 'N/file'], function(render, search, record, file) {
    function onRequest(context) {
        var request = context.request;
		var getCtId = request.parameters.ctId;
		//getCtId = JSON.stringify(getCtId);
		log.debug('getCtId',getCtId);
      //  var response = options.response; 
		
		var ctRecord = record.load({
								type: 'customrecord_case_transactions',
								id: getCtId
								});
							
								
				var getPodFileId = ctRecord.getValue({
									fieldId: 'custrecordct_carrier_pod'
									});
						log.debug('getPodFileId',getPodFileId);			
									var filePath = file.load({
											  id: getPodFileId
											});
										var geturl = filePath.url;
						log.debug('geturl',geturl);	
						
						var finalUrl = geturl;

       var newWindowParams = "width=750, height=400,resizeable = 1, scrollbars = 1," +

       "toolbar = 0, location = 0, directories = 0, status = 0, menubar = 0, copyhistory = 0";

       var setWindow = "<script>window.open('" + finalUrl + "','Suitelet Form 2','" + newWindowParams + "')</script>";
				//	geturl = 'https://3778702.app.netsuite.com/core/media/media.nl?id=1315505&c=3778702&h=KPZBfEjQytPlQKoH2BSgKj2tXzZy83CM-DwPI37gYwr8Skz8'
 //var test = test +'<script> window.open("'+geturl+'")</script>';
						

        context.response.write(setWindow);
    }

    return {
        onRequest: onRequest
    };
});
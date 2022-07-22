/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Feb 2022     Doug Humberd     Changes the GL Impact on a Credit Memo with item "Write-Off Item" from the 11010 account to 11020
 *
 */
const WRITE_OFF_ITEM = '321';//Item: Write-Off Item
const WRONG_GL_ACCT = 517;//Account: 11010 Accounts Receivable
const RIGHT_GL_ACCT = 617;//Account: 11020 Allowance for Doubtful Accounts
function customizeGlImpact(transactionRecord, standardLines, customLines, book){
    
    nlapiLogExecution('DEBUG', 'SuiteGL Plugin', 'START');
    
    //nlapiLogExecution('DEBUG', 'credit', standardLines.getLine(1).getCreditAmount());
    nlapiLogExecution('DEBUG', 'total', transactionRecord.getFieldValue('total'));
    //nlapiLogExecution('DEBUG', 'debit', standardLines.getLine(3).getDebitAmount());
    nlapiLogExecution('DEBUG', 'type', transactionRecord.getRecordType());
    
    var runGLupdate = 'N';
    
    //Only run Plugin when "Write-Off Item" is on the Credit Memo
    var lineCount = transactionRecord.getLineItemCount('item');
    //nlapiLogExecution('DEBUG', 'Line Count', lineCount);
    
    for (var x = 1; x <= lineCount; x++){
        
        var item = transactionRecord.getLineItemValue('item', 'item', x);
        nlapiLogExecution('DEBUG', 'Item Line ' + x, item);
        
        if (item == WRITE_OFF_ITEM){
            nlapiLogExecution('DEBUG', 'Write-Off Item Found', 'RUN PLUGIN');
            runGLupdate = 'Y';
            break;
        }
        
    }
    
    nlapiLogExecution('DEBUG', 'runGLupdate', runGLupdate);
    
    if (runGLupdate == 'N'){
        nlapiLogExecution('DEBUG', 'Write-Off Item NOT Found', 'EXIT');
        return;
    }
    
    nlapiLogExecution('DEBUG', 'Write-Off Item Found', 'CONTINUE PLUGIN');
    
    for (var i = 0; i < standardLines.getCount(); i++){
        
        var currLine = standardLines.getLine(i);
        //nlapiLogExecution('DEBUG', 'Current Line', currLine);
        
        //nlapiLogExecution('DEBUG', 'credit Line ' + i, standardLines.getLine(i).getCreditAmount());
        //nlapiLogExecution('DEBUG', 'debit Line ' + i, standardLines.getLine(i).getDebitAmount());
        
        var acctId = standardLines.getLine(i).getAccountId();
        nlapiLogExecution('DEBUG', 'Account ID Line ' + i, acctId);
        
        if (acctId == WRONG_GL_ACCT)
        {
            
            nlapiLogExecution('DEBUG', 'Wrong Account Id Found', 'Create GL Imact Lines');
            
            var creditAmt = standardLines.getLine(i).getCreditAmount();
            //var isPosting = standardLines.getLine(i).isPosting();
            var memo = standardLines.getLine(i).getMemo();
            //var custId = standardLines.getLine(i).getEntityId();
            //var subId = standardLines.getLine(i).getSubsidiaryId();
            
            nlapiLogExecution('DEBUG', 'Credit Amount Line ' + i, creditAmt);
            //nlapiLogExecution('DEBUG', 'Is Posting Line ' + i, isPosting);
            nlapiLogExecution('DEBUG', 'Memo Line ' + i, memo);
            //nlapiLogExecution('DEBUG', 'Customer Id Line ' + i, custId);
            //nlapiLogExecution('DEBUG', 'Subsidiary Id Line ' + i, subId);
            
            
            //Create new Debit line to correct the GL Impact
            nlapiLogExecution('DEBUG', 'Create New Debit Line', 'ADD DEBIT LINE');
            var newLine = customLines.addNewLine();
            newLine.setDebitAmount(creditAmt);
            newLine.setAccountId(WRONG_GL_ACCT);
            newLine.setMemo('Custom Plugin Script Setting Debit Value.');
            //newLine.setEntityId(custId);
            
            //Create new Credit line to correct the GL Impact
            nlapiLogExecution('DEBUG', 'Create New Credit Line', 'ADD CREDIT LINE');
            var newLine = customLines.addNewLine();
            newLine.setCreditAmount(creditAmt);
            newLine.setAccountId(RIGHT_GL_ACCT);
            newLine.setMemo('Custom Plugin Script setting Credit Value.');
            //newLine.setEntityId(custId);
            
            break;
            
        }//End if (acctId == WRONG_GL_ACCT)
        
    }//End for i loop
      
}
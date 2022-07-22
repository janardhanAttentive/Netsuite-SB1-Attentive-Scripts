/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       03 Jun 2022    Jyothi Somisetti     Changes the GL Impact on a Credit Memo with item "Write-Off Item" from the 11010 account to 11020
 *
 */
 var WRITE_OFF_ITEM = '466'; //Item: Write-Off Item
 var WRONG_GL_ACCT = 443; //Account: Bad Debt Expense
 var RIGHT_GL_ACCT = 617; //Account: 11020 Allowance for Doubtful Accounts
 
 
 function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
 
     nlapiLogExecution('DEBUG', 'SuiteGL Plugin', 'START');
     nlapiLogExecution('DEBUG', 'total', transactionRecord.getFieldValue('total'));
 
     var runGLupdate = false;
 
     //Only run Plugin when "Write-Off Item" is on the Credit Memo
     var lineCount = transactionRecord.getLineItemCount('item');
 
     for (var x = 1; x <= lineCount; x++) {
         var item = transactionRecord.getLineItemValue('item', 'item', x);
         nlapiLogExecution('DEBUG', 'Item Line ' + x, item);
         if (item == WRITE_OFF_ITEM) {
             nlapiLogExecution('DEBUG', 'Write-Off Item Found', 'RUN PLUGIN');
             runGLupdate = true;
         }
     }
     nlapiLogExecution('DEBUG', 'runGLupdate', runGLupdate);
     if (runGLupdate) {
 
         for (var i = 0; i < standardLines.getCount(); i++) 
         {
 
             var currLine = standardLines.getLine(i);
             var acctId = standardLines.getLine(i).getAccountId();
             nlapiLogExecution('DEBUG', 'Account ID Line ' + i, acctId);
 
             if (acctId == WRONG_GL_ACCT) 
             {
                 try 
                 {
                     nlapiLogExecution('DEBUG', 'Wrong Account Id Found', 'Create GL Imact Lines');
 
                     var debitAmt = standardLines.getLine(i).getDebitAmount();
                     var memo = standardLines.getLine(i).getMemo();
                     var entity = standardLines.getLine(i).getEntityId();

 
                     nlapiLogExecution('DEBUG', 'Debit Amount Line ' + i, debitAmt);                     
                     nlapiLogExecution('DEBUG', 'Memo Line ' + i, memo);
                     nlapiLogExecution('DEBUG', 'entity ' + i, entity);

                     //Create new Debit line to correct the GL Impact
                     nlapiLogExecution('DEBUG', 'Create New Debit Line', 'ADD DEBIT LINE');
                     var newLine = customLines.addNewLine();
                     newLine.setCreditAmount(debitAmt);
                     newLine.setAccountId(WRONG_GL_ACCT);
                     newLine.setMemo('Custom Plugin Script Setting Credit Value.');
                     //newLine.setEntityId(custId);
                     
 
                     //Create new Credit line to correct the GL Impact
                     nlapiLogExecution('DEBUG', 'Create New Credit Line', 'ADD CREDIT LINE');
                     var newLine = customLines.addNewLine();
                     newLine.setDebitAmount(debitAmt);
                     newLine.setAccountId(RIGHT_GL_ACCT);
                     newLine.setMemo('Custom Plugin Script setting Debit Value.');
                     //newLine.setEntityId(custId);
 
                     break;
 
                 } catch (e) {
                     nlapiLogExecution('error', 'error message', e.message);
                 }
             }//End if (acctId == WRONG_GL_ACCT)
         } //End if(runGLupdate)
     } //End for i loop
 
 }
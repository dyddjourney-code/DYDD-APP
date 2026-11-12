import 'server-only';
import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createReadyPdfMonkeyReport, cleanReportFilename, waitForPdfMonkeyDocument, pdfMonkeyReportLink } from '@/lib/assessment-reporting';
import { archiveReportPdf, type StoredReport } from '@/lib/assessments/report-storage';
import { sendApplicationEmail } from '@/lib/lifecycle/application-mail';
import { designPdTemplateId } from '@/lib/designpd/report';
import { ownedGuestResult, type GuestSession, type GuestResult } from './guest';
import { guestRecoveryPath } from './guest-capability';

function origin() {
 const value=process.env.DYDD_APP_URL || '';
 const url=new URL(value);
 if(url.protocol!=='https:'||url.origin!==value||url.username||url.password)throw Error('Report origin is not configured.');
 return value;
}
function escaped(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
async function patch(result:GuestResult,lease:string,values:Record<string,unknown>) {
 const saved=await createSupabaseAdminClient().from('dydd_guest_results').update(values).eq('id',result.id).eq('session_id',result.session_id).eq('report_lease',lease).select('id').maybeSingle();
 if(saved.error||!saved.data)throw Error('Report state needs recovery; no duplicate report was created.');
}
/** One atomic generation fence. A crash before the document ID is saved is uncertain, never retried as a new PDF. */
export async function prepareGuestReport(session:GuestSession,resultId:string) {
 let result=await ownedGuestResult(session.id,resultId);
 if(result.report_state==='ready'&&result.pdf.storage)return result;
 if(process.env.DYDD_GUEST_REPORT_GENERATION_ENABLED!=='true')throw Error('Your result is saved. Report preparation is paused; do not repurchase.');
 const db=createSupabaseAdminClient(),lease=randomUUID();
 const previous=result.report_state;
 if(previous==='creating'&&(!result.pdf.documentId||!result.pdf.startedAt||Date.now()-Date.parse(String(result.pdf.startedAt))<180000))throw Error('Your report is being prepared or needs support reconciliation. Refresh shortly; do not repurchase.');
 if(previous!=='not_started'&&!result.pdf.documentId)throw Error('Your original report needs support reconciliation. Your purchase and answers are saved; do not repurchase.');
 const claim=await db.from('dydd_guest_results').update({report_state:'creating',report_lease:lease,pdf:{...result.pdf,startedAt:new Date().toISOString()}}).eq('id',result.id).eq('session_id',session.id).eq('report_state',previous).filter('report_lease',result.report_lease?'eq':'is',result.report_lease||'null').select('id').maybeSingle();
 if(claim.error||!claim.data)throw Error('Your report is already processing. Refresh shortly.');
 const name=result.product==='designid'?'DesignID':'DesignPD';
 const filename=`${name} Report - ${cleanReportFilename(session.participant_name)} - ${result.id.slice(0,8)}.pdf`;
 let pdf:Record<string,unknown>={...result.pdf,filename,startedAt:new Date().toISOString()};
 let retryMessage='';
 async function createAttempt(){
  await ownedGuestResult(session.id,resultId);
  pdf={...pdf,documentId:null,status:'uncertain',attempts:Number(pdf.attempts||0)+1,lastCreationAt:new Date().toISOString(),storage:null};
  await patch(result,lease,{pdf}); // Fence this creation BEFORE provider IO, even after a known failed attempt.
  const report=await createReadyPdfMonkeyReport({filename,archiveKey:`guest/${result.id}`,payload:result.scores.reportPayload as Record<string,unknown>,
   templateId:result.product==='designid'?(process.env.DESIGNID_PDFMONKEY_TEMPLATE_ID||'346a0595-80fa-48c3-a9e2-29f0c0312e6e'):designPdTemplateId,
   onCreated:async document=>{
    pdf={...pdf,documentId:document.id,status:document.status};
    await patch(result,lease,{pdf}); // durable provider ID BEFORE polling/archive/email
   }});
  pdf={...pdf,documentId:report.document.id,status:report.document.status,storage:report.storage||null,archiveError:report.archiveError||null};
 }
 try{
  // Also recheck paid ownership immediately before any provider request.
  await ownedGuestResult(session.id,resultId);
  if(pdf.documentId){
   const document=await waitForPdfMonkeyDocument(String(pdf.documentId));
   if(document.status==='failure'){
    pdf={...pdf,status:'failure',storage:null};
    if(Number(pdf.attempts||1)>=3)retryMessage='This saved report has reached its technical retry limit. Contact support; do not repurchase.';
    else if(Date.now()-Date.parse(String(pdf.lastCreationAt||result.pdf.startedAt||new Date().toISOString()))<60000)retryMessage='The provider confirmed this report failed. Wait one minute, then retry this same saved report; no new purchase or answers are needed.';
    else{
     pdf={...pdf,previousDocumentIds:[...(Array.isArray(pdf.previousDocumentIds)?pdf.previousDocumentIds:[]),document.id]};
     await createAttempt(); // ONLY explicit original-document failure permits bounded regeneration.
    }
   }else{
    const link=pdfMonkeyReportLink(document);
    const storage=link&&['ready','success'].includes(String(document.status))
     ?await archiveReportPdf(document.download_url||link,`guest/${result.id}`,filename):null;
    pdf={...pdf,status:document.status,storage,documentId:document.id};
   }
  }else await createAttempt();
  await patch(result,lease,{pdf,report_state:pdf.storage?'ready':'uncertain'});
 }catch{
  await patch(result,lease,{pdf,report_state:'uncertain'});
  throw Error('Your result is saved. The original report needs recovery; no repurchase or resubmission is required.');
 }
 if(retryMessage)throw Error(retryMessage);
 result=await ownedGuestResult(session.id,resultId);
 return result;
}
/** Guest-specific copy; never reuse account-login instructions. Original outbox event is immutable. */
export async function emailGuestReport(session:GuestSession,token:string,resultId:string) {
 const result=await ownedGuestResult(session.id,resultId);
 guestStoredReport(result); // validate exact private guest archive locator before notify
 if(process.env.DYDD_GUEST_EMAIL_ENABLED!=='true')throw Error('Your PDF is saved. Report email is paused; use your private download and recovery link.');
 const reportUrl=origin()+guestRecoveryPath(session.id,token),name=result.product==='designid'?'DesignID':'DesignPD';
 const sent=await sendApplicationEmail({templateId:'guest-'+result.product+'-report',idempotencyKey:'guest-report-'+result.id,
  deliveryContext:{type:'guest_assessment_report',guestResultId:result.id,guestSessionId:session.id,reportUrl},
  to:session.participant_email,subject:`Your ${name} report is ready`,
  text:`Hi ${session.participant_name},\n\nYour ${name} report is ready. Open your private report and recovery link: ${reportUrl}\n\nNo account or sign-in is needed. Keep this link private.`,
  html:`<p>Hi ${escaped(session.participant_name)},</p><p>Your ${name} report is ready.</p><p><a href="${escaped(reportUrl)}">Open your report</a></p><p>No account or sign-in is needed. Keep this private link to return to your reports.</p>`});
 const saved=await createSupabaseAdminClient().from('dydd_guest_results').update({email:{sent:sent.sent,skipped:sent.skipped,id:sent.id||null,message:sent.message||null}}).eq('id',result.id).eq('session_id',session.id);
 if(saved.error)throw Error('Your PDF is saved; email status needs reconciliation.');
 return sent;
}
export function guestStoredReport(result:GuestResult):StoredReport {
 const storage=result.pdf.storage as StoredReport|undefined;
 if(result.report_state!=='ready'||!storage||storage.bucket!=='assessment-report-pdfs'||storage.path!==`guest/${result.id}/report.pdf`)throw Error('Your original PDF is not ready. Use report recovery; do not repurchase.');
 return storage;
}

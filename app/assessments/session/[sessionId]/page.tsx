import type { Metadata } from 'next';
import Link from 'next/link';
import { AssessmentPublicShell } from '../../public-assessment-ui';
import { requireGuest, guestRecords } from '@/lib/public-assessments/guest';
import { guestRecoveryPath, guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { DesignIdAssessmentForm } from '@/app/designid/assessment-form';
import { guestCheckoutAvailable } from '@/lib/public-assessments/config';
import { completeGuestAssessment, buyGuestDesignId, buyGuestDesignPd, recoverGuestReport, retryGuestEmail } from '../../guest-actions';
import { AssessmentSubmitButton } from '../../submit-button';
import styles from '../../public-assessments.module.css';
export const dynamic='force-dynamic';
export const maxDuration=120;
export const metadata:Metadata={title:'Your private assessment | DYDD',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function GuestAssessment({params,searchParams}:{params:Promise<{sessionId:string}>;searchParams:Promise<{message?:string}>}) {
 const {sessionId}=await params,{message}=await searchParams;
 let guest,records;
 try{guest=await requireGuest(sessionId);records=await guestRecords(sessionId);}catch{
  return <AssessmentPublicShell><h1>Open your private recovery link</h1><p>This assessment needs the private link supplied with your purchase or report email. No login is needed. If your link has expired, contact support with your purchase receipt; do not repurchase.</p><a href="https://www.discoverdivine.design/contact">Contact DYDD</a></AssessmentPublicShell>;
 }
 const {session,token}=guest;
 const paused=!guestCheckoutAvailable(session.capability_hash);
 return <AssessmentPublicShell><p className={styles.eyebrow}>Your private assessment</p><h1>Welcome, {session.participant_name}.</h1><p>Keep your <a href={guestRecoveryPath(sessionId,token)}>private recovery link</a> to return to your purchase and reports. No account or sign-in is needed.</p>{message?<p className={styles.status} role="status">{message}</p>:null}
  {records.orders.map(order=>{
   const result=records.results.find(r=>r.order_id===order.id),name=order.product==='designid'?'DesignID':'DesignPD';
   if(order.status!=='paid')return <section className={styles.accessPanel} key={order.id}><h2>{name} purchase</h2><p>{order.status==='pending'?'Payment confirmation is pending. A checkout return alone does not unlock the assessment. If you completed payment, refresh shortly; do not purchase again.':order.status==='refunded'?'This purchase was refunded or disputed and is no longer available. Your historical result is retained.':'This checkout did not complete. Contact support if you need help restarting it.'}</p><Link href={guestSessionPath(sessionId)}>Refresh payment status</Link></section>;
   if(!result)return <section key={order.id} className={styles.sourceNote}><h2>{name} is purchased</h2>{order.product==='designid'?<DesignIdAssessmentForm action={completeGuestAssessment.bind(null,sessionId,order.id)} initialReviewer={{name:session.participant_name,email:session.participant_email}} draftNamespace={'guest:'+sessionId} fulfillment="guest"/>:<><p>Your report will use only the completed DesignID associated with this purchase. No additional questions.</p><form action={completeGuestAssessment.bind(null,sessionId,order.id)}><AssessmentSubmitButton pendingLabel="Preparing your report…">Prepare my DesignPD report</AssessmentSubmitButton></form></>}</section>;
   return <section key={order.id} className={styles.accessPanel} style={{marginTop:24}}><h2>{name} · saved</h2><p>Your answers and original result are saved. You do not need another purchase.</p>
    {result.report_state==='ready'&&result.pdf.storage?<><a href={guestSessionPath(sessionId)+'/report/'+result.id}>Download original {name} PDF</a><p className={styles.helper}>{result.email.sent?'Email provider accepted your report email. This does not confirm inbox delivery.':'Email is pending, paused, or needs retry. Your PDF remains available here.'}</p><form action={retryGuestEmail.bind(null,sessionId,result.id)}><AssessmentSubmitButton secondary pendingLabel="Checking original delivery…">Retry report email</AssessmentSubmitButton></form></>:<><p>{result.report_state==='creating'?'Your original PDF is being prepared. Refresh shortly.':'Your report is pending or needs recovery. Recover the original report below; no answers will be rescored.'}</p><form action={recoverGuestReport.bind(null,sessionId,result.id)}><AssessmentSubmitButton secondary pendingLabel="Recovering original report…">Recover original report</AssessmentSubmitButton></form></>}
    {result.product==='designid'&&!records.orders.some(o=>o.product==='designpd'&&o.source_result_id===result.id&&['pending','paid'].includes(o.status))?<div className={styles.checkout}><h3>Explore how you Plan, Decide, and Do</h3><p>DesignPD is derived from this exact DesignID result. Separate one-time purchase: $19.99. No extra questionnaire.</p><form action={buyGuestDesignPd.bind(null,sessionId,result.id)}><AssessmentSubmitButton secondary disabled={paused} pendingLabel="Opening secure checkout…">{paused?'DesignPD purchases are paused':'Purchase DesignPD · $19.99'}</AssessmentSubmitButton></form></div>:null}
   </section>;
  })}
  {!records.orders.length?<section className={styles.accessPanel}><p>Your private session is reserved, but no checkout has been completed.</p><form action={buyGuestDesignId.bind(null,sessionId)}><AssessmentSubmitButton disabled={paused} pendingLabel="Opening secure checkout…">{paused?"Purchases are paused":"Purchase DesignID · $19.99"}</AssessmentSubmitButton></form><Link href="/assessments/designid?guest=1">About DesignID</Link></section>:null}
 </AssessmentPublicShell>;
}

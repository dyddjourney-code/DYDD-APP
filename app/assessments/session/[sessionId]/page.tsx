import { DigitalPurchaseDisclosure } from "@/components/digital-product-disclosure";
import type { Metadata } from 'next';
import Link from 'next/link';
import { AssessmentPublicShell } from '../../public-assessment-ui';
import { markGuestCheckoutResumed } from '@/lib/public-assessments/guest-checkout-reminder';
import { requireGuest, guestRecords } from '@/lib/public-assessments/guest';
import { guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { DesignIdAssessmentForm } from '@/app/designid/assessment-form';
import { guestCheckoutAvailable } from '@/lib/public-assessments/config';
import { completeGuestAssessment, buyGuestDesignId, buyGuestDesignPd, recoverGuestReport, retryGuestEmail, resumeGuestPurchase } from '../../guest-actions';
import { AssessmentSubmitButton } from '../../submit-button';
import { PrepareDesignPd } from './prepare-designpd';
import { GuestJourneyInvitation } from '../../guest-account-link';
import { GuestGroupSessionPanel } from '../../group/session-panel';
import { includedGuestDesignPd } from '@/lib/public-assessments/guest-group-access';
import styles from '../../public-assessments.module.css';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export const metadata: Metadata = { title: 'Your assessments | DYDD', robots: { index: false, follow: false }, referrer: 'no-referrer' };
type GuestQuery = { message?: string; product?: string; order?: string; orderId?: string; result?: string; resultId?: string };

export default async function GuestAssessment({ params, searchParams }: { params: Promise<{ sessionId: string }>; searchParams: Promise<GuestQuery> }) {
  const { sessionId } = await params, query = await searchParams;
  const { message } = query;
  let guest, records;
  try { guest = await requireGuest(sessionId); records = await guestRecords(sessionId);
    // Optional reminder storage must not strand an otherwise valid saved report.
    try{await markGuestCheckoutResumed(sessionId);}catch{/* Worker eligibility/storage failures also fail closed; retry suppression on the next visit. */} } catch {
    return <AssessmentPublicShell owned focused><section className={styles.sessionIntro}><h1>Open your private access link</h1><p>Use the link in your purchase or report email to open your assessment. No sign-in is needed. If the link has expired, contact us with your purchase receipt; you do not need to buy again.</p><a href="https://www.discoverdivine.design/contact" target="_blank" rel="noopener noreferrer">Contact DYDD</a></section></AssessmentPublicShell>;
  }
  const { session } = guest;
  const paused = !guestCheckoutAvailable(session.capability_hash);
  const includedPd = await includedGuestDesignPd(sessionId);
  // All query hints only reorder records already owned by this verified capability.
  const requestedOrder = query.orderId || query.order;
  const requestedResult = records.results.find(result => result.id === (query.resultId || query.result));
  const explicitOrder = records.orders.find(order => order.id === requestedOrder) || records.orders.find(order => order.id === requestedResult?.order_id);
  const productOrder = ['designid', 'designpd'].includes(query.product || '') ? [...records.orders].reverse().find(order => order.product === query.product && order.status === 'paid') : undefined;
  const latestPaid = [...records.orders].reverse().find(order => order.status === 'paid');
  const primaryOrderId = (explicitOrder || productOrder || latestPaid)?.id;
  const orders = [...records.orders].reverse().sort((a, b) => Number(b.id === primaryOrderId) - Number(a.id === primaryOrderId));

  return <AssessmentPublicShell owned focused welcomeName={session.participant_name}>
    {message ? <p className={styles.status} role="status">{message}</p> : null}
    <div className={styles.reportList}>
      {orders.map(order => {
        const result = records.results.find(r => r.order_id === order.id), name = order.product === 'designid' ? 'DesignID' : 'DesignPD';
        if (order.status !== 'paid') return <section className={styles.accessPanel} key={order.id}><h2>{name} purchase</h2><p>{order.status === 'pending' ? 'Checkout is not yet confirmed. If you left before paying, resume the same secure checkout below. If you already paid, check payment status; do not start a new purchase.' : order.status === 'refunded' ? 'This purchase was refunded or disputed and is no longer available.' : 'This checkout did not complete. Contact us if you need help.'}</p>{order.status === 'pending' ? <><DigitalPurchaseDisclosure /><form action={resumeGuestPurchase.bind(null, sessionId, order.id)}><AssessmentSubmitButton pendingLabel="Checking secure checkout…">Resume secure checkout / check payment</AssessmentSubmitButton><p className={styles.helper}>An open checkout is reused. An expired, unpaid checkout is safely replaced for this same purchase. Confirmed payment opens your assessment, without another charge.</p></form></> : null}</section>;
        if (!result) {
          const source = records.results.find(r => r.id === order.source_result_id && r.product === 'designid');
          const sourceIsPaid = source && records.orders.some(o => o.id === source.order_id && o.status === 'paid');
          return <section key={order.id} className={order.product === 'designid' ? styles.assessmentSection : styles.accessPanel}>
            {order.product === 'designid' ? <DesignIdAssessmentForm action={completeGuestAssessment.bind(null, sessionId, order.id)} initialReviewer={{ name: session.participant_name, email: session.participant_email }} draftNamespace={'guest:' + sessionId} fulfillment="guest" /> : <><p className={styles.eyebrow}>Purchase confirmed</p><h2>Your DesignPD report</h2><p>No more questions. We use the DesignID result connected to this purchase to prepare your report.</p><PrepareDesignPd action={completeGuestAssessment.bind(null, sessionId, order.id)} orderId={order.id} autoPrepare={Boolean(sourceIsPaid && order.id === primaryOrderId && !message)} /><p className={styles.helper}>Preparation starts automatically. If it does not start, use the button above. You will return here to download your PDF.</p></>}
          </section>;
        }
        return <section key={order.id} className={styles.accessPanel} id={`report-${result.id}`}>
          <p className={styles.eyebrow}>Your saved report</p><h2>{name}</h2>
          {result.report_state === 'ready' && result.pdf.storage ? <>
            <a className={`${styles.primary} ${styles.reportDownload}`} href={guestSessionPath(sessionId) + '/report/' + result.id}>Download {name} PDF</a>
            <p className={styles.helper}>Your original report is saved. You can download it again without another purchase.</p>
            <div className={styles.emailTools}><p className={styles.helper}>{result.email.sent ? 'Your report email was accepted by the email service. Check your inbox and spam folder.' : 'Your report is available above, even if the email has not arrived.'}</p><form action={retryGuestEmail.bind(null, sessionId, result.id)}><AssessmentSubmitButton secondary pendingLabel="Sending report email…">Resend report email</AssessmentSubmitButton></form></div>
          </> : <><p>{result.report_state === 'creating' ? 'Your PDF is being prepared. Refresh shortly to check it.' : 'Your answers are saved. Use the button below to finish preparing the same report. You do not need to answer again.'}</p><form action={recoverGuestReport.bind(null, sessionId, result.id)}><AssessmentSubmitButton pendingLabel="Preparing your saved report…">Prepare saved {name} PDF</AssessmentSubmitButton></form><Link className={styles.textLink} href={guestSessionPath(sessionId)}>Refresh report status</Link></>}
          {result.product === 'designid' && !includedPd && !records.orders.some(o => o.product === 'designpd' && o.source_result_id === result.id && ['pending', 'paid'].includes(o.status)) ? <div className={styles.checkout}><h3>Continue with DesignPD</h3><p>Optional: explore how you Plan, Decide, and Do, using this DesignID result. No extra questionnaire.</p><DigitalPurchaseDisclosure /><form action={buyGuestDesignPd.bind(null, sessionId, result.id)}><AssessmentSubmitButton secondary disabled={paused} pendingLabel="Opening secure checkout…">{paused ? 'DesignPD is currently unavailable' : 'Purchase DesignPD now · $19.99'}</AssessmentSubmitButton></form><a className={styles.textLink} href="https://www.discoverdivine.design/designpd" target="_blank" rel="noopener noreferrer">Explore DesignPD</a></div> : null}
        </section>;
      })}
    </div>
    {records.results.length > 0 && !orders.some(o => o.status === 'pending' || o.status === 'paid' && !records.results.some(r => r.order_id === o.id)) ? <><GuestGroupSessionPanel sessionId={sessionId}/><GuestJourneyInvitation/></> : null}
    {!records.orders.length ? <section className={styles.accessPanel}><h2>Start your DesignID</h2><p>Your details are saved. Continue to secure checkout to begin.</p><DigitalPurchaseDisclosure /><form action={buyGuestDesignId.bind(null, sessionId)}><AssessmentSubmitButton disabled={paused} pendingLabel="Opening secure checkout…">{paused ? 'Purchases are paused' : 'Continue to DesignID checkout'}</AssessmentSubmitButton></form><a className={styles.textLink} href="https://www.discoverdivine.design/designid" target="_blank" rel="noopener noreferrer">Explore DesignID</a></section> : null}
  </AssessmentPublicShell>;
}

'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { PersonalSubscriptionSummary } from '@/lib/commerce/personal-subscription';

function exactDate(value: string) {
 return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'long', timeZone: 'UTC' }).format(new Date(value));
}
export function PersonalSubscriptionControls({ summary: initial, betaIncluded = false, lifetime = false }: { summary: PersonalSubscriptionSummary; betaIncluded?: boolean; lifetime?: boolean }) {
 const [summary, setSummary] = useState(initial);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const dialog = useRef<HTMLDialogElement>(null);
 const trigger = useRef<HTMLButtonElement>(null);
 const panel = useRef<HTMLElement>(null);
 useEffect(() => { setSummary(initial); }, [initial]);
 const close = () => { dialog.current?.close(); trigger.current?.focus(); };
 async function cancel() {
  if (busy || !summary.paidThrough) return;
  setBusy(true); setError('');
  try {
   const response = await fetch('/api/commerce/personal-subscription/cancel', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'cancel_at_period_end', paidThrough: summary.paidThrough }) });
   const data = await response.json();
   if (!response.ok || data.summary?.cancelAtPeriodEnd !== true) throw Error(data.error || 'Cancellation could not be verified. Please reload your details.');
   setSummary(data.summary); setNotice('Future Personal renewals are canceled. Your account and history are retained.'); dialog.current?.close(); panel.current?.focus();
  } catch (cause) { setError(cause instanceof Error ? cause.message : 'Please try again.'); }
  finally { setBusy(false); }
 }
 const current = summary.state === 'current';
 return <section ref={panel} tabIndex={-1} className="personal-membership-offer" aria-label="Personal membership">
  <div className="personal-membership-summary">
   <p className="section-label">Personal membership</p>
   <h3>{current ? 'Current subscription' : lifetime ? 'Lifetime Personal access' : betaIncluded ? 'Your Personal access' : 'Personal membership'}</h3>
   {current ? <>
    <p className="purchase-price">$10 <span>USD / month</span></p>
    {summary.cancelAtPeriodEnd ? <p className="purchase-active">Unsubscribed · Future renewal stopped</p> : <p className="purchase-active">Subscription status: {summary.status}</p>}
    {summary.nextBillAt && <p>Next billing date: <time dateTime={summary.nextBillAt}>{exactDate(summary.nextBillAt)}</time>.</p>}
    <p className="purchase-fine-print">Standard plan price: $10 USD. Discounts and taxes may affect the invoice.</p>
    {summary.paidThrough ? <p>Paid access through <time dateTime={summary.paidThrough}>{exactDate(summary.paidThrough)}</time>.</p> : <p>A paid-through date could not be verified. No billing change is available here.</p>}
    {summary.canCancel && <button className="button secondary" ref={trigger} type="button" onClick={() => { setError(''); dialog.current?.showModal(); }}>Unsubscribe</button>}
    {summary.cancelAtPeriodEnd && <p>Download your reports before paid access expires. <Link href="/renew?next=%2Fhq">Renew using this same account</Link> to keep your history together.</p>}
   </> : <>
    <p className="purchase-price">{lifetime ? 'No expiry' : betaIncluded ? 'Included in beta' : 'No paid plan verified'}</p>
    <p>{lifetime ? 'Free lifetime Personal all-access. No payment is required for this access.' : betaIncluded ? 'Personal access is included during the free beta. Beta access is not a paid Stripe subscription.' : 'Your saved access stays connected to this account.'}</p>
    {!betaIncluded && <p role={summary.state === 'unavailable' ? 'status' : undefined}>{summary.message || 'No current paid Personal subscription was found.'}</p>}
    {betaIncluded && summary.state === 'unavailable' && <p className="purchase-fine-print">Paid Personal billing details are not available here. Your beta access is unchanged.</p>}
   </>}
  </div>
  <div className="personal-membership-retention"><h4>Keep your journey together</h4><ul><li>Your account, assessment results and report history</li><li>Your saved workbook and journey progress</li><li>Your purchase records and independently purchased report rights</li></ul><p>Always return with this same account. Personal billing does not change Circle billing.</p></div>
  <p role="status" aria-live="polite">{notice}</p>
  <dialog className="membership-cancel-dialog" ref={dialog} aria-labelledby="personal-cancel-title" aria-describedby="personal-cancel-policy" onCancel={event => { if (busy) event.preventDefault(); }} onClose={() => trigger.current?.focus()}>
   <h2 id="personal-cancel-title">Unsubscribe from Personal membership?</h2>
   <div id="personal-cancel-policy">
    <p>This stops future Personal renewals; it does not delete your account. Paid Personal access continues until {summary.paidThrough ? <strong>{exactDate(summary.paidThrough)}</strong> : 'the verified paid-through boundary'}.</p>
    <p>Download your reports before paid access expires. Your account, assessment and report history, workbook progress, and purchase records are retained.</p>
    <p>Circle Leadership, organization billing, separately purchased reports, lifetime grants and free tools keep their independent access rules.</p>
    <p>To renew later, sign in with this same account. Do not create a replacement account.</p>
   </div>
   {error && <p role="alert">{error}</p>}
   <div className="membership-dialog-actions"><button className="button secondary" type="button" autoFocus disabled={busy} onClick={close}>Keep my subscription</button>
   <button className="button primary" type="button" disabled={busy || !summary.canCancel} onClick={cancel}>{busy ? 'Confirming…' : 'Yes, unsubscribe'}</button></div>
  </dialog>
 </section>;
}
export default PersonalSubscriptionControls;

"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
type Subscription={id:string;capability:string;status:string;cancelPending:boolean;paidThrough:string|null;renewsAt:string|null};
const date=(value:string)=>new Intl.DateTimeFormat('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(value));
export function TestSubscriptionControls({area}:{area:'personal'|'circles'|'designpd'}){
 const [rows,setRows]=useState<Subscription[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState<Subscription|null>(null),[loading,setLoading]=useState(true);
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement|null>(null);
 async function load(){const r=await fetch('/api/commerce/subscriptions',{cache:'no-store'}),b=await r.json();if(!r.ok)throw Error(b.error||'Subscription status could not be checked.');setRows(b.subscriptions||[]);}
 useEffect(()=>{void load().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 useEffect(()=>{if(pending&&!dialog.current?.open)dialog.current?.showModal();},[pending]);
 function close(){dialog.current?.close();setPending(null);opener.current?.focus();}
 async function act(row:Subscription,action:string){setBusy(true);setError('');setMessage('');try{
  const r=await fetch('/api/commerce/subscriptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({capability:row.capability,subscriptionId:row.id,action,requestId:crypto.randomUUID()})}),b=await r.json();
  if(!r.ok)throw Error(b.error||'Subscription settings could not be saved.');
  setMessage(action==='resume'?'Renewal restored. Your account, purchase history and saved records are unchanged.':`Renewal cancelled. No more renewals will be charged for this membership. Access continues through ${date(b.paidThrough)} (UTC). Your account and saved records are retained.`);
  close();await load();window.dispatchEvent(new Event('dydd-subscription-updated'));
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const visible=rows.filter(r=>area==='personal'?r.capability==='personal':area==='circles'?r.capability==='circle_leadership':false);
 if(area==='designpd')return null;
 return <section aria-label="Subscription status" className="account-subscription-status"><h3>Subscription status</h3>
  {loading&&<p role="status">Checking your subscription…</p>}
  {!loading&&!visible.length&&!error&&<p>No {area==='personal'?'Personal':'Circle Leadership'} subscription on this account.</p>}
  {visible.map(r=>{const ended=['canceled','incomplete_expired'].includes(r.status)||Boolean(r.paidThrough&&Date.parse(r.paidThrough)<=Date.now());return <div className="account-subscription-record" key={r.id}>
   <p><strong>{r.capability==='personal'?'Personal membership':'Circle Leadership'}</strong> · {ended?'Ended':r.cancelPending?'Renewal cancelled':r.status.replaceAll('_',' ')}</p>
   {r.paidThrough?<p>Paid access through <strong>{date(r.paidThrough)}</strong> (UTC).</p>:<p>Paid-through date is not yet confirmed. No date is estimated.</p>}
   {r.renewsAt&&!ended&&<p>Next billing date: <strong>{date(r.renewsAt)}</strong> (UTC).</p>}
   {r.cancelPending&&!ended&&<p>No further renewal. Download your reports before your paid access ends. Your account and saved records will be retained.</p>}
   {!ended?<button className="button secondary" type="button" disabled={busy||!r.paidThrough} onClick={e=>{if(r.cancelPending)void act(r,'resume');else{opener.current=e.currentTarget;setPending(r);}}}>{r.cancelPending?'Restore renewal':r.capability==='personal'?'Cancel membership':'Cancel Circle Leadership renewal'}</button>:r.capability==='personal'?<Link className="button secondary" href="/renew">Renew membership</Link>:<p>Renew Circle Leadership from your Circle purchase options.</p>}
  </div>;})}
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <dialog ref={dialog} className="membership-cancel-dialog" aria-labelledby="cancel-membership-title" aria-describedby="cancel-membership-description" onCancel={e=>{if(busy)e.preventDefault();else close();}}>
   <h2 id="cancel-membership-title">Cancel {pending?.capability==='circle_leadership'?'Circle Leadership renewal':'membership renewal'}?</h2>
   <div id="cancel-membership-description"><p>No more renewals will be charged for this membership. Your current paid access continues through <strong>{pending?.paidThrough?date(pending.paidThrough)+' (UTC)':'your verified paid-through date'}</strong>.</p>
   <p>Download your reports before that date. After paid access ends, membership content will require renewal. Renew with this same account to reconnect your saved work.</p>
   <p>Your account, purchase history and saved records are retained. Separately purchased items keep their own access rules. {pending?.capability==='personal'?'This does not cancel Circle Leadership or an organization subscription. Circle participation still requires the applicable active memberships.':'This does not cancel your Personal or organization membership. Existing Circle transition rules still apply.'}</p></div>
   <div className="membership-dialog-actions"><button autoFocus className="button secondary" type="button" disabled={busy} onClick={close}>Keep membership</button><button className="button primary" type="button" disabled={busy||!pending?.paidThrough} onClick={()=>pending&&void act(pending,'cancel_at_period_end')}>{busy?'Saving…':'Confirm cancellation'}</button></div>
   {error&&<p role="alert">{error}</p>}
  </dialog>
 </section>;
}

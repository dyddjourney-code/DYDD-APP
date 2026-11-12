'use client';
import { useActionState, useState } from 'react';
import { createGuestAccessGrant, type GrantCreationState } from './actions';
import { CopyGuestPassLink } from './grant-controls';
import s from './guest-access.module.css';
const initial:GrantCreationState={message:''};
export function CreatedGuestLink({link,message}:{link:string;message:string}) {
 return <div className={s.result} role="status"><p className={s.resultTitle}>Your guest link is ready</p><p className={s.note}>{message}</p><div className={s.resultLink}><code className={s.url}>{link}</code><CopyGuestPassLink link={link}/></div></div>;
}
export function CreateGuestGrantForm() {
 const [state,action,pending]=useActionState(createGuestAccessGrant,initial),[kind,setKind]=useState('individual');
 const individual=kind==='individual';
 return <section className={s.create} aria-labelledby="create-title"><div className={s.createHead}><h2 id="create-title">Create a guest pass</h2><p className={s.note}>1. Create link &nbsp; 2. Copy or email &nbsp; 3. Guest completes</p></div><form action={action} className={s.form} aria-busy={pending}>
 <input type="hidden" name="kind" value={kind}/><div className={s.types} role="group" aria-label="Access type">{[['individual','Individual pass'],['group','Group link'],['coupon','Coupon link']].map(([value,label])=><button key={value} type="button" aria-pressed={kind===value} disabled={pending} onClick={()=>setKind(value)}>{label}</button>)}</div>
 <div className={s.fields}>{individual?<><label>Recipient email<input name="recipient_email" type="email" autoComplete="off" required maxLength={254} placeholder="guest@example.com"/></label><label>Recipient name <span className={s.sr}>(optional)</span><input name="recipient_name" maxLength={120} placeholder="Optional"/></label></>:<><label>Group or offer name<input name="name" required minLength={2} maxLength={120} placeholder="Name this access link"/></label>{kind==='coupon'?<label>Coupon provenance code<input name="coupon_code" required maxLength={120}/></label>:<label>Enrollment limit<input name="max_uses" type="number" required min="1" max="2147483647" step="1" placeholder="Number of guests"/></label>}</>}
 <label>{individual?'Complete by · Eastern Time':'Enrollment closes · UTC'}{individual?<input key="date" name="expires_at" type="date" required/>:<input key="datetime" name="expires_at" type="datetime-local" required/>}</label>{kind==='coupon'?<label>Enrollment limit<input name="max_uses" type="number" required min="1" max="2147483647" step="1"/></label>:null}</div>
 <fieldset className={s.products}><legend>Included assessments</legend><div className={s.productGrid}><label className={s.product}><input type="checkbox" name="products" value="designid" defaultChecked/><span><strong>DesignID</strong><small>Discover your design</small></span></label><label className={s.product}><input type="checkbox" name="products" value="designpd"/><span><strong>DesignPD</strong><small>Requires the guest’s completed DesignID</small></span></label></div></fieldset>
 <div className={s.footer}><button className={s.primary} disabled={pending}>{pending?'Creating pass…':individual?'Create individual pass':'Create access link'}</button><p className={s.note}>{individual?'One recipient, one private enrollment. Due at 11:59 p.m. Eastern. No email is sent until you choose Send Email.':'Expiry and capacity apply to new enrollments. Copy the link when created; group and coupon links cannot be recovered later.'}</p></div>
 {state.message&&!state.link?<p className={s.error} role="alert">{state.message}</p>:null}</form>{state.link?<CreatedGuestLink link={state.link} message={state.message}/>:null}</section>;
}

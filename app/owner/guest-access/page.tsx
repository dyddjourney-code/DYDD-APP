import type { Metadata } from 'next';
import Link from 'next/link';
import {randomUUID} from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { GuestAccessGrant } from '@/lib/public-assessments/guest-group-access';
import {formatGuestDeadline,guestGrantLink,individualGuestToken} from '@/lib/public-assessments/individual-guest-access';
import {guestCapabilityHash} from '@/lib/public-assessments/guest-capability';
import {guestInvitationKey} from '@/lib/public-assessments/guest-invitation';
import { requireGuestAccessOwner, revokeGuestAccessGrant } from './actions';
import { CreateGuestGrantForm } from './create-form';
import {CopyGuestPassLink,GuestInvitationControl} from './grant-controls';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'DYDD Guest Pass | Owner',robots:{index:false,follow:false},referrer:'no-referrer'};
const timestamp=(value:string)=>new Date(value).toLocaleString('en-US',{timeZone:'America/New_York',timeZoneName:'short'});
export default async function OwnerGuestAccess() {
 await requireGuestAccessOwner();
 const db=createSupabaseAdminClient();
 const found=await db.from('dydd_guest_access_grants').select('*').order('created_at',{ascending:false}).limit(200);
 if(found.error)throw Error('Guest access storage could not be read.');
 const grants=(found.data||[]) as (GuestAccessGrant&{token_hash:string})[],ids=grants.filter(g=>g.kind==='individual').map(g=>g.id);
 const orders=ids.length?await db.from('dydd_guest_orders').select('id,access_grant_id').in('access_grant_id',ids):{data:[],error:null};
 if(orders.error)throw Error('Guest completion history could not be read.');
 const orderIds=(orders.data||[]).map(o=>o.id);
 const results=orderIds.length?await db.from('dydd_guest_results').select('order_id,product,created_at').in('order_id',orderIds):{data:[],error:null};
 if(results.error)throw Error('Guest completion history could not be read.');
 const keys=grants.filter(g=>g.invitation_job_id).map(g=>'application:'+guestInvitationKey(g.id,g.invitation_job_id!));
 const jobs=keys.length?await db.from('dydd_lifecycle_jobs').select('event_key,status,accepted_at,error_message,provider_id,created_at').in('event_key',keys):{data:[],error:null};
 if(jobs.error)throw Error('Invitation delivery history could not be read.');
 const providerIds=(jobs.data||[]).map(j=>j.provider_id).filter(Boolean);
 const messages=providerIds.length?await db.from('dydd_email_messages').select('provider_id,status,last_event_at').in('provider_id',providerIds):{data:[],error:null};
 if(messages.error)throw Error('Email delivery status could not be read.');
 return <main style={{maxWidth:920,margin:'40px auto',padding:24}}><Link href="/command-center">Command Center</Link><h1>DYDD Guest Pass</h1><p>Create an individual guest pass, a free group link, or a coupon-provenance link without requiring app signup. No course access is granted.</p><p>Individual passes are for one named email recipient and must be completed by the selected date at 11:59 p.m. Eastern Time, even if started earlier. Completed report downloads remain available after expiry. Creating a pass never sends email; use its Send Email button when ready.</p><p>Group and coupon expiry and capacity only prevent new enrollments. Enrolled group guests retain their original sessions. Revoking any link disables the access and recovery it granted; historical scores remain saved.</p><CreateGuestGrantForm/><h2>Guest passes and access links</h2>{!grants.length?<p>No links have been created.</p>:grants.map(grant=>{
  const individual=grant.kind==='individual',expired=Date.parse(grant.expires_at)<=Date.now(),active=!grant.revoked_at&&!expired;
  const ownOrders=new Set((orders.data||[]).filter(o=>o.access_grant_id===grant.id).map(o=>o.id));
  const completed=(results.data||[]).filter(r=>ownOrders.has(r.order_id));
  const job=(jobs.data||[]).find(j=>j.event_key==='application:'+(grant.invitation_job_id?guestInvitationKey(grant.id,grant.invitation_job_id):''));
  const message=(messages.data||[]).find(m=>m.provider_id===job?.provider_id);
  let link:string|null=null;
  if(individual){try{const token=individualGuestToken(grant.id);if(guestCapabilityHash(token)===grant.token_hash)link=guestGrantLink(token);}catch{/* Never display an invalid reconstructed capability. */}}
  return <section key={grant.id} style={{borderTop:'1px solid #ccc',padding:'20px 0'}}><h3>{individual?grant.recipient_name||grant.recipient_email:grant.name}</h3>{individual?<p>Individual guest pass · {grant.recipient_email}</p>:<p>{grant.kind==='coupon'?'Coupon: '+grant.coupon_code:'Free group'} · {grant.uses} of {grant.max_uses} enrolled</p>}<p>{grant.products.map(p=>p==='designid'?'DesignID':'DesignPD').join(' + ')} · Created {timestamp(grant.created_at)}</p><p>{individual?'Complete by '+formatGuestDeadline(grant.expires_at):'New enrollments expire '+timestamp(grant.expires_at)}. {grant.revoked_at?'Revoked.':expired?individual?'Expired. Completed reports remain saved.':'Expired for new guests.':'Active.'}</p>{individual?grant.products.map(product=><p key={product}>{product==='designid'?'DesignID':'DesignPD'} completed: {completed.filter(r=>r.product===product).length?completed.filter(r=>r.product===product).map(r=>timestamp(r.created_at)).join('; '):'Not completed'}</p>):null}{individual?<><p>Email: {message?.status||job?.status||grant.invitation_status||'not_sent'}{message?.status==='delivered'&&message.last_event_at?' · Delivered '+timestamp(message.last_event_at):job?.accepted_at?' · Provider accepted '+timestamp(job.accepted_at):grant.invitation_sent_at?' · Last provider acceptance '+timestamp(grant.invitation_sent_at):job?.created_at?' · Requested '+timestamp(job.created_at):''}</p>{job?.error_message?<p>{job.error_message}</p>:null}{link?<CopyGuestPassLink link={link}/>:<p>Link recovery unavailable. Check the signing configuration before sending.</p>}{active&&link?<GuestInvitationControl grantId={grant.id} requestId={randomUUID()} hasInvitation={Boolean(grant.invitation_job_id)}/>:null}</>:null}{!grant.revoked_at?<form action={revokeGuestAccessGrant}><input type="hidden" name="grant_id" value={grant.id}/><button>Revoke this access link and its granted rights</button></form>:null}</section>;
 })}</main>;
}

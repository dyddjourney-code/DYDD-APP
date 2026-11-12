import type { Metadata } from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {randomUUID} from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { GuestAccessGrant } from '@/lib/public-assessments/guest-group-access';
import {formatGuestDeadline,guestGrantLink,individualGuestToken} from '@/lib/public-assessments/individual-guest-access';
import {guestCapabilityHash} from '@/lib/public-assessments/guest-capability';
import {guestInvitationKey} from '@/lib/public-assessments/guest-invitation';
import { requireGuestAccessOwner } from './actions';
import { CreateGuestGrantForm } from './create-form';
import {CopyGuestPassLink,GuestInvitationControl,RevokeGuestControl} from './grant-controls';
import s from './guest-access.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'DYDD Guest Pass | Owner',robots:{index:false,follow:false},referrer:'no-referrer'};
const timestamp=(value:string)=>new Date(value).toLocaleString('en-US',{timeZone:'America/New_York',timeZoneName:'short'});
export default async function OwnerGuestAccess({searchParams}:{searchParams:Promise<{q?:string;page?:string}>}) {
 await requireGuestAccessOwner();
 const db=createSupabaseAdminClient();
 const params=await searchParams,q=String(params.q||'').trim().slice(0,120),page=Math.max(1,Math.min(100000,Number.parseInt(params.page||'1',10)||1)),pageSize=12;
 // Escape filter grammar and wildcard characters; never interpolate raw PostgREST syntax.
 const term=q.replace(/[^\p{L}\p{N}@ .+_\-]/gu,' ').trim().replace(/[_%]/g,' ');
 let query=db.from('dydd_guest_access_grants').select('*',{count:'exact'}).order('created_at',{ascending:false});
 if(term)query=query.or(['name','recipient_email','recipient_name','coupon_code'].map(field=>field+'.ilike.%'+term+'%').join(','));
 const found=await query.range((page-1)*pageSize,page*pageSize-1);
 const total=found.count||0,pages=Math.max(1,Math.ceil(total/pageSize));
 if(!found.error&&page>pages)redirect('/owner/guest-access?'+new URLSearchParams({...q?{q}:{},page:String(pages)}));
 const pageHref=(number:number)=>'/owner/guest-access?'+new URLSearchParams({...q?{q}:{},page:String(number)});
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
 return <main className={s.shell}><div className={s.top}><div><span className={s.eyebrow}>Owner Command Center</span><h1>DYDD Guest Pass</h1><p className={s.intro}>Give someone a clear path to their design. Create a private assessment link, then share it directly or send an invitation.</p></div><Link className={s.back} href="/command-center">Back to Command Center</Link></div><CreateGuestGrantForm/>
 <section aria-labelledby="passes-heading"><div className={s.listHead}><div><h2 id="passes-heading">Your guest passes <span className={s.note}>({total})</span></h2><p className={s.note}>Links, deadlines and invitation status in one place.</p></div><form className={s.search} action="/owner/guest-access"><label><span className={s.sr}>Search name, email or coupon</span><input name="q" type="search" defaultValue={q} placeholder="Search name, email or coupon…"/></label><button>Search</button>{q?<Link className={s.button} href="/owner/guest-access">Clear</Link>:null}</form></div>
 <div className={s.table}><div className={s.columns} aria-hidden="true"><span>Recipient / link</span><span>Assessments</span><span>Deadline / status</span><span>Share & invite</span></div>{!grants.length?<div className={s.empty}>{q?'No passes match your search. Try a name or email address.':'No guest passes yet. Create your first link above.'}</div>:grants.map(grant=>{
  const individual=grant.kind==='individual',expired=Date.parse(grant.expires_at)<=Date.now(),active=!grant.revoked_at&&!expired;
  const ownOrders=new Set((orders.data||[]).filter(o=>o.access_grant_id===grant.id).map(o=>o.id));
  const completed=(results.data||[]).filter(r=>ownOrders.has(r.order_id));
  const job=(jobs.data||[]).find(j=>j.event_key==='application:'+(grant.invitation_job_id?guestInvitationKey(grant.id,grant.invitation_job_id):''));
  const message=(messages.data||[]).find(m=>m.provider_id===job?.provider_id);
  const rawStatus=message?.status||job?.status||grant.invitation_status||'not_sent';
  const emailStatus=rawStatus==='delivered'?'Delivered':rawStatus==='accepted'||rawStatus==='sent'?'Provider accepted':rawStatus==='not_sent'?'Not emailed':rawStatus==='queued'||rawStatus==='retry'?'Queued · not yet sent':rawStatus==='processing'||rawStatus==='submitting'?'Sending · awaiting provider':rawStatus==='failed'||rawStatus==='dead'?'Email failed':rawStatus.replaceAll('_',' ');
  let link:string|null=null;
  if(individual){try{const token=individualGuestToken(grant.id);if(guestCapabilityHash(token)===grant.token_hash)link=guestGrantLink(token);}catch{/* Never display an invalid reconstructed capability. */}}
  const shortDate=new Date(grant.expires_at).toLocaleDateString('en-US',{timeZone:individual?'America/New_York':'UTC',month:'short',day:'numeric',year:'numeric'});
  return <article className={s.record} key={grant.id}><div className={s.rowMain}><div><h3 className={s.identity}>{individual?grant.recipient_name||grant.recipient_email:grant.name}</h3><p className={s.secondary}>{individual?grant.recipient_name?grant.recipient_email:'Individual pass':grant.kind==='coupon'?'Coupon · '+grant.coupon_code:'Group · '+grant.uses+' / '+grant.max_uses+' enrolled'}</p></div><div className={s.productCell}><span className={s.badge}>{grant.products.map(p=>p==='designid'?'DesignID':'DesignPD').join(' + ')}</span>{individual&&completed.length?<p className={s.secondary}>{new Set(completed.map(r=>r.product)).size} assessment(s) complete</p>:null}</div><div><p className={s.deadline}>{shortDate}</p><p className={s.secondary}>{individual?'11:59 p.m. Eastern':'Enrollment closes · UTC'}</p><p className={s.status}><span className={`${s.badge} ${!active?s.inactive:''}`}>{grant.revoked_at?'Revoked':expired?'Expired':'Active'}</span>{individual?' · '+emailStatus:''}</p></div><div className={s.actions}>{individual&&link?<CopyGuestPassLink link={link}/>:null}{individual&&active&&link?<GuestInvitationControl grantId={grant.id} requestId={randomUUID()} hasInvitation={Boolean(grant.invitation_job_id)}/>:null}{!individual?<p className={s.secondary}>Share the original copied link.</p>:!link?<p className={s.secondary}>Link recovery unavailable. Check signing configuration.</p>:null}</div></div>
 <details className={s.details}><summary>Details & access settings</summary><div className={s.detailBody}><div><h3>Pass details</h3><p>Created {timestamp(grant.created_at)}</p><p>{individual?'Complete by '+formatGuestDeadline(grant.expires_at):'New enrollments close '+timestamp(grant.expires_at)}</p>{individual?grant.products.map(product=><p key={product}>{product==='designid'?'DesignID':'DesignPD'}: {completed.filter(r=>r.product===product).length?completed.filter(r=>r.product===product).map(r=>timestamp(r.created_at)).join('; '):'Not completed'}</p>):<p>{grant.uses} of {grant.max_uses} enrollments used</p>}{link?<code className={s.url}>{link}</code>:null}<p className={s.secondary}>Pass ID: {grant.id}</p></div><div>{individual?<><h3>Invitation history</h3><p>{emailStatus}</p><p className={s.secondary}>{message?.status==='delivered'&&message.last_event_at?'Delivered '+timestamp(message.last_event_at):job?.accepted_at?'Provider accepted '+timestamp(job.accepted_at):grant.invitation_sent_at?'Last provider acceptance '+timestamp(grant.invitation_sent_at):job?.created_at?'Requested '+timestamp(job.created_at):'No invitation requested.'}</p>{job?.error_message?<p className={s.error}>{job.error_message}</p>:null}<p className={s.secondary}>Queued is not sent. Provider acceptance is not delivery; delivery appears when confirmed.</p></>:null}{!grant.revoked_at?<RevokeGuestControl grantId={grant.id}/>:null}</div></div></details></article>;
 })}</div><nav className={s.pagination} aria-label="Guest pass pages"><span>{total?`${(page-1)*pageSize+1}–${Math.min(page*pageSize,total)} of ${total}`:'0 passes'} · Page {page} of {pages}</span><div className={s.actions}>{page>1?<Link className={s.button} href={pageHref(page-1)}>Previous</Link>:null}{page<pages?<Link className={s.button} href={pageHref(page+1)}>Next</Link>:null}</div></nav></section>
 <details className={s.help}><summary>How access and deadlines work</summary><p>Individual passes belong to one email address and must be completed by 11:59 p.m. Eastern on the selected date, even if started earlier. Completed reports remain available after expiry. DesignPD requires a completed DesignID. Assessment passes do not grant course access.</p><p>Group and coupon deadlines and capacity apply only to new enrollments; existing group guests keep their sessions. Revoking a link disables its granted access and recovery, without deleting saved scores. Creating a pass never sends email automatically.</p></details></main>;
}

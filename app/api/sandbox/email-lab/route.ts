import {NextResponse} from 'next/server';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {sandboxRecipientAllowed} from '@/lib/email/sandbox-policy';
import {sandboxEmailCatalog} from '@/lib/email/sandbox-catalog';
import {sendApplicationEmail} from '@/lib/lifecycle/application-mail';
import {appBase,must} from '@/lib/lifecycle/store';
import {lifecycleHtml} from '@/lib/lifecycle/templates';
import {sameOrigin} from '@/lib/circles/server';
export const dynamic='force-dynamic';
const reply=(b:unknown,status=200)=>NextResponse.json(b,{status,headers:{'Cache-Control':'private, no-store'}});
async function account(){
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox')return null;
 const db=await createSupabaseServerClient(),r=await db.auth.getUser(),u=r.data.user;
 return !r.error&&u?.email_confirmed_at&&u.email&&sandboxRecipientAllowed(u.email)?u:null;
}
export async function GET(){
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox')return reply({error:'Not found'},404);
 const user=await account();if(!user)return reply({error:'Sign in with the verified sandbox test address. Owner preview does not authorize email.'},403);
 try{const db=createSupabaseAdminClient(),jobs=must(await db.from('dydd_lifecycle_jobs').select('id,template_id,subject,status,provider_id,error_message,created_at').eq('email',user.email!.toLowerCase()).like('event_key','application:sandbox-lab:%').order('created_at',{ascending:false}).limit(30)) as any[];
 const ids=jobs.filter(j=>j.provider_id).map(j=>j.provider_id),delivery=ids.length?must(await db.from('dydd_email_messages').select('provider_id,status,last_event_at').in('provider_id',ids)) as any[]:[];
 return reply({email:user.email,catalog:sandboxEmailCatalog(appBase()),jobs:jobs.map(j=>({...j,delivery:delivery.find(d=>d.provider_id===j.provider_id)||null})),telemetryConfigured:Boolean(process.env.DYDD_RESEND_WEBHOOK_SECRET)});
 }catch{return reply({error:'Test email history unavailable.'},503);}
}
export async function POST(request:Request){
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox')return reply({error:'Not found'},404);
 if(!sameOrigin(request))return reply({error:'Same-origin request required.'},403);
 const user=await account();if(!user)return reply({error:'Verified allowlisted sandbox account required.'},403);
 try{const b=await request.json(),preview=sandboxEmailCatalog(appBase()).find(p=>p.id===b.id);
 if(!preview||typeof b.requestId!=='string'||!/^[-a-zA-Z0-9]{16,64}$/.test(b.requestId))return reply({error:'Choose a valid catalog message and request ID.'},400);
 const db=createSupabaseAdminClient();
 const recent=must(await db.from('dydd_lifecycle_jobs').select('id').eq('email',user.email!.toLowerCase()).like('event_key','application:sandbox-lab:%').gte('created_at',new Date(Date.now()-86400000).toISOString())) as any[];
 if(recent.length>=25)return reply({error:'Daily limit reached: 25 deliberate test messages. Preview remains available.'},429);
 const body='SANDBOX COPY PREVIEW — not a live invitation, completion notice or report.\n\n'+preview.body+'\n\n'+preview.note+'\n\nThis deliberate test does not change email preferences or subscribe any account.';
 const result=await sendApplicationEmail({templateId:'sandbox-preview:'+preview.id,idempotencyKey:`sandbox-lab:${user.id}:${b.requestId}`,deliveryContext:{type:'account_service',userId:user.id},to:user.email!,subject:'Copy preview · '+preview.subject,text:body,html:lifecycleHtml(preview.subject,body)});
 return reply({...result,status:result.sent?'accepted':result.skipped?'skipped':'queued',requestId:b.requestId},result.sent||result.skipped?200:202);
 }catch{return reply({error:'Test request failed. Refresh history before trying again.'},503);}
}

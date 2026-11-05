import 'server-only';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isDyddAdminEmail} from '@/lib/admin-access';
import {sandboxRecipientAllowed} from '@/lib/email/sandbox-policy';
import {sendResendEmail,type SendEmailInput} from '@/lib/email/resend';
import {getAssessmentEligibility} from './policy';

export const assessmentNames={designid:'DesignID',spiritual_gifts:'Spiritual Gifts',fruitful_self:'Fruitful Life 360 (self)'} as const;
export type RequestAssessmentType=keyof typeof assessmentNames;
export const starts:Record<RequestAssessmentType,string>={designid:'/designid',spiritual_gifts:'/spiritual-gifts',fruitful_self:'/fruitlife360'};
const ownerEmail='dyddjourney@gmail.com';
const base='https://dydd-online-school-sandbox.vercel.app';
export const hashDecisionToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export function assertRequestSandbox(){
 if(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT!=='sandbox'||process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF!=='atemrshtshxoqnuevvqu'||process.env.NEXT_PUBLIC_SUPABASE_URL!=='https://atemrshtshxoqnuevvqu.supabase.co') throw Error('This workflow is available only in the isolated sandbox.');
}
export function assertRequestOrigin(request:Request){
 const origin=request.headers.get('origin');
 const expected=new URL(request.url).origin;
 const local=process.env.NODE_ENV!=='production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(expected);
 if((expected!==base&&!local)||origin!==expected||['cross-site','same-site'].includes(request.headers.get('sec-fetch-site')||'')) throw Error('Same-origin confirmation required.');
}
export async function requestIdentity(owner=false){
 assertRequestSandbox();
 const auth=await createSupabaseServerClient();
 const {data,error}=await auth.auth.getUser();
 const user=data.user;
 if(error||!user?.email||!user.email_confirmed_at) throw Error('Sign in with a verified account to continue.');
 if(owner&&(!isDyddAdminEmail(user.email)||user.email.toLowerCase()!==ownerEmail)) throw Error('Verified sandbox owner access required.');
 return user as typeof user & {email:string};
}
function html(text:string){return '<div style="white-space:pre-wrap">'+text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))+'</div>';}
function mail(to:string,subject:string,text:string,key:string):SendEmailInput{return {to,subject,text,html:html(text),idempotencyKey:key};}
export async function loadOwnRequests(userId:string){
 const result=await createSupabaseAdminClient().from('dydd_assessment_retake_requests').select('id,assessment_type,status,created_at,decision_reason,next_eligible_label').eq('user_id',userId).order('created_at',{ascending:false}).limit(20);
 if(result.error) throw Error('Unable to load retake requests.');
 return result.data;
}
export async function requestEarlyRetake(user:{id:string;email:string},type:RequestAssessmentType,happened:string,understood:string){
 assertRequestSandbox();
 if(!Object.hasOwn(assessmentNames,type)) throw Error('Choose an assessment.');
 happened=happened.trim();understood=understood.trim();
 if([happened,understood].some(s=>s.length<10||s.length>2000)) throw Error('Please use 10–2,000 characters for each answer.');
 const eligibility=await getAssessmentEligibility(user.id,user.email,type,false);
 if(eligibility.allowed) throw Error('An early-retake request is only needed while waiting after a completed assessment.');
 const id=randomUUID(),token=randomBytes(32).toString('hex');
 const reviewUrl=`${base}/assessment-timing/owner?id=${id}&token=${token}`;
 const text=`${user.email} requests an early ${assessmentNames[type]} retake.\n\nWhat happened?\n${happened}\n\nWhat do you understand differently now?\n${understood}\n\nRegular availability: ${eligibility.nextEligibleLabel||'See assessment timing'}.\n\nReview and confirm Approve / Decline (verified owner sign-in required; expires in 7 days):\n${base}/assessment-timing/owner?id=${id}&token=${token}\n\nOpening this link does not approve or decline.`;
 const result=await createSupabaseAdminClient().rpc('dydd_request_assessment_retake',{p_id:id,p_user:user.id,p_type:type,p_source:eligibility.previousAttemptId,p_happened:happened,p_understood:understood,p_next:eligibility.nextEligibleLabel||'See assessment timing',p_hash:hashDecisionToken(token),p_mail:{...mail(ownerEmail,'Early-retake request: '+assessmentNames[type],text,'retake-owner-'+id),sourceCompletionId:eligibility.previousCompletionId??eligibility.previousAttemptId,sourceCompletedAt:eligibility.previousCompletedAt,html:html(text)+`<p><a href="${reviewUrl}&amp;decision=approved">Review approval</a> · <a href="${reviewUrl}&amp;decision=declined">Review decline</a></p>`}});
 if(result.error) throw Error(result.error.message.includes('24 hours')?'Please wait 24 hours before another request.':'Unable to save the request. Please retry.');
 await flushRetakeMail(result.data);
 return result.data as string;
}
export async function loadOwnerDecision(id:string,token:string){
 if(!/^[a-f0-9-]{36}$/.test(id)||!/^[a-f0-9]{64}$/.test(token)) throw Error('Invalid decision link.');
 const result=await createSupabaseAdminClient().from('dydd_assessment_retake_requests').select('*').eq('id',id).eq('token_hash',hashDecisionToken(token)).maybeSingle();
 if(result.error||!result.data||Date.parse(result.data.token_expires_at)<=Date.now()) throw Error('Invalid or expired decision link.');
 const identity=await createSupabaseAdminClient().auth.admin.getUserById(result.data.user_id);
 if(identity.error||!identity.data.user?.email) throw Error('Unable to verify the requester account.');
 return {...result.data,requesterEmail:identity.data.user.email};
}
export async function decideEarlyRetake(actor:{id:string;email:string},id:string,token:string,decision:string,reason:string){
 assertRequestSandbox();
 if(!isDyddAdminEmail(actor.email)||actor.email.toLowerCase()!==ownerEmail) throw Error('Owner access required.');
 if(!['approved','declined'].includes(decision)) throw Error('Choose Approve or Decline.');
 const req=await loadOwnerDecision(id,token);
 reason=reason.trim()||(decision==='approved'?'Your early retake has been approved.':'Thank you for sharing. Please continue reflecting and return on your regular next-available date.');
 if(reason.length>1000) throw Error('Please keep the explanation within 1,000 characters.');
 const db=createSupabaseAdminClient(),identity=await db.auth.admin.getUserById(req.user_id);
 if(identity.error||!identity.data.user?.email) throw Error('Unable to verify learner recipient.');
 const type=req.assessment_type as RequestAssessmentType;
 const text=decision==='approved'?`Your early ${assessmentNames[type]} retake is approved.\n\n${reason}\n\nYou have one additional attempt, valid for 30 days. Opening a draft does not use it. Your original results remain saved.\nStart: ${base}${starts[type]}`:`Your early ${assessmentNames[type]} retake request has been declined.\n\n${reason}\n\nAvailable again: ${req.next_eligible_label}.\nYour saved results remain available: ${base}${starts[type]}`;
 const result=await db.rpc('dydd_decide_assessment_retake',{p_id:id,p_actor:actor.id,p_hash:hashDecisionToken(token),p_decision:decision,p_reason:reason,p_mail:mail(identity.data.user.email,'Your early-retake request: '+decision,text,'retake-decision-'+id)});
 if(result.error) throw Error('This request is already decided, expired, or unavailable. Refresh its status before retrying.');
 await flushRetakeMail(id);
}
/** All sends use the persisted payload and stable provider key. No GET calls this. */
export async function flushRetakeMail(requestId:string){
 assertRequestSandbox();const db=createSupabaseAdminClient();
 const rows=await db.from('dydd_assessment_retake_outbox').select('*').eq('request_id',requestId).neq('status','accepted');
 if(rows.error) throw Error('Request saved; unable to load notification status.');
 for(const row of rows.data??[]){
 const input=row.payload as SendEmailInput;
 let outcome;
 try {outcome=sandboxRecipientAllowed(input.to)?await sendResendEmail(input):{sent:false,skipped:true,message:'Recipient is not on the sandbox owner allowlist; no email sent.'};}
 catch {outcome={sent:false,skipped:false,message:'Transport failed. Retry uses the saved payload and key.'};}
 const saved=await db.from('dydd_assessment_retake_outbox').update({status:outcome.sent?'accepted':outcome.skipped?'blocked':'failed',provider_id:outcome.id||null,error_message:outcome.message||null,attempts:row.attempts+1,last_attempt_at:new Date().toISOString()}).eq('id',row.id).neq('status','accepted');
 if(saved.error) throw Error('Request saved; notification status persistence failed. Retry with the same request.');
 }
}
export async function mailStatus(requestId:string){
 const rows=await createSupabaseAdminClient().from('dydd_assessment_retake_outbox').select('kind,status,error_message,provider_id').eq('request_id',requestId);
 if(rows.error) throw Error('Unable to load notification status.');return rows.data;
}

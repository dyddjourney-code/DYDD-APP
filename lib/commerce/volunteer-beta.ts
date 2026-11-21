import 'server-only';
import {createHash,createHmac} from 'node:crypto';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {guestSessionId} from '@/lib/public-assessments/guest-capability';
export const volunteerBatch='owner-volunteer-beta-v1';
export type VolunteerInvitation={id:string;recipient_email:string;recipient_name:string;code_hash:string;created_at:string;redeemed_at:string|null;revoked_at:string|null;invitation_job_id:string|null};
export type BetaChecklist={filename:string;content_base64:string;sha256:string;byte_size:number;updated_at:string};
/** Existing public redemption accepts DYDD + 128 random-looking bits. Only its hash is saved. */
export function volunteerCode(id:string) {
 const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!secret)throw Error('Volunteer signup code configuration is unavailable.');
 return 'DYDD'+createHmac('sha256',secret).update('dydd-volunteer-beta-v1:'+guestSessionId(id)).digest('hex').slice(0,32).toUpperCase();
}
export function volunteerCodeHash(code:string){return createHash('sha256').update(code).digest('hex');}
// Deliberately targets the CURRENT PUBLISHED app, never the teaching sandbox or owner console.
// The stable published account screen already supports signup, email confirmation and code redemption.
export function volunteerSignupLink(){return 'https://app.discoverdivine.design/login?'+new URLSearchParams({mode:'signup',next:'/hq#beta-access'});}
export const volunteerWelcomeKey=(id:string,request:string)=>'volunteer-beta-welcome:'+guestSessionId(id)+':'+guestSessionId(request);
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function renderVolunteerWelcome(invite:VolunteerInvitation,code:string,checklist:BetaChecklist) {
 if(!checklist?.content_base64||!checklist.filename)throw Error('Attach John’s beta tester checklist before sending a welcome email.');
 const link=volunteerSignupLink();
 const text=`Hello ${invite.recipient_name},\n\nWelcome, and thank you for volunteering to beta test Discover Your Divine Design!\n\nYour invitation grants free lifetime personal all-access to the currently published DYDD app: your personal tools, reports and courses. There is no payment, card or subscription required, and your lifetime access does not expire. This is the published app, not the teaching sandbox.\n\n1. Create your account using ${invite.recipient_email}:\n${link}\n2. Confirm your email using the account verification message. If you already have an account with this email, sign in instead.\n3. In Base Camp → Purchases, find “Redeem beta access code” and enter your unique signup code:\n${code}\n4. After redemption, your account will show “Lifetime personal all-access”.\n\nYour code belongs to ${invite.recipient_email} and can be redeemed by one verified account only. The code has no time limit; please keep it private. Existing course and assessment prerequisites still apply. Circle seats for other people are not included.\n\nYou can also explore Circles: create and edit Circles, complete their setup, and add draft people. For now, this is exploration and preparation only: you cannot invite others, send admission links, or proceed through the journey with a group yet.\n\nThe beta tester checklist is attached as ${checklist.filename}. Please use it as you explore the published app and share your feedback.\n\nThank you for helping us improve the DYDD journey!`;
 return {subject:'Welcome, DYDD Volunteer Beta Tester — your free lifetime access',text,html:'<div style="font-family:Arial,sans-serif;line-height:1.6;max-width:640px">'+text.split('\n\n').map(p=>'<p>'+escape(p).replaceAll('\n','<br>')+'</p>').join('')+'</div>',attachments:[{filename:checklist.filename,content:checklist.content_base64}]};
}
export async function validateBetaChecklist(file:File){
 if(file.size<1||file.size>2097152)throw Error('Choose a PDF or DOCX checklist up to 2 MB.');
 const filename=file.name.replace(/[^\p{L}\p{N} ._()-]/gu,'_').slice(0,160);
 const data=Buffer.from(await file.arrayBuffer()),pdf=/\.pdf$/i.test(filename)&&data.subarray(0,5).toString()==='%PDF-',docx=/\.docx$/i.test(filename)&&data[0]===0x50&&data[1]===0x4b;
 if(!pdf&&!docx)throw Error('Choose John’s checklist as a valid PDF or DOCX file.');
 return {filename,content_base64:data.toString('base64'),sha256:createHash('sha256').update(data).digest('hex'),byte_size:data.length};
}
export async function volunteerWelcomeEligibility(job:any):Promise<{stop?:string}>{
 const ctx=job.context.deliveryContext,db=createSupabaseAdminClient();
 const found=await db.from('dydd_beta_access_codes').select('recipient_email,revoked_at,redeemed_at,invitation_job_id').eq('id',ctx.betaCodeId).maybeSingle();
 if(found.error)throw Error('Volunteer invitation eligibility could not be checked.');
 const c=found.data;
 if(!c||c.recipient_email!==job.email||c.revoked_at||c.redeemed_at||c.invitation_job_id!==ctx.invitationRequestId)return {stop:'Volunteer invitation is revoked, redeemed, replaced or belongs to a different email.'};
 const loaded=await db.from('dydd_beta_checklist').select('sha256').eq('id',true).maybeSingle();
 if(loaded.error)throw Error('Beta checklist eligibility could not be checked.');
 if(!loaded.data||loaded.data.sha256!==ctx.checklistSha256||!job.context.senderInput.attachments?.length)return {stop:'The beta checklist changed or is missing. Review and send a new welcome.'};
 return {};
}

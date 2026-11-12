"use server";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { publicPaymentConfiguration } from '@/lib/public-assessments/payments';
import { createGuestCheckout, resumeGuestCheckout } from '@/lib/public-assessments/guest-payments';
import { newGuestCapability, guestCapabilityHash, guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { requireGuest, rememberGuest, guestRecords, type GuestSession } from '@/lib/public-assessments/guest';
import { saveGuestResult } from '@/lib/public-assessments/guest-results';
import { prepareGuestReport, emailGuestReport } from '@/lib/public-assessments/guest-reports';

function problem(error:unknown) { return error instanceof Error ? error.message : 'The service is temporarily unavailable. Your saved purchase is preserved.'; }
export async function startGuestDesignId(form:FormData) {
 let destination='/assessments/designid?guest=1';
 try{
  publicPaymentConfiguration('designid'); // fail closed before any guest session/provider write when sales are paused
  const name=String(form.get('name')||'').trim(),email=String(form.get('email')||'').trim().toLowerCase();
  if(name.length<2||name.length>120||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Enter your name and a valid email address.');
  // Resume unfinished purchases only through the private browser capability.
  // A completed report is immutable; an explicit new purchase gets a fresh paid session.
  // Never discover or reopen another session by a typed email.
  const current=(await cookies()).get('dydd_guest_current')?.value;
  let session:GuestSession|undefined,token='';
  if(current){try{const existing=await requireGuest(current);if(existing.session.participant_email===email){const history=await guestRecords(current);const completed=history.results.find(r=>r.product==='designid');if(!completed){session=existing.session;token=existing.token;}}}catch{/* expired/invalid browser link must not reveal another session */}}
  if(!session){
   token=newGuestCapability();
   const saved=await createSupabaseAdminClient().from('dydd_guest_sessions').insert({capability_hash:guestCapabilityHash(token),participant_name:name,participant_email:email}).select('*').single();
   if(saved.error||!saved.data)throw Error('Guest checkout could not be reserved. Please try later.');
   session=saved.data as GuestSession;
   await rememberGuest(session.id,token);
   (await cookies()).set('dydd_guest_current',session.id,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/assessments',maxAge:365*86400});
  }
  destination=guestSessionPath(session.id);
  const url=await createGuestCheckout(session,token,'designid');
  destination=url;
 }catch(error){destination+=(destination.includes('?')?'&':'?')+'message='+encodeURIComponent(problem(error));}
 redirect(destination);
}
export async function buyGuestDesignId(sessionId:string) {
 let destination=guestSessionPath(sessionId);
 try{const {session,token}=await requireGuest(sessionId);destination=await createGuestCheckout(session,token,'designid');}
 catch(error){destination+=(destination.includes('?')?'&':'?')+'message='+encodeURIComponent(problem(error));}
 redirect(destination);
}
export async function buyGuestDesignPd(sessionId:string,sourceId:string) {
 let destination=guestSessionPath(sessionId);
 try{const {session,token}=await requireGuest(sessionId);destination=await createGuestCheckout(session,token,'designpd',sourceId);}
 catch(error){destination+=(destination.includes('?')?'&':'?')+'message='+encodeURIComponent(problem(error));}
 redirect(destination);
}
export async function completeGuestAssessment(sessionId:string,orderId:string,form:FormData) {
 let message='';
 try{
  const {session,token}=await requireGuest(sessionId);
  const resultId=await saveGuestResult(session,orderId,form);
  const report=await prepareGuestReport(session,resultId);
  if(report.report_state==='ready'){
   try{const email=await emailGuestReport(session,token,resultId);if(!email.sent)message='Your PDF is saved. Email is pending or needs retry; use the download below.';}
   catch{message='Your PDF is saved. Email is paused or needs retry; use the download below.';}
  }else message='Your result is saved. Report preparation is pending. Use Recover original report below.';
 }catch(error){message=problem(error);}
 redirect(guestSessionPath(sessionId)+(message?'?message='+encodeURIComponent(message):''));
}
export async function recoverGuestReport(sessionId:string,resultId:string) {
 let message='';
 try{const {session,token}=await requireGuest(sessionId);const result=await prepareGuestReport(session,resultId);if(result.report_state==='ready')await emailGuestReport(session,token,resultId);}
 catch(error){message=problem(error);}
 redirect(guestSessionPath(sessionId)+(message?'?message='+encodeURIComponent(message):''));
}
export async function retryGuestEmail(sessionId:string,resultId:string) {
 let message='';
 try{const {session,token}=await requireGuest(sessionId);const result=await emailGuestReport(session,token,resultId,true);message=result.sent?'Your new email copy, including the PDF attachment, was accepted by the email provider. Inbox delivery is not yet confirmed.':'Your report remains downloadable. Email is pending or needs review.';}
 catch(error){message=problem(error);}
 redirect(guestSessionPath(sessionId)+'?message='+encodeURIComponent(message));
}

export async function resumeGuestPurchase(sessionId:string,orderId:string) {
 let destination=guestSessionPath(sessionId);
 try{const {session,token}=await requireGuest(sessionId);destination=await resumeGuestCheckout(session,token,orderId);}
 catch(error){destination+='?message='+encodeURIComponent(problem(error));}
 redirect(destination);
}

'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireGuest, rememberGuest, guestRecords } from '@/lib/public-assessments/guest';
import { newGuestCapability, guestCapabilityHash, guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { guestGrantCookie, readGuestGrant, redeemGuestGrant } from '@/lib/public-assessments/guest-group-access';
export async function enrollGuestAccess(form:FormData) {
 let target='/assessments/group',sessionId='';
 const token=String(form.get('key')||'');
 try {
  const grant=await readGuestGrant(token); // Unknown capabilities fail before session creation.
  const name=String(form.get('name')||'').trim(),email=String(form.get('email')||'').trim().toLowerCase();
  if(name.length<2||name.length>120||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter your name and a valid email address.');
  const jar=await cookies(),current=jar.get('dydd_guest_current')?.value;
  let sourceId:string|undefined;
  const retake=form.get('retake')==='yes'&&grant.products.includes('designid');
  {
   // Recovery links install a per-session cookie even when no current-session
   // convenience cookie exists. Only inspect browser-held, verified capabilities;
   // a typed email never discovers historical sessions.
   const candidates=[current,...jar.getAll().map(c=>/^dydd_guest_([0-9a-f-]{36})$/.exec(c.name)?.[1])].filter((id):id is string=>Boolean(id));
   for(const candidate of [...new Set(candidates)].slice(0,20)) {
    try {const existing=await requireGuest(candidate);if(existing.session.participant_email!==email)continue;
     const source=(await guestRecords(candidate)).results.find(r=>r.product==='designid');
     if(retake&&source)continue; // Retry the new unfinished session, never a completed earlier cycle.
     if(!sessionId||source){sessionId=existing.session.id;sourceId=source?.id;}
     if(source)break;
    }catch{/* Never discover sessions by email or trust an unverified browser cookie. */}
   }
  }
  if(!sessionId) {
   const capability=newGuestCapability();
   const saved=await createSupabaseAdminClient().from('dydd_guest_sessions').insert({capability_hash:guestCapabilityHash(capability),participant_name:name,participant_email:email}).select('id').single();
   if(saved.error||!saved.data)throw Error('Guest access could not be reserved. Please retry later.');
   sessionId=saved.data.id;
   // Save recovery capability BEFORE redemption: a timeout/retry resumes this session,
   // never consumes another enrollment or loses access to a committed order.
   await rememberGuest(sessionId,capability);
   jar.set('dydd_guest_current',sessionId,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/assessments',maxAge:365*86400});
  }
  await redeemGuestGrant(sessionId,token,sourceId);
  jar.set(guestGrantCookie(sessionId),token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/assessments',maxAge:365*86400});
  target=guestSessionPath(sessionId);
 } catch(error) {
  // Preserve only a validated capability in the entry URL for a recoverable retry.
  const query=new URLSearchParams({message:error instanceof Error?error.message:'Access could not be opened.'});
  if(/^[A-Za-z0-9_-]{43}$/.test(token))query.set('key',token);
  target='/assessments/group?'+query;
 }
 redirect(target);
}
export async function unlockGuestAccessDesignPd(sessionId:string) {
 let message='';
 try {
  await requireGuest(sessionId);
  const token=(await cookies()).get(guestGrantCookie(sessionId))?.value||'';
  const records=await guestRecords(sessionId),source=records.results.find(r=>r.product==='designid');
  if(!source)throw Error('Complete DesignID in this private session first.');
  if(token)await redeemGuestGrant(sessionId,token,source.id);
  else {const redeemed=await createSupabaseAdminClient().rpc('dydd_guest_unlock_included_pd',{p_session_id:sessionId,p_source:source.id});if(redeemed.error||!redeemed.data)throw Error('Included DesignPD is unavailable. Contact the person who supplied your access.');}
 } catch(error){message=error instanceof Error?error.message:'Access could not be opened.';}
 redirect(guestSessionPath(sessionId)+(message?'?message='+encodeURIComponent(message):'?product=designpd'));
}

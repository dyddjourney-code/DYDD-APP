'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireGuest, guestRecords } from '@/lib/public-assessments/guest';
import { guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { guestGrantCookie, redeemGuestGrant } from '@/lib/public-assessments/guest-group-access';
import { guestAccessTarget } from './enrollment';
export async function enrollGuestAccess(form:FormData) { redirect(await guestAccessTarget(form)); }
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

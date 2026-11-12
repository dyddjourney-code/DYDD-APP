import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { guestRecords, ownedGuestResult, requireGuest, type GuestResult } from './guest';
import { guestCapabilityHash, guestSessionId } from './guest-capability';
import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';

/** Identity always comes from Auth's verified response, not form fields or contact email. */
export async function verifiedGuestAccountUser() {
 const {data:{user},error}=await (await createSupabaseServerClient()).auth.getUser();
 if(error || !user?.email_confirmed_at || !user.email || user.is_anonymous) throw Error('Sign in to a verified account first.');
 return user;
}
export async function linkCurrentGuestToAccount(sessionId:string) {
 const user=await verifiedGuestAccountUser();
 const {token}=await requireGuest(sessionId); // HttpOnly cookie, never a hidden token or typed address.
 const {data,error}=await createSupabaseAdminClient().rpc('dydd_guest_link_verified_account',{
  p_session:guestSessionId(sessionId),p_user:user.id,p_hash:guestCapabilityHash(token),
 });
 if(error || data!==sessionId)throw Error('This guest session could not be linked. It may already belong to another account.');
 return sessionId;
}
/** Internal server boundary: the database independently checks verified Auth identity.
 * No supplied contact address or browser identity can select another email. */
export async function carryOverVerifiedGuestResults(userId:string) {
 const {error}=await createSupabaseAdminClient().rpc('dydd_guest_link_matching_verified_account',{p_user:userId});
 if(error)throw Error('Your completed public assessments could not be connected. Please retry.');
}
/** Filter server-role snapshot reads as strictly as the SQL restrictive policy. */
export function filterGuestBridgeSnapshots<T extends AssessmentSnapshotSummary>(snapshots:T[],linked:AssessmentSnapshotSummary[]):T[] {
 const eligible=new Set(linked.map(s=>s.id));
 const projected=new Set(snapshots.filter(s=>s.source==='public_guest').map(s=>s.id));
 return snapshots.filter(s=>s.source!=='public_guest' && !(s.source==='designpd_app' &&
  projected.has(String(s.scores.designIdSnapshotId)) && !eligible.has(String(s.scores.designIdSnapshotId))));
}
/** Apply the same original entitlement fence to privileged cross-account school
 * consumers after their independent circle/membership authorization. */
export async function filterGuestBridgeServiceSnapshots<T extends {id:string;source?:string|null}>(snapshots:T[],db=createSupabaseAdminClient()):Promise<T[]> {
 const candidates=snapshots.filter(s=>s.source==='public_guest'||s.source==='designpd_app');
 if(!candidates.length)return snapshots;
 const allowed=new Set<string>();
 for(let i=0;i<candidates.length;i+=500){
  const {data,error}=await db.rpc('dydd_guest_school_snapshot_ids',{p_ids:candidates.slice(i,i+500).map(s=>s.id)});
  if(error)throw Error('Shared assessment ownership could not be checked.');
  for(const row of data||[])allowed.add(String(row.snapshot_id));
 }
 const checked=new Set(candidates.map(s=>s.id));
 return snapshots.filter(s=>!checked.has(s.id)||allowed.has(s.id));
}
export function guestAccountSnapshot(result:GuestResult):AssessmentSnapshotSummary {
 const storage=result.pdf?.storage as {bucket?:string;path?:string}|undefined;
 const originalReady=result.report_state==='ready' && storage?.bucket==='assessment-report-pdfs' && storage?.path===`guest/${result.id}/report.pdf`;
 return {id:result.id,assessment_type:result.product,created_at:result.created_at,source_submitted_at:result.created_at,
  source:'public_guest',scores:result.scores,owned_designid_source_id:result.source_result_id || undefined,owned_report_ready:originalReady,owned_report_href:`/assessments/account/report/${result.id}`};
}
/** Link is permanent; expired guest cookies do not revoke account ownership.
 * Paid status, source revocations and environment fences remain authoritative. */
export async function getLinkedGuestSnapshots(userId:string) {
 const db=createSupabaseAdminClient();
 const {data:links,error}=await db.from('dydd_guest_account_links').select('session_id').eq('user_id',userId).order('session_id');
 if(error)throw Error('Linked assessment ownership could not be read.');
 const snapshots:AssessmentSnapshotSummary[]=[];
 for(const link of links||[]) {
  const {results}=await guestRecords(link.session_id);
  for(const result of results) {
   try {
    const snapshot=guestAccountSnapshot(await ownedGuestResult(link.session_id,result.id));
    if(result.product==='designpd' && !snapshot.owned_report_ready)continue;
    snapshots.push(snapshot);
   }
   catch(error) {
    const {GuestAccessDeniedError}=await import('./guest');
    if(!(error instanceof GuestAccessDeniedError))throw error;
   }
  }
 }
 return snapshots.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
}
export async function getAccountGuestResult(userId:string,resultId:string) {
 const db=createSupabaseAdminClient();
 const {data:result,error}=await db.from('dydd_guest_results').select('session_id').eq('id',guestSessionId(resultId)).maybeSingle();
 if(error || !result)throw Error('Report unavailable.');
 const {data:link,error:linkError}=await db.from('dydd_guest_account_links').select('session_id')
  .eq('session_id',result.session_id).eq('user_id',userId).maybeSingle();
 if(linkError || !link)throw Error('Report unavailable.');
 return ownedGuestResult(link.session_id,resultId);
}

import 'server-only';
import { normalizeEmail } from '@/lib/identity/email';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { AssessmentSnapshotSummary } from '@/lib/assessments/student-context';
/** Exact verified Auth address only. Explicit ownership wins; never Gmail alias expansion. */
export async function claimVerifiedAssessmentParticipant(userId: string, email: string, displayName: string) {
 const db = createSupabaseAdminClient();
 const identity = await db.auth.admin.getUserById(userId);
 if (identity.error || !identity.data.user?.email_confirmed_at || normalizeEmail(identity.data.user.email) !== normalizeEmail(email)) throw Error('Verified account required.');
 const owned = await db.from('assessment_participants').select('id,user_id').eq('user_id',userId).limit(1).maybeSingle();
 if (owned.error) throw Error('Unable to check assessment identity.');
 if (owned.data) return owned.data as {id:string};
 const found = await db.from('assessment_participants').select('id,user_id').eq('normalized_email',normalizeEmail(email)).maybeSingle();
 if (found.error || (found.data?.user_id && found.data.user_id !== userId)) throw Error('Assessment identity needs support.');
 if (found.data) {
  const claimed = await db.from('assessment_participants').update({user_id:userId,updated_at:new Date().toISOString()}).eq('id',found.data.id).is('user_id',null).select('id').single();
  if (claimed.error || !claimed.data) throw Error('Assessment identity changed. Please retry.');
  return claimed.data as {id:string};
 }
 const created = await db.from('assessment_participants').insert({user_id:userId,normalized_email:normalizeEmail(email),display_name:displayName}).select('id').single();
 if (created.error || !created.data) throw Error('Assessment identity could not be created. Please retry.');
 return created.data as {id:string};
}
/** Read-only native launch listing uses the same exact ownership rule as artifact downloads. */
export async function getOwnedAssessmentSnapshots(user:{id:string;email?:string|null}) {
 const db=createSupabaseAdminClient();
 const identity=await db.auth.admin.getUserById(user.id);
 if(identity.error || !identity.data.user?.email_confirmed_at || normalizeEmail(identity.data.user.email)!==normalizeEmail(user.email)) throw Error('Verified account required.');
 const address=normalizeEmail(identity.data.user.email);
 const [ownedParticipants,emailParticipants]=await Promise.all([
  db.from('assessment_participants').select('id,user_id,normalized_email').eq('user_id',user.id),
  db.from('assessment_participants').select('id,user_id,normalized_email').eq('normalized_email',address),
 ]);
 if(ownedParticipants.error||emailParticipants.error)throw Error('Assessment ownership could not be checked.');
 const ids=[...new Set([...(ownedParticipants.data||[]),...(emailParticipants.data||[])].filter(p=>p.user_id===user.id||(!p.user_id&&normalizeEmail(p.normalized_email)===address)).map(p=>p.id))];
 const result=await db.from('assessment_snapshots').select('id,assessment_type,created_at,scores,source,source_submitted_at,user_id,participant_id')
  .or(`user_id.eq.${user.id}${ids.length?`,and(user_id.is.null,participant_id.in.(${ids.join(',')}))`:''}`)
  .order('source_submitted_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
 if(result.error)throw Error('Saved assessments could not be checked.');
 return (result.data||[]) as AssessmentSnapshotSummary[];
}

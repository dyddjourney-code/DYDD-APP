import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getAssessmentSnapshotsForUser } from '@/lib/assessments/student-context';
import { normalizeEmail } from '@/lib/identity/email';
import { passportCurriculum, journeySlug, journeyChapterBadges, courseCompleted } from './curriculum';
import { savedAssessmentComplete, savedPrimary, currentPrimaryAwards, completedFruitSession, completedLegacyFruitSnapshot } from './evidence';

export async function readPassportState(user: {id:string;email?:string}) {
 const db=createSupabaseAdminClient();
 const [progress, awards] = await Promise.all([
  db.from('passport_lesson_completions').select('course_slug,lesson_slug,completed_at').eq('user_id',user.id),
  db.from('passport_awards').select('badge_key,evidence,awarded_at').eq('user_id',user.id),
 ]);
 for (const r of [progress,awards]) if(r.error)throw Error('Your Passport could not be loaded. Please try again.');
 const legacyCourses=(awards.data??[]).flatMap(a=>a.evidence?.source==='legacy_completed_enrollment' && typeof a.evidence?.course==='string'?[a.evidence.course as string]:[]);
 return {progress:progress.data??[],awards:awards.data??[],legacyCourses,legacyJourney:legacyCourses.includes(journeySlug)};
}
export async function awardBadges(userId:string, badges:Array<{key:string;evidence:Record<string,unknown>}>) {
 if(!badges.length)return;
 const {error}=await createSupabaseAdminClient().from('passport_awards').upsert(badges.map(b=>({user_id:userId,badge_key:b.key,evidence:b.evidence})),{onConflict:'user_id,badge_key',ignoreDuplicates:true});
 if(error)throw Error('Your progress is saved, but your badges could not be updated. Please try again.');
}
export async function syncPassportAwards(user:{id:string;email?:string}, state?:Awaited<ReturnType<typeof readPassportState>>) {
 state ??= await readPassportState(user);
 const badges:Array<{key:string;evidence:Record<string,unknown>}>=[];
 for(const course of passportCurriculum) {
  const completed=state.progress.filter(p=>p.course_slug===course.slug).map(p=>p.lesson_slug);
  const legacy=state.legacyCourses.includes(course.slug) || course.slug===journeySlug && state.legacyJourney;
  if(course.slug===journeySlug) {
   for(const [module,key] of Object.entries(journeyChapterBadges)) {
    const lessons=course.lessons.filter(l=>l.module===module);
    if(lessons.length && (legacy || lessons.every(l=>completed.includes(l.slug))))badges.push({key,evidence:{course:course.slug,module,source:legacy?'legacy_completed_enrollment':'lesson_checklist'}});
   }
  } else if(legacy || courseCompleted(course.slug,completed)) badges.push({key:course.slug,evidence:{course:course.slug,source:legacy?'legacy_completed_enrollment':'lesson_checklist'}});
 }
 const report=await getAssessmentSnapshotsForUser(user.id,user.email??'');
 const verified=report.all.filter(s=>savedAssessmentComplete(s,report.all));
 for(const snapshot of verified)badges.push({key:snapshot.assessment_type,evidence:{snapshotId:snapshot.id,source:'saved_completed_result'}});
 // Reports are newest first. Only the latest completed DesignID's canonical
 // saved Primary earns a reflection badge; secondary/history never add badges.
 const designId=verified.find(s=>s.assessment_type==='designid');
 const primary=designId ? savedPrimary(designId) : undefined;
 if(primary)badges.push({key:primary,evidence:{snapshotId:designId!.id,source:'canonical_saved_primary'}});
 for(const snapshot of report.all.filter(completedLegacyFruitSnapshot))badges.push({key:'fruit_360',evidence:{snapshotId:snapshot.id,source:'retained_full360_report_response_counts'}});
 if(user.email)for(const session of await completedFruitSessionsForEmail(user.email,user.id))badges.push({key:'fruit_360',evidence:{sessionId:session.id,source:'completed_report_and_required_observers'}});
 await awardBadges(user.id,badges);
 const synced=await readPassportState(user);
 const completedAssessments=Array.from(new Set(badges.map(b=>b.key).filter(key=>['designid','designpd','spiritual_gifts','fruit_360'].includes(key))));
 // Keep the persisted ledger unchanged. Only current, owner-verified assessment
 // evidence can project an assessment award into the current earned collection.
 const currentAwards=currentPrimaryAwards(synced.awards,primary).filter(a=>
  !['designid','designpd','spiritual_gifts','fruit_360','DesignID','DesignPD','Spiritual Gifts Assessment','FruitLife360'].includes(a.badge_key) || completedAssessments.includes(a.badge_key));
 return {...synced,completedAssessments,awards:currentAwards};
}

/** Exact account/participant ownership, never Gmail delivery-alias equivalence.
 * Unclaimed exact-email legacy reports remain readable without claiming rows. */
export async function completedFruitSessionsForEmail(email:string,userId:string) {
 const db=createSupabaseAdminClient();
 const participants=await db.from('assessment_participants').select('id,user_id,normalized_email')
  .or(`user_id.eq.${userId},and(normalized_email.eq.${JSON.stringify(normalizeEmail(email))},user_id.is.null)`);
 if(participants.error)throw Error('Your FruitLife360 report identity could not be checked. Please try again.');
 const participantIds=(participants.data??[]).map(p=>p.id);
 const ownership=[`created_by_user_id.eq.${userId}`,...participantIds.map(id=>`and(participant_id.eq.${id},created_by_user_id.is.null)`)];
 const sessions=await db.from('fruitlife_360_sessions')
  .select('id,self_completed_at,observer_goal,observer_completed_count,report_status,report_mode,report_snapshot_id,report_url,artifacts:fruitlife_360_report_artifacts(artifact_type,artifact_status)')
  .or(ownership.join(',')).in('report_status',['ready','sent']);
 if(sessions.error)throw Error('Your FruitLife360 report evidence could not be checked. Please try again.');
 return (sessions.data??[]).filter(completedFruitSession);
}

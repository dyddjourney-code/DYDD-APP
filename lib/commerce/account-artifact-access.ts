import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {personalMembershipExpired} from './account-access';
/** Call only AFTER exact artifact ownership. Retain separately paid session reports. */
export async function membershipArtifactExpired(user:{id:string;email?:string|null},snapshot:{id:string;assessment_type:string}) {
 if(!['designid','fruit_360'].includes(snapshot.assessment_type)||!await personalMembershipExpired(user))return false;
 if(snapshot.assessment_type==='designid'){
  const saved=await createSupabaseAdminClient().from('dydd_public_assessment_entitlements').select('id').eq('user_id',user.id).eq('product','designid').eq('completion_snapshot_id',snapshot.id).is('revoked_at',null).limit(1);
  if(saved.error)throw Error('Your saved assessment purchase could not be checked. Please retry.');
  if(saved.data?.length)return false;
 }
 if(snapshot.assessment_type==='fruit_360'){
  const db=createSupabaseAdminClient();
  const session=await db.from('fruitlife_360_sessions').select('id').eq('report_snapshot_id',snapshot.id).maybeSingle();
  if(session.error)throw Error('Your saved report access could not be checked. Please retry.');
  if(session.data){
   const purchase=await db.from('fruitlife_360_entitlements').select('id').eq('user_id',user.id).eq('fruitlife_session_id',session.data.id).in('status',['active','consumed']).limit(1);
   if(purchase.error)throw Error('Your saved report purchase could not be checked. Please retry.');
   if(purchase.data?.length)return false;
  }
 }
 return true;
}

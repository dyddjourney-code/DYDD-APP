import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const check=r=>{assert(!r.error,r.error?.message);return r.data;};
// Same paid sandbox order + entitlement contract as circles-system-published.mjs.
// These synthetic rows exercise the real guards; never bypass Personal/Circle gates.
export async function grantCircleFixture(db,user,{leadership=true}={}){
 const through=new Date(Date.now()+90*86400000).toISOString();
 for(const capability of leadership?['personal','circle_leadership']:['personal']){
  const order=check(await db.from('dydd_test_billing_orders').insert({user_id:user.id,capability,scope_id:'account',price_id:'synthetic_qa_fixture_NOT_provider',status:'paid'}).select('id').single());
  check(await db.from('dydd_test_billing_entitlements').insert({source_id:'email-qa-'+crypto.randomUUID(),order_id:order.id,user_id:user.id,capability,scope_id:'account',active:true,paid:true,expires_at:through,paid_through:through}));
 }
}
export function validLifecyclePlan(plan){return {...plan,format:'Small group',expectedPeople:'3',assignments:Object.fromEntries(Object.entries(plan.assignments).map(([slug,n])=>[slug,Math.min(plan.meetingCount,n)]))};}
export async function cleanupCircleFixtures(db,{users=[],circles=[]}){
 const ids=users.map(u=>u.id),emails=users.map(u=>u.email),proof=[];
 async function remove(table,key,values){if(!values.length)return;check(await db.from(table).delete().in(key,values));const remaining=check(await db.from(table).select(key).in(key,values));assert.equal(remaining.length,0,'Cleanup failed: '+table);proof.push(table);}
 if(circles.length){for(const circleId of circles){check(await db.from('dydd_lifecycle_events').delete().contains('payload',{circleId}));assert.equal(check(await db.from('dydd_lifecycle_events').select('id').contains('payload',{circleId})).length,0);}
 const campaigns=check(await db.from('dydd_circle_campaigns').select('id').in('circle_id',circles));await remove('dydd_lifecycle_events','source_id',campaigns.map(c=>c.id));}
 for(const table of ['dydd_lifecycle_jobs','dydd_circle_held_outbox','dydd_circle_callouts','dydd_circle_consents','dydd_circle_roster_previews','dydd_circle_cohort_requests','dydd_circle_email_preferences','dydd_circle_memberships','dydd_circle_announcements','dydd_circle_campaigns'])await remove(table,'circle_id',circles);
 await remove('journey_circle_plans','id',circles);
 for(const table of ['dydd_test_couple_bindings','dydd_circle_operation_events','dydd_circle_operation_limits'])await remove(table,'user_id',ids);
 if(ids.length){const orders=check(await db.from('dydd_test_billing_orders').select('id').in('user_id',ids));await remove('dydd_test_billing_renewals','order_id',orders.map(o=>o.id));}
 await remove('dydd_test_leader_credits','participant_id',ids);
 for(const table of ['dydd_test_billing_entitlements','dydd_test_billing_orders','dydd_lifecycle_jobs','dydd_lifecycle_events','dydd_personal_access','assessment_participants','reflection_rounds'])await remove(table,'user_id',ids);
 for(const table of ['dydd_email_preferences','dydd_email_preference_tokens'])await remove(table,'email',emails);
 for(const user of users){check(await db.auth.admin.deleteUser(user.id));const remaining=await db.auth.admin.getUserById(user.id);assert(remaining.error&&!remaining.data?.user,'Auth fixture remains');}
 console.log('PASS asserted fixture deletions and empty-table readback ('+new Set(proof).size+' tables); synthetic auth users absent');
}

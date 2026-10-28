// Assessment completion, observer completion and course completion are distinct.
// Isolated real server helpers with synthetic rows; no network or database writes.
const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
global.fetch=()=>{throw Error('Network forbidden')};
const evidence=load('lib/passport/evidence.ts');
const {completedFruitSession,completedFruitAssessmentSession:assessment,completedLegacyFruitAssessmentSnapshot:legacy}=evidence;
const {buildPassportBadges}=load('lib/passport-badges.ts');
const user={id:'owner',email:'learner+one@gmail.com'};
const base={id:'session',created_by_user_id:'owner',self_completed_at:'2026-10-28',observer_goal:0,observer_completed_count:0,report_status:'sent',report_mode:'SELF_ONLY',report_snapshot_id:'report',report_url:null,artifacts:[]};
const snapshot={id:'report',user_id:'owner',assessment_type:'fruit_360',source:'fruitlife_360_native_app',created_at:'2026-10-28',source_submitted_at:null,scores:{summary:{Report_Mode:'SELF_ONLY',Report_Date:'2026-10-28'},scores:{Observer_Count:0,Response_Count:1}}};
assert(assessment(base));assert(!completedFruitSession(base),'SELF_ONLY never claims observer completion');
for(const patch of [{self_completed_at:null},{report_status:'queued'},{report_status:'error'},{report_snapshot_id:null},{report_mode:null},{report_mode:'UNKNOWN'},{observer_goal:2},{observer_completed_count:1},{observer_goal:NaN},{observer_goal:0.5}])assert(!assessment({...base,...patch}),JSON.stringify(patch));
for(const report_status of evidence.completedFruitReportStatuses)assert(assessment({...base,report_status}));
assert(assessment({...base,report_snapshot_id:null,artifacts:[{artifact_type:'pdf',artifact_status:'ready'}]}));
assert(!assessment({...base,report_snapshot_id:null,artifacts:[{artifact_type:'payload',artifact_status:'ready'}]}));
for(const report_mode of ['360','FULL_360',null]){
 assert(assessment({...base,observer_goal:2,observer_completed_count:2,report_mode}));
 assert(!assessment({...base,observer_goal:2,observer_completed_count:1,report_mode}));
}
assert(!assessment({...base,observer_goal:2,observer_completed_count:2,report_mode:'UNKNOWN'}));
const imported={...snapshot,source:'fruitlife_360_report_export'};
assert(legacy(imported));assert(!legacy(snapshot),'Native snapshot alone cannot award');
assert(!legacy({...imported,scores:{...imported.scores,scores:{Observer_Count:0,Response_Count:1,Observer_Goal:2}}}),'An incomplete configured observer cycle is not a completed self-only report');
for(const scores of [{...imported.scores,status:'draft'},{summary:{Report_Mode:'SELF_ONLY',Report_Date:'2026-10-28'},scores:{Response_Count:1}},{...imported.scores,scores:{Observer_Count:1,Response_Count:1}},{...imported.scores,summary:{Report_Mode:'SELF_ONLY'}}])assert(!legacy({...imported,scores}));
for(const Report_Mode of ['360','FULL_360'])assert(legacy({...imported,scores:{summary:{Report_Mode,Report_Date:'2026-10-28'},scores:{Observer_Count:2,Response_Count:3}}}));
let rows={},calls=[],written=[];
function dbQuery(table){const eq=[],ors=[],ins=[];const q={select(){return q},eq(k,v){eq.push([k,v]);return q},or(v){ors.push(v);return q},in(k,v){ins.push([k,v]);return q},order(){return q},returns(){return q},
 upsert:async data=>{assert.equal(table,'passport_awards');written.push(...data);return {error:null}},
 then(resolve,reject){return Promise.resolve().then(()=>{
 calls.push({table,eq,ors,ins});let data=rows[table]||[];
 data=data.filter(r=>eq.every(([k,v])=>r[k]===v)&&ins.every(([k,v])=>v.includes(r[k])));
 for(const raw of ors)data=data.filter(r=>{
 if(table==='assessment_participants')return r.user_id===user.id || r.user_id==null&&r.normalized_email===user.email;
 const owner=table==='fruitlife_360_sessions'?'created_by_user_id':'user_id';
 return r[owner]===user.id || r[owner]==null&&(rows.assessment_participants||[]).some(p=>raw.includes(`participant_id.eq.${p.id},${owner}.is.null`)&&r.participant_id===p.id);
 });return {data,error:null};
 }).then(resolve,reject)} };return q;}
const db={from:dbQuery};load('lib/supabase/admin.ts').createSupabaseAdminClient=()=>db;
const context=load('lib/assessments/student-context.ts');
context.getAssessmentSnapshotsForUser=async()=>({all:rows.assessment_snapshots.filter(s=>s.user_id===user.id),latest:[]});
const {completedFruitSessionsForEmail:read,syncPassportAwards:sync}=load('lib/passport/state.ts');
function reset(){calls=[];written=[];rows={assessment_participants:[],fruitlife_360_sessions:[{...base,report_mode:null}],assessment_snapshots:[snapshot],passport_awards:[{user_id:'owner',badge_key:'fruitlife-360-formation',evidence:{}}],passport_lesson_completions:[]};}
(async()=>{
 reset();assert.equal((await read(user.email,user.id)).length,1,'Owned linked SELF_ONLY recovers old null report_mode');
 for(const report_status of evidence.completedFruitReportStatuses){reset();rows.fruitlife_360_sessions[0].report_status=report_status;assert.equal((await read(user.email,user.id)).length,1,report_status+' survives server query filtering');}
 reset();await read(user.email,user.id);
 const query=calls.find(q=>q.table==='assessment_snapshots');assert.equal(query.ors[0],'user_id.eq.owner');
 let result=await sync(user,{progress:[],awards:rows.passport_awards,legacyCourses:[],legacyJourney:false});
 assert.deepEqual(result.completedAssessments,['fruit_360']);assert(written.some(a=>a.badge_key==='fruit_360'));assert(!written.some(a=>a.badge_key==='fruitlife-360-formation'));
 let badges=buildPassportBadges({completedAssessments:result.completedAssessments});
 assert.equal(badges.find(b=>b.title==='FruitLife360').state,'earned');assert.notEqual(badges.find(b=>b.title==='FruitLife360 Course').state,'earned');
 badges=buildPassportBadges({completedAssessments:result.completedAssessments,earnedBadgeKeys:result.awards.map(a=>a.badge_key)});assert.equal(badges.find(b=>b.title==='FruitLife360 Course').state,'earned','Existing course award preserved');
 for(const change of [()=>rows.assessment_snapshots=[],()=>rows.assessment_snapshots=[{...snapshot,user_id:'foreign'}],()=>rows.assessment_snapshots=[{...snapshot,scores:{...snapshot.scores,status:'draft'}}],()=>rows.fruitlife_360_sessions=[{...base,created_by_user_id:'foreign'}]]){reset();change();assert.equal((await read(user.email,user.id)).length,0);}
 reset();rows.assessment_participants=[{id:'alias',user_id:null,normalized_email:'learner@gmail.com'}];rows.fruitlife_360_sessions=[{...base,created_by_user_id:null,participant_id:'alias'}];assert.equal((await read(user.email,user.id)).length,0,'Gmail alias is not ownership');
 reset();rows.assessment_participants=[{id:'foreign',user_id:'other',normalized_email:user.email}];rows.fruitlife_360_sessions=[{...base,created_by_user_id:null,participant_id:'foreign'}];assert.equal((await read(user.email,user.id)).length,0,'Conflicting exact-email owner is not ownership');
 reset();rows.assessment_participants=[{id:'legacy',user_id:null,normalized_email:user.email}];rows.fruitlife_360_sessions=[{...base,created_by_user_id:null,participant_id:'legacy',report_mode:null}];rows.assessment_snapshots=[{...snapshot,user_id:null,participant_id:'legacy'}];assert.equal((await read(user.email,user.id)).length,1,'Unclaimed exact-email legacy identity works without attachment');
 assert(calls.find(q=>q.table==='assessment_snapshots').ors[0].includes('participant_id.eq.legacy,user_id.is.null'));
 reset();rows.fruitlife_360_sessions=[];rows.assessment_snapshots=[imported];result=await sync(user,{progress:[],awards:[],legacyCourses:[],legacyJourney:false});assert(result.completedAssessments.includes('fruit_360'),'Imported SELF_ONLY report is sufficient');
 reset();rows.fruitlife_360_sessions=[];rows.passport_awards.push({user_id:'owner',badge_key:'fruit_360',evidence:{sessionId:'foreign'}});result=await sync(user,{progress:[],awards:[],legacyCourses:[],legacyJourney:false});assert(!result.completedAssessments.includes('fruit_360'));assert(!result.awards.some(a=>a.badge_key==='fruit_360'),'Stale ledger never creates completion');assert(result.awards.some(a=>a.badge_key==='fruitlife-360-formation'));
 console.log('PASS FruitLife assessment badge: owned native/imported SELF_ONLY and full360, null-mode recovery, full observer gate retained, incomplete/foreign/Gmail-alias/stale-ledger rejection, independent existing course badge. No network or real writes.');
})().catch(e=>{console.error(e);process.exitCode=1});

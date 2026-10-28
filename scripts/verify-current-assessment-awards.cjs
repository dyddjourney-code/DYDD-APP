// Read-only, isolated regression: no credentials, network, mutation or delivery.
const assert=require('node:assert/strict');
const load=require('./fruitlife-test-load.cjs');
const {completedFruitSession,completedLegacyFruitSnapshot,savedAssessmentComplete}=load('lib/passport/evidence.ts');
const {buildPassportBadges}=load('lib/passport-badges.ts');
const base={self_completed_at:'2026-10-28',observer_goal:2,observer_completed_count:2,report_status:'sent',report_snapshot_id:'report',report_mode:'FULL_360'};
assert(completedFruitSession(base),'A complete owned full360 can earn the milestone');
for(const patch of [
 {observer_goal:0,observer_completed_count:0,report_mode:'SELF_ONLY'},
 {observer_goal:0,observer_completed_count:4},
 {observer_goal:2,observer_completed_count:1},
 {self_completed_at:null},{report_status:'queued'},
 {report_snapshot_id:null},{observer_goal:NaN},
 {observer_goal:1.5},{observer_completed_count:NaN},
 {report_mode:'SELF_ONLY'},
])assert(!completedFruitSession({...base,...patch}),JSON.stringify(patch));
const legacyFruit={id:'legacy',assessment_type:'fruit_360',source:'fruit_export',scores:{summary:{Report_Mode:'FULL_360',Report_Date:'2026-09-14'},scores:{Observer_Count:2,Response_Count:3}}};
assert(completedLegacyFruitSnapshot(legacyFruit),'Retained completed full360 compatibility survives');
assert(!completedLegacyFruitSnapshot({...legacyFruit,source:'fruitlife_360_native_app'}),'Native report snapshot alone is not session completion');
assert(!savedAssessmentComplete(legacyFruit,[legacyFruit]),'Ordinary result eligibility does not bless FruitLife snapshots');
assert(!completedLegacyFruitSnapshot({...legacyFruit,scores:{...legacyFruit.scores,summary:{Report_Mode:'SELF_ONLY',Report_Date:'2026-09-14'}}}));
const stale=['fruit_360','FruitLife360','designpd','DesignPD','spiritual_gifts','Spiritual Gifts Assessment','designid','DesignID','Architect','Artisan'];
let badges=buildPassportBadges({completedAssessments:['designid'],primaryDesign:'Artisan',earnedBadgeKeys:[...stale,'Identity','designid-foundations']});
for(const title of ['FruitLife360','DesignPD','Spiritual Gifts Assessment'])assert.notEqual(badges.find(b=>b.title===title).state,'earned',title+' must not trust stale awards');
assert.equal(badges.find(b=>b.title==='DesignID').state,'earned');
assert.deepEqual(badges.filter(b=>['Architect','Artisan','Shepherd','Steward'].includes(b.title)&&b.state==='earned').map(b=>b.title),['Artisan']);
assert.equal(badges.find(b=>b.title==='Identity').state,'earned');
assert.equal(badges.find(b=>b.title==='DesignID Course').state,'earned','Independent course award remains intact');
assert.equal(buildPassportBadges({completedAssessments:[],earnedBadgeKeys:stale}).filter(b=>b.state==='earned').length,0);
assert.equal(buildPassportBadges({completedAssessments:['fruit_360']}).find(b=>b.title==='FruitLife360').state,'earned');

let queries=[],writes=[],mode='session';
const ledger=[{badge_key:'fruit_360',evidence:{sessionId:'other-self-only'}},{badge_key:'Artisan',evidence:{}},{badge_key:'Identity',evidence:{}}];
const native={id:'native',assessment_type:'designid',source:'designid_app',created_at:'2026-10-28',source_submitted_at:'2026-10-28',scores:{summary:{Primary:'Artisan',Secondary:'Shepherd'}}};
const db={from(table){const query={table};queries.push(query);const q={
 select(fields){query.select=fields;return q},eq(key,value){(query.eq??={})[key]=value;return q},
 in(key,value){(query.in??={})[key]=value;return q},or(value){query.or=value;return q},
 order(){return q},returns(){return q},
 async maybeSingle(){return {data:mode==='claim'?null:{id:'self-participant'},error:null}},
 async upsert(rows){writes.push(...rows);return {error:null}},
 update(){throw Error('Participant mutations forbidden in regression')},
 then(resolve){let data=[];
 if(table==='assessment_participants')data=mode==='claim'?[{id:'other-participant',user_id:'other-user'}]:[{id:'self-participant',user_id:'self-user',normalized_email:'learner+new@gmail.com'}];
 if(table==='fruitlife_360_sessions')data=mode==='complete'?[{...base,id:'owned-complete'}]:[];
 if(table==='passport_awards')data=ledger;
 if(table==='assessment_snapshots')data=[native];
 return Promise.resolve({data,error:null}).then(resolve);
 }};return q;}};
// Mock the DB, not the production identity/evidence functions.
(async()=>{
 const context=load('lib/assessments/student-context.ts');
 // student-context was loaded transitively by evidence.ts before mocks: its
 // exported DB-dependent helpers use the actual admin export, patched here.
 const admin=load('lib/supabase/admin.ts');admin.createSupabaseAdminClient=()=>db;
 const {completedFruitSessionsForEmail,syncPassportAwards}=load('lib/passport/state.ts');
 let sessions=await completedFruitSessionsForEmail('learner+new@gmail.com','self-user');
 assert.deepEqual(sessions,[]);
 const participantQuery=queries.find(q=>q.table==='assessment_participants');
 assert(participantQuery.or.includes('user_id.eq.self-user'));
 assert(participantQuery.or.includes('learner+new@gmail.com'));
 assert(!participantQuery.or.includes('normalized_email.eq.learner@gmail.com'),'No canonical-email account expansion');
 const sessionQuery=queries.find(q=>q.table==='fruitlife_360_sessions');
 assert(sessionQuery.or.includes('created_by_user_id.eq.self-user'));
 assert(sessionQuery.or.includes('participant_id.eq.self-participant,created_by_user_id.is.null'));
 assert(!sessionQuery.in?.participant_email,'Session eligibility is owned identity, not email aliases');
 mode='complete';assert.equal((await completedFruitSessionsForEmail('learner+new@gmail.com','self-user')).length,1);
 mode='session';queries=[];
 const snapshots=await context.getAssessmentSnapshotsForUser('self-user','learner+new@gmail.com');
 assert.equal(snapshots.all.length,1);
 assert.equal(queries.find(q=>q.table==='assessment_snapshots').or,'user_id.eq.self-user,and(participant_id.eq.self-participant,user_id.is.null)');
 mode='claim';queries=[];assert.equal(await context.findOrAttachParticipant('self-user','learner+new@gmail.com'),null);
 assert.deepEqual(queries.find(q=>q.in?.normalized_email).in.normalized_email,['learner+new@gmail.com']);
 mode='session';queries=[];
 const state=await syncPassportAwards({id:'self-user',email:'learner+new@gmail.com'},{progress:[],awards:ledger,legacyCourses:[],legacyJourney:false});
 assert.deepEqual(state.completedAssessments,['designid']);
 assert.deepEqual(state.awards.map(a=>a.badge_key),['Artisan','Identity']);
 assert.equal(ledger.length,3,'Historical false FruitLife award stays in ledger');
 assert(!writes.some(a=>a.badge_key==='fruit_360'),'No false new FruitLife award');
 assert(writes.some(a=>a.badge_key==='designid'));
 assert(writes.some(a=>a.badge_key==='Artisan'));
 console.log('PASS current assessment projection, ledger preservation, primary-only/course independence, self-only rejection, exact Gmail-plus claims, owned session and snapshot isolation, real sync stale-award exclusion.');
})().catch(e=>{console.error(e);process.exitCode=1});

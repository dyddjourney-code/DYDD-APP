const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
global.fetch = () => { throw Error('Network forbidden'); };
let user = {id:'self-user',email:'learner+one@gmail.com'}, rows = {}, writes = [], calls = [];
let snapshots = [];
function query(table) {
 const filters = [], ors = []; let verb = 'select', payload;
 const q = {
  select(){return q}, eq(k,v){filters.push([k,v]);return q}, or(v){ors.push(v);return q},
  in(){return q}, order(){return q}, limit(){return q}, range(){return q},
  insert(v){verb='insert';payload=v;return q}, upsert(v){verb='upsert';payload=v;return q},
  update(v){verb='update';payload=v;return q}, single(){return q}, maybeSingle(){return q},
  then(resolve,reject){return Promise.resolve().then(()=>{
   calls.push({table,filters,ors,verb});
   if(verb!=='select'){writes.push({table,verb,payload});return {data:{id:'new-round',...payload},error:null};}
   let data=rows[table]??[];
   data=data.filter(r=>filters.every(([k,v])=>r[k]===v));
   // Model the PostgREST ownership branches, not simply return all mocked rows.
   if(ors.length) data=data.filter(r=>ors.some(raw=>{
    const ownerKey=table==='fruitlife_360_sessions'?'created_by_user_id':'user_id';
    if(table==='assessment_participants')return r.user_id===user.id || r.user_id==null && r.normalized_email===user.email;
    return r[ownerKey]===user.id || r[ownerKey]==null && (rows.assessment_participants??[]).some(p=>
      raw.includes(`participant_id.eq.${p.id}`)&&p.id===r.participant_id);
   }));
   return {data,error:null};
  }).then(resolve,reject)}
 };return q;
}
const db={from:query,auth:{getUser:async()=>({data:{user}})},rpc:async()=>{throw Error('Unexpected RPC')}};
const passport={progress:[],awards:[],legacyCourses:[],legacyJourney:false};
const mocks={
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>db},
 '@/lib/assessments/student-context':{
  getAssessmentSnapshotsForUser:async()=>({all:snapshots,latest:snapshots}),displayDateTime:x=>x,
  buildDesignIdContext:()=>({primary:'Architect'})
 },
 '@/lib/passport/state':{readPassportState:async()=>passport,syncPassportAwards:async()=>passport,completedFruitSessionsForEmail:async()=>rows.fruitlife_360_sessions.filter(evidence.completedFruitSession),awardBadges:async()=>{throw Error('No awards expected')}},
 '@/lib/reflections/preview':{previewParams:()=>null},
 '@/lib/passport/preview':{}, '@/lib/environment':{isSandbox:()=>false},
};
const helper=load('lib/trails/course-eligibility.ts',mocks);
const evidence=load('lib/passport/evidence.ts',mocks);
const progress=load(process.env.COURSE_PROGRESS_FIXTURE_ROUTE || 'app/api/course-progress/route.ts',mocks);
const reflections=load('app/api/course-reflections/route.ts',mocks);
const courseAccess=load('lib/trails/course-access.ts',{...mocks,'next/navigation':{redirect:path=>{throw Error('redirect:'+path)}}});
const curriculum=load('lib/passport/curriculum.ts',mocks);
const slug='fruitlife-360-formation',lesson=curriculum.passportCurriculum.find(c=>c.slug===slug).lessons[0].slug;
const snapshot=(id,date='2026-10-10T00:00:00Z')=>({id,user_id:user.id,assessment_type:'fruit_360',created_at:date,source_submitted_at:date,source:'fruitlife_360_native_app',scores:{}});
const session=(id='session',snapshotId='native')=>({id,created_by_user_id:user.id,self_completed_at:'2026-10-10',observer_goal:0,observer_completed_count:0,report_status:'ready',report_mode:'SELF_ONLY',report_snapshot_id:snapshotId,report_url:null,artifacts:[]});
const post=(handler,body)=>handler.POST(new Request('https://school.test/api/test',{method:'POST',headers:{'Content-Type':'application/json',origin:'https://school.test'},body:JSON.stringify(body)}));
function reset(){rows={assessment_participants:[],assessment_snapshots:[],fruitlife_360_sessions:[]};writes=[];calls=[];snapshots=[];}
async function complete(status){const r=await post(progress,{action:'complete-lesson',courseSlug:slug,lessonSlug:lesson});assert.equal(r.status,status,await r.text());assert.equal(writes.filter(w=>w.table==='passport_lesson_completions').length,status===200?1:0);}
(async()=>{
 reset(); rows.assessment_snapshots=[snapshot('native')];rows.fruitlife_360_sessions=[session()];
 assert.equal(evidence.completedFruitSession(session()),false,'self-only is not full360 badge evidence');
 await complete(200);
 await courseAccess.requireTrailCourseAssessment({slug,snapshots:[],email:user.email,signedIn:true,preview:false});
 const identity=calls.find(c=>c.table==='assessment_participants').ors[0];assert(identity.includes('learner+one@gmail.com'));assert(!identity.includes('learner@gmail.com'));
 const ownership=calls.find(c=>c.table==='fruitlife_360_sessions').ors[0];assert(ownership.includes('created_by_user_id.eq.self-user'));
 for(const mutation of [s=>s.self_completed_at=null,s=>s.report_status='pending',s=>s.report_snapshot_id=null,s=>{s.observer_goal=2;s.observer_completed_count=1;s.report_mode='360'},s=>s.created_by_user_id='foreign-user']){
  reset();const s=session();mutation(s);rows.fruitlife_360_sessions=[s];rows.assessment_snapshots=[snapshot('native')];await complete(403);
 }
 reset();rows.assessment_snapshots=[{...snapshot('native'),scores:{summary:{Report_Mode:'SELF_ONLY'}}}];rows.fruitlife_360_sessions=[{...session(),report_mode:null}];await complete(200);
 reset();rows.assessment_snapshots=[{...snapshot('native'),user_id:'foreign-user',scores:{summary:{Report_Mode:'SELF_ONLY'}}}];rows.fruitlife_360_sessions=[{...session(),report_mode:null}];await complete(403);
 reset();rows.assessment_snapshots=[snapshot('native')];rows.fruitlife_360_sessions=[{...session(),report_mode:null}];await complete(403);
 reset();await complete(403);
 await assert.rejects(()=>courseAccess.requireTrailCourseAssessment({slug,snapshots:[snapshot('not-completed')],email:user.email,signedIn:true,preview:false}),/redirect:.*fruitlife-360/);
 reset();rows.assessment_participants=[{id:'alias',normalized_email:'learner@gmail.com',user_id:null}];rows.fruitlife_360_sessions=[{...session(),created_by_user_id:null,participant_id:'alias'}];await complete(403);
 reset(); rows.assessment_participants=[{id:'legacy',normalized_email:user.email,user_id:null}];rows.fruitlife_360_sessions=[{...session(),created_by_user_id:null,participant_id:'legacy'}];await complete(200);
 reset();rows.assessment_participants=[{id:'foreign',normalized_email:user.email,user_id:'other'}];rows.fruitlife_360_sessions=[{...session(),created_by_user_id:null,participant_id:'foreign'}];await complete(403);
 reset();rows.fruitlife_360_sessions=[{...session(),observer_goal:2,observer_completed_count:2,report_mode:'360'}];await complete(200);assert(evidence.completedFruitSession(rows.fruitlife_360_sessions[0]));
 reset();rows.assessment_snapshots=[{...snapshot('retained'),source:'legacy_export',scores:{summary:{Report_Mode:'SELF_ONLY',Report_Date:'2026-10-10'},scores:{Observer_Count:0,Response_Count:1}}}];await complete(200);
 reset();rows.fruitlife_360_sessions=[{...session(),report_snapshot_id:null,artifacts:[{artifact_type:'pdf',artifact_status:'ready'}]}];await complete(200);
 // Deliberately shuffled storage results: use completion dates, not input order.
 reset();rows.assessment_snapshots=[snapshot('older','2026-10-01T00:00:00Z'),snapshot('latest','2026-10-20T00:00:00Z'),snapshot('unlinked','2026-10-25T00:00:00Z'),{...snapshot('foreign','2026-10-26T00:00:00Z'),user_id:'other'}];
 rows.fruitlife_360_sessions=[session('old-session','older'),session('new-session','latest')];
 rows.reflection_rounds=[{id:'historical-round',course_slug:slug,user_id:user.id,assessment_snapshot_id:'older',assessment_label:'Original label',questions:[],started_at:'2026-10-02T00:00:00Z'}];
 for(const selection of [undefined,null,'older']){
  writes=[];const body={action:'new-round',courseSlug:slug};if(selection!==undefined)body.assessmentSnapshotId=selection;
  const response=await post(reflections,body);assert.equal(response.status,201,await response.text());
  assert.equal(writes[0].payload.assessment_snapshot_id,selection==='older'?'older':'latest');
  assert(writes[0].payload.assessment_label.includes(selection==='older'?'2026-10-01':'2026-10-20'));
  assert.equal(writes.filter(w=>w.verb==='update').length,0,'no historical round overwrite');
  assert.equal(rows.reflection_rounds[0].assessment_label,'Original label');
 }
 for(const id of ['foreign','unlinked','',123]){writes=[];assert.equal((await post(reflections,{action:'new-round',courseSlug:slug,assessmentSnapshotId:id})).status,400);assert.equal(writes.length,0);}
 const data=await (await reflections.GET(new Request('https://school.test/api/course-reflections?courseSlug='+slug))).json();
 assert.deepEqual(data.reports.map(r=>r.id),['latest','older']);assert.equal(data.nextAssessmentReportId,'latest');assert.equal(data.rounds[0].assessment_snapshot_id,'older');
 reset();assert.equal((await post(reflections,{action:'new-round',courseSlug:slug})).status,403);assert.equal(writes.length,0);
 const sorted=helper.newestCourseReports([snapshot('a','2026-10-20'),{...snapshot('z','2026-10-21'),source_submitted_at:'invalid'},{...snapshot('b','2026-10-20'),source_submitted_at:null}]);assert.deepEqual(sorted.map(r=>r.id),['z','b','a']);
 user=null;assert.equal((await post(progress,{action:'complete-lesson',courseSlug:slug,lessonSlug:lesson})).status,401);assert.equal((await post(reflections,{action:'new-round',courseSlug:slug})).status,401);
 console.log('PASS real course-progress/reflections handlers: SELF_ONLY teaching vs full360 badge, exact ownership/aliases/foreign sessions, no report/incomplete gates, newest eligible report default omitted/null, explicit historical selection, foreign rejection, immutable historical rounds, sorted report list and retake hint. No network/data/email.');
})().catch(e=>{console.error(e);process.exitCode=1});

const {test}=require('node:test'),assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function harness(failure=false){
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];
 const load=require('../scripts/fruitlife-test-load.cjs'),calls=[];
 const m=load('lib/public-assessments/guest-account.ts',{
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {error:failure?{message:'private database detail'}:null}}})}
 });return {m,calls};
}
test('automatic bridge sends only Auth UUID to DB independent verified exact-email proof, no contact field',async()=>{
 const {m,calls}=harness();await m.carryOverVerifiedGuestResults(id);
 assert.deepEqual(calls,[{name:'dydd_guest_link_matching_verified_account',args:{p_user:id}}]);
});
test('bridge storage failure is fail closed and sanitized',async()=>{await assert.rejects(harness(true).m.carryOverVerifiedGuestResults(id),e=>/could not be connected/.test(e.message)&&!/private/.test(e.message));});
test('guest school summary preserves original scores/time/UUID and original PDF locator, never native archive',()=>{
 const {m}=harness(),scores={reportPayload:{Primary:'Shepherd'},scores:{Architect_Pts:20,Artisan_Pts:20,Shepherd_Pts:40,Steward_Pts:20,Total_Pts:100}},date='2026-08-31T13:15:12Z';
 const result={id,product:'designid',created_at:date,scores,report_state:'ready',pdf:{storage:{bucket:'assessment-report-pdfs',path:`guest/${id}/report.pdf`}}};
 const snapshot=m.guestAccountSnapshot(result);assert.equal(snapshot.scores,scores);assert.equal(snapshot.created_at,date);assert.equal(snapshot.source_submitted_at,date);assert.equal(snapshot.id,id);assert.equal(snapshot.owned_report_href,`/assessments/account/report/${id}`);assert.equal(snapshot.owned_report_ready,true);
 assert.equal(m.guestAccountSnapshot({...result,report_state:'uncertain'}).owned_report_ready,false);
 assert.equal(m.guestAccountSnapshot({...result,pdf:{storage:{bucket:'foreign',path:`guest/${id}/report.pdf`}}}).owned_report_ready,false);
});
test('stale mirror rows and native derived results from revoked guest sources excluded; native unaffected',()=>{
 const {m}=harness();
 const projected={id,source:'public_guest',assessment_type:'designid',scores:{}},derived={id:'derived',source:'designpd_app',assessment_type:'designpd',scores:{designIdSnapshotId:id}},native={id:'native',source:'designid_app',assessment_type:'designid',scores:{}},nativeDerived={id:'nativeDerived',source:'designpd_app',assessment_type:'designpd',scores:{designIdSnapshotId:'native'}};
 assert.deepEqual(m.filterGuestBridgeSnapshots([projected,derived,native,nativeDerived],[]),[native,nativeDerived]);
 assert.deepEqual(m.filterGuestBridgeSnapshots([projected,derived,native,nativeDerived],[projected]),[derived,native,nativeDerived]);
});
test('public PD completion requires original ready artifact and completed owned DesignID; no course completion fabricated',()=>{
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];const load=require('../scripts/fruitlife-test-load.cjs');
 const evidence=load('lib/passport/evidence.ts'),access=load('lib/designpd/access.ts'),catalog=load('lib/trails/catalog.ts');
 const source={id,assessment_type:'designid',source:'public_guest',scores:{reportPayload:{Primary:'Architect'},scores:{Architect_Pts:40,Artisan_Pts:30,Shepherd_Pts:20,Steward_Pts:10,Total_Pts:100}}};
 const report={id:'pd',assessment_type:'designpd',source:'public_guest',owned_designid_source_id:id,owned_report_ready:true,scores:{reportPayload:{Plan_Tendency:'Test'}}};
 assert.equal(evidence.savedAssessmentComplete(report,[source,report]),true);assert.equal(evidence.savedAssessmentComplete(report,[report]),false);
 for(const ready of [false,undefined]){
  const pending={...report,owned_report_ready:ready};assert.equal(evidence.savedAssessmentComplete(pending,[source,pending]),false);assert.equal(access.hasDesignPdCourseAccess('learner@example.invalid',[source,pending]),false);assert.equal(catalog.isTrailAssessmentComplete('designpd',[pending]),false);
 }
 assert.equal(access.hasDesignPdCourseAccess('learner@example.invalid',[source,report]),true);assert.equal(catalog.isTrailAssessmentComplete('designpd',[report]),true);
});
test('shared school report merges newer paid report as current, retains native history and excludes raw stale projections',async()=>{
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];const load=require('../scripts/fruitlife-test-load.cjs');
 const dates=['2026-01-01T12:00:00Z','2026-11-12T12:00:00Z'];
 const native={id:'native',assessment_type:'designid',source:'designid_app',created_at:dates[0],source_submitted_at:dates[0],scores:{reportPayload:{Primary:'Architect'}}};
 const guest={id,assessment_type:'designid',source:'public_guest',created_at:dates[1],source_submitted_at:dates[1],scores:{reportPayload:{Primary:'Shepherd'}},owned_report_href:`/assessments/account/report/${id}`};
 let carried=0;
 const db={from(table){const q={select(){return q},eq(){return q},or(){return q},order(){return q},maybeSingle:async()=>({data:{id:'participant',user_id:'owner'}}),then(resolve,reject){return Promise.resolve({data:table==='assessment_snapshots'?[native,{...guest,owned_report_href:undefined}]:[]}).then(resolve,reject)}};return q;}};
 const helper=load('lib/public-assessments/guest-account.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}});
 const context=load('lib/assessments/student-context.ts',{
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
  '@/lib/public-assessments/gifts-account':{filterPublicGiftsSnapshots:async s=>s,getLinkedPublicGiftsSnapshots:async()=>[]},
  '@/lib/public-assessments/guest-account':{...helper,filterGuestBridgeServiceSnapshots:async s=>s,carryOverVerifiedGuestResults:async uid=>{assert.equal(uid,'owner');carried++;},getLinkedGuestSnapshots:async()=>[guest]},
 });
 const report=await context.getAssessmentSnapshotsForUser('owner','verified@example.invalid');
 assert.equal(carried,1);assert.deepEqual(report.all.map(s=>s.id),[id,'native']);assert.equal(report.latest[0].id,id);assert.equal(report.latest[0].owned_report_href,guest.owned_report_href);assert.equal(context.buildDesignIdContext(report).primary,'Shepherd');assert.equal(report.all[1].scores,native.scores);
});

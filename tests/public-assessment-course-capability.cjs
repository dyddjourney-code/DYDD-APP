const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ts=require('typescript');
const root=process.cwd();
function load(file,deps){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:n=>{if(n==='server-only')return {};if(!(n in deps))throw Error('Unmocked '+n+' for '+file);return deps[n]},URL,URLSearchParams,process,console});return exports;}
let ledger=true,lifetime=false,grandfather=false,dbError=false,queries=0;
const query={select(){return this},eq(){return this},async maybeSingle(){queries++;return {data:grandfather?{user_id:'existing'}:null,error:dbError?{message:'offline'}:null}}};
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY='grandfathered-v1';
const included=load('lib/public-assessments/included-access.ts',{'@/lib/commerce/personal-access':{hasIncludedPersonalAccess:async()=>true,hasLifetimePersonalAccess:async()=>lifetime},'@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>query})},'@/lib/environment':{isSandbox:()=>false}});
const cap=load('lib/public-assessments/course-capability.ts',{'./included-access':included});
const capability=cap.hasAssessmentCourseCapability;
const json={NextResponse:{json:(body,options={})=>({body,status:options.status??200})}};
(async()=>{
for(const slug of ['designid-foundations','designpd-alignment']){
 assert.equal(await capability('buyer',slug),false,'new report-only buyer denied');
 grandfather=true;assert.equal(await capability('legacy',slug),true,'grandfather preserved');grandfather=false;
 lifetime=true;assert.equal(await capability('lifetime',slug),true,'existing lifetime preserved');lifetime=false;
 assert.equal(await capability('',slug),false,'missing account denied');
 dbError=true;await assert.rejects(capability('buyer',slug),/verified/);dbError=false;
}
const before=queries;assert.equal(await capability('buyer','spiritual-gifts-service'),true);assert.equal(await capability('buyer','fruitlife-360-formation'),true);assert.equal(queries,before,'Gifts/FruitLife do not consult new policy');
delete process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY;assert.equal(await capability('existing','designid-foundations'),true,'pre-cutover legacy policy preserved');process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY='grandfathered-v1';
const user={id:'buyer',email:'buyer@example.com'};
const guard=load('lib/trails/course-access.ts',{
 '@/lib/courses/course-catalog':{getLearningLesson:()=>true},'./course-origin':{courseCardHref:s=>'/courses/'+s,courseOrigin:()=> 'trailheads'},'./course-preview':{isOwnerCoursePreview:()=>false},'next/navigation':{redirect:p=>{throw Error('REDIRECT '+p)}},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'./course-eligibility':{},'@/lib/public-assessments/course-capability':cap,'@/lib/designpd/access':{hasDesignPdCourseAccess:()=>true},'./catalog':{trailDefinitions:[{id:'designid',courseSlug:'designid-foundations',assessmentType:'designid'},{id:'designpd',courseSlug:'designpd-alignment',assessmentType:'designpd'}],isTrailAssessmentComplete:()=>true},'@/lib/review/heather':{withReviewQuery:p=>p}});
for(const slug of ['designid-foundations','designpd-alignment']){
 await assert.rejects(guard.requireTrailCourseAssessment({slug,snapshots:[],email:user.email,signedIn:true,preview:false}),/REDIRECT/);
 grandfather=true;await guard.requireTrailCourseAssessment({slug,snapshots:[],email:user.email,signedIn:true,preview:false});grandfather=false;
}
const deps={
 'next/server':json,'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>{throw Error('Unauthorized DB touched')}},
 '@/lib/assessments/student-context':{getAssessmentSnapshotsForUser:()=>{throw Error('Unauthorized snapshots touched')}},
 '@/lib/designpd/access':{},'@/lib/admin-access':{},'@/lib/trails/catalog':{trailDefinitions:[]},
 '@/lib/passport/curriculum':{passportCurriculum:[{slug:'designid-foundations',lessons:[]},{slug:'designpd-alignment',lessons:[]}]},
 '@/lib/passport/state':{readPassportState:()=>{throw Error('Unauthorized state touched')},syncPassportAwards:()=>{throw Error('Unauthorized awards touched')}},
 '@/lib/trails/course-eligibility':{},'@/lib/reflections/preview':{previewParams:()=>null},'@/lib/environment':{isSandbox:()=>false},'@/lib/passport/preview':{},'@/lib/public-assessments/course-capability':cap
};
const progress=load('app/api/course-progress/route.ts',deps);
for(const slug of ['designid-foundations','designpd-alignment']){
 assert.equal((await progress.GET(new Request('https://school.example/api/course-progress?courseSlug='+slug))).status,403);
 assert.equal((await progress.POST(new Request('https://school.example/api/course-progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({courseSlug:slug,action:'complete-lesson',lessonSlug:'welcome'})}))).status,403);
}
const reflections=load('app/api/course-reflections/route.ts',{...deps,'node:crypto':require('node:crypto'),'@/lib/reflections/journey-assessments':{},'@/lib/journey/pathfinder':{},'@/lib/reflections/catalog':{getReflectionExperience:()=>({})}});
for(const slug of ['designid-foundations','designpd-alignment']){
 assert.equal((await reflections.GET(new Request('https://school.example/api/course-reflections?courseSlug='+slug))).status,403);
 for(const action of ['save','position','new-round','sync-round'])assert.equal((await reflections.POST(new Request('https://school.example/api/course-reflections',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({courseSlug:slug,action,roundId:'known-round'})}))).status,403);
}
let exported=[];const rounds=[{id:'a',course_slug:'designid-foundations'},{id:'b',course_slug:'designpd-alignment'},{id:'c',course_slug:'spiritual-gifts-service'}];
const exportQuery={select(){return this},eq(){return this},order(){return this},in(){return this},async range(){return {data:rounds,error:null}}};
const exp=load('app/api/course-reflections/export/route.ts',{'@/lib/public-assessments/course-capability':cap,'@/lib/reflections/preview':{previewParams:()=>null},'next/server':{NextResponse:class {constructor(text,opts){this.text=text;this.status=200}static json(body,opts){return {body,status:opts.status}}}},'@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})},from:name=>({...exportQuery,range:async()=>({data:name==='reflection_rounds'?rounds:[],error:null})})})},'@/lib/reflections/catalog':{getReflectionExperience:()=>({title:'workbook'})},'@/lib/reflections/export':{reflectionExportText:rs=>{exported=rs;return 'export'}},'@/lib/lifecycle/application-mail':{},'node:crypto':require('node:crypto')});
assert.equal((await exp.GET(new Request('https://school.example/api/course-reflections/export?scope=course&courseSlug=designid-foundations'))).status,403);
await exp.GET(new Request('https://school.example/api/course-reflections/export?scope=all'));
assert.deepEqual(Array.from(exported,r=>r.course_slug),['spiritual-gifts-service'],'all-workbooks export excludes gated courses, preserves Gifts');
console.log('PASS: capability matrix, live page gates, progress GET/POST, all reflection writes, export single/all; no unauthorized DB access.');
})().catch(e=>{console.error(e);process.exit(1)});

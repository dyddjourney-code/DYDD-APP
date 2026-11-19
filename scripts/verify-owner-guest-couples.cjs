const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript'),assert=require('node:assert/strict');
const root=process.cwd(),original=Module._load;let state;
const guestId='32545a44-ad1a-47ce-8bef-595ba1827a1a',nativeId='00000000-0000-4000-8000-000000000001';
const score={scores:{Architect_Pts:23,Artisan_Pts:26,Shepherd_Pts:9,Steward_Pts:42}};
const person=(id,name,email)=>({id,display_name:name,normalized_email:email});
function db(){return {from(table){const filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},in(k,v){filters[k]=v;return q},order(){return q},range(){return q},maybeSingle(){return Promise.resolve({data:state.group})},then(resolve,reject){let rows=[];if(table==='assessment_group_members')rows=state.native;
if(table==='assessment_group_guest_members')rows=state.guests;
if(table==='assessment_snapshots')rows=state.snapshots;
if(table==='dydd_guest_results')rows=state.results;
return Promise.resolve({data:rows,count:rows.length,error:null}).then(resolve,reject)}};return q}}}
Module._load=function(id,parent,isMain){if(id==='server-only')return {};
if(id==='@/lib/supabase/admin')return {createSupabaseAdminClient:db};
if(id==='@/lib/supabase/server')return {createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:state.user}})}})};
if(id.startsWith('@/')){let p=path.join(root,id.slice(2));if(fs.existsSync(p+'.ts'))p+='.ts';return original(p,parent,isMain)}return original(id,parent,isMain)};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {NextRequest}=require('next/server'),{GET}=require(root+'/app/api/command-center/couple-report/route.ts');
function reset(){process.env.DYDD_PRIVATE_OWNER_MODE='true';process.env.VERCEL_PROJECT_ID='prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq';process.env.VERCEL_ENV='production';state={group:{id:'g',name:'Verification couple',group_type:'couple',owner_user_id:'u'},user:null,native:[{participant_id:nativeId,assessment_participants:person(nativeId,'Native Partner','native@example.test')}],guests:[{id:'gm',group_id:'g',session_id:guestId,membership_status:'active',contact:{id:guestId,participant_name:'Giovanni',participant_email:'gio617215@gmail.com'}}],snapshots:[{id:'n-result',participant_id:nativeId,assessment_type:'designid',created_at:'2026-11-19',source_submitted_at:'2026-11-19',scores:score}],results:[{id:'112dc32b-aa9b-4e79-97b3-be16c514aeae',session_id:guestId,product:'designid',created_at:'2026-11-19',scores:score,purchase:{status:'paid'}}]}}
async function request(){return GET(new NextRequest('https://owner.example/api/command-center/couple-report?group=g&format=html'))}
(async()=>{
reset();let r=await request();assert.equal(r.status,200);let html=await r.text();assert(html.includes('Giovanni'));assert(html.includes('Native Partner'));assert(html.includes('23'));assert(html.includes('42'));assert(html.includes('DesignID Capacity Overlay'));
reset();state.native=[];const other='00000000-0000-4000-8000-000000000002';state.guests.push({...state.guests[0],id:'gm2',session_id:other,contact:{participant_name:'Other Guest',participant_email:'guest2@example.test'}});state.results.push({...state.results[0],id:'guest-result2',session_id:other});r=await request();assert.equal(r.status,200);assert((await r.text()).includes('Other Guest'));
reset();state.guests=[];state.native.push({participant_id:'native2',assessment_participants:person('native2','Native Two','two@example.test')});state.snapshots.push({...state.snapshots[0],id:'n2',participant_id:'native2'});r=await request();assert.equal(r.status,200);
reset();state.results[0].scores={};r=await request();assert.equal(r.status,400);
reset();state.results[0].purchase.status='refunded';r=await request();assert.equal(r.status,400);
reset();state.guests=[];r=await request();assert.equal(r.status,400);
reset();state.guests.push({...state.guests[0],id:'duplicate'});r=await request();assert.equal(r.status,400);
reset();state.native[0].assessment_participants.normalized_email='g.io617215+alias@gmail.com';r=await request();assert.equal(r.status,400);
reset();delete process.env.DYDD_PRIVATE_OWNER_MODE;state.user={id:'u',email:'circle@example.test'};r=await request();assert.equal(r.status,403);
reset();delete process.env.DYDD_PRIVATE_OWNER_MODE;state.user=null;r=await request();assert.equal(r.status,401);
reset();delete process.env.DYDD_PRIVATE_OWNER_MODE;state.user={id:'u',email:'dyddjourney@gmail.com'};r=await request();assert.equal(r.status,403);
console.log('PASS 11 actual route cases: mixed, guest/guest, native/native HTML; missing scores; reversed purchase; missing partner; duplicate; canonical-email alias; non-admin; unauthenticated; non-private admin');
})().catch(e=>{console.error(e);process.exit(1)});

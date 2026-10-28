// Execute the actual application action against memory only. No network/provider/DB writes.
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
let channel='app',saved=[];
const records={assessment_snapshots:{id:'snapshot',scores:{}},spiritual_gifts_sessions:{id:'session',metadata:{}}};
const db={from(table){let op='read',values;const q={select(){return q},eq(){return q},ilike(){return q},upsert(v){op='upsert';values=v;return q},insert(v){op='insert';values=v;return q},update(v){op='update';values=v;return q},single:async()=>run(),maybeSingle:async()=>run(),then:(a,b)=>Promise.resolve(run()).then(a,b)};function run(){if(table==='school_profiles')return {data:{full_name:'Synthetic owner',email:'owner@example.invalid'}};if(table==='assessment_participants')return {data:{id:'participant'}};if(op!=='read'){saved.push({table,op});records[table]={...(records[table]||{}),...values};}return {data:{...(records[table]||{}),id:records[table]?.id||table}};}return q;}};
const actions=load('app/spiritual-gifts/actions.ts',{
 'next/navigation':{redirect:href=>{throw Object.assign(Error('redirect'),{href})}},
 'next/headers':{headers:async()=>new Headers()},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:channel==='app'?{id:'owner',email:'owner@example.invalid',user_metadata:{full_name:'Synthetic owner'}}:null}})}})},
 '@/lib/review/heather':{isHeatherReviewRequest:()=>false,isNewReviewRequest:()=>false},
 '@/lib/spiritual-gifts/app-identity':{verifySpiritualGiftsAppIdentity:()=>null},
 '@/lib/pdfmonkey/client':{createPdfMonkeyDocument:async()=>({id:'fake'}),getPdfMonkeyDocument:async()=>({id:'fake',status:'failure'})},
 '@/lib/lifecycle/application-mail':{sendApplicationEmail:async()=>{throw Error('Must never email from dry run')}},
});
global.fetch=async()=>{throw Error('Network forbidden')};
const {spiritualGiftQuestionBank:bank,spiritualGiftRatingField:field}=load('lib/spiritual-gifts/intake.ts');
(async()=>{
 for(channel of ['app','public']){
  saved=[];const f=new FormData();f.set('signup_source',channel==='app'?'app-spiritual-gifts-assessment':'public-spiritual-gifts-assessment');f.set('reviewer_name','Public fixture');f.set('reviewer_email','public@example.invalid');for(const q of bank)f.set(field(q.code),'3');
  let target;try{await actions.saveSpiritualGiftsPublicResponse(f);assert.fail('redirect expected')}catch(e){assert(e.href,e.stack);target=e.href;}
  assert(saved.some(x=>x.table==='spiritual_gifts_responses'&&x.op==='insert'));assert(saved.some(x=>x.table==='assessment_snapshots'&&x.op==='insert'));assert.equal(records.spiritual_gifts_sessions.session_status,'completed');
  if(channel==='app'){assert.equal(target,'/field-kit#collection-spiritual-gifts');assert.equal(records.spiritual_gifts_sessions.created_by_user_id,'owner');assert.equal(records.spiritual_gifts_responses.participant_email,'owner@example.invalid');}
  else {const u=new URL(target,'https://school.invalid');assert.equal(u.pathname,'/spiritual-gifts/thanks');assert.equal(u.searchParams.get('channel'),'public');}
 }
 console.log('PASS actual app assessment action saves before exact Field Kit anchor; authenticated identity preserved; public completion untouched; zero external calls');
})().catch(e=>{console.error(e);process.exitCode=1});

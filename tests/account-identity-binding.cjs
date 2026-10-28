const assert=require('node:assert/strict');
let participant=null,claimed=true,writes=0,requiredNull=false;
const client={from(table){assert.equal(table,'assessment_participants');let update=false;const q={select(){return q},eq(){return q},is(k,v){assert.equal(k,'user_id');assert.equal(v,null);requiredNull=true;return q},update(){update=true;writes++;return q},maybeSingle:async()=>({data:update?(claimed?{id:'legacy'}:null):null,error:null}),in(){return q},returns:async()=>({data:participant?[participant]:[],error:null})};return q}};
const load=require('../scripts/fruitlife-test-load.cjs');
const {findOrAttachParticipant}=load('lib/assessments/student-context.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>client}});
(async()=>{
 participant={id:'foreign',user_id:'other-user'};assert.equal(await findOrAttachParticipant('current','current@example.invalid'),null);assert.equal(writes,0);
 participant={id:'legacy',user_id:null};assert.equal(await findOrAttachParticipant('current','current@example.invalid'),'legacy');assert(requiredNull);
 claimed=false;assert.equal(await findOrAttachParticipant('current','current@example.invalid'),null);
 console.log('PASS foreign participant cannot be adopted; unowned attachment is conditional/atomic and a lost claim fails closed.');
})().catch(e=>{console.error(e);process.exitCode=1});

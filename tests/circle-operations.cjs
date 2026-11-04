const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
let actorUser={id:'10000000-0000-4000-8000-000000000001',email:'member@example.invalid',email_confirmed_at:'2026-11-01'},rpcCalls=[];
const mocks={
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async(name,args)=>{rpcCalls.push({name,args});return {data:{saved:true,canInvite:true},error:null};}})},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:actorUser}})}})},
 '@/lib/admin-access':{isDyddAdminEmail:email=>email==='owner@example.invalid'},
 '@/lib/commerce/circle-billing':{},
};
const o=load('lib/circles/operations.ts',mocks);
const id='20000000-0000-4000-8000-000000000001';
(async()=>{
let p=o.parseCircleRoster('\ufeffname,email\r\n"Smith, Jane", JANE@EXAMPLE.INVALID\r\nJane duplicate,jane@example.invalid\r\n"A ""quoted"" person",b@example.invalid\r\n');
assert.deepEqual(p.rows,[{name:'Smith, Jane',email:'jane@example.invalid'},{name:'A "quoted" person',email:'b@example.invalid'}]);assert.deepEqual(p.duplicates,[3]);assert.equal(p.canInvite,true);
p=o.parseCircleRoster('email,name\na@example.invalid,"Two\nLines"\ninvalid,Missing\n');assert.equal(p.rows[0].name,'Two\nLines');assert.equal(p.errors.length,1);assert.equal(p.canInvite,false);
for(const bad of ['name,email\n"unterminated,x','name,email\n"yes"junk,a@b.co','email,email\na@b.co,b@c.co','name,email\n'])assert.throws(()=>o.parseCircleRoster(bad));
assert.throws(()=>o.parseCircleRoster('name,email\n'+Array.from({length:1001},(_,i)=>`P${i},p${i}@example.invalid`).join('\n')));
const projected=o.participantCircleProjection({id,status:'active',plan:{name:'Safe',format:'Class',participants:[{email:'private@example.invalid'}],leaderNotes:'secret',billing:'secret',location:'Shared place',assignments:{lesson:1}}});
assert.equal(projected.plan.location,'Shared place');assert(!JSON.stringify(projected).includes('private@'));assert(!('leaderNotes' in projected.plan));
const r=(uid,text,audience='leader',extra={})=>({user_id:uid,session:'1',lesson:'lesson',prompt:'prompt',marked:true,share_text:true,body:text,audience,...extra});
const rows=[r('me','my request'),r('a','leader only'),r('b','circle shared','circle'),r('a','same person duplicate'),r('outsider','must not leak')];
let result=o.projectCallouts(rows,'me',false,false,new Set(['me','a','b']));assert.equal(result.counts[0].count,3);assert.equal(result.counts[0].total,3);assert.deepEqual(result.submissions.map(s=>s.text),['my request','circle shared']);
result=o.projectCallouts(rows,'leader',true,true,new Set(['me','a','b']));assert.deepEqual(result.submissions,[]);assert.deepEqual(result.own,[]);assert(!JSON.stringify(result).includes('leader only'));assert.equal(result.counts[0].count,3);
result=o.projectCallouts([r('a','private',{},{share_text:false})],'leader',true,false,new Set(['a']));assert.deepEqual(result.submissions,[]);
let actor=await o.operationActor();assert.equal(actor.owner,false);actorUser.email='owner@example.invalid';assert.equal((await o.operationActor()).owner,true);actorUser.email_confirmed_at=null;assert.equal(await o.operationActor(),null);
actor={userId:'10000000-0000-4000-8000-000000000001',email:'member@example.invalid',owner:false};
await assert.rejects(()=>o.operateCircle(actor,{action:'approve_cohort',requestId:id,seatCap:100,owner:true}),/Owner approval/);
await assert.rejects(()=>o.operateCircle(actor,{action:'accept_invite',token:'bad'}),/valid invitation/);
await assert.rejects(()=>o.operateCircle(actor,{action:'callout',circleId:id,session:'1',lesson:'a',prompt:'b',text:'silently publish'}),/explicit/);
await o.operateCircle(actor,{action:'consent',circleId:id,people:false,insights:false,actor:'spoof',owner_actor:true});
assert.equal(rpcCalls[0].args.actor,actor.userId);assert.equal(rpcCalls[0].args.owner_actor,false);
await o.operateCircle(actor,{action:'preview_roster',circleId:id,csv:'name,email\nA,a@example.invalid\nA duplicate,A@example.invalid'});assert.equal(rpcCalls[1].args.payload.rows.length,1);assert(!('csv' in rpcCalls[1].args.payload));
console.log('PASS CSV quoting/errors/dedup/limits; safe participant allowlist; explicit callouts; cohort unique counts/no text; verified owner; anti-spoof RPC contract');
})().catch(e=>{console.error(e);process.exit(1)});

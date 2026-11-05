// Real exported action authorization before validation/save. No database/network/provider writes.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),load=require('../scripts/fruitlife-test-load.cjs');
const token='synthetic-ownership-token',sessionId=crypto.randomUUID(),owner=crypto.randomUUID();
let user={id:crypto.randomUUID(),email:'foreign@example.invalid'},inserts=0,refreshes=0,completed=false;
const session={id:sessionId,intake_token_hash:crypto.createHash('sha256').update(token).digest('hex'),participant_id:'participant',created_by_user_id:owner,self_completed_at:null,observer_round_started_at:null,participant_email:'owner@example.invalid',metadata:{}};
class Q{constructor(table){this.table=table}select(){return this}eq(){return this}single(){return this.maybeSingle()}maybeSingle(){return Promise.resolve({data:this.table==='fruitlife_360_sessions'?{...session,self_completed_at:completed?'2026-11-05':null}:{user_id:owner},error:null})}insert(){inserts++;throw Error('No writes allowed')}}
const db={from:t=>new Q(t)};
const mocks={
 '@/lib/commerce/account-access':{requireFruitLifeSelfMembership:async()=>{},requirePersonalMembershipContent:async()=>{}},
 '@/lib/commerce/personal-access':{hasLifetimePersonalAccess:async()=>false},
 '@/lib/commerce/fruitlife-entitlements':{consumeFruitLifeEntitlement:async()=>{},getActiveFruitLifeEntitlement:async()=>null},
 '@/lib/lifecycle/application-mail':{sendApplicationEmail:async()=>{throw Error('No mail')}},
 '@/lib/fruitlife360/payload':{buildFruitLifePayloadForSession:async()=>{throw Error('No payload')}},
 '@/lib/fruitlife360/report-worker':{processFruitLifeReportJobs:async()=>{throw Error('No provider')}},
 '@/lib/fruitlife360/timing':{requireFruitLifeSelfEligibility:async()=>{},refreshFruitLifeRound:async()=>{refreshes++;return false}},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},
 'next/headers':{headers:async()=>new Headers()},'next/server':{after:()=>{}},'next/navigation':{redirect:path=>{throw Error('REDIRECT '+path)}},
};
const actions=load('app/fruitlife360/actions.ts',mocks);
const form=()=>{const f=new FormData();f.set('session_id',sessionId);f.set('token',token);return f};
(async()=>{
 await assert.rejects(actions.saveFruitLifeSelfResponse(form()),/Sign%20in%20to%20the%20account%20that%20owns/);assert.equal(inserts,0);
 user={id:owner,email:'owner@example.invalid'};await assert.rejects(actions.saveFruitLifeSelfResponse(form()),/Rank%20each%20of%20the%20nine/);assert.equal(inserts,0);
 completed=true;await assert.rejects(actions.saveFruitLifeSelfResponse(form()),/REDIRECT \/field-kit/);assert.equal(refreshes,1);assert.equal(inserts,0);
 user=null;await assert.rejects(actions.saveFruitLifeSelfResponse(form()),/Sign%20in%20to%20the%20account%20that%20owns/);assert.equal(inserts,0);
 console.log('PASS actual self action: foreign/anonymous bearer denied before write; owner reaches unchanged instrument validation; successful retry refreshes same round without new attempt.');
})().catch(e=>{console.error(e);process.exitCode=1});

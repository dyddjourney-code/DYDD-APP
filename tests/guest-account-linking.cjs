const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
let user={id:'verified-user',email:'verified@example.test',email_confirmed_at:'2026-11-12'},authError=null,validCookie=true,rpcCalls=0,rpcError=null,hasLink=true,revoked=false;
const guestResult={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',session_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',product:'designid',scores:{saved:'unchanged'},created_at:'2026-11-12T00:00:00Z'};
class GuestAccessDeniedError extends Error{}
const db={rpc:async(name,payload)=>{rpcCalls++;assert.equal(name,'dydd_guest_link_verified_account');assert.equal(payload.p_user,'verified-user');assert.equal(payload.p_hash,'hash-from-cookie');return{data:payload.p_session,error:rpcError}},from(table){const q={select(){return q},eq(){return q},order:async()=>({data:hasLink?[{session_id:guestResult.session_id}]:[],error:null}),maybeSingle:async()=>({data:table==='dydd_guest_results'?{session_id:guestResult.session_id}:hasLink?{session_id:guestResult.session_id}:null,error:null})};return q}};
const moduleUnderTest=load('lib/public-assessments/guest-account.ts',{
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user},error:authError})}})},
 './guest-capability':{guestSessionId:v=>v,guestCapabilityHash:v=>{assert.equal(v,'actual-http-only-cookie');return'hash-from-cookie'}},
 './guest':{GuestAccessDeniedError,requireGuest:async()=>{if(!validCookie)throw Error('Bad cookie');return{token:'actual-http-only-cookie'}},guestRecords:async()=>({results:[guestResult]}),ownedGuestResult:async()=>{if(revoked)throw new GuestAccessDeniedError();return guestResult}},
});
(async()=>{
 const validUser=user;
 for(const invalid of [null,{...validUser,email_confirmed_at:null},{...validUser,is_anonymous:true}]){
  user=invalid;await assert.rejects(()=>moduleUnderTest.linkCurrentGuestToAccount(guestResult.session_id));assert.equal(rpcCalls,0);
 }
 user=validUser;authError=Error('Auth rejected');await assert.rejects(()=>moduleUnderTest.linkCurrentGuestToAccount(guestResult.session_id));assert.equal(rpcCalls,0);authError=null;
 validCookie=false;await assert.rejects(()=>moduleUnderTest.linkCurrentGuestToAccount(guestResult.session_id));assert.equal(rpcCalls,0);validCookie=true;
 assert.equal(await moduleUnderTest.linkCurrentGuestToAccount(guestResult.session_id),guestResult.session_id);assert.equal(rpcCalls,1);
 rpcError=Error('conflict');await assert.rejects(()=>moduleUnderTest.linkCurrentGuestToAccount(guestResult.session_id));rpcError=null;
 hasLink=false;await assert.rejects(()=>moduleUnderTest.getAccountGuestResult('unrelated',guestResult.id));assert.deepEqual(await moduleUnderTest.getLinkedGuestSnapshots('unrelated'),[]);
 hasLink=true;const snapshots=await moduleUnderTest.getLinkedGuestSnapshots(validUser.id);assert.equal(snapshots[0].id,guestResult.id);assert.equal(snapshots[0].scores,guestResult.scores);assert.equal(snapshots[0].owned_report_href,`/assessments/account/report/${guestResult.id}`);
 revoked=true;assert.deepEqual(await moduleUnderTest.getLinkedGuestSnapshots(validUser.id),[]);await assert.rejects(()=>moduleUnderTest.getAccountGuestResult(validUser.id,guestResult.id));
 console.log('PASS authenticated verified account + cookie required, RPC conflict fails closed, unrelated account denied, exact saved scores and guest archive route retained, refunded access denied');
})().catch(e=>{console.error(e);process.exitCode=1});

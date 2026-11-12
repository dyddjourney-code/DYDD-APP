const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('../scripts/fruitlife-test-load.cjs');
const sid = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', token = 'a'.repeat(32);
let user={id:'verified-user',email:'verified@example.test',email_confirmed_at:'2026-11-12'}, authError=null, rpcError=null, calls=0;
let sessions=[], links=[], snapshots=[], tableError=null, artifact=null, participant=null;
const db={
 rpc:async(name,p)=>{calls++;assert.equal(name,'dydd_gifts_link_verified_account');assert.equal(p.p_user,'verified-user');assert.equal(p.p_hash,crypto.createHash('sha256').update(token).digest('hex'));return {data:p.p_session,error:rpcError};},
 from(table){let filters=[];const q={select(){return q;},eq(k,v){filters.push([k,v]);return q;},in(k,v){filters.push([k,v]);return q;},
 then(resolve,reject){let rows=table==='spiritual_gifts_sessions'?sessions:table==='dydd_gifts_account_links'?links:snapshots;rows=rows.filter(r=>filters.every(([k,v])=>Array.isArray(v)?v.includes(r[k]):r[k]===v));return Promise.resolve({data:rows,error:tableError}).then(resolve,reject);},
 async maybeSingle(){if(table==='assessment_snapshots')return {data:artifact,error:null};if(table==='assessment_participants')return{data:participant,error:null};const r=await q;return{data:r.data[0]||null,error:r.error};}};return q;}
};
const mocks={
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user},error:authError})}})},
};
const gifts=load('lib/public-assessments/gifts-account.ts',mocks);
const {getOwnedArtifactSnapshot}=load('lib/assessments/artifact-access.ts',mocks);
(async()=>{
 const good=user;
 for(const bad of [null,{...good,email_confirmed_at:null},{...good,is_anonymous:true},{...good,email:null}]){
  user=bad;await assert.rejects(()=>gifts.linkCurrentPublicGiftsToAccount(sid,token));assert.equal(calls,0);
 }
 user=good;authError=Error('invalid Auth');await assert.rejects(()=>gifts.linkCurrentPublicGiftsToAccount(sid,token));authError=null;
 for(const t of ['', 'wrong', token+'x'])await assert.rejects(()=>gifts.linkCurrentPublicGiftsToAccount(sid,t));
 assert.equal(calls,0);assert.equal(await gifts.linkCurrentPublicGiftsToAccount(sid,token),sid);
 rpcError=Error('already linked');await assert.rejects(()=>gifts.linkCurrentPublicGiftsToAccount(sid,token));rpcError=null;
 const publicGift={id:'public',assessment_type:'spiritual_gifts',user_id:null,participant_id:'typed',scores:{channel:'public_assessment'}};
 const historical={...publicGift,id:'historical',scores:{channel:'native_app'}};
 const native={...historical,id:'native'};
 const other={...publicGift,id:'other',assessment_type:'design_id'};
 sessions=[{id:sid,result_snapshot_id:'historical',metadata:{channel:'public_assessment'}}];
 assert.deepEqual((await gifts.filterPublicGiftsSnapshots([publicGift,historical,native,other],good.id)).map(s=>s.id),['native','other']);
 links=[{snapshot_id:'historical',user_id:good.id},{snapshot_id:'public',user_id:good.id}];
 assert.deepEqual(await gifts.filterPublicGiftsSnapshots([publicGift,historical],good.id),[publicGift,historical]);
 assert.deepEqual(await gifts.filterPublicGiftsSnapshots([{...publicGift,user_id:'different'}],good.id),[]);
 assert.deepEqual(await gifts.filterPublicGiftsSnapshots([{...publicGift,user_id:good.id}],good.id),[{...publicGift,user_id:good.id}]);
 links=[];artifact=historical;participant={user_id:null,normalized_email:good.email};
 assert.equal(await getOwnedArtifactSnapshot('historical',good.id,good.email),null,'typed email alone never authorizes public Gifts artifact');
 participant.user_id=good.id;
 assert.equal(await getOwnedArtifactSnapshot('historical',good.id,good.email),null,'claimed participant alone never authorizes historical public Gifts');
 links=[{snapshot_id:'historical',user_id:good.id}];
 assert.equal((await getOwnedArtifactSnapshot('historical',good.id,good.email)).id,'historical');
 links=[];artifact=native;assert.equal((await getOwnedArtifactSnapshot('native',good.id,good.email)).id,'native','native participant ownership remains');
 artifact=other;participant={user_id:null,normalized_email:good.email};assert.equal((await getOwnedArtifactSnapshot('other',good.id,good.email)).id,'other','other legacy email access remains');
 snapshots=[historical];links=[{snapshot_id:'historical',user_id:good.id}];assert.deepEqual(await gifts.getLinkedPublicGiftsSnapshots(good.id),[historical]);
 tableError=Error('lookup failed');await assert.rejects(()=>gifts.filterPublicGiftsSnapshots([historical],good.id));
 console.log('PASS verified Auth + exact token only; RPC conflict fails closed; public/historical Gifts reject typed-email and participant ownership; immutable-link and explicit ownership accepted; native/other assessment access preserved; linked snapshots retain scores');
})().catch(e=>{console.error(e);process.exitCode=1});

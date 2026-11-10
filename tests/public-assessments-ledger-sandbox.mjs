// Actual isolated DB integration. Synthetic accounts only; no customer queries/providers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { credentials as c, sandboxSql } from '../scripts/assessment-timing-sandbox-db.mjs';
const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false,autoRefreshToken:false}});
const anon=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});
const batch=`synthetic-public-ledger-${crypto.randomUUID()}`;
const users=[], participants=[], sources=[], codes=[], orders=[]; const events=[];
const check=r=>{if(r.error)throw Error(r.error.message);return r.data;};
const hash=(p,code)=>crypto.createHash('sha256').update(`dydd-public-assessment:sandbox:v1:${p}:${code.trim().toUpperCase()}`).digest('hex');
const mint=async(product)=>{const code=`SANDBOX-${product==='designid'?'DID':'DPD'}-${crypto.randomBytes(20).toString('hex').toUpperCase()}`;const code_hash=hash(product,code);const row=check(await db.from('dydd_public_assessment_codes').insert({code_hash,product,batch_label:batch}).select().single());codes.push(row.id);return {code,code_hash,id:row.id};};
const redeem=(code,user,product,source=null)=>db.rpc('dydd_redeem_public_assessment_code',{p_code_hash:code.code_hash,p_user_id:user,p_product:product,p_source_snapshot_id:source});
const has=(user,product,source=null)=>db.rpc('dydd_has_public_assessment_entitlement',{p_user_id:user,p_product:product,p_source_snapshot_id:source});
const valid={scores:{Architect_Pts:25,Artisan_Pts:25,Shepherd_Pts:25,Steward_Pts:25,Total_Pts:100}};
const operationalBefore=await sandboxSql("select product,count(*)::int as total,count(*) filter(where redeemed_at is null)::int as unused from public.dydd_public_assessment_codes where batch_label='SANDBOX operational public assessments 2026-11-10' group by product order by product",true);
let cleanup=false;
try {
 for (let i=0;i<3;i++) {const user=check(await db.auth.admin.createUser({email:`public-ledger-${crypto.randomUUID()}@example.invalid`,password:crypto.randomBytes(24).toString('hex'),email_confirm:i<2})).user;users.push(user);}
 const [owner,foreign,unverified]=users.map(u=>u.id);
 for(const user of users.slice(0,2)){participants.push(check(await db.from('assessment_participants').insert({user_id:user.id,normalized_email:user.email,display_name:'Synthetic public ledger QA'}).select('id').single()).id);}
 for(const [user,participant,scores] of [[owner,participants[0],valid],[owner,participants[0],valid],[foreign,participants[1],valid],[owner,participants[0],{}]])sources.push(check(await db.from('assessment_snapshots').insert({user_id:user,participant_id:participant,assessment_type:'designid',scores,source:batch}).select('id').single()).id);
 const did=await mint('designid');
 const race=await Promise.all(Array.from({length:12},()=>redeem(did,owner,'designid')));race.forEach(check);
 assert.equal(new Set(race.map(r=>r.data.id)).size,1);const entitlement=race[0].data;
 assert.equal(check(await has(owner,'designid')).id,entitlement.id);
 assert.equal(check(await db.from('dydd_public_assessment_orders').select('id').eq('user_id',owner)).length,1);
 assert((await redeem(did,foreign,'designid')).error);assert((await redeem(did,owner,'designpd',sources[0])).error);
 events.push('12 concurrent same-user redemptions create exactly one order/entitlement; idempotent retry; foreign replay/wrong product denied');
 const competing=await mint('designid');
 const contested=await Promise.all(Array.from({length:12},(_,i)=>redeem(competing,i%2?owner:foreign,'designid')));
 const wins=contested.filter(r=>!r.error);assert(wins.length>0);assert(contested.some(r=>r.error));assert.equal(new Set(wins.map(r=>r.data.user_id)).size,1);assert.equal(new Set(wins.map(r=>r.data.id)).size,1);
 events.push('12 competing-identity redemptions permit exactly one identity, one order, one entitlement');
 const dpd=await mint('designpd');
 for(const source of [null,crypto.randomUUID(),sources[2],sources[3]])assert((await redeem(dpd,owner,'designpd',source)).error);
 assert((await redeem(dpd,unverified,'designpd',sources[0])).error);
 assert.equal(check(await db.from('dydd_public_assessment_codes').select('redeemed_at').eq('id',dpd.id).single()).redeemed_at,null);
 const pd=check(await redeem(dpd,owner,'designpd',sources[0]));assert.equal(pd.source_snapshot_id,sources[0]);
 assert.equal(check(await redeem(dpd,owner,'designpd',sources[0])).id,pd.id);
 assert((await redeem(dpd,owner,'designpd',sources[1])).error);
 assert.equal(check(await has(owner,'designpd',sources[0])).id,pd.id);
 assert.equal(check(await has(owner,'designpd',sources[1])),null);assert.equal(check(await has(foreign,'designpd',sources[0])),null);
 events.push('PD missing/foreign/invalid/unverified prerequisite denied without consuming code; exact-source binding and retry verified');
 // Existing trusted imported ownership: null explicit owners, canonical current verified email.
 const imported=check(await db.from('assessment_participants').insert({normalized_email:`PUBLIC-LEDGER-ALIAS-${crypto.randomUUID()}@example.invalid`,display_name:'Synthetic imported ownership'}).select('id').single());participants.push(imported.id);
 check(await db.from('assessment_participants').update({normalized_email:users[0].email.toUpperCase()}).eq('id',imported.id));
 const importedSource=check(await db.from('assessment_snapshots').insert({participant_id:imported.id,assessment_type:'designid',scores:valid,source:batch}).select('id').single()).id;sources.push(importedSource);
 assert.equal(check(await db.rpc('dydd_public_assessment_source_owned',{p_user_id:owner,p_source_snapshot_id:importedSource})),true);
 check(await db.from('assessment_snapshots').update({user_id:foreign}).eq('id',importedSource));
 assert.equal(check(await db.rpc('dydd_public_assessment_source_owned',{p_user_id:owner,p_source_snapshot_id:importedSource})),false);
 events.push('Current verified Auth email links unowned imported source; explicit foreign snapshot ownership wins over matching email');
 for(const state of ['pending','failed','cancelled','refunded','paid']){
 const order=check(await db.from('dydd_public_assessment_orders').insert({user_id:owner,product:'designpd',source_snapshot_id:sources[1],status:state}).select().single());orders.push(order.id);
 assert((await db.rpc('dydd_fulfill_public_assessment_payment',{p_order_id:order.id,p_provider_reference:`synthetic-${state}`})).error);
 assert.equal(check(await has(owner,'designpd',sources[1])),null);
 assert((await db.from('dydd_public_assessment_orders').update({fulfillment_status:'fulfilled',fulfilled_at:new Date().toISOString()}).eq('id',order.id)).error);
 }
 events.push('Pending/failed/cancelled/refunded/paid-without-verified-fulfillment create no access; payment fulfillment RPC and forged fulfilled state fail closed');
 const expire=await mint('designid');check(await db.from('dydd_public_assessment_codes').update({expires_at:'2000-01-01T00:00:00Z'}).eq('id',expire.id));assert((await redeem(expire,owner,'designid')).error);
 const revoked=await mint('designid');check(await db.from('dydd_public_assessment_codes').update({revoked_at:new Date().toISOString()}).eq('id',revoked.id));assert((await redeem(revoked,owner,'designid')).error);
 check(await db.from('dydd_public_assessment_entitlements').update({consumed_at:new Date().toISOString(),completion_snapshot_id:sources[0]}).eq('id',entitlement.id));
 // Other code may have granted another DesignID. The consumed entitlement itself must disappear.
 const available=check(await has(owner,'designid'));assert.notEqual(available?.id,entitlement.id);
 assert.equal(check(await redeem(did,owner,'designid')).id,entitlement.id);
 check(await db.from('dydd_public_assessment_entitlements').update({revoked_at:new Date().toISOString()}).eq('id',pd.id));assert.equal(check(await has(owner,'designpd',sources[0])),null);assert((await redeem(dpd,owner,'designpd',sources[0])).error);
 events.push('Expired/revoked codes denied; consumed attempt unavailable for new entry but redemption retry retains identity; revoked access fails closed');
 const security=await sandboxSql(`select c.relname,c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT') as anon_read,has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_read from pg_class c where c.oid in ('public.dydd_public_assessment_codes'::regclass,'public.dydd_public_assessment_orders'::regclass,'public.dydd_public_assessment_entitlements'::regclass)`,true);
 assert.equal(security.length,3);security.forEach(r=>{assert.equal(r.relrowsecurity,true);assert.equal(r.anon_read,false);assert.equal(r.authenticated_read,false);});
 const privileges=await sandboxSql(`select proname,has_function_privilege('anon',p.oid,'EXECUTE') as anon_exec,has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_exec from pg_proc p where proname in ('dydd_redeem_public_assessment_code','dydd_has_public_assessment_entitlement','dydd_fulfill_public_assessment_payment','dydd_public_assessment_source_owned')`,true);
 assert.equal(privileges.length,4);privileges.forEach(r=>{assert.equal(r.anon_exec,false);assert.equal(r.authenticated_exec,false);});
 assert((await anon.from('dydd_public_assessment_codes').select('*')).error);assert((await anon.rpc('dydd_redeem_public_assessment_code',{p_code_hash:did.code_hash,p_user_id:owner,p_product:'designid'})).error);
 const signed=createClient(c.project_url,c.anon_key,{auth:{persistSession:false}});const auth=check(await db.auth.admin.generateLink({type:'magiclink',email:users[0].email}));check(await signed.auth.verifyOtp({type:'magiclink',token_hash:auth.properties.hashed_token}));
 assert((await signed.from('dydd_public_assessment_codes').select('*')).error);assert((await signed.rpc('dydd_redeem_public_assessment_code',{p_code_hash:did.code_hash,p_user_id:owner,p_product:'designid'})).error);
 events.push('All 3 tables RLS enabled; anon/authenticated read denied; all 4 RPCs execute denied; actual authenticated/anonymous Data API attacks denied');
} finally {
 // Order first cannot be deleted until the code FK is removed. No final operational batch touched.
 if(codes.length)check(await db.from('dydd_public_assessment_codes').delete().in('id',codes));
 for(const u of users)check(await db.from('dydd_public_assessment_orders').delete().eq('user_id',u.id));
 if(sources.length)check(await db.from('assessment_snapshots').delete().in('id',sources));
 if(participants.length)check(await db.from('assessment_participants').delete().in('id',participants));
 for(const u of users)check(await db.auth.admin.deleteUser(u.id));
 cleanup=true;
 const remains=check(await db.from('dydd_public_assessment_codes').select('id').eq('batch_label',batch));assert.equal(remains.length,0);
 const operationalAfter=await sandboxSql("select product,count(*)::int as total,count(*) filter(where redeemed_at is null)::int as unused from public.dydd_public_assessment_codes where batch_label='SANDBOX operational public assessments 2026-11-10' group by product order by product",true);
 assert.deepEqual(operationalAfter,operationalBefore);
 console.log(JSON.stringify({sandboxRef:c.ref,events,syntheticFixturesCleaned:cleanup,noCustomerLookup:true,noProviderCalls:true,operationalBatchPreserved:operationalAfter},null,2));
}

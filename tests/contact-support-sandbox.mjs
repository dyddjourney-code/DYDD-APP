import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,ref=process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.equal(process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT,'sandbox');assert.equal(ref,'atemrshtshxoqnuevvqu');assert.equal(new URL(url).hostname,`${ref}.supabase.co`);assert(key);
const db=createClient(url,key,{auth:{persistSession:false}}),anon=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const marker=randomUUID(),email=`support-qa-${marker}@example.test`;
const hash=v=>createHmac('sha256',key).update(v).digest('hex');
const emailKey=hash(`email:${email}`),networkKey=hash(`network:qa:${marker}`);
const body={p_name:'Sandbox Contact QA',p_email:email,p_subject:`Contact QA ${marker}`,p_message:'Sandbox-only durable support intake verification.',p_email_key:emailKey,p_network_key:networkKey};
try {
 const result=await Promise.all(Array.from({length:8},()=>db.rpc('submit_support_request',body)));
 result.forEach(r=>assert.equal(r.error,null,r.error?.message));
 const ids=result.map(r=>r.data).filter(Boolean);assert.equal(ids.length,3,'Only three concurrent requests per email/hour');
 const rows=await db.from('support_requests').select('*').eq('email',email);assert.equal(rows.error,null);assert.equal(rows.data.length,3);
 const exposed=await anon.from('support_requests').select('*').eq('email',email);assert(exposed.error||exposed.data.length===0,'Private messages not publicly readable');
 const rpc=await anon.rpc('submit_support_request',body);assert(rpc.error,'Anon cannot bypass application validation/rate hashing');
 const id=ids[0];
 const updates=await Promise.all(['in_progress','resolved'].map(status=>db.from('support_requests').update({status,revision:1}).eq('id',id).eq('revision',0).select('id')));
 updates.forEach(r=>assert.equal(r.error,null));assert.equal(updates.reduce((n,r)=>n+r.data.length,0),1,'Exactly one stale-revision update succeeds');
 console.log('PASS sandbox durable intake, concurrent atomic rate limit, RLS privacy, private RPC, optimistic status updates');
} finally {
 const removed=await db.from('support_requests').delete().eq('email',email);assert.equal(removed.error,null);
 const limits=await db.from('support_rate_limits').delete().in('key',[`email:${emailKey}`,`network:${networkKey}`]);assert.equal(limits.error,null);
}

import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {createClient} from '@supabase/supabase-js';import {createServerClient} from '@supabase/ssr';
const base=process.env.CONTACT_BASE??'http://localhost:3138';assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));assert.equal(c.ref,'atemrshtshxoqnuevvqu');const db=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}});let userId,requestId;
const email='support-admin-foundation@example.test',customer=`support-http-${crypto.randomUUID()}@example.test`;
try {
 const response=await fetch(base+'/api/contact',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({name:'Sandbox HTTP QA',email:customer,subject:'Sandbox HTTP fixture',message:'Please help with my sandbox course account.'})});assert.equal(response.status,201,await response.clone().text());requestId=(await response.json()).reference;assert(requestId);
 let row=await db.from('support_requests').select().eq('id',requestId).single();assert.equal(row.data.email,customer);assert.equal(row.data.status,'new');
 assert.equal((await fetch(base+'/api/admin/support')).status,403);
 const password=crypto.randomBytes(24).toString('hex');const created=await db.auth.admin.createUser({email,password,email_confirm:true});assert(!created.error,created.error?.message);userId=created.data.user.id;
 let cookies=[];const client=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:c=>{cookies=c}}});const signed=await client.auth.signInWithPassword({email,password});assert(!signed.error,signed.error?.message);const cookie=cookies.map(c=>c.name+'='+c.value).join('; ');
 const queue=await fetch(base+'/api/admin/support',{headers:{cookie}});assert.equal(queue.status,200,await queue.clone().text());assert((await queue.json()).requests.some(r=>r.id===requestId));
 const patch=(revision,status)=>fetch(base+'/api/admin/support',{method:'PATCH',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({id:requestId,status,revision})});
 let updated=await patch(0,'in_progress');assert.equal(updated.status,200,await updated.clone().text());assert.equal((await updated.json()).request.revision,1);assert.equal((await patch(0,'resolved')).status,409);assert.equal((await patch(1,'resolved')).status,200);
 const finished=await db.from('support_requests').select().eq('id',requestId).single();assert.equal(finished.data.status,'resolved');assert.equal(finished.data.updated_by,userId);
 console.log('PASS actual local HTTP contact persistence, signed-in admin queue, status changes, stale revision 409 and anonymous rejection; no emails');
} finally {
 if(requestId)await db.from('support_requests').delete().eq('id',requestId);
 const h=v=>crypto.createHmac('sha256',c.service_role_key).update(v).digest('hex');await db.from('support_rate_limits').delete().in('key',['email:'+h('email:'+customer),'network:'+h('network:self-hosted')]);
 if(userId)await db.auth.admin.deleteUser(userId);console.log('Sandbox-only support HTTP fixtures removed');
}

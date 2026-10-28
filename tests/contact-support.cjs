const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
let rpcResult = { data: 'b21887a0-5fb4-4fd6-ad71-e840764e91fc', error: null }, calls = 0, admin = null, updateResult = { data: { revision: 1 }, error: null };
const chain = { update() { return this; }, eq() { return this; }, select() { return this; }, order() { return this; }, async range() { return { data: [], error: null }; }, async maybeSingle() { return updateResult; } };
const mocks = {
  '@/lib/supabase/admin': { createSupabaseAdminClient: () => ({
    rpc: async (_name, input) => { calls++; assert.match(input.p_email_key, /^[a-f0-9]{64}$/); assert.equal(input.p_email, 'support-test@example.test'); return rpcResult; },
    from: () => chain,
  }) },
  '@/lib/support/auth': { supportAdmin: async () => admin },
};
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-hmac-key';
const intake = load('app/api/contact/route.ts', mocks), queue = load('app/api/admin/support/route.ts', mocks);
const body = { name: 'Contact QA', email: 'SUPPORT-TEST@example.test', subject: 'Account access', message: 'Cannot open my course page.' };
const request = (data=body, origin='http://localhost', method='POST') => new Request('http://localhost/api/contact', { method, headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
(async()=> {
  let response = await intake.POST(request()); assert.equal(response.status,201); assert.match(response.headers.get('cache-control'),/no-store/); assert.equal(calls,1);
  assert.equal((await intake.POST(request(body,'https://outside.test'))).status,403);
  const missing = request(); missing.headers.delete('origin'); assert.equal((await intake.POST(missing)).status,403);
  for (const changes of [{name:''},{email:'invalid'},{subject:'x'},{message:'short'},{message:'a'.repeat(5001)},{name:'a\nb'}]) assert.equal((await intake.POST(request({...body,...changes}))).status,400);
  assert.equal(calls,1);
  assert.equal((await intake.POST(request({...body,website:'bot'}))).status,201); assert.equal(calls,1);
  const huge = request({...body,message:'a'.repeat(22000)}); assert.equal((await intake.POST(huge)).status,400);
  rpcResult={data:null,error:null}; assert.equal((await intake.POST(request())).status,429);
  rpcResult={data:null,error:{message:'private database detail'}}; response=await intake.POST(request()); assert.equal(response.status,503); assert(!(await response.text()).includes('private database'));
  assert.equal((await queue.GET(new Request('http://localhost/api/admin/support?review=owner&key=preview'))).status,403);
  assert.equal((await queue.PATCH(request({id:body.name,status:'resolved',revision:0},'http://localhost','PATCH'))).status,403);
  admin={id:'test-admin'};
  assert.equal((await queue.GET(new Request('http://localhost/api/admin/support?status=invalid'))).status,400);
  assert.equal((await queue.GET(new Request('http://localhost/api/admin/support?status=new'))).status,200);
  const update={id:'b21887a0-5fb4-4fd6-ad71-e840764e91fc',status:'resolved',revision:0};
  assert.equal((await queue.PATCH(request(update,'https://outside.test','PATCH'))).status,403);
  assert.equal((await queue.PATCH(request({...update,status:'arbitrary'},'http://localhost','PATCH'))).status,400);
  assert.equal((await queue.PATCH(request(update,'http://localhost','PATCH'))).status,200);
  updateResult={data:null,error:null}; assert.equal((await queue.PATCH(request(update,'http://localhost','PATCH'))).status,409);
  console.log('PASS contact validation, origin checks, bounded body, honeypot, durable limiter contract, storage failure privacy, admin guard, status allowlist and optimistic conflicts');
})().catch(e=>{console.error(e);process.exitCode=1;});

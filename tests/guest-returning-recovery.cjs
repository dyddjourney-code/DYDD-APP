const assert=require('node:assert/strict');
const {NextRequest}=require('next/server');
const load=require('../scripts/fruitlife-test-load.cjs');
const crypto=require('node:crypto');
let queued=[],calls=[],reservation=null,available=true,headerValue='198.51.100.9',rpcError=false;
const sid='11111111-1111-4111-8111-111111111111';
process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-service-role-never-real';
process.env.DYDD_GUEST_EMAIL_ENABLED='true';process.env.DYDD_APP_URL='https://school.test';
const mocks={
 './config':{publicAssessmentLedgerEnabled:()=>available},
 '@/lib/public-assessments/config':{publicAssessmentLedgerEnabled:()=>available},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='dydd_guest_redeem_recovery')return {data:reservation,error:rpcError?{}:null};
  if(rpcError)return {error:{message:'private db failure'}};
  const row=reservation&&{...reservation,id:reservation.id||args.p_id};
  return {data:row,error:null};
 }})},
 '@/lib/lifecycle/store':{enqueue:async input=>queued.push(input)},
 '@/lib/lifecycle/application-mail':{sendApplicationEmail:async()=>({sent:false,skipped:false,message:'Mocked durable delivery'})},
 'next/headers':{headers:async()=>new Headers(headerValue?{'x-vercel-forwarded-for':headerValue}:{})},
};
const recovery=load('lib/public-assessments/guest-recovery.ts',mocks);
const action=load('app/assessments/guest-recovery-actions.ts',mocks);
const route=load('app/assessments/recover/email/route.ts',mocks);
function form(email='learner@example.invalid',product='designpd'){const f=new FormData();f.set('email',email);f.set('product',product);return f;}
async function request(email,product){return action.requestReturningGuestRecovery({message:''},form(email,product));}
(async()=>{
 const missing=await request();assert.equal(queued.length,0);
 reservation={id:'22222222-2222-4222-8222-222222222222',session_id:sid,product:'designpd',created_at:new Date().toISOString(),expires_at:new Date(Date.now()+1800000).toISOString(),used_at:null};
 const found=await request(' LEARNER@example.invalid ');
 assert.deepEqual(found,missing,'Unknown and known addresses receive precisely the same state');
 assert.equal(queued.length,1);const first=queued[0];
 assert.equal(first.category,'service');assert.equal(first.email,'learner@example.invalid');
 assert.match(first.context.senderInput.text,/replaces older private links/);
 assert(!JSON.stringify(found).includes(sid));assert(!JSON.stringify(found).includes(reservation.id));assert(!JSON.stringify(found).includes('learner@'));
 await request();assert.deepEqual(queued[1],first,'Retries reconstruct the same immutable token, intent and queued payload');
 const reserve=calls.find(c=>c.name==='dydd_guest_reserve_recovery').args;
 assert.equal(reserve.p_email,'learner@example.invalid');assert.match(reserve.p_email_hash,/^[a-f0-9]{64}$/);
 assert(!reserve.p_requester_hash.includes('198.51.100.9'));
 assert.notEqual(reserve.p_email_hash,crypto.createHash('sha256').update(reserve.p_email).digest('hex'),'Address hashes are keyed against dictionary recovery');
 let count=calls.length;await request('not an email');await request('a@example.invalid','foreign');assert.equal(calls.length,count);
 available=false;assert.deepEqual(await request(),missing);available=true;
 rpcError=true;assert.deepEqual(await request(),missing);rpcError=false;
 reservation=null;assert.deepEqual(await request(),missing);
 const privateUrl=new URL(first.context.senderInput.text.match(/https:\/\/\S+/)[0]);
 count=calls.length;
 const landing=await route.GET(new NextRequest(privateUrl));assert.equal(landing.status,200);assert.equal(calls.length,count,'GET/scanners never query, consume or rotate');
 assert.equal(landing.headers.get('cache-control'),'private, no-store');assert.equal(landing.headers.get('referrer-policy'),'no-referrer');
 assert.match(landing.headers.get('content-security-policy'),/frame-ancestors 'none'/);
 assert.match(await landing.text(),/method="post"/);
 assert.equal((await route.GET(new NextRequest('https://school.test/assessments/recover/email?request=<script>&key=bad'))).status,403);
 const post=origin=>new NextRequest('https://school.test/assessments/recover/email',{method:'POST',headers:{origin},body:new URLSearchParams({request:privateUrl.searchParams.get('request'),key:privateUrl.searchParams.get('key')})});
 assert.equal((await route.POST(post('https://attacker.test'))).status,403);assert.equal(calls.length,count,'Cross-origin requests cannot redeem');
 reservation={session_id:sid,product:'designpd'};
 const redeemed=await route.POST(post('https://school.test'));assert.equal(redeemed.status,303);
 assert.equal(redeemed.headers.get('location'),'https://school.test/assessments/session/'+sid+'?product=designpd');
 const cookie=redeemed.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);assert.match(cookie,/SameSite=lax/);assert.match(cookie,/dydd_guest_current=/);
 const args=calls.at(-1).args;assert.match(args.p_token_hash,/^[a-f0-9]{64}$/);assert.notEqual(args.p_capability_hash,args.p_token_hash);
 reservation=null;assert.equal((await route.POST(post('https://school.test'))).status,403,'Used/expired tokens do not restore access');
 console.log('PASS returning guest recovery: uniform responses, exact durable retries, keyed privacy hashes, disabled/malformed/unknown cases, no provider sends, GET scanner safety, origin fencing, private cookies and expired-token denial.');
})().catch(e=>{console.error(e);process.exitCode=1;});

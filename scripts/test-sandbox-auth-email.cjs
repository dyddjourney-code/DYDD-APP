const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('./fruitlife-test-load.cjs');
const secret = 'whsec_' + crypto.randomBytes(32).toString('base64');
Object.assign(process.env, {NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:'https://atemrshtshxoqnuevvqu.supabase.co',DYDD_SANDBOX_EMAIL_ENABLED:'true',DYDD_SANDBOX_EMAIL_ALLOWLIST:'dyddjourney@gmail.com',DYDD_SANDBOX_AUTH_EMAIL_ENABLED:'true',DYDD_SANDBOX_AUTH_HOOK_SECRET:secret});
const sent=[];
const {handleSandboxAuthEmail:handle}=load('lib/email/sandbox-auth.ts',{'@/lib/email/resend':{sendResendEmail:async input=>{sent.push(input);return {sent:true,id:'mock'};}}});
const payload={user:{email:'dyddjourney@gmail.com'},email_data:{email_action_type:'recovery',token_hash:'a'.repeat(56),site_url:'https://atemrshtshxoqnuevvqu.supabase.co',redirect_to:'https://dydd-online-school-sandbox.vercel.app/auth/callback?next=%2Freset-password%3Fnext%3D%2Fhq'}};
function request(data=payload,{timestamp=Math.floor(Date.now()/1000),bad=false,unsigned=false}={}){const raw=JSON.stringify(data),id=crypto.randomUUID();const signature=crypto.createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${id}.${timestamp}.${raw}`).digest('base64');return new Request('https://dydd-online-school-sandbox.vercel.app/api/sandbox/auth-email',{method:'POST',body:raw,headers:unsigned?{}:{'webhook-id':id,'webhook-timestamp':String(timestamp),'webhook-signature':'v1,'+(bad?'a':signature)}});}
(async()=>{
 assert.equal((await handle(request(payload,{unsigned:true}))).status,401);
 assert.equal((await handle(request(payload,{bad:true}))).status,401);
 assert.equal((await handle(request(payload,{timestamp:Math.floor(Date.now()/1000)-301}))).status,401);
 for(const email of ['someone@example.test','dyddjourney+test@gmail.com','dyddjourney@gmail.com.evil.test'])assert.equal((await handle(request({...payload,user:{email}}))).status,403);
 assert.equal((await handle(request({...payload,user:{...payload.user,new_email:'someone@example.test'}}))).status,403);
 assert.equal((await handle(request({...payload,email_data:{...payload.email_data,email_action_type:'email_change'}}))).status,403);
 const redirectDenied=await handle(request({...payload,email_data:{...payload.email_data,redirect_to:'https://evil.test/'}}));assert.equal((await redirectDenied.json()).error.http_code,400);
 assert.equal(sent.length,0);
 assert.equal((await handle(request())).status,200);assert(sent[0].text.includes('token_type=recovery'));assert(sent[0].text.includes('next=%2Freset-password'));
 assert.equal((await handle(request())).status,200);assert.equal(sent[0].idempotencyKey,sent[1].idempotencyKey);
 assert.equal((await handle(request({...payload,email_data:{...payload.email_data,email_action_type:'signup'}}))).status,200);assert(sent[2].text.includes('token_type=signup'));
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';assert.equal((await handle(request())).status,503);assert.equal(sent.length,3);
 console.log(JSON.stringify({status:'PASS',checks:['unsigned/tampered/stale denied','outsider/plus/suffix denied','email-change all-or-nothing denied','external redirect denied','recovery/signup token types correct','retry stable business key','production disabled'],realSends:0}));
})().catch(e=>{console.error(e);process.exitCode=1});

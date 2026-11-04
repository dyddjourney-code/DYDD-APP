const assert=require('node:assert/strict'),crypto=require('node:crypto'),load=require('../scripts/fruitlife-test-load.cjs');
const secret='whsec_'+crypto.randomBytes(32).toString('base64');let known=false,stored=0;
Object.assign(process.env,{DYDD_RESEND_WEBHOOK_SECRET:secret,NEXT_PUBLIC_DYDD_ENVIRONMENT:'sandbox',NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF:'atemrshtshxoqnuevvqu',NEXT_PUBLIC_SUPABASE_URL:'https://atemrshtshxoqnuevvqu.supabase.co',DYDD_SANDBOX_EMAIL_ENABLED:'true',DYDD_SANDBOX_EMAIL_ALLOWLIST:'dyddjourney@gmail.com'});
const db={from:()=>({select(){return this},eq(){return this},async maybeSingle(){return {data:known?{id:'sandbox-intent'}:null}}}),rpc:async()=>{stored++;return {data:true}}};
const {POST}=load('app/api/webhooks/dydd-email/route.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}});
function request(data={}){const raw=JSON.stringify({type:'email.delivered',created_at:new Date().toISOString(),data:{email_id:'fictional-email-id',...data}}),id=crypto.randomUUID(),timestamp=String(Math.floor(Date.now()/1000)),sig=crypto.createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${id}.${timestamp}.${raw}`).digest('base64');return new Request('https://dydd-online-school-sandbox.vercel.app/api/webhooks/dydd-email',{method:'POST',body:raw,headers:{'svix-id':id,'svix-timestamp':timestamp,'svix-signature':'v1,'+sig}});}
(async()=>{
 assert.equal((await POST(new Request('https://example.test',{method:'POST',body:'{}'}))).status,401);
 assert((await (await POST(request({from:'DPG <reports@developingpeoplegroup.com>',to:['dyddjourney@gmail.com']}))).json()).ignored);assert.equal(stored,0);
 assert((await (await POST(request({tags:{dydd_environment:'sandbox'},to:['outsider@example.test']}))).json()).ignored);assert.equal(stored,0);
 assert((await (await POST(request({tags:{dydd_environment:'production'},to:['dyddjourney@gmail.com']}))).json()).ignored);assert.equal(stored,0);
 assert((await (await POST(request({tags:{dydd_environment:'sandbox'},to:['dyddjourney@gmail.com']}))).json()).received);assert.equal(stored,1);
 known=true;assert((await (await POST(request())).json()).received);assert.equal(stored,2);
 console.log('PASS signed shared-account DPG/production/outsider events ignored without writes; tagged exact-owner race and known historical sandbox IDs project');
})().catch(e=>{console.error(e);process.exitCode=1});

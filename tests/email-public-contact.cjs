const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const contact='https://www.discoverdivine.design/discover-your-divine-design-contact';
test('generated Resend text and HTML use public contact regardless of app env; private links stay intact',async()=>{
 const saved={...process.env},originalFetch=global.fetch;const payloads=[];let intent;
 const db={from(table){return {select(){return this},eq(){return this},is(){return this},async maybeSingle(){return {data:null}},async upsert(row){intent=row;return {}},async single(){return {data:{...intent,id:'mock-message',created_at:new Date().toISOString()}}},async order(){return {data:[]}}}},async rpc(){return {data:true}}};
 const {sendResendEmail}=load('lib/email/resend.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}});
 global.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');payloads.push(JSON.parse(options.body));return {ok:true,json:async()=>({id:'mock-provider'})}};
 try{
  process.env.DYDD_RESEND_API_KEY='mock-no-real-email';delete process.env.RESEND_API_KEY;process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='owner';
  for(const base of ['https://dydd-online-school.vercel.app','https://dydd-private-owner-console.vercel.app',undefined])for(const fullDocument of [false,true]){
   if(base)process.env.DYDD_APP_URL=base;else delete process.env.DYDD_APP_URL;
   const start='https://dydd-online-school.vercel.app/assessments/guest/synthetic-capability',recovery='https://dydd-online-school.vercel.app/assessments/recover/synthetic-private';
   const content=`<a href="${start}">Start your assessment</a><a href="${recovery}">Private recovery</a>`;
   const input={to:'mock@example.test',subject:'Synthetic invitation',html:fullDocument?`<html><body>${content}</body></html>`:content,text:`Start: ${start}\nRecovery: ${recovery}`,idempotencyKey:'mock-'+payloads.length};
   assert.equal((await sendResendEmail(input)).sent,true);const p=payloads.at(-1);
   assert.equal(p.text,input.text+'\n\nThis automated mailbox is unmonitored. For help, use the DYDD Contact form: '+contact);
   assert.ok(p.html.includes(`<a href="${contact}">DYDD Contact form</a>`));assert.equal(p.html.split(contact).length,2);
   for(const link of [start,recovery]){assert.ok(p.html.includes(link));assert.ok(p.text.includes(link));}
   if(fullDocument)assert.ok(p.html.indexOf(contact)<p.html.indexOf('</body>'));
   assert.doesNotMatch(p.html,/href="https:\/\/dydd-[^"]+\/contact"/);
  }
  console.log('Verified six actual generated provider payloads; fetch and database fully mocked; zero real sends.');
 }finally{global.fetch=originalFetch;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);}
});

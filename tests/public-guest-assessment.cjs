// Real guest modules + canonical engines. All DB, Stripe, PDF/archive and mail transports are synthetic.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
function harness(){
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];
 const load=require('../scripts/fruitlife-test-load.cjs');
 const tables={dydd_guest_sessions:[],dydd_guest_orders:[],dydd_guest_results:[],dydd_guest_email_resends:[],dydd_lifecycle_jobs:[]},jar=new Map(),events=[];
 let serial=0,creates=0,emails=0,checkouts=0,failCreate=false,failAfterCreated=false,dbOffline=false,knownFailure=false,mailAmbiguous=false;
 let pdfBytes=Buffer.from('%PDF-1.7\nsynthetic private archived original\n%%EOF');
 const acceptedMail=new Map(),mailPayloads=new Map();
 const id=()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`;
 function query(table){if(dbOffline)throw Error('synthetic storage timeout');let operation='select',value,filters=[],single=false;
  const q={select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},gt(k,v){filters.push(r=>r[k]>v);return q},order(){return q},filter(k,op,v){filters.push(r=>op==='is'?r[k]==null:r[k]===v);return q},insert(v){operation='insert';value=v;return q},update(v){operation='update';value=v;return q},single(){single=true;return q},maybeSingle(){single=true;return q},then(resolve,reject){try{let rows=tables[table].filter(r=>filters.every(f=>f(r)));if(operation==='insert'){const row={id:id(),created_at:new Date().toISOString(),...value};tables[table].push(row);rows=[row]}if(operation==='update')for(const row of rows)Object.assign(row,value);resolve({data:single?(rows[0]?structuredClone(rows[0]):null):structuredClone(rows),error:null});}catch(e){reject(e)}}};return q;
 }
 const db={from:query,storage:{from(bucket){return {async download(path){events.push({download:{bucket,path}});if(dbOffline)return {error:{message:'storage offline'}};return {data:new Blob([pdfBytes]),error:null}}}}},async rpc(name,p){events.push(name);
  if(name==='dydd_guest_reserve_email_resend'){
   // Synthetic implementation of the migration contract; production SQL is reviewed separately.
   const r=tables.dydd_guest_results.find(r=>r.id===p.p_result_id&&r.session_id===p.p_session_id),o=tables.dydd_guest_orders.find(o=>o.id===r?.order_id);
   if(!r||!o||o.status!=='paid'||session.expires_at<=new Date().toISOString()||r.report_state!=='ready'||r.pdf.storage?.path!==`guest/${r.id}/report.pdf`)return {error:{message:'Report access is unavailable'}};
   const intents=tables.dydd_guest_email_resends.filter(i=>i.result_id===r.id).sort((a,b)=>b.created_at.localeCompare(a.created_at)),prior=intents[0];
   if(prior&&!prior.accepted_at){
    const job=tables.dydd_lifecycle_jobs.find(j=>j.event_key==='application:guest-report-resend-'+prior.id&&j.status==='accepted');
    if(job)Object.assign(prior,{accepted_at:job.accepted_at,provider_id:job.provider_id});
    if(!prior.accepted_at)return {data:prior.id};
   }
   if(prior&&Date.parse(prior.created_at)>Date.now()-120000)return {error:{message:'Please wait two minutes before requesting another copy'}};
   if(intents.filter(i=>Date.parse(i.created_at)>Date.now()-86400000).length>=3)return {error:{message:'Daily email limit reached. Your PDF remains downloadable'}};
   const intent={id:id(),session_id:p.p_session_id,result_id:r.id,created_at:new Date().toISOString(),accepted_at:null};tables.dydd_guest_email_resends.push(intent);return {data:intent.id};
  }
  if(name==='dydd_public_assessment_provider_allowed')return {data:p.p_provider==='stripe_live'};
  if(name==='dydd_guest_order_entitled'){const o=tables.dydd_guest_orders.find(o=>o.id===p.p_order_id);return {data:!!o&&o.status==='paid'&&o.payment_provider==='stripe_live'};}
  if(name==='dydd_guest_reserve_order'){
   if(tables.dydd_guest_orders.some(o=>o.session_id===p.p_session_id&&o.product===p.p_product&&o.source_result_id===p.p_source&&['pending','paid'].includes(o.status)))return {error:{message:'duplicate'}};
   const o={id:id(),session_id:p.p_session_id,product:p.p_product,source_result_id:p.p_source,status:'pending',payment_provider:p.p_provider,expected_product_id:p.p_product_id,expected_price_id:p.p_price,expected_amount:1999,currency:'usd'};tables.dydd_guest_orders.push(o);return {data:o.id};
  }
  if(name==='dydd_guest_save_result'){
   const existing=tables.dydd_guest_results.find(r=>r.order_id===p.p_order_id);if(existing)return {data:existing.id};
   const o=tables.dydd_guest_orders.find(o=>o.id===p.p_order_id&&o.session_id===p.p_session_id&&o.status==='paid');assert.ok(o,'save only paid');
   const r={id:id(),session_id:o.session_id,order_id:o.id,product:o.product,source_result_id:o.source_result_id,scores:structuredClone(p.p_scores),created_at:new Date().toISOString(),report_state:'not_started',report_lease:null,pdf:{},email:{}};tables.dydd_guest_results.push(r);return {data:r.id};
  }throw Error(name);
 }};
 const stripe={prices:{retrieve:async()=>({livemode:true,active:true,type:'one_time',currency:'usd',unit_amount:1999,product:'prod_fixture'})},checkout:{sessions:{create:async(body)=>{checkouts++;events.push({checkout:body});return {id:'cs_fixture',url:'https://checkout.stripe.invalid/synthetic',livemode:true}}}}};
 const mocks={
  'next/headers':{cookies:async()=>({get:k=>jar.has(k)?{value:jar.get(k)}:undefined,set:(k,v)=>jar.set(k,v)})},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
  './config':{publicAssessmentLedgerEnabled:()=>true,publicPaymentRuntime:()=>({})},
  './payments':{publicPaymentConfiguration:()=>({stripe,origin:'https://guest.invalid',app:'dydd_public_assessments_live_v1',provider:'stripe_live',livemode:true,price:'price_fixture',productId:'prod_fixture'}),validatePublicAssessmentSession:load('lib/public-assessments/payments.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db}}).validatePublicAssessmentSession},
  '@/lib/assessment-reporting':{
   cleanReportFilename:s=>s.replace(/[^\w .'-]+/g,' '),
   createReadyPdfMonkeyReport:async p=>{creates++;events.push('create_pdf');if(failCreate)throw Error('transport ambiguous');await p.onCreated({id:'doc_fixture',status:'pending'});if(failAfterCreated)throw Error('poll offline');return {document:{id:'doc_fixture',status:'success'},storage:{bucket:'assessment-report-pdfs',path:p.archiveKey+'/report.pdf',filename:p.filename,bytes:1000,archivedAt:'2026-11-11'}}},
   waitForPdfMonkeyDocument:async id=>{events.push('poll_original');assert.equal(id,'doc_fixture');if(knownFailure)return {id,status:'failure'};return {id,status:'success',download_url:'https://pdfmonkey.io/original.pdf'}},pdfMonkeyReportLink:d=>d.download_url,
  },
  '@/lib/assessments/report-storage':{archiveReportPdf:async(url,key,filename)=>({bucket:'assessment-report-pdfs',path:key+'/report.pdf',filename,bytes:1000,archivedAt:'2026-11-11'})},
  '@/lib/lifecycle/application-mail':{sendApplicationEmail:async p=>{
   const r=tables.dydd_guest_results.find(r=>r.id===p.deliveryContext.guestResultId);assert.equal(r.report_state,'ready');assert.ok(r.pdf.storage,'archive persisted before mail');events.push({mail:p});
   if(mailPayloads.has(p.idempotencyKey))assert.deepEqual(p,mailPayloads.get(p.idempotencyKey),'immutable payload for same delivery intent');else mailPayloads.set(p.idempotencyKey,structuredClone(p));
   if(acceptedMail.has(p.idempotencyKey))return acceptedMail.get(p.idempotencyKey);
   if(mailAmbiguous)return {sent:false,skipped:false,message:'Provider acceptance is not confirmed; original durable intent retained'};
   emails++;const outcome={sent:true,skipped:false,id:'email_fixture_'+emails};acceptedMail.set(p.idempotencyKey,outcome);return outcome;
  }}
 };
 const capability=load('lib/public-assessments/guest-capability.ts',mocks),guest=load('lib/public-assessments/guest.ts',mocks),results=load('lib/public-assessments/guest-results.ts',mocks),reports=load('lib/public-assessments/guest-reports.ts',mocks),payments=load('lib/public-assessments/guest-payments.ts',mocks);
 const token=capability.newGuestCapability(),session={id:id(),capability_hash:capability.guestCapabilityHash(token),participant_name:'Guest <A>',participant_email:'guest@example.invalid',expires_at:'2030-01-01T00:00:00Z'};tables.dydd_guest_sessions.push(session);jar.set(capability.guestCookie(session.id),token);
 const order=(product='designid',source=null)=>{const row={id:id(),session_id:session.id,product,source_result_id:source,status:'paid',payment_provider:'stripe_live',expected_product_id:'prod_fixture',expected_price_id:'price_fixture',expected_amount:1999,currency:'usd'};tables.dydd_guest_orders.push(row);return row};
 function form(){const f=new FormData(),{designIdQuestionBlocks}=load('lib/designid/intake.ts',mocks),{mapsConfirmationItems}=load('lib/designid/maps-confirmation.ts',mocks);for(const b of designIdQuestionBlocks)for(const [i,s]of b.statements.entries())f.set('designid_points_'+s.code,String([3,2,0,0][i]));for(const [i,item]of mapsConfirmationItems.entries())f.set('designid_maps_'+item.id,['most','often','sometimes','least'][Math.floor(i/3)]);return f;}
 Object.assign(process.env,{DYDD_GUEST_REPORT_GENERATION_ENABLED:'true',DYDD_GUEST_EMAIL_ENABLED:'true',DYDD_APP_URL:'https://guest.invalid'});
 return {load,mocks,tables,session,token,order,form,capability,guest,results,reports,payments,events,setPdfBytes:v=>{pdfBytes=Buffer.from(v)},setMailAmbiguous:v=>{mailAmbiguous=v},counts:()=>({creates,emails,checkouts}),failCreate:()=>{failCreate=true},failAfterCreated:()=>{failAfterCreated=true},setDbOffline:v=>{dbOffline=v},setKnownFailure:v=>{knownFailure=v}};
}
test('capabilities are256bit/hashed, cookies scoped; typed email, foreign/expired token cannot access',async()=>{
 const h=harness();assert.equal(h.token.length,43);assert.equal(h.session.capability_hash.length,64);assert.notEqual(h.token,h.session.capability_hash);
 assert.equal((await h.guest.requireGuest(h.session.id)).session.id,h.session.id);
 await assert.rejects(h.guest.verifyGuestCapability(h.session.id,h.capability.newGuestCapability()),/invalid or expired/);
 await assert.rejects(h.guest.verifyGuestCapability(h.session.id,'guest@example.invalid'),/Invalid recovery/);
 await assert.rejects(h.guest.verifyGuestCapability('not-a-uuid',h.token),/Invalid assessment/);
 h.session.expires_at='2020-01-01';await assert.rejects(h.guest.requireGuest(h.session.id),/invalid or expired/);
});
test('canonical guest ID validates80allocations+12sort, immutable retry, PD exact source/no extra questions',async()=>{
 const h=harness(),o=h.order();await assert.rejects(h.results.saveGuestResult(h.session,o.id,new FormData()));
 const rid=await h.results.saveGuestResult(h.session,o.id,h.form()),r=h.tables.dydd_guest_results[0];assert.equal(r.scores.scores.Total_Pts,100);assert.equal(Object.keys(r.scores.answers).length,80);
 const before=structuredClone(r.scores);assert.equal(await h.results.saveGuestResult(h.session,o.id,new FormData()),rid);assert.deepEqual(r.scores,before);
 const pd=h.order('designpd',rid),pid=await h.results.saveGuestResult(h.session,pd.id),saved=h.tables.dydd_guest_results.find(r=>r.id===pid);assert.equal(saved.scores.designIdSnapshotId,rid);assert.deepEqual(saved.scores.ratings,{});assert.equal(saved.scores.scoringVersion,'designpd-derived-workbook-v1');
 const bad=h.order('designpd',crypto.randomUUID());await assert.rejects(h.results.saveGuestResult(h.session,bad.id),/unavailable/);
 const foreign=crypto.randomUUID();await assert.rejects(h.guest.ownedGuestResult(foreign,rid),/not available/);
 o.status='refunded';await assert.rejects(h.guest.ownedGuestResult(h.session.id,rid),/not paid/);await assert.rejects(h.guest.ownedGuestResult(h.session.id,pid),/source purchase/);
});
test('concurrent guest checkouts reserve only one payable session and bind no Auth identity',async()=>{
 const h=harness();const settled=await Promise.allSettled([h.payments.createGuestCheckout(h.session,h.token,'designid'),h.payments.createGuestCheckout(h.session,h.token,'designid')]);
 assert.equal(settled.filter(x=>x.status==='fulfilled').length,1);assert.equal(h.counts().checkouts,1);assert.equal(h.tables.dydd_guest_orders.length,1);
 const body=h.events.find(e=>e.checkout).checkout;assert.deepEqual(body.payment_method_types,['card']);assert.equal(body.payment_method_options?.card?.wallets,undefined);assert.equal(body.metadata.ownership,'guest-v1');assert.equal(body.metadata.guest_session_id,h.session.id);assert.equal(body.metadata.user_id,undefined);assert.match(body.success_url,/assessments\/recover/);assert.doesNotMatch(body.success_url,/login|signup/);
});
test('guest payment exact tuple rejects forgery/source/user/account metadata',()=>{
 const h=harness(),o=h.order();Object.assign(o,{payment_reference:'cs_fixture'});
 const s={id:'cs_fixture',livemode:true,mode:'payment',payment_status:'paid',status:'complete',amount_total:1999,currency:'usd',client_reference_id:h.session.id,metadata:{app:'dydd_public_assessments_live_v1',ownership:'guest-v1',order_id:o.id,guest_session_id:h.session.id,product:'designid',source_id:''},line_items:{data:[{quantity:1,price:{id:'price_fixture',product:'prod_fixture'}}],has_more:false}};
 assert.equal(h.payments.validateGuestPayment(o,s),true);
 for(const mutate of [x=>x.metadata.user_id='fake-auth',x=>x.metadata.guest_session_id=crypto.randomUUID(),x=>x.metadata.source_id=crypto.randomUUID(),x=>x.amount_total=1500,x=>x.payment_status='unpaid',x=>x.livemode=false,x=>x.line_items.data[0].price.id='price_other',x=>x.metadata.ownership='account']){const bad=structuredClone(s);mutate(bad);assert.throws(()=>h.payments.validateGuestPayment(o,bad));}
});
test('report fencing concurrent requests exactly once, persist archive BEFORE email, logged-out guest copy',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());
 const both=await Promise.allSettled([h.reports.prepareGuestReport(h.session,rid),h.reports.prepareGuestReport(h.session,rid)]);assert.equal(both.filter(x=>x.status==='fulfilled').length,1);assert.equal(h.counts().creates,1);
 const report=await h.reports.prepareGuestReport(h.session,rid);assert.equal(h.counts().creates,1);assert.equal(report.report_state,'ready');
 await h.reports.emailGuestReport(h.session,h.token,rid);const mail=h.events.find(e=>e.mail).mail;assert.match(mail.text,/No account or sign-in is needed/);assert.doesNotMatch(mail.text,/Field Kit|same account/);assert.match(mail.html,/Guest &lt;A&gt;/);assert.match(mail.deliveryContext.reportUrl,/assessments\/recover/);assert.equal(mail.idempotencyKey,'guest-report-v2-'+rid);assert.equal(mail.attachments.length,1);assert.match(Buffer.from(mail.attachments[0].content,'base64').toString(),/^%PDF-/);
 h.tables.dydd_guest_results[0].pdf.storage.path='designid/foreign/report.pdf';await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid),/not ready/);assert.equal(h.counts().emails,1);
});
test('unknown provider failure cannot regenerate; known document resumes original without repurchase/rescore',async()=>{
 let h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());h.failCreate();await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/needs recovery/);await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/support reconciliation/);assert.equal(h.counts().creates,1);assert.equal(h.counts().emails,0);
 h=harness();o=h.order();rid=await h.results.saveGuestResult(h.session,o.id,h.form());h.failAfterCreated();await assert.rejects(h.reports.prepareGuestReport(h.session,rid));const result=await h.reports.prepareGuestReport(h.session,rid);assert.equal(result.report_state,'ready');assert.equal(h.counts().creates,1);assert.ok(h.events.includes('poll_original'));assert.equal(h.tables.dydd_guest_results.length,1);
});
test('paused PDF/mail flags fail before external transport, saved results retained',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());process.env.DYDD_GUEST_REPORT_GENERATION_ENABLED='false';await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/paused/);assert.equal(h.counts().creates,0);process.env.DYDD_GUEST_REPORT_GENERATION_ENABLED='true';await h.reports.prepareGuestReport(h.session,rid);process.env.DYDD_GUEST_EMAIL_ENABLED='false';await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid),/email is paused/);assert.equal(h.counts().emails,0);assert.equal(h.tables.dydd_guest_results.length,1);
});
test('durable guest retry gate respects switch, exact recovery capability, paid source, recipient and archived original',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);
 const gate=h.load('lib/public-assessments/guest-delivery.ts',h.mocks).guestReportDeliveryEligibility;
 const job={email:h.session.participant_email,context:{kind:'application',deliveryContext:{type:'guest_assessment_report',guestSessionId:h.session.id,guestResultId:rid,reportUrl:'https://guest.invalid'+h.capability.guestRecoveryPath(h.session.id,h.token)}}};
 assert.deepEqual(await gate(job),{});h.setDbOffline(true);const outage=await gate(job);assert.ok(outage.deferUntil);assert.equal(outage.stop,undefined);h.setDbOffline(false);assert.deepEqual(await gate(job),{});process.env.DYDD_GUEST_EMAIL_ENABLED='false';assert.ok((await gate(job)).deferUntil);process.env.DYDD_GUEST_EMAIL_ENABLED='true';
 for(const change of [j=>j.email='foreign@example.invalid',j=>j.context.deliveryContext.reportUrl=j.context.deliveryContext.reportUrl.replace('guest.invalid','foreign.invalid'),j=>j.context.deliveryContext.reportUrl=j.context.deliveryContext.reportUrl.replace(h.token,h.capability.newGuestCapability()),j=>j.context.deliveryContext.guestResultId=crypto.randomUUID()]){const bad=structuredClone(job);change(bad);assert.ok((await gate(bad)).stop);}
 const r=h.tables.dydd_guest_results[0];r.pdf.storage.path='guest/foreign/report.pdf';assert.ok((await gate(job)).stop);r.pdf.storage.path=`guest/${rid}/report.pdf`;
 o.status='refunded';assert.ok((await gate(job)).stop);o.status='paid';h.session.expires_at='2020-01-01';assert.ok((await gate(job)).stop);
});
test('public default anonymous page has no signup/login requirement; authenticated legacy lane remains available',async()=>{
 const h=harness();let user=null,identityReads=0;
 const page=h.load('app/assessments/[product]/page.tsx',{...h.mocks,
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>{identityReads++;return {data:{user}}}}})},
  '../public-assessments.module.css':{},'./public-assessments.module.css':{},
 });
 const props={params:Promise.resolve({product:'designid'}),searchParams:Promise.resolve({})};
 const anon=await page.default(props);function texts(node){if(node==null)return '';if(Array.isArray(node))return node.map(texts).join(' ');if(typeof node!=='object')return String(node);return texts(node.props?.children);}
 assert.match(texts(anon),/No account(?:, app signup| or sign-in is needed)/);assert.doesNotMatch(texts(anon),/Create your account|Sign in first/);assert.equal(identityReads,1);
 user={id:crypto.randomUUID(),email:'account@example.invalid',email_confirmed_at:'2026-10-01'};const account=await page.default(props);assert.equal(account.type.name,'PublicAssessmentProductPage');assert.equal(identityReads,2);
 const signedGuest=await page.default({...props,searchParams:Promise.resolve({guest:'1'})});assert.match(texts(signedGuest),/No account(?:, app signup| or sign-in is needed)/);assert.notEqual(signedGuest.type.name,'PublicAssessmentProductPage');
});

test('only explicit provider failure permits bounded cooldown retry using original immutable scores/order',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());h.failAfterCreated();await assert.rejects(h.reports.prepareGuestReport(h.session,rid));h.setKnownFailure(true);
 await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/Wait one minute/);assert.equal(h.counts().creates,1);
 const r=h.tables.dydd_guest_results[0],scores=structuredClone(r.scores);r.pdf.lastCreationAt=new Date(Date.now()-61000).toISOString();await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/needs recovery/);assert.equal(h.counts().creates,2);assert.deepEqual(r.scores,scores);assert.equal(h.tables.dydd_guest_orders.length,1);assert.equal(h.tables.dydd_guest_results.length,1);assert.deepEqual(r.pdf.previousDocumentIds,['doc_fixture']);
 r.pdf.attempts=3;r.pdf.lastCreationAt=new Date(Date.now()-61000).toISOString();await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/technical retry limit/);assert.equal(h.counts().creates,2);
});

test('original v2 delivery is immutable across concurrency/retries and legacy accepted originals remain a no-op',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);
 await Promise.all([h.reports.emailGuestReport(h.session,h.token,rid),h.reports.emailGuestReport(h.session,h.token,rid)]);
 assert.equal(h.counts().emails,1);assert.equal(h.tables.dydd_guest_email_resends.length,0);
 const mail=h.events.find(e=>e.mail).mail;assert.equal(mail.idempotencyKey,'guest-report-v2-'+rid);
 const before=h.events.filter(e=>e.download||e.mail).length;await h.reports.emailGuestReport(h.session,h.token,rid);assert.equal(h.events.filter(e=>e.download||e.mail).length,before,'accepted originals do not even reload attachment');
 const r=h.tables.dydd_guest_results[0];r.email={sent:true,id:'legacy_accepted_without_attachment'};
 const legacy=await h.reports.emailGuestReport(h.session,h.token,rid);assert.equal(legacy.id,'legacy_accepted_without_attachment');assert.equal(h.counts().emails,1);assert.equal(h.events.filter(e=>e.download||e.mail).length,before);
});

test('explicit resend is a new bounded intent with exact archived attachment and original scores unchanged',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);
 const r=h.tables.dydd_guest_results[0],scores=structuredClone(r.scores),pdf=structuredClone(r.pdf);await h.reports.emailGuestReport(h.session,h.token,rid);
 const original=h.events.find(e=>e.mail).mail;await h.reports.emailGuestReport(h.session,h.token,rid,true);
 const intent=h.tables.dydd_guest_email_resends[0],mail=h.events.filter(e=>e.mail).at(-1).mail;
 assert.match(intent.id,/^[0-9a-f-]{36}$/);assert.equal(mail.idempotencyKey,'guest-report-resend-'+intent.id);assert.notEqual(mail.idempotencyKey,original.idempotencyKey);assert.ok(intent.accepted_at);assert.equal(intent.provider_id,'email_fixture_2');
 assert.deepEqual(mail.attachments,original.attachments);assert.equal(mail.attachments[0].filename,pdf.storage.filename);assert.equal(mail.to,h.session.participant_email);assert.match(mail.deliveryContext.reportUrl,new RegExp('&report='+rid+'$'));
 assert.deepEqual(h.events.filter(e=>e.download).map(e=>e.download),Array(2).fill({bucket:'assessment-report-pdfs',path:`guest/${rid}/report.pdf`}));
 assert.deepEqual(r.scores,scores);assert.deepEqual(r.pdf,pdf);assert.deepEqual(h.counts(),{creates:1,emails:2,checkouts:0});assert.equal(h.tables.dydd_guest_orders.length,1);
 await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid,true),/wait two minutes/);assert.equal(h.counts().emails,2);
 // Expire cooldowns without sleeping; preserve all accepted intent history for daily bound.
 for(let i=0;i<2;i++){for(const row of h.tables.dydd_guest_email_resends)row.created_at=new Date(Date.now()-180000-i*1000).toISOString();await h.reports.emailGuestReport(h.session,h.token,rid,true);}
 assert.equal(h.tables.dydd_guest_email_resends.length,3);assert.equal(h.counts().emails,4);
 for(const row of h.tables.dydd_guest_email_resends)row.created_at=new Date(Date.now()-240000).toISOString();
 await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid,true),/Daily email limit/);assert.equal(h.counts().emails,4);
});

test('ambiguous original and explicit resend retries reuse their same immutable intents, never duplicate originals',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);h.setMailAmbiguous(true);
 const original=await h.reports.emailGuestReport(h.session,h.token,rid);assert.equal(original.sent,false);assert.equal(h.tables.dydd_guest_email_resends.length,0);
 h.setMailAmbiguous(false);await h.reports.emailGuestReport(h.session,h.token,rid);assert.equal(h.counts().emails,1);
 h.setMailAmbiguous(true);await h.reports.emailGuestReport(h.session,h.token,rid,true);const pending=h.tables.dydd_guest_email_resends[0];assert.equal(pending.accepted_at,null);
 await h.reports.emailGuestReport(h.session,h.token,rid,true);assert.equal(h.tables.dydd_guest_email_resends.length,1);assert.equal(h.counts().emails,1);
 h.setMailAmbiguous(false);await h.reports.emailGuestReport(h.session,h.token,rid,true);assert.equal(h.tables.dydd_guest_email_resends.length,1);assert.ok(pending.accepted_at);assert.equal(h.counts().emails,2);
 const keys=h.events.filter(e=>e.mail).map(e=>e.mail.idempotencyKey);assert.deepEqual(keys.slice(0,2),Array(2).fill('guest-report-v2-'+rid));assert.deepEqual(keys.slice(2),Array(3).fill('guest-report-resend-'+pending.id));
 await h.reports.emailGuestReport(h.session,h.token,rid);assert.equal(h.counts().emails,2);assert.equal(h.counts().creates,1);
});

test('concurrent explicit resend submissions share one pending durable intent and one provider acceptance',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);
 await Promise.all([h.reports.emailGuestReport(h.session,h.token,rid,true),h.reports.emailGuestReport(h.session,h.token,rid,true)]);
 assert.equal(h.tables.dydd_guest_email_resends.length,1);assert.equal(h.counts().emails,1);assert.equal(h.counts().creates,1);
 const mails=h.events.filter(e=>e.mail);assert.equal(mails.length,2);assert.deepEqual(mails[0].mail,mails[1].mail);
});

test('invalid PDF contents and oversized private originals fail before original or resend intent submission',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);
 for(const data of [Buffer.alloc(0),Buffer.from('<html>upstream error</html>'),Buffer.from(' %PDF-1.7'),Buffer.concat([Buffer.from('%PDF-'),Buffer.alloc(20*1024*1024)])]){
  h.setPdfBytes(data);for(const explicit of [false,true])await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid,explicit),/original PDF attachment is unavailable/);
 }
 assert.equal(h.tables.dydd_guest_email_resends.length,0);assert.equal(h.counts().emails,0);assert.equal(h.counts().creates,1);
});

test('foreign private storage bucket/path never downloads or consumes resend intents; ownership remains enforced',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);
 const r=h.tables.dydd_guest_results[0],storage=structuredClone(r.pdf.storage),before=h.events.filter(e=>e.download||e.mail).length;
 for(const bad of [{...storage,path:`guest/${crypto.randomUUID()}/report.pdf`},{...storage,bucket:'public-pdfs'},{...storage,path:`guest/${rid}/../report.pdf`},{...storage,path:`guest/${rid}/another.pdf`}]){
  r.pdf.storage=bad;for(const explicit of [false,true])await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid,explicit),/not ready/);
 }
 r.pdf.storage=storage;await assert.rejects(h.reports.emailGuestReport({...h.session,id:crypto.randomUUID()},h.token,rid,true),/not available/);
 o.status='refunded';await assert.rejects(h.reports.emailGuestReport(h.session,h.token,rid,true),/not paid/);
 assert.equal(h.events.filter(e=>e.download||e.mail).length,before);assert.equal(h.tables.dydd_guest_email_resends.length,0);assert.equal(h.counts().emails,0);
});

test('recovery honors owned report/product focus, strips capability from redirect, rejects foreign report',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());
 class Response {constructor(body,options={}){this.body=body;this.status=options.status||200;this.headers=new Headers();this.cookies={set:(...args)=>{this.cookie=args}}}static redirect(url,status){const response=new Response(null,{status});response.headers.set('location',String(url));return response}}
 const route=h.load('app/assessments/recover/route.ts',{'next/server':{NextResponse:Response},'@/lib/public-assessments/guest':h.guest,'@/lib/public-assessments/guest-capability':h.capability});
 const invoke=async suffix=>{const url='https://guest.invalid'+h.capability.guestRecoveryPath(h.session.id,h.token)+suffix;return route.GET({url,nextUrl:new URL(url)})};
 const focused=await invoke('&report='+rid+'&product=designid');assert.equal(focused.status,303);const target=new URL(focused.headers.get('location'));assert.equal(target.pathname,h.capability.guestSessionPath(h.session.id));assert.equal(target.searchParams.get('result'),rid);assert.equal(target.searchParams.get('product'),'designid');assert.equal(target.searchParams.has('key'),false);
 assert.equal(focused.cookie[0],h.capability.guestCookie(h.session.id));assert.equal(focused.cookie[1],h.token);assert.equal(focused.cookie[2].httpOnly,true);assert.equal(focused.headers.get('Referrer-Policy'),'no-referrer');assert.equal(focused.headers.get('Cache-Control'),'private, no-store');
 assert.equal((await invoke('&report='+crypto.randomUUID())).status,403);
 const ignored=await invoke('&product=foreign');assert.equal(new URL(ignored.headers.get('location')).searchParams.has('product'),false);
});

test('guest page puts requested owned report first and auto-prepares only targeted paid DesignPD',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);const pd=h.order('designpd',rid);
 const actions=Object.fromEntries(['completeGuestAssessment','buyGuestDesignId','buyGuestDesignPd','recoverGuestReport','retryGuestEmail'].map(k=>[k,()=>{}]));
 const page=h.load('app/assessments/session/[sessionId]/page.tsx',{...h.mocks,
  '@/lib/public-assessments/guest':h.guest,'@/lib/public-assessments/guest-capability':h.capability,'@/lib/public-assessments/config':{guestCheckoutAvailable:()=>true},
  '../../guest-actions':actions,'../../public-assessments.module.css':{},'./public-assessments.module.css':{},'@/app/designid/assessment-form':{DesignIdAssessmentForm:function DesignIdAssessmentForm(){}},'../../public-assessment-ui':{AssessmentPublicShell:function AssessmentPublicShell(){}},'./prepare-designpd':{PrepareDesignPd:function PrepareDesignPd(){}}
 });
 function allNodes(node){if(!node||typeof node!=='object')return [];if(Array.isArray(node))return node.flatMap(allNodes);return [node,...allNodes(node.props?.children)]}
 const render=query=>page.default({params:Promise.resolve({sessionId:h.session.id}),searchParams:Promise.resolve(query)});
 const reportNodes=allNodes(await render({result:rid}));const focused=reportNodes.filter(n=>n.key===o.id||n.key===pd.id);assert.equal(focused[0].key,o.id);assert.equal(reportNodes.find(n=>n.type?.name==='PrepareDesignPd').props.autoPrepare,false);
 const productNodes=allNodes(await render({product:'designpd'}));assert.equal(productNodes.filter(n=>n.key===o.id||n.key===pd.id)[0].key,pd.id);assert.equal(productNodes.find(n=>n.type?.name==='PrepareDesignPd').props.autoPrepare,true);
 const foreignHint=allNodes(await render({result:crypto.randomUUID(),product:'designid'}));assert.equal(foreignHint.filter(n=>n.key===o.id||n.key===pd.id)[0].key,o.id);assert.equal(foreignHint.find(n=>n.type?.name==='PrepareDesignPd').props.autoPrepare,false);
 const warning=allNodes(await render({product:'designpd',message:'Preparation is paused'}));assert.equal(warning.find(n=>n.type?.name==='PrepareDesignPd').props.autoPrepare,false);
});


test('worker-accepted pending resend is reconciled before a new post-cooldown explicit intent',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());await h.reports.prepareGuestReport(h.session,rid);h.setMailAmbiguous(true);
 await h.reports.emailGuestReport(h.session,h.token,rid,true);const prior=h.tables.dydd_guest_email_resends[0];assert.equal(prior.accepted_at,null);
 prior.created_at=new Date(Date.now()-180000).toISOString();const acceptedAt=new Date(Date.now()-170000).toISOString();
 h.tables.dydd_lifecycle_jobs.push({event_key:'application:guest-report-resend-'+prior.id,status:'accepted',accepted_at:acceptedAt,provider_id:'worker_accepted'});
 h.setMailAmbiguous(false);await h.reports.emailGuestReport(h.session,h.token,rid,true);
 assert.equal(prior.accepted_at,acceptedAt);assert.equal(prior.provider_id,'worker_accepted');assert.equal(h.tables.dydd_guest_email_resends.length,2);assert.equal(h.counts().emails,1);
 const mail=h.events.filter(e=>e.mail).at(-1).mail;assert.equal(mail.idempotencyKey,'guest-report-resend-'+h.tables.dydd_guest_email_resends[1].id);
});

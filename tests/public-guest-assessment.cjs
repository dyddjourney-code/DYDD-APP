// Real guest modules + canonical engines. All DB, Stripe, PDF/archive and mail transports are synthetic.
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
function harness(){
 delete require.cache[require.resolve('../scripts/fruitlife-test-load.cjs')];
 const load=require('../scripts/fruitlife-test-load.cjs');
 const tables={dydd_guest_sessions:[],dydd_guest_orders:[],dydd_guest_results:[]},jar=new Map(),events=[];
 let serial=0,creates=0,emails=0,checkouts=0,failCreate=false,failAfterCreated=false,dbOffline=false,knownFailure=false;
 const id=()=>`00000000-0000-4000-8000-${String(++serial).padStart(12,'0')}`;
 function query(table){if(dbOffline)throw Error('synthetic storage timeout');let operation='select',value,filters=[],single=false;
  const q={select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},gt(k,v){filters.push(r=>r[k]>v);return q},order(){return q},filter(k,op,v){filters.push(r=>op==='is'?r[k]==null:r[k]===v);return q},insert(v){operation='insert';value=v;return q},update(v){operation='update';value=v;return q},single(){single=true;return q},maybeSingle(){single=true;return q},then(resolve,reject){try{let rows=tables[table].filter(r=>filters.every(f=>f(r)));if(operation==='insert'){const row={id:id(),created_at:new Date().toISOString(),...value};tables[table].push(row);rows=[row]}if(operation==='update')for(const row of rows)Object.assign(row,value);resolve({data:single?(rows[0]?structuredClone(rows[0]):null):structuredClone(rows),error:null});}catch(e){reject(e)}}};return q;
 }
 const db={from:query,async rpc(name,p){events.push(name);
  if(name==='dydd_public_assessment_provider_allowed')return {data:p.p_provider==='stripe_live'};
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
  '@/lib/lifecycle/application-mail':{sendApplicationEmail:async p=>{emails++;const r=tables.dydd_guest_results.find(r=>p.idempotencyKey==='guest-report-'+r.id);assert.equal(r.report_state,'ready');assert.ok(r.pdf.storage,'archive persisted before mail');events.push({mail:p});return {sent:true,skipped:false,id:'email_fixture'}}}
 };
 const capability=load('lib/public-assessments/guest-capability.ts',mocks),guest=load('lib/public-assessments/guest.ts',mocks),results=load('lib/public-assessments/guest-results.ts',mocks),reports=load('lib/public-assessments/guest-reports.ts',mocks),payments=load('lib/public-assessments/guest-payments.ts',mocks);
 const token=capability.newGuestCapability(),session={id:id(),capability_hash:capability.guestCapabilityHash(token),participant_name:'Guest <A>',participant_email:'guest@example.invalid',expires_at:'2030-01-01T00:00:00Z'};tables.dydd_guest_sessions.push(session);jar.set(capability.guestCookie(session.id),token);
 const order=(product='designid',source=null)=>{const row={id:id(),session_id:session.id,product,source_result_id:source,status:'paid',payment_provider:'stripe_live',expected_product_id:'prod_fixture',expected_price_id:'price_fixture',expected_amount:1999,currency:'usd'};tables.dydd_guest_orders.push(row);return row};
 function form(){const f=new FormData(),{designIdQuestionBlocks}=load('lib/designid/intake.ts',mocks),{mapsConfirmationItems}=load('lib/designid/maps-confirmation.ts',mocks);for(const b of designIdQuestionBlocks)for(const [i,s]of b.statements.entries())f.set('designid_points_'+s.code,String([3,2,0,0][i]));for(const [i,item]of mapsConfirmationItems.entries())f.set('designid_maps_'+item.id,['most','often','sometimes','least'][Math.floor(i/3)]);return f;}
 Object.assign(process.env,{DYDD_GUEST_REPORT_GENERATION_ENABLED:'true',DYDD_GUEST_EMAIL_ENABLED:'true',DYDD_APP_URL:'https://guest.invalid'});
 return {load,mocks,tables,session,token,order,form,capability,guest,results,reports,payments,events,counts:()=>({creates,emails,checkouts}),failCreate:()=>{failCreate=true},failAfterCreated:()=>{failAfterCreated=true},setDbOffline:v=>{dbOffline=v},setKnownFailure:v=>{knownFailure=v}};
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
 const body=h.events.find(e=>e.checkout).checkout;assert.equal(body.metadata.ownership,'guest-v1');assert.equal(body.metadata.guest_session_id,h.session.id);assert.equal(body.metadata.user_id,undefined);assert.match(body.success_url,/assessments\/recover/);assert.doesNotMatch(body.success_url,/login|signup/);
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
 await h.reports.emailGuestReport(h.session,h.token,rid);const mail=h.events.find(e=>e.mail).mail;assert.match(mail.text,/No account or sign-in is needed/);assert.doesNotMatch(mail.text,/Field Kit|same account/);assert.match(mail.html,/Guest &lt;A&gt;/);assert.match(mail.deliveryContext.reportUrl,/assessments\/recover/);assert.equal(mail.idempotencyKey,'guest-report-'+rid);
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
 assert.match(texts(anon),/No account, app signup/);assert.doesNotMatch(texts(anon),/Create your account|Sign in first/);assert.equal(identityReads,1);
 user={id:crypto.randomUUID(),email:'account@example.invalid',email_confirmed_at:'2026-10-01'};const account=await page.default(props);assert.equal(account.type.name,'PublicAssessmentProductPage');assert.equal(identityReads,2);
 const signedGuest=await page.default({...props,searchParams:Promise.resolve({guest:'1'})});assert.match(texts(signedGuest),/No account, app signup/);assert.notEqual(signedGuest.type.name,'PublicAssessmentProductPage');
});

test('only explicit provider failure permits bounded cooldown retry using original immutable scores/order',async()=>{
 const h=harness(),o=h.order(),rid=await h.results.saveGuestResult(h.session,o.id,h.form());h.failAfterCreated();await assert.rejects(h.reports.prepareGuestReport(h.session,rid));h.setKnownFailure(true);
 await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/Wait one minute/);assert.equal(h.counts().creates,1);
 const r=h.tables.dydd_guest_results[0],scores=structuredClone(r.scores);r.pdf.lastCreationAt=new Date(Date.now()-61000).toISOString();await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/needs recovery/);assert.equal(h.counts().creates,2);assert.deepEqual(r.scores,scores);assert.equal(h.tables.dydd_guest_orders.length,1);assert.equal(h.tables.dydd_guest_results.length,1);assert.deepEqual(r.pdf.previousDocumentIds,['doc_fixture']);
 r.pdf.attempts=3;r.pdf.lastCreationAt=new Date(Date.now()-61000).toISOString();await assert.rejects(h.reports.prepareGuestReport(h.session,rid),/technical retry limit/);assert.equal(h.counts().creates,2);
});

// Real application policy/report orchestration; mocked database/provider/mail transports only.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
let legacy=true,lifetime=false,grandfather=false,dbError=false,reads=0;
const inclusion=load('lib/public-assessments/included-access.ts',{
 '@/lib/commerce/personal-access':{hasIncludedPersonalAccess:async()=>legacy,hasLifetimePersonalAccess:async()=>lifetime},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>{reads++;return {data:grandfather?{user_id:'owner'}:null,error:dbError?Error('offline'):null}}})})}
});
test('scoped production assessment inclusion retains explicit grandfather/lifetime and never inherits global beta after cutover',async()=>{
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';delete process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY;
 assert.equal(await inclusion.hasIncludedAssessmentAccess('owner'),true);assert.equal(reads,0,'before cutover preserves existing beta');
 process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY='grandfathered-v1';
 assert.equal(await inclusion.hasIncludedAssessmentAccess('new-buyer'),false,'global beta cannot bypass report-only gate');
 grandfather=true;assert.equal(await inclusion.hasIncludedAssessmentAccess('owner'),true);
 process.env.DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED='false';process.env.DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED='false';
 assert.equal(await inclusion.hasIncludedAssessmentAccess('owner'),true,'sales/ledger pause cannot reset explicit inclusion policy');
 grandfather=false;lifetime=true;assert.equal(await inclusion.hasIncludedAssessmentAccess('owner'),true);lifetime=false;
 dbError=true;await assert.rejects(()=>inclusion.hasIncludedAssessmentAccess('owner'),/could not be verified/);dbError=false;
});
let events=[],pollFailure=false,archiveFailure=false;
const reporting=load('lib/assessment-reporting.ts',{
 '@/lib/pdfmonkey/client':{createPdfMonkeyDocument:async()=>{events.push('create');return{id:'doc_saved',status:'pending'}},getPdfMonkeyDocument:async()=>{events.push('poll');if(pollFailure)throw Error('temporary polling failure');return{id:'doc_saved',status:'success',download_url:'https://provider.invalid/report.pdf'}}},
 '@/lib/assessments/report-storage':{archiveReportPdf:async()=>{events.push('archive');if(archiveFailure)throw Error('storage offline');return{path:'designid/saved/report.pdf'}}},
 '@/lib/lifecycle/application-mail':{sendApplicationEmail:async()=>{throw Error('No email authorized by these tests')}}
});
test('creation evidence persists before polling/archive; callback failure cannot proceed or send email',async()=>{
 events=[];const result=await reporting.createReadyPdfMonkeyReport({filename:'report.pdf',payload:{},templateId:'fixture',archiveKey:'designid/saved',onCreated:async d=>{assert.equal(d.id,'doc_saved');events.push('persist')}});
 assert.deepEqual(events,['create','persist','poll','archive']);assert.equal(result.storage.path,'designid/saved/report.pdf');
 events=[];await assert.rejects(()=>reporting.createReadyPdfMonkeyReport({filename:'report.pdf',payload:{},templateId:'fixture',onCreated:async()=>{events.push('persist-failed');throw Error('DB offline')}}),/DB offline/);
 assert.deepEqual(events,['create','persist-failed']);
});
test('provider-poll ambiguity retains saved document evidence; archive failure does not become a new generation',async()=>{
 events=[];pollFailure=true;let savedId;
 await assert.rejects(()=>reporting.createReadyPdfMonkeyReport({filename:'report.pdf',payload:{},templateId:'fixture',archiveKey:'designid/saved',onCreated:async d=>{savedId=d.id;events.push('persist')}}),/polling failure/);
 assert.equal(savedId,'doc_saved');assert.deepEqual(events,['create','persist','poll']);pollFailure=false;
 events=[];archiveFailure=true;const result=await reporting.createReadyPdfMonkeyReport({filename:'report.pdf',payload:{},templateId:'fixture',archiveKey:'designid/saved'});
 assert.equal(result.ready,true);assert.equal(result.storage,undefined);assert.match(result.archiveError,/storage offline/);assert.equal(events.filter(x=>x==='create').length,1);archiveFailure=false;
});
let originalMail=null,sentPayload=null,mailLookupError=false;
const retryMail=load('lib/public-assessments/delivery.ts',{
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:originalMail,error:mailLookupError?Error('offline'):null})})})},
 '@/lib/assessment-reporting':{sendAssessmentReportEmail:async payload=>{sentPayload=payload;return{sent:true}}},
 '@/lib/lifecycle/application-mail':{sendApplicationEmail:async payload=>{sentPayload=payload;return{sent:true}}}
});
test('saved email retry preserves the exact original immutable event payload despite profile/name drift',async()=>{
 const url='https://school.invalid/designid/report?snapshot=saved';
 const key='assessment-report-'+require('node:crypto').createHash('sha256').update('owner@example.invalid|'+url).digest('hex');
 const senderInput={idempotencyKey:key,to:'owner@example.invalid',subject:'Original subject',html:'Original saved name',text:'Original content'};
 originalMail={template_id:'B01-designid',context:{senderInput,deliveryContext:{type:'assessment_report',reportUrl:url}}};
 await retryMail.retryOwnedAssessmentEmail({email:'owner@example.invalid'},{assessment_type:'designid',scores:{reportPayload:{Name:'Changed name'}}},url);
 assert.equal(sentPayload.html,'Original saved name');assert.equal(sentPayload.subject,'Original subject');assert.equal(sentPayload.idempotencyKey,key);
 originalMail=null;await retryMail.retryOwnedAssessmentEmail({email:'owner@example.invalid'},{assessment_type:'designid',scores:{reportPayload:{Name:'Saved assessment name'}}},url);
 assert.equal(sentPayload.participantName,'Saved assessment name','no prior outbox uses saved report, never current editable profile');
 mailLookupError=true;await assert.rejects(()=>retryMail.retryOwnedAssessmentEmail({email:'owner@example.invalid'},{scores:{}},url),/could not be read/);mailLookupError=false;
});
let failureState='uncertain',providerState='pending',providerOffline=false,stateUpdates=0;
const failedRecovery=load('lib/designpd/generation-recovery.ts',{
 '@/lib/pdfmonkey/client':{getPdfMonkeyDocument:async id=>{if(providerOffline)throw Error('network');return{id,status:providerState}}},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{token:'original-token',state:failureState},error:null}),update(value){assert.equal(value.state,'failed');stateUpdates++;return this},then(resolve){return Promise.resolve({error:null}).then(resolve)}})})}
});
test('known uncertain DesignPD job becomes retryable only on explicit original-document failure; pending/offline jobs stay fenced',async()=>{
 const snapshot={id:'saved',scores:{designIdSnapshotId:'source',contentVersion:'v1',pdfMonkey:{documentId:'original-document'}}};
 await failedRecovery.reconcileKnownDesignPdFailure('owner',snapshot);assert.equal(stateUpdates,0);
 providerOffline=true;await failedRecovery.reconcileKnownDesignPdFailure('owner',snapshot);assert.equal(stateUpdates,0);providerOffline=false;
 providerState='failure';await failedRecovery.reconcileKnownDesignPdFailure('owner',snapshot);assert.equal(stateUpdates,1);
 failureState='running';await failedRecovery.reconcileKnownDesignPdFailure('owner',snapshot);assert.equal(stateUpdates,1,'active jobs never become duplicate retries');
});

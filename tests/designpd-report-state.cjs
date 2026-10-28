const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
let scores, events, sendFailure, persistFailure, pdfStatus, participantId, participantConflict;
let source={id:'source-designid',assessment_type:'designid',scores:{}};
const redirect = location => { throw Object.assign(Error('redirect'),{location}); };
const db = { from(table) {
  let operation='read', values, filters={};
  return {
    select(){return this;},eq(k,v){filters[k]=v;return this;},
    insert(v){operation='insert';values=v;return this;},
    upsert(){throw Error('Unsafe participant reassignment');},
    update(v){operation='update';values=v;return this;},
    async maybeSingle(){return {data:{full_name:'Safe Test'}};},
    async single(){
      if(table==='assessment_participants') {
        assert.equal(operation,'insert'); events.push('participant-insert');
        assert.equal(values.user_id,'owner');
        return participantConflict?{error:{message:'unique conflict'}}:{data:{id:'new-participant'}};
      }
      assert.equal(table,'assessment_snapshots');
      if(operation==='insert') {
        events.push('snapshot'); assert.equal(values.user_id,'owner');
        scores=structuredClone(values.scores);return {data:{id:'saved-pd'}};
      }
      assert.deepEqual(filters,{id:'saved-pd',user_id:'owner'});
      if(operation==='read')return {data:{scores:structuredClone(scores)}};
      events.push('persist');
      if(persistFailure)return {error:{message:'storage down'}};
      scores=structuredClone(values.scores);return {data:{id:'saved-pd'}};
    }
  };
}};
const actions=load('app/designpd/actions.ts',{
  'next/navigation':{redirect}, 'next/headers':{headers:async()=>new Headers({origin:'https://school.invalid'})},
  '@/lib/environment':{isFreeBeta:()=>true}, '@/lib/admin-access':{isDyddAdminEmail:()=>true},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'owner',email:'owner@example.invalid'}}})}})},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
  '@/lib/assessments/student-context':{getAssessmentSnapshotsForUser:async()=>({all:[source]}),latestByAssessment:a=>a,findOrAttachParticipant:async()=>participantId},
  '@/lib/designpd/engine':{designPdScoringVersion:'test',scoreDesignPd:()=>({axisScores:{plan:2},ratings:{}})},
  '@/lib/designpd/report':{buildDesignPdReportPayload:()=>({name:'Safe Test'}),designPdSnapshotSections:()=>({summary:{},profileLanguage:{}}),designPdContentVersion:'test',designPdTemplateId:'template'},
  '@/lib/assessment-reporting':{
    cleanReportFilename:v=>v,
    createReadyPdfMonkeyReport:async()=>{
      events.push('pdf');return {ready:pdfStatus==='success',document:{id:'pdf',status:pdfStatus},storage:{path:'designpd/saved-pd/report.pdf'}};
    },
    sendAssessmentReportEmail:async input=>{
      events.push('email');
      assert.equal(scores.pdfMonkey.status,'success','report state durably persisted before email');
      assert.equal(scores.pdfMonkey.storage.path,'designpd/saved-pd/report.pdf');
      assert.equal(input.reportUrl,'https://school.invalid/designpd/report?snapshot=saved-pd');
      // A report download may attach recovery metadata during a slow/deferred send.
      scores.pdfRecovery={documentId:'concurrent-recovery'};
      if(sendFailure)throw Error('email unavailable');
      return {sent:true,id:'mock-email',skipped:false};
    }
  }
});
async function run({email=true,sendFails=false,persistFails=false,status='success',linked='participant',conflict=false,origin='field-kit'}={}){
  events=[];scores=null;sendFailure=sendFails;persistFailure=persistFails;pdfStatus=status;participantId=linked;participantConflict=conflict;
  const form=new FormData();form.set('origin',origin);if(email)form.set('emailReport','yes');
  try {await actions.saveDesignPdResponse(form);assert.fail('Expected redirect');}
  catch(error){assert(error.location,error.stack);return error.location;}
}
(async()=>{
  assert.equal(await run(),'/designpd/thanks?snapshot=saved-pd&origin=field-kit');
  assert.deepEqual(events,['snapshot','pdf','persist','email','persist']);
  assert.equal(await run({origin:'trailheads'}),'/designpd/thanks?snapshot=saved-pd&origin=trailheads');
  assert.equal(scores.resultEmail.sent,true);
  assert.equal(scores.pdfRecovery.documentId,'concurrent-recovery','email status update preserves download lifecycle changes');
  await run({email:false});assert(!events.includes('email'));assert.equal(scores.resultEmail.reason,'owner_review_without_email');
  await run({sendFails:true});assert.equal(scores.pdfMonkey.status,'success');assert.equal(scores.resultEmail.sent,false);assert.equal(scores.resultEmail.error,'email unavailable');
  const failed=await run({persistFails:true});assert(failed.startsWith('/designpd?origin=field-kit&message='));assert(!events.includes('email'),'no delivery of an unpersisted artifact URL');
  await run({status:'pending'});assert(!events.includes('email'));assert.equal(scores.pdfMonkey.status,'pending');
  await run({linked:null});assert(events.includes('participant-insert'));
  const conflict=await run({linked:null,conflict:true});assert(conflict.startsWith('/designpd?origin=field-kit&message='));assert.deepEqual(events,['participant-insert'],'foreign email conflict cannot steal participant or create report');
  let mail;
  const reporting=load('lib/assessment-reporting.ts',{
    '@/lib/lifecycle/application-mail':{sendApplicationEmail:async input=>{mail=input;return {sent:false,skipped:true};}}
  });
  await reporting.sendAssessmentReportEmail({assessmentName:'DesignPD',participantEmail:'owner@example.invalid',participantName:'Safe Test',reportUrl:'https://school.invalid/designpd/report?snapshot=saved-pd'});
  assert(mail.text.includes('Sign in with the same account you used to complete DesignPD.'));
  assert(mail.html.includes('Your report is also available in Field Kit.'));
  assert.equal(mail.templateId,'B01-designpd');
  assert.equal(mail.deliveryContext.reportUrl,'https://school.invalid/designpd/report?snapshot=saved-pd');
  console.log('PASS DesignPD persist-before-email, checked writes, no-email preview, email-failure isolation, concurrent metadata preservation, pending suppression, ownership-safe participant creation');
})().catch(e=>{console.error(e);process.exitCode=1;});

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const load = require('../scripts/fruitlife-test-load.cjs');
const {spiritualGiftQuestionBank, spiritualGiftRatingField} = load('lib/spiritual-gifts/intake.ts');
let session, snapshot, order, mail, mode, mailCalls;
const token = 'in-memory-fixture-token';
const db = {from(table) {
  let operation = 'read', values;
  const q = {
    select(){return q;},eq(){return q;},insert(v){operation='insert';values=v;return q;},
    update(v){operation='update';values=v;return q;},
    async single(){return run();},async maybeSingle(){return run();},
    then(a,b){return Promise.resolve(run()).then(a,b);}
  };
  function run(){
    if (table==='spiritual_gifts_responses') {
      assert.equal(operation,'insert'); order.push('response');return {data:{id:'response'}};
    }
    if (table==='assessment_snapshots') {
      if (operation==='insert') {snapshot={id:'snapshot',scores:structuredClone(values.scores)};order.push('snapshot');return {data:{id:'snapshot'}};}
      if (operation==='update') {
        if (mode==='snapshot-fails'&&!snapshot.scores.pdfMonkey) return {error:{message:'offline'}};
        snapshot.scores=structuredClone(values.scores);order.push('snapshot-persist');return {data:{id:'snapshot'}};
      }
      return {data:structuredClone(snapshot)};
    }
    assert.equal(table,'spiritual_gifts_sessions');
    if(operation==='update') {
      if(mode==='session-fails'&&!session.metadata.pdfMonkey)return {error:{message:'offline'}};
      session={...session,...structuredClone(values)};order.push('session-persist');return {data:{id:'session'}};
    }
    return {data:structuredClone(session)};
  }
  return q;
}};
const actions=load('app/spiritual-gifts/actions.ts',{
  'next/navigation':{redirect:location=>{throw Object.assign(Error('redirect'),{location});}},
  'next/headers':{headers:async()=>new Headers()},
  '@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>{throw Error('unexpected authentication lookup');}},
  '@/lib/assessments/report-storage':{archiveReportPdf:async()=>({bucket:'assessment-report-pdfs',path:'spiritual_gifts/snapshot/report.pdf'})},
  '@/lib/pdfmonkey/client':{
    createPdfMonkeyDocument:async()=>({id:'document'}),
    getPdfMonkeyDocument:async()=>({id:'document',status:mode==='pdf-fails'?'failure':'success',public_share_link:'https://provider.invalid/share',download_url:'https://provider.invalid/download'}),
  },
  '@/lib/lifecycle/application-mail':{sendApplicationEmail:async input=>{
    mailCalls++;order.push('email');mail=input;
    assert.equal(snapshot.scores.pdfMonkey.status,'success','snapshot artifact saved before delivery');
    assert.equal(session.metadata.pdfMonkey.storage.path,'spiritual_gifts/snapshot/report.pdf','emailed token locator can already resolve the archived PDF');
    assert.equal(session.report_status,'ready');
    assert.equal(session.result_snapshot_id,'snapshot');
    snapshot.scores.pdfRecovery={documentId:'concurrent'};session.metadata.concurrent='preserved';
    if(mode==='mail-throws')throw Error('unavailable');
    if(mode==='413'&&mailCalls===1)return {sent:false,skipped:false,message:'Provider HTTP 413; retry with the same idempotency key.'};
    return {sent:mode!=='deferred',skipped:false,id:mode==='deferred'?undefined:'intercepted-only'};
  }},
});
process.env.DYDD_APP_URL='https://school.invalid';
global.fetch=async url=>{
  assert.equal(url,'https://provider.invalid/download','attachment must fetch actual download, not public viewer HTML');
  if(mode==='attachment-fails')throw Error('download interrupted');
  return {ok:true,arrayBuffer:async()=>Buffer.from('%PDF-in-memory-fixture')};
};
async function run(nextMode='success') {
  mode=nextMode;order=[];mail=null;mailCalls=0;snapshot=null;
  session={id:'session',participant_id:'participant',created_by_user_id:'owner',intake_token_hash:crypto.createHash('sha256').update(token).digest('hex'),metadata:{original:'preserved'}};
  const form=new FormData();form.set('session_id','session');form.set('token',token);form.set('reviewer_name','Fixture');form.set('reviewer_email','fixture@example.invalid');
  for(const q of spiritualGiftQuestionBank)form.set(spiritualGiftRatingField(q.code),'3');
  try {await actions.saveSpiritualGiftsSelfResponse(form);assert.fail('redirect expected');}
  catch(e){assert(e.location,e.stack);return e.location;}
}
(async()=>{
  assert.equal(await run(),'/field-kit#collection-spiritual-gifts');assert.deepEqual(order,['response','snapshot','snapshot-persist','session-persist','email','snapshot-persist','session-persist']);
  assert.equal(session.report_status,'sent');assert.equal(snapshot.scores.pdfRecovery.documentId,'concurrent');assert.equal(session.metadata.concurrent,'preserved');assert.equal(session.metadata.original,'preserved');
  const baselineScores=JSON.stringify(snapshot.scores.totals),baselinePayload=JSON.stringify(snapshot.scores.reportPayload);
  await run('attachment-fails');assert.equal(mailCalls,1);assert(!mail.attachments);assert.equal(session.metadata.pdfMonkey.status,'success');assert.equal(session.report_status,'sent');
  await run('mail-throws');assert.equal(session.report_status,'ready');assert.equal(session.metadata.pdfMonkey.status,'success');assert.equal(session.metadata.resultEmail.resendSent,false);assert.equal(session.metadata.resultEmail.sentAt,null);
  assert.equal(JSON.stringify(snapshot.scores.totals),baselineScores);assert.equal(JSON.stringify(snapshot.scores.reportPayload),baselinePayload);
  await run('deferred');assert.equal(session.report_status,'ready');assert.equal(session.metadata.resultEmail.sentAt,null);
  await run('413');assert.equal(mailCalls,2);assert(!mail.attachments);assert.equal(session.metadata.resultEmail.retryWithoutAttachment.resendSent,true);
  for(const failure of ['snapshot-fails','session-fails']) {assert.match(await run(failure),/message=/);assert.equal(mailCalls,0,'never email a locator whose metadata write failed');}
  await run('pdf-fails');assert.equal(mailCalls,0);assert.equal(session.report_status,'error');
  console.log('PASS Spiritual Gifts real scoring in memory, artifact persisted before delivery, optional download/mail failure isolation, preserved result/PDF/concurrent metadata, attachmentless fallback, checked writes, non-ready suppression; no external calls or database writes');
})().catch(e=>{console.error(e);process.exitCode=1;});

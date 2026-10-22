const assert=require('node:assert/strict'),fs=require('node:fs'),load=require('../scripts/fruitlife-test-load.cjs');
const source=JSON.parse(fs.readFileSync('content/designid-shadow-canonical.json'));
const {canonicalDesignIdShadow}=load('lib/designid/shadow.ts');
const {buildDesignIdReportPayload}=load('lib/designid/report.ts');
const {scoreDesignId}=load('lib/designid/engine.ts');
const {designIdQuestionBank}=load('lib/designid/intake.ts');
const {buildDesignIdContext}=load('lib/assessments/student-context.ts',{'@/lib/supabase/admin':{}});
assert.deepEqual(source.reflections.Artisan.Shadow_Risks.split('\n'),['Perfectionism','Overcontrol','Criticism','Analysis Paralysis']);
for(const primary of ['Architect','Artisan','Shepherd','Steward']){
 const row=source.reflections[primary];
 const expected=Object.fromEntries(['A','B','C','D'].flatMap((letter,i)=>[['Risk','Shadow_Risks'],['Root','Shadow_Root_Cause'],['Red','Shadow_Redemption']].map(([field,key])=>[`Shadow_${field}_${letter}`,row[key].replace(/\r\n?/g,'\n').split('\n')[i].trim()])));
 const answers=Object.fromEntries(designIdQuestionBank.map(q=>[q.code,q.reflection===primary?3:q.reflection===(primary==='Architect'?'Artisan':'Architect')?2:0]));
 const result=scoreDesignId(answers);assert.equal(result.primary,primary);
 const payload=buildDesignIdReportPayload({participantName:'QA',participantEmail:'qa@example.invalid',result});
 for(const [key,value]of Object.entries(expected))assert.equal(payload[key],value,primary+' native '+key);
 for(const payloadOnly of [false,true]){
  const generic=Object.fromEntries(Object.keys(expected).map(key=>[key,'Invented historical generic placeholder']));
  const saved={Primary:primary,...generic};const snapshot={id:'qa',assessment_type:'designid',created_at:'2026-10-22',scores:payloadOnly?{reportPayload:saved}:{summary:saved}};
  const report={all:[snapshot],latest:[snapshot]},before=JSON.stringify(report),context=buildDesignIdContext(report);
  for(const [key,value]of Object.entries(expected))assert.equal(context[key.replace('Shadow_','shadow').replaceAll('_','')],value,primary+' saved historical '+key);
  assert.equal(JSON.stringify(report),before,'original saved report untouched');
 }
 assert.equal(canonicalDesignIdShadow(primary).Reflection_Shadow,row.Reflection_Shadow);
}
assert.equal(canonicalDesignIdShadow(''),null);assert.equal(canonicalDesignIdShadow('unknown'),null);
console.log('PASS exact canonical multiline split → 48 cells; all4 scored native generators; historical generic/payload-only binding; source snapshots immutable; Artisan exact; missing primary honest');

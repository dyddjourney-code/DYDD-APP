const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {designIdPdfDisplayPayload:format,pdfScoreDisplayPayload}=load('lib/pdfmonkey/score-display.ts');
const {recoveryReport}=load('lib/assessments/report-recovery.ts');
const refs=['Architect','Artisan','Shepherd','Steward'];
const row=(values,suffix)=>Object.fromEntries(refs.map((r,i)=>[`${r}_${suffix}`,values[i]]));
const expected=row(['22','21','41','16'],'Pct');
for(const source of [row([.22,.21,.41,.16],'Pct'),row(['0.220','0.210','0.410','0.160'],'Pct'),row([22,21,41,16],'Pct'),row(['22%','21%','41%','16%'],'Pct'),{...row([22,21,41,16],'Pts'),...row([.22,.21,.41,.16],'Pct')}]){
 const before=JSON.stringify(source),out=format({...source,Primary:'Shepherd',unchanged:{meaning:'same'}});
 for(const r of refs)assert.equal(out[`${r}_Pct`],expected[`${r}_Pct`]);
 assert.deepEqual(format(out),out,'PDF formatting must be idempotent');assert.equal(out.Primary,'Shepherd');assert.equal(JSON.stringify(source),before);
 for(const formatTag of [undefined,'template-v1']){const report=recoveryReport({assessment_type:'designid',scores:{reportPayload:source,reportPayloadFormat:formatTag}});assert.equal(report.payload.Architect_Pct,'22');}
}
for(const values of [[0,1,49,50],[1,0,0,99],[100,0,0,0]])for(const raw of [values,values.map(v=>v/100),values.map(v=>`${v}%`)]){const out=format(row(raw,'Pct'));refs.forEach((r,i)=>assert.equal(out[`${r}_Pct`],`${values[i]}`));}
const pd={plan_score:12,decide_score:13,do_score:7,move_dreamer_minus_doer:'12.0%'};
const fruit={self_overall:3.8333333333,love_self:4.33333333,overall_gap:.25};
for(const [id,p]of [['other-pd',pd],['other-fruit',fruit],['other-gifts',{Top1_Score:15,Top1_Pct:100}]])assert.deepEqual(pdfScoreDisplayPayload(id,p),p);
assert.deepEqual(format({Name:'Partial',Architect_Pct:'22%'}),{Name:'Partial',Architect_Pct:'22'});
const legacy={...row([30,23,39,37],'Pts'),...row([30/129,23/129,39/129,37/129],'Pct'),Total_Pts:129};const legacyOut=format(legacy);assert.equal(legacyOut.Architect_Pct,'30');assert.equal(legacyOut.Architect_Pts,30);assert.equal(legacyOut.Total_Pts,129);
assert.throws(()=>format(row([-.1,.21,.41,.48],'Pct')),/invalid saved percentage/);
let sent;global.fetch=async(url,opts)=>{sent=JSON.parse(opts.body);return new Response(JSON.stringify({document:{id:'mock-only'}}),{status:200})};process.env.PDFMONKEY_API_KEY='test-only';
const {createPdfMonkeyDocument}=load('lib/pdfmonkey/client.ts');
(async()=>{await createPdfMonkeyDocument({templateId:'346a0595-80fa-48c3-a9e2-29f0c0312e6e',filename:'test.pdf',payload:row([.22,.21,.41,.16],'Pct')});assert.equal(sent.document.payload.Architect_Pct,'22');console.log('PASS workbook/native/template-v1/last-mile PDF units; 0/1/100 edge cases; nonmutation; legacy total/partial-source preservation; PD/gifts/Fruit intended scales preserved.');})().catch(e=>{console.error(e);process.exitCode=1});

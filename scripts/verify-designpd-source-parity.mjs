import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'designpd-parity-'));
fs.mkdirSync(path.join(dir,'source'));
for(const name of ['libraries','legacy-fields'])fs.copyFileSync(`lib/designpd/source/${name}.json`,path.join(dir,`source/${name}.json`));
for(const name of ['report','engine'])fs.writeFileSync(path.join(dir,`${name}.cjs`),ts.transpileModule(fs.readFileSync(`lib/designpd/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2021,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText);
const {buildDesignPdReportPayload,designPdMovementLength,designPdContentVersion}=require(path.join(dir,'report.cjs'));
const {scoreDesignPd}=require(path.join(dir,'engine.cjs'));
const source=JSON.parse(fs.readFileSync('lib/designpd/source/libraries.json'));
const mapping=JSON.parse(fs.readFileSync('lib/designpd/source/legacy-fields.json'));
const reflections=['Architect','Artisan','Shepherd','Steward'];
const bands=['Abundant','Steady','Limited','Drained'];
const tendencies={plan:['Balanced','Moderate_Dreamer','Strong_Dreamer','Moderate_Doer','Strong_Doer'],decide:['Balanced','Moderate_Feel_It','Strong_Feel_It','Moderate_Think_It','Strong_Think_It'],do:['Balanced','Moderate_Solo','Strong_Solo','Moderate_Together','Strong_Together']};
const covered=new Set();let combinations=0;
for(const primary of reflections)for(const secondary of reflections.filter(x=>x!==primary))for(const band of bands)for(let t=0;t<5;t++){
 const result={designId:{primary,secondary,bands:Object.fromEntries(reflections.map((r,i)=>[r,bands[(bands.indexOf(band)+i)%4]])),rawScores:{},reflectionShadow:'This deliberately is NOT the primary shadow',integrativeReflection:''},axisScores:{plan:14,decide:14,do:14},movement:{plan:0.14,decide:-0.14,do:0},axisTendencies:Object.fromEntries(Object.entries(tendencies).map(([k,v])=>[k,v[t]])),ratings:{}};
 const payload=buildDesignPdReportPayload({designIdSnapshot:{id:'test',created_at:'2026-10-15T16:00:00Z'},participantName:'Parity test',participantEmail:'parity@example.invalid',result});
 for(const field of Object.keys(mapping))assert.ok(payload[field]!==undefined&&payload[field]!=='',`Missing ${field}`);
 assert.equal(payload.reflection_shadow,source.reflectionShadows[primary]);assert.equal(payload.shadow_reflection,primary);
 for(const [lib,rows] of Object.entries(source.libraries))for(const [key,row]of Object.entries(rows))if(Object.values(payload).some(v=>typeof v==='string'&&v===row.at(-1).replaceAll('{{reflection_shadow}}',source.reflectionShadows[primary]).replaceAll('{{shadow_reflection}}',primary)))covered.add(`${lib}:${key}`);
 for(const axis of ['plan','decide','do'])assert.ok(!payload[`${axis}_shadow_watch`].includes('{{'));
 combinations++;
}
assert.equal(covered.size,222,'Every source-library row must be exercised');
for(const n of [-0.5,-0.16,-0.05,0,0.05,0.16,0.5])assert.equal(designPdMovementLength(n),`${(100*n).toFixed(1)}%`);
assert.throws(()=>designPdMovementLength(NaN));assert.throws(()=>designPdMovementLength(0.51));
let vectors=0;
for(let a=0;a<=60;a++)for(let r=0;r<=60;r++)for(let h=0;h<=60;h++){
 const s=100-a-r-h;if(s<0||s>60)continue;
 const p={Architect_Pts:a,Artisan_Pts:r,Shepherd_Pts:h,Steward_Pts:s,Total_Pts:100};
 const result=scoreDesignPd({scores:{scores:p,summary:{Primary:'Architect',Secondary:'Artisan'}}});
 assert.equal(result.movement.plan,(h+r-a-s)/200);assert.equal(result.movement.decide,(a+h-r-s)/200);assert.equal(result.movement.do,(a+r-h-s)/200);vectors++;
}
let historical=0,fields=0;
if(process.argv[2]){
 const data=JSON.parse(fs.readFileSync(path.join(process.argv[2],'historical-formatted.json'))).values;
 const headers=data[0];
 for(const row of data.slice(1)){
  if(!row[0])continue;const record=Object.fromEntries(headers.map((h,i)=>[h,row[i]??'']));
  const result={designId:{primary:record.Primary,secondary:record.Secondary,integrativeReflection:record.Integrative_Reflection,reflectionShadow:record.Reflection_Shadow,bands:Object.fromEntries(reflections.map(r=>[r,record[`Band_${r}`]])),rawScores:{}},axisTendencies:{plan:record.Plan_Tendency,decide:record.Decide_Tendency,do:record.Do_Tendency},axisScores:{plan:Number(record.Plan_Score),decide:Number(record.Decide_Score),do:Number(record.Do_Score)},movement:{plan:parseFloat(record.Move_DreamerMinusDoer)/100,decide:parseFloat(record.Move_Feel_ItMinusThink_It)/100,do:parseFloat(record.Move_SoloMinusTogether)/100},ratings:{}};
  const completed=new Date(`${record.Report_Date_Display} 12:00:00 GMT-0400`).toISOString();
  const payload=buildDesignPdReportPayload({designIdSnapshot:{id:'historical',created_at:completed},participantEmail:record.Email,participantName:record.Name,result});
  for(const [field,column]of Object.entries(mapping)){
   // Only numbered row is logged on failure; never participant identities or content.
   assert.equal(String(payload[field]),String(record[column]),`Historical row ${historical+2}, ${field}`);fields++;
  }historical++;
 }
}
console.log(JSON.stringify({status:'PASS',contentVersion:designPdContentVersion,sourceRowsCovered:covered.size,profileCombinations:combinations,numericVectors:vectors,historicalReports:historical,historicalFieldComparisons:fields}));

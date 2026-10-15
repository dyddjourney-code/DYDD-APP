const assert=require('node:assert/strict'),fs=require('node:fs'),load=require('./fruitlife-test-load.cjs');
const {buildFruitLifePayload}=load('lib/fruitlife360/payload.ts');const {fruitLifeFruits}=load('lib/fruitlife360/intake.ts');const libs=require('../lib/fruitlife360/source-libraries.json').libraries;
const session={id:'beta-fixture',source_participant_id:'beta-fixture',participant_name:'Beta Fixture',participant_email:'fixture@example.invalid',observer_goal:0,observer_completed_count:0};
function response(type,visible,pressure){return {response_type:type,fruit_rank:[...fruitLifeFruits].reverse().map(x=>x.key),answers:{fruitRatings:Object.fromEntries(fruitLifeFruits.map((f,i)=>[f.key,{visible:typeof visible==='function'?visible(i):visible,pressure:typeof pressure==='function'?pressure(i):pressure}])),reflections:{growth:'Grow gently',strength:'Kind care',encouragement:'Keep growing'}},derived_scores:{}}}
let checks=0;
for(let self=1;self<=5;self++)for(let obs=1;obs<=5;obs++)for(let sp=1;sp<=5;sp++)for(let op=1;op<=5;op++){
 const data=buildFruitLifePayload(session,[response('self',self,sp),response('observer',obs,op)]);
 const diff=Math.abs(obs-self),drop=Math.max(0,self-sp,obs-op);const cb=diff<.5?'ALIGNED':diff<1?'LIGHT_DIFFERENCE':diff<1.5?'MEANINGFUL_GAP':'SIGNIFICANT_CONVERSATION';const pb=drop<.5?'STEADY':drop<1?'MILD_SENSITIVITY':drop<1.5?'NOTICEABLE_DROP':'MAJOR_VULNERABILITY';
 assert.equal(data.love_consistency_note,libs.Fruit_Gap_Language_360.find(r=>r[1]==='love'&&r[2]==='Consistency'&&r[3]===cb)[8]);assert.equal(data.love_pressure_note,libs.Fruit_Gap_Language_360.find(r=>r[1]==='love'&&r[2]==='Pressure'&&r[3]===pb)[8]);assert.equal(data.self_overall,self);assert.equal(data.observer_overall,obs);assert.equal(data.overall_gap,obs-self);checks++;
}
for(const gap of [.499999,.5,.999999,1,1.499999,1.5]){
 const p=buildFruitLifePayload(session,[response('self',2,2),response('observer',2+gap,2+gap)]);const band=gap<.5?'ALIGNED':gap<1?'LIGHT_DIFFERENCE':gap<1.5?'MEANINGFUL_GAP':'SIGNIFICANT_CONVERSATION';assert.equal(p.love_consistency_note,libs.Fruit_Gap_Language_360.find(r=>r[1]==='love'&&r[2]==='Consistency'&&r[3]===band)[8]);checks++;
}
// Observer-first ordering, self tie-break, not pooled averages or forced self rank.
const asymmetric=buildFruitLifePayload(session,[response('self',i=>i===0?5:1,3),response('observer',i=>i===1?4:3,3)]);assert.equal(asymmetric.joy_rank,1);assert.equal(asymmetric.love_rank,2);
const solo=buildFruitLifePayload(session,[response('self',i=>5-i/3,3)]);assert.equal(solo.love_rank,1);assert.equal(solo.self_control_rank,9);assert.equal(solo.observer_overall,solo.self_overall);assert.equal(solo.overall_gap,0);assert.equal(solo.report_mode,'SELF_ONLY');
for(const fruit of fruitLifeFruits){const tier=solo[fruit.key+'_tier_label'];const row=libs.Fruit_Tier_Formation_360.find(r=>r[0].toLowerCase().replace(/[- ]/g,'_')===fruit.key&&r[1]===tier);assert.equal(solo[fruit.key+'_maturity'],row[2]);assert.equal(solo[fruit.key+'_growth_invitation'],row[3]);assert.equal(solo[fruit.key+'_practice'],row[4]);assert.equal(solo[fruit.key+'_prayer_prompt'],row[5]);assert.equal(solo[fruit.key+'_reflection_question'],row[5]);}
const fixture=response('observer',4,3);fixture.answers.reflections.growth='<script>alert(1)</script>';const escaped=buildFruitLifePayload(session,[response('self',3,3),fixture]);assert(!escaped.observer_growth_comments.includes('<script>'));assert(escaped.observer_growth_comments.includes('&lt;script&gt;'));
const fields=require('./fixtures/fruitlife-template-fields.json');assert.deepEqual(fields.filter(key=>!(key in solo)),[]);
console.log(`PASS ${checks} scoring/band fixtures, observer-first ordering, self-only fallback, all 9 tier-library selections, HTML escaping and ${fields.length} template fields.`);

let historicFields=0;const historic=require('./fixtures/fruitlife-historical-parity.json');
for(const fixture of historic.cases){const payload=buildFruitLifePayload(session,fixture.responses);for(const[key,expected]of Object.entries(fixture.expected)){const actual=payload[key];if(typeof expected==='number')assert(Math.abs(actual-expected)<1e-8, key);else assert.equal(actual,expected,key);historicFields++;}}
for(const question of [...load('lib/fruitlife360/intake.ts').fruitLifeQuestionBank,...load('lib/fruitlife360/intake.ts').fruitLifePressureQuestions]){const bank=libs.Question_Bank_360;const row=bank.slice(1).find(row=>String(row[0]).toLowerCase()===question.code.toLowerCase() || row[3]==='Pressure' && String(row[1]).toLowerCase().replace(/[- ]/g,'_')===question.fruitKey);assert(row,question.code);assert.equal(question.selfText,row[8]);assert.equal(question.observerText,row[9]);}
console.log(`PASS ${historic.cases.length} anonymized historical reports / ${historicFields} values and all 72 self/observer item statements.`);

// Independent MAPS regression fixtures only. No DB, auth, deployment or delivery writes.
// Run: node tests/maps-refinement.cjs
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const ts = require('typescript');
const load = require('../scripts/fruitlife-test-load.cjs');
const report = load('lib/maps-report/report.ts');
const {mapsPhases} = load('lib/maps-report/content.ts');
const {buildMapsRoadmapHtml: build, mapsIndicatorScore, mapsReflectionLens, mapsShortFormDefinition: definition} = report;
const identities = ['Architect', 'Artisan', 'Shepherd', 'Steward'];
const boundaries = [0, 9, 10, 24, 25, 39, 40, 60];
const expectedBand = score => score >= 40 ? 'Abundant' : score >= 25 ? 'Steady' : score >= 10 ? 'Limited' : 'Drained';
const snapshot = scores => ({id:'synthetic-regression', assessment_type:'fixture', scores,
  created_at:'2026-10-23', source_submitted_at:null, participant_id:null});
const idSnapshot = values => snapshot({scores:Object.fromEntries(identities.map((name,i) => [name+'_Pts', values[i]]))});
const pdSnapshot = (tendencies=['Balanced','Balanced','Balanced'], magnitude=0) => snapshot({axisTendencies:
  Object.fromEntries(['plan','decide','do'].map((axis,i)=>[axis,{tendency:tendencies[i],score:magnitude}]))});
const input = (id, pd=pdSnapshot()) => ({participant:{id:'synthetic-only',display_name:'Independent Regression',normalized_email:null},designIdSnapshot:id,designPdSnapshot:pd});
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const categories = mapsPhases.flatMap(p=>p.subcategories);
const blended = {Purpose:['Shepherd','Architect'],Development:['Artisan','Architect'],Outcomes:['Architect','Steward']};
// The other nine relationships are intentionally fixed independently of implementation metadata.
const primaries = {Culture:'Shepherd',Motivation:'Shepherd',Assessment:'Artisan',Insight:'Artisan',Proof:'Steward',Organization:'Steward',Reliability:'Steward',Energy:'Architect',Momentum:'Architect'};
let checks=0;
function check(label, action) { action(); checks++; }
function focusPages(html) {
  const pages = html.match(/<section class="maps-subcategory-page"[\s\S]*?<\/section>/g) || [];
  return Object.fromEntries(pages.map(page=>[page.match(/<h2>([^<]+)<\/h2>/)[1],page]));
}
function card(page, title) {
  const at=page.indexOf('<h3>'+title+'</h3>');
  assert(at>=0,'missing '+title);
  return page.slice(at,page.indexOf('</article>',at));
}
function mini(cardHtml, title) {
  const match=cardHtml.match(new RegExp('<h4>'+title+'</h4>\\s*<p>([\\s\\S]*?)</p>'));
  assert(match,'missing mini section '+title); return match[1];
}
// Compare against Git's unchanged authored source, not the working-tree content module alone.
check('all authored content equals HEAD',()=>{
  const source=execFileSync('git',['show','HEAD:lib/maps-report/content.ts'],{encoding:'utf8'});
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const baseline={exports:{}};new Function('exports','module',js)(baseline.exports,baseline);
  assert.deepEqual(mapsPhases,baseline.exports.mapsPhases,'shared authored content changed');
});
check('12 categories and public helpers',()=>{
  assert.equal(categories.length,12);
  assert.equal(typeof mapsIndicatorScore,'function','mapsIndicatorScore must be exported');
  assert.equal(typeof mapsReflectionLens,'function','mapsReflectionLens must be exported');
  assert.equal(definition.sections,mapsPhases);
});

// Independent score expectations: arithmetic blend on three slices, original primary elsewhere.
for(const sub of categories) {
  const contributors=blended[sub.name] || [primaries[sub.name]];
  check(sub.name+' has an independently specified score relationship',()=>assert(contributors.every(Boolean),'unmapped category '+sub.name));
  for(let index=0;index<4;index++) for(const score of boundaries) {
    const values=[0,0,0,0]; values[index]=score;
    const expected=contributors.reduce((sum,name)=>sum+values[identities.indexOf(name)],0)/contributors.length;
    check(`${sub.name}: isolated ${identities[index]} ${score}`,()=>{
      const snap=idSnapshot(values), before=JSON.stringify(snap);
      assert.equal(mapsIndicatorScore(sub,snap),expected);
      assert.equal(JSON.stringify(snap),before,'indicator mutated snapshot');
    });
  }
  for(const score of boundaries) check(`${sub.name}: equal scores ${score}`,()=>assert.equal(mapsIndicatorScore(sub,idSnapshot([score,score,score,score])),score));
}
const john=idSnapshot([29,35,33,3]);
for(const [name,expected] of Object.entries({Purpose:31,Development:32,Outcomes:16}))
  check('John synthetic shape '+name,()=>assert.equal(mapsIndicatorScore(categories.find(s=>s.name===name),john),expected));

// Every page must actually use its helper's personal lens, not a generic highest/lowest block.
for(const score of boundaries) {
  const id=idSnapshot([score,score,score,score]);
  const request=input(id),before=JSON.stringify(request),pages=focusPages(build(request));
  check('all focus pages rendered and immutable '+score,()=>{assert.equal(Object.keys(pages).length,12);assert.equal(JSON.stringify(request),before)});
  for(const sub of categories) check(`${sub.name}: lens output wired at ${score}`,()=>{
    const lens=mapsReflectionLens(sub,id),html=card(pages[sub.name],'Reflection Capacity Lens');
    for(const field of ['strength','gap','support']) {
      assert.equal(typeof lens[field],'string');assert(lens[field].trim());
      assert.equal(mini(html,field[0].toUpperCase()+field.slice(1)),escape(lens[field]));
    }
    for(const identity of identities) assert(pages[sub.name].includes(identity));
    assert(pages[sub.name].includes('<em>'+expectedBand(score)+'</em>'));
    for(const term of sub.terms) for(const key of ['name','definition','biblical','capacity','scripture','scriptureSummary'])
      assert(pages[sub.name].includes(escape(term[key])),`${sub.name}: authored ${term.name}.${key} missing`);
    for(const key of ['definition','demandQuestion','capacityNeed','applicationUse'])
      assert(pages[sub.name].includes(escape(sub[key])),`${sub.name}: authored ${key} missing`);
  });
}

// Probe each reflection independently, with stable peers: rank alone cannot substitute for capacity.
for(const sub of categories) for(let i=0;i<4;i++) {
  const seen=new Map();
  for(const score of boundaries) {
    const values=[27,28,29,30];values[i]=score;
    const snap=idSnapshot(values),before=JSON.stringify(snap),lens=mapsReflectionLens(sub,snap);
    check(`${sub.name}: ${identities[i]} ${score} personal lens`,()=>{
      assert.equal(JSON.stringify(snap),before,'reflection lens mutated input');
      for(const field of ['strength','gap','support']) assert.equal(typeof lens[field],'string');
      assert((lens.strength+' '+lens.gap).includes(identities[i]+' ('+expectedBand(score)+')'),`${sub.name}: ${identities[i]} ${score} not given its true band in strength/gap`);
      seen.set(score,JSON.stringify([lens.strength,lens.gap,lens.support]));
    });
  }
  check(`${sub.name}: every ${identities[i]} band changes its lens`,()=>{
    for(const [a,b] of [[9,10],[24,25],[39,40]]) assert.notEqual(seen.get(a),seen.get(b),`${identities[i]} crossing ${a}/${b} did not change ${sub.name}'s reflection lens`);
  });
}
for(const field of ['strength','gap','support']) check('page-specific '+field,()=>{
  const texts=categories.map(sub=>mapsReflectionLens(sub,john)[field]);
  assert.equal(new Set(texts).size,12,field+' still repeated across category pages');
});

// PD score magnitudes are unsigned; the stored tendency, not numeric sign, selects polarity.
const pdCases=[
  {side:'positive',labels:['Strong Dreamer','Strong Feel It','Strong Solo'], strengths:['Imagine the outcome.','Notice conviction and people’s needs.','Take ownership and start independently.'], needs:['Choose one direction from the possibilities.','Test the choice with evidence and counsel.','Add a check-in partner and a clear finish line.']},
  {side:'negative',labels:['Strong Doer','Strong Think It','Strong Together'], strengths:['Find a practical starting point.','Weigh evidence and clear criteria.','Build momentum through shared effort.'], needs:['Make room for a fresh possibility before acting.','Include people’s experience and inner conviction.','Name your own next action and decision space.']},
];
const balancedStrengths=['Connect possibility with practical steps.','Bring conviction and evidence together.','Move between independent and shared work.'];
const balancedNeeds=['Choose vision or detail as this task needs.','Use both people’s needs and clear criteria.','Choose an owner and useful collaboration points.'];
const laneFor=name=>['Purpose','Culture','Motivation','Assessment'].includes(name)?0:['Insight','Development','Proof','Organization'].includes(name)?1:2;
for(const test of pdCases) for(const score of [0,5,6,15,16,60]) {
  const pd=pdSnapshot(test.labels,score),before=JSON.stringify(pd),pages=focusPages(build(input(john,pd)));
  for(const sub of categories) check(`${sub.name}: PD ${test.side} ${score}`,()=>{
    const lane=laneFor(sub.name),html=card(pages[sub.name],'Plan / Decide / Do Lens');
    assert(mini(html,'Strength').startsWith(escape(score<=5?balancedStrengths[lane]:test.strengths[lane]+(score>=16?' A strong default; pause to check fit.':' A preference you can flex.'))));
    assert(mini(html,'Need').startsWith(escape(score<=5?balancedNeeds[lane]:(score>=16?'Support: ':'')+test.needs[lane]+(score>=16?' Build this into the workflow.':' Use a brief check when needed.'))));
  });
  assert.equal(JSON.stringify(pd),before,'PD interpretation mutated input');
}
for(const score of [0,5,6,15,16,60]) {
  const pages=focusPages(build(input(john,pdSnapshot(['Balanced','Balanced','Balanced'],score))));
  for(const sub of categories) check(`${sub.name}: explicit PD balanced ${score}`,()=>{
    const html=card(pages[sub.name],'Plan / Decide / Do Lens');
    assert(mini(html,'Strength').startsWith(escape(balancedStrengths[laneFor(sub.name)])));
    assert(!mini(html,'Need').startsWith('Support: '));
  });
}
for(const pd of [snapshot({}),snapshot({axisScores:{plan:60,decide:60,do:60}})]) {
  const pages=focusPages(build(input(john,pd)));
  for(const sub of categories) check(sub.name+': missing tendency does not infer polarity',()=>{
    const html=card(pages[sub.name],'Plan / Decide / Do Lens');
    assert(mini(html,'Need').startsWith('Review your DesignPD result before choosing support.'));
    assert(mini(html,'Gap').startsWith('Do not assume an opposite-side need.'));
  });
}
for(const values of [[25,25,25,25],[0,0,0,0],[60,60,60,60],[40,40,10,10]]) check('ties remain deterministic and immutable '+values.join('/'),()=>{
  const snap=idSnapshot(values),before=JSON.stringify(snap);
  for(const sub of categories) assert.deepEqual(mapsReflectionLens(sub,snap),mapsReflectionLens(sub,structuredClone(snap)));
  assert.equal(JSON.stringify(snap),before);
});
// A support recommendation also needs to distinguish each relevant capacity band.
// Keep other contributors abundant so a change cannot be attributed to rank or a peer.
const supportBandFailures=[];
for(const sub of categories) for(const identity of blended[sub.name] || [primaries[sub.name]]) {
  const supportAt=score=>{const values=[60,60,60,60];values[identities.indexOf(identity)]=score;return mapsReflectionLens(sub,idSnapshot(values)).support;};
  for(const [a,b] of [[9,10],[24,25],[39,40]]) {
    checks++;
    if(supportAt(a)===supportAt(b)) supportBandFailures.push(`${sub.name}/${identity}: support unchanged across ${a}/${b}`);
  }
}
assert.deepEqual(supportBandFailures,[], 'Relevant reflection support must react across all capacity-band boundaries');
console.log(`PASS MAPS refinement: ${checks} independent checks; 12 category scores, 4 reflection identities x 8 boundary values, three blend anchors, category-specific lenses and exact authored teaching, both PD polarities at all six boundaries, balanced/missing/ties, immutable in-memory fixtures.`);
// Exhaust all 4^4 band combinations; all four identities remain represented on every page.
let matrix=0;
for(const a of [0,15,30,45])for(const b of [0,15,30,45])for(const c of [0,15,30,45])for(const d of [0,15,30,45])for(const sub of categories){
 const lens=mapsReflectionLens(sub,idSnapshot([a,b,c,d]));const text=[lens.interpretation,lens.strength,lens.gap,lens.support].join(' ');
 assert(!/undefined|NaN/.test(text));for(const id of identities)assert(text.includes(id));matrix++;
}
const axisSpecs=[{axisKey:'plan',label:'Plan',scoreKeys:['Plan_Score'],tendencyKeys:['Plan_Tendency']},{axisKey:'decide',label:'Decide',scoreKeys:['Decide_Score'],tendencyKeys:['Decide_Tendency']},{axisKey:'do',label:'Do',scoreKeys:['Do_Score'],tendencyKeys:['Do_Tendency']}];
for(const polarity of pdCases)for(let i=0;i<3;i++){
 const read=score=>report.designPdAxis(pdSnapshot(polarity.labels,score),axisSpecs[i]);
 for(const key of ['strength','need','gap','sidebar'])assert.notEqual(read(6)[key],read(16)[key],axisSpecs[i].label+' '+polarity.side+' '+key+' intensity not distinct');
 assert.equal(read(5).side,'balanced');assert.equal(read(6).intensity,'Moderate');assert.equal(read(15).intensity,'Moderate');assert.equal(read(16).intensity,'Strong');
}
const missingLens=mapsReflectionLens(categories[0],snapshot({}));assert(missingLens.interpretation.includes('unavailable'));assert(missingLens.support.includes('review missing capacity'));
const labels=build(input(john)).match(/<div class="maps-phase-subcategory-strip">[\s\S]*?<\/div>/g);assert.equal(labels.length,4);for(const label of labels)assert.equal((label.match(/<em>\(/g)||[]).length,3);
console.log(`PASS additional: ${matrix} category/band-matrix combinations, all six PD sidebar polarities/intensity pairs, missing reflection data and all 12 opening-page labels.`);

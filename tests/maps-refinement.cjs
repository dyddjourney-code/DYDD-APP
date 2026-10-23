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

// Independently specified mapped relationships, not implementation dictionaries.
const mappedFor=sub=>blended[sub.name] || [primaries[sub.name]];
const actualBands = [0,9,10,24,25,39,40,60];
for(const sub of categories) {
 const mapped=mappedFor(sub);
 for(const score of actualBands) {
  const snap=idSnapshot([score,score,score,score]), before=JSON.stringify(snap);
  const lens=mapsReflectionLens(sub,snap);
  check(sub.name+' actual mapped capacity '+score,()=>{
   for(const name of mapped) {
    assert((score>=25?lens.strength:lens.gap).includes(name+' ('+expectedBand(score)+')'));
    assert(lens.support.includes(name+':'));
   }
   for(const name of identities.filter(n=>!mapped.includes(n))) for(const field of ['strength','gap','support'])
    assert(!lens[field].includes(name),sub.name+' wrongly interprets unmapped '+name+' in '+field);
   if(score>=25)assert(lens.gap.startsWith('No lower-capacity flag'),sub.name+' labels available capacity a gap');
   else assert(lens.strength.startsWith('No mapped capacity'),sub.name+' labels low capacity a strength');
   assert.equal(JSON.stringify(snap),before);
  });
 }
 // Changing every irrelevant reflection/rank must not change this page's interpretation.
 check(sub.name+' independent of global rank',()=>{
  const first=identities.map(n=>mapped.includes(n)?29:0), second=identities.map(n=>mapped.includes(n)?29:60);
  assert.deepEqual(mapsReflectionLens(sub,idSnapshot(first)),mapsReflectionLens(sub,idSnapshot(second)));
 });
 for(const identity of mapped) {
  const supportAt=n=>mapsReflectionLens(sub,idSnapshot(identities.map(x=>x===identity?n:30))).support;
  for(const [a,b] of [[9,10],[24,25],[39,40]])check(sub.name+' '+identity+' support boundary '+a+'/'+b,()=>assert.notEqual(supportAt(a),supportAt(b)));
 }
}
// Editorial anchors are taken from the approved source concepts, not generated strings.
const termAnchors={Purpose:['Calling','Direction','Kingdom Impact'],Culture:['Belonging','Trust','Unity'],Motivation:['Care','Growth','Life-giving'],Assessment:['Discern','Understand','Clarify'],Insight:['Shape','Refine','Adjust'],Development:['Improve','Strengthen','Elevate'],Proof:['Observable','Measurable','Verified'],Organization:['Clear Roles','Ownership','Responsibility'],Reliability:['Consistent','Dependable','Sustainable'],Energy:['Initiative','Activate','Move Forward'],Momentum:['Build','Advance','Multiply'],Outcomes:['Complete','Deliver','Closure']};
const johnPages=focusPages(build(input(john)));
for(const sub of categories)check(sub.name+' useful mapped-term guidance and exact teaching',()=>{
 const lens=mapsReflectionLens(sub,john),html=johnPages[sub.name];
 const prose=[lens.strength,lens.gap,lens.support].join(' ').toLowerCase();
 for(const term of termAnchors[sub.name])assert(prose.includes(term.toLowerCase()),sub.name+' missing contextual '+term);
 for(const field of ['strength','gap','support'])assert.equal(mini(card(html,'Reflection Capacity Lens'),field[0].toUpperCase()+field.slice(1)),escape(lens[field]));
 for(const key of ['definition','demandQuestion','capacityNeed','applicationUse'])assert(html.includes(escape(sub[key])),sub.name+' authored '+key);
 for(const term of sub.terms)for(const key of ['name','definition','biblical','capacity','scripture','scriptureSummary'])assert(html.includes(escape(term[key])),sub.name+' '+term.name+'.'+key);
 const data=html.slice(html.indexOf('<div class="maps-data-grid">'),html.indexOf('<div class="maps-term-grid">'));
 assert(!data.includes('<small>'),'bottom score cards must not duplicate interpretive advice');
 assert(!html.includes('Use clear scope.'));assert(!html.includes('Share ownership; use tools.'));
});
check('John actual capacity interpretation',()=>{
 const lens=name=>mapsReflectionLens(categories.find(x=>x.name===name),john);
 assert(lens('Culture').strength.includes('Shepherd (Steady)'));
 assert(lens('Culture').gap.startsWith('No lower-capacity flag'));
 for(const name of ['Proof','Organization','Reliability']) {assert(lens(name).gap.includes('Steward (Drained)'));assert(!lens(name).strength.includes('Artisan'));}
 for(const name of ['Purpose','Development'])assert(lens(name).strength.includes('Architect (Steady)'));
 assert(lens('Outcomes').strength.includes('Architect (Steady)'));assert(lens('Outcomes').gap.includes('Steward (Drained)'));
 assert(lens('Culture').support.includes('quieter voice'));assert(lens('Culture').support.includes('promise'));
 assert(lens('Proof').support.includes('visible result'));assert(lens('Proof').support.includes('second person'));
});
for(const values of [[25,25,25,25],[0,0,0,0],[60,60,60,60],[40,40,10,10]])check('ties not split by arbitrary rank '+values,()=>{
 for(const sub of categories){const lens=mapsReflectionLens(sub,idSnapshot(values));for(const name of mappedFor(sub)){const n=values[identities.indexOf(name)];assert((n>=25?lens.strength:lens.gap).includes(name+' ('+expectedBand(n)+')'));}}
});
// Exhaust 4^4 actual-band combinations for all 12 pages, including split blends.
let matrix=0;
for(const a of [0,15,30,45])for(const b of [0,15,30,45])for(const c of [0,15,30,45])for(const d of [0,15,30,45])for(const sub of categories){
 const values=[a,b,c,d],lens=mapsReflectionLens(sub,idSnapshot(values));
 assert(!/undefined|NaN/.test(JSON.stringify(lens)));
 for(const name of mappedFor(sub)){const n=values[identities.indexOf(name)];assert((n>=25?lens.strength:lens.gap).includes(name+' ('+expectedBand(n)+')'));}
 matrix++;
}
const polarityCases=[['Strong Dreamer','Strong Feel It','Strong Solo'],['Strong Doer','Strong Think It','Strong Together']];
const axisSpecs=[{axisKey:'plan',label:'Plan',scoreKeys:['Plan_Score'],tendencyKeys:['Plan_Tendency']},{axisKey:'decide',label:'Decide',scoreKeys:['Decide_Score'],tendencyKeys:['Decide_Tendency']},{axisKey:'do',label:'Do',scoreKeys:['Do_Score'],tendencyKeys:['Do_Tendency']}];
for(const labels of polarityCases)for(const magnitude of [0,5,6,15,16,60]){
 const pd=pdSnapshot(labels,magnitude),before=JSON.stringify(pd);
 for(const sub of categories)check(sub.name+' PD polarity/intensity '+labels[0]+'/'+magnitude,()=>{
  const lens=report.mapsMovementLens(sub,pd),page=focusPages(build(input(john,pd)))[sub.name];
  assert.equal(lens.side,magnitude<=5?'balanced':labels===polarityCases[0]?'positive':'negative');
  assert.equal(lens.intensity,magnitude<=5?'Balanced':magnitude<16?'Moderate':'Strong');
  assert.equal(mini(card(page,'Plan / Decide / Do Lens'),'Need'),escape(lens.need));
  assert.equal(lens.need.includes('scheduled check'),magnitude>=16);
  assert.equal(lens.need.includes('brief check'),magnitude>5&&magnitude<16);
  assert.equal(JSON.stringify(pd),before);
 });
}
// Editorial QA found five movement contexts drifting to older/general terms.
// Each polarity must explicitly connect to all three approved authored concepts.
for(const labels of [...polarityCases,['Balanced','Balanced','Balanced']])for(const sub of categories)check(sub.name+' PD all three authored concepts '+labels[0],()=>{
 const lens=report.mapsMovementLens(sub,pdSnapshot(labels,20)),prose=[lens.strength,lens.need,lens.gap].join(' ').toLowerCase();
 for(const term of termAnchors[sub.name])assert(prose.includes(term.toLowerCase()),sub.name+' PD missing '+term);
});
for(const labels of [...polarityCases,['Balanced','Balanced','Balanced']]) {
 const lenses=categories.map(sub=>report.mapsMovementLens(sub,pdSnapshot(labels,20)));
 for(const field of ['strength','need','gap'])check('PD task-specific '+labels[0]+'/'+field,()=>assert.equal(new Set(lenses.map(x=>x[field])).size,12));
}
for(const pd of [snapshot({}),snapshot({axisScores:{plan:60,decide:60,do:60}})])for(const sub of categories)check(sub.name+' missing PD safe',()=>{
 const lens=report.mapsMovementLens(sub,pd);assert.equal(lens.side,null);assert(lens.need.startsWith('Review your DesignPD result'));assert(lens.gap.includes('missing data'));
});
for(const sub of categories)check(sub.name+' missing mapped capacity',()=>{
 const lens=mapsReflectionLens(sub,snapshot({}));assert(lens.interpretation.includes('unavailable'));assert(lens.support.includes('missing score'));assert(!lens.strength.includes('Drained'));
});
for(const labels of polarityCases)for(const [i,axis]of axisSpecs.entries())for(const score of [0,5,6,15,16,60])check('stored unsigned axis '+axis.label+'/'+score,()=>{
 const read=report.designPdAxis(pdSnapshot(labels,score),axis);assert.equal(read.side,score<=5?'balanced':labels===polarityCases[0]?'positive':'negative');
});
check('overall input and source immutability',()=>{const value=input(john,pdSnapshot(polarityCases[1],20)),before=JSON.stringify(value);build(value);assert.equal(JSON.stringify(value),before)});
console.log(`PASS MAPS contextual correction: ${checks} independent checks + ${matrix} category/band combinations. Mapped-only bands, rank independence, ties, split blends, 36 source concepts, all authored teaching, task-specific PD polarity/intensity/missing, score-only bottom panels, immutable fixtures.`);

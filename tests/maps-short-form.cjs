// In-memory fixtures only: no database, authentication, personal score, or email writes.
const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const {buildMapsRoadmapHtml:build,mapsShortFormDefinition:definition}=load('lib/maps-report/report.ts');
const {mapsPhases}=load('lib/maps-report/content.ts');
const participant={id:'local-only',display_name:'Profile QA',normalized_email:null};
const snap=scores=>({id:'fixture',assessment_type:'fixture',scores,created_at:'2026-10-22',source_submitted_at:null,participant_id:null});
const input=(values,tendencies,scores=[18,12,14])=>({participant,designIdSnapshot:snap({scores:Object.fromEntries(['Architect','Artisan','Shepherd','Steward'].map((r,i)=>[r+'_Pts',values[i]]))}),designPdSnapshot:snap({axisTendencies:Object.fromEntries(['plan','decide','do'].map((r,i)=>[r,{tendency:tendencies[i],score:scores[i]}]))})});
const cases=[
 input([45,30,20,5],['Strong Dreamer','Moderate Feel It','Moderate Solo']),
 input([5,20,30,45],['Strong Doer','Moderate Think It','Moderate Together']),
 input([25,25,25,25],['Balanced','Balanced','Balanced'],[0,5,0]),
 input([5,5,5,5],['Strong Doer','Strong Think It','Strong Together'],[25,30,18]),
 input([45,45,45,45],['Moderate Dreamer','Moderate Feel It','Moderate Solo'],[6,6,6]),
];
const html=cases.map(x=>{const before=JSON.stringify(x),out=build(x);assert.equal(JSON.stringify(x),before);return out});
for(const h of html){assert.equal((h.match(/<section class="maps-subcategory-page"/g)||[]).length,12);assert(!h.includes('<h3>Reflection Space</h3>'));assert(!h.includes('movement</dt>'));assert(!h.includes('The report should'));for(const phase of mapsPhases)for(const sub of phase.subcategories)for(const term of sub.terms)for(const key of ['definition','biblical','capacity','scripture','scriptureSummary']){const escaped=term[key].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');assert(h.includes(escaped),`authored ${term.name} ${key} changed`)}}
for(const band of ['Abundant','Steady','Limited','Drained'])assert(html[0].includes(`<em>${band}</em>`));
assert(html[0].includes('scheduled check'));assert(html[1].includes('wider Kingdom Impact'));assert(html[2].includes('No lower-capacity flag'));assert(html[2].includes('Architect (Steady)'));assert(html[3].includes('No mapped capacity'));assert(html[4].includes('ample capacity'));
// Real derived snapshot shape, imported capitalized shape, zero magnitudes and missing data.
const derived=input([40,30,20,10],['Balanced','Balanced','Balanced']);derived.designPdSnapshot=snap({axisTendencies:{plan:'Strong_Doer',decide:'Strong_Think_It',do:'Strong_Together'},axisScores:{plan:18,decide:20,do:25}});assert(build(derived).includes('wider Kingdom Impact'));
const imported=structuredClone(derived);imported.designPdSnapshot=snap({axisTendencies:{Plan:'Moderate Dreamer',Decide:'Moderate Feel It',Do:'Moderate Solo'},scores:{Plan_Score:8,Decide_Score:10,Do_Score:12}});assert(build(imported).includes('Moderate Dreamer (8)'));
const missing=structuredClone(derived);missing.designPdSnapshot=snap({});assert(build(missing).includes('Review your DesignPD result before choosing support.'));
assert.equal(definition.sections,mapsPhases);
console.log('PASS: 12 focus pages, all 36 authored ABC teaching blocks preserved; contrasting ranks, ties, all capacity bands, three opposing PD axes, balanced/zero/missing/derived/imported shapes, intensity-specific support, input immutability.');

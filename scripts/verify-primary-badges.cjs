// Read-only regression: no network, account mutations or external delivery.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const testLoad = require('./fruitlife-test-load.cjs');
const load = (file,mocks={}) => testLoad(file,{'server-only':{},...mocks});
const context = load('lib/assessments/student-context.ts');
const {savedPrimary, savedAssessmentComplete, currentPrimaryAwards} = load('lib/passport/evidence.ts');
const {buildPassportBadges} = load('lib/passport-badges.ts');
const names = ['Architect','Artisan','Shepherd','Steward'];
const design = (id, primary, secondary, points={Architect:38,Artisan:31,Shepherd:19,Steward:12}) => ({id, assessment_type:'designid',created_at:'2026-10-28T00:00:00Z',source_submitted_at:'2026-10-28T00:00:00Z',source:'designid_app',scores:{summary:{Primary:primary,Secondary:secondary},scores:Object.fromEntries(Object.entries(points).map(([k,v])=>[k+'_Pts',v]))}});
const latest=design('latest','Architect','Artisan'), historical=design('historical','Artisan','Architect');
assert.equal(savedPrimary(latest),'Architect');
assert(savedAssessmentComplete(latest,[latest,historical]));
for(const primary of names) {
 const badges=buildPassportBadges({completedAssessments:['designid','spiritual_gifts','fruit_360','designpd'],primaryDesign:primary,earnedBadgeKeys:[...names,'designid','spiritual_gifts','fruit_360','designpd']});
 assert.deepEqual(badges.filter(b=>names.includes(b.title)&&b.state==='earned').map(b=>b.title),[primary]);
 assert.equal(badges.filter(b=>b.kind==='course'&&b.state==='earned').length,0,'Assessment completion never completes courses');
 for(const title of ['DesignID','Spiritual Gifts Assessment','FruitLife360','DesignPD']) assert.equal(badges.find(b=>b.title===title).state,'earned');
}
assert.equal(buildPassportBadges({completedAssessments:[],earnedBadgeKeys:names}).filter(b=>b.state==='earned').length,0,'No saved DesignID cannot gain reflection from stale awards');
assert.equal(buildPassportBadges({completedAssessments:[]}).filter(b=>b.state==='earned').length,0);
const tie=design('tie','Architect','Artisan',{Architect:30,Artisan:30,Shepherd:20,Steward:20});
assert.equal(savedPrimary(tie),'Architect','Exact tie uses saved canonical primary, not two badges');
assert.deepEqual(currentPrimaryAwards(names.map(badge_key=>({badge_key})),savedPrimary(tie)),[{badge_key:'Architect'}]);
let report={all:[latest,historical],latest:[latest]};let ledger=names.map(badge_key=>({badge_key,evidence:{source:'canonical_saved_primary'}})),writes=[];
const db={from(table){const q={select(){return q},eq(){return q},in(){return q},then(resolve){return Promise.resolve({data:table==='passport_awards'?ledger:[],error:null}).then(resolve)},async upsert(rows){writes.push(...rows);return {error:null}}};return q;}};
const {syncPassportAwards}=load('lib/passport/state.ts',{'@/lib/supabase/admin':{createSupabaseAdminClient:()=>db},'@/lib/assessments/student-context':{...context,getAssessmentSnapshotsForUser:async()=>report}});
(async()=>{
 let state=await syncPassportAwards({id:'fixture'});
 assert.deepEqual(state.awards.map(a=>a.badge_key),['Architect']);
 assert.deepEqual(writes.filter(a=>names.includes(a.badge_key)).map(a=>a.badge_key),['Architect'],'Only latest completed primary is newly awarded');
 assert(!writes.some(a=>a.badge_key.includes('-foundations')||a.badge_key.includes('-service')));
 report={all:[],latest:[]};ledger=[];writes=[];
 state=await syncPassportAwards({id:'fresh'});assert.deepEqual(state.awards,[]);assert.deepEqual(writes,[]);
 const {FieldKitCollection}=load('components/field-kit-collection.tsx',{'next/link':({children,prefetch,...props})=>React.createElement('a',props,children)});
 const render=(artifacts)=>renderToStaticMarkup(React.createElement(FieldKitCollection,{artifacts,rounds:[]}));
 const empty=render([]);assert.equal((empty.match(/>Take assessment<\/a>/g)||[]).length,12,'All four missing assessments exposed in mobile summary/details and desktop');
 for(const href of ['/designid','/spiritual-gifts?channel=app','/fruitlife360'])assert(empty.includes('href="'+href+'"'));
 assert(empty.includes('Complete DesignID first to open DesignPD.'));
 const artifact={experienceSlug:'designid-foundations',id:'saved',title:'Saved DesignID',meta:[],detail:'Saved',action:'View snapshot',href:'/snapshot'};
 const returning=render([artifact]);assert(returning.includes('href="/designpd?origin=field-kit"'));assert(!returning.includes('Complete DesignID first to open DesignPD.'));assert.equal((returning.match(/>Take assessment<\/a>/g)||[]).length,9);
 if(process.env.BADGE_QA_HTML_DIR){fs.mkdirSync(process.env.BADGE_QA_HTML_DIR,{recursive:true});fs.writeFileSync(process.env.BADGE_QA_HTML_DIR+'/empty.html',empty);fs.writeFileSync(process.env.BADGE_QA_HTML_DIR+'/returning.html',returning);}
 console.log('PASS primary-only all four designs; stale/historical/secondary excluded; exact tie canonical saved primary; fresh empty; sync awards latest primary only; independent assessment/course milestones; real Field Kit routes and DesignPD prerequisite.');
})().catch(e=>{console.error(e);process.exitCode=1});

const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const {buildPassportBadges} = load('lib/passport-badges.ts');
const names = ['Architect','Artisan','Shepherd','Steward'];
const fresh = buildPassportBadges({completedAssessments:[]});
assert(!fresh.some(b=>b.title==='Design Pathways'));
assert.deepEqual(fresh.filter(b=>names.includes(b.title)).map(b=>b.title),names);
for(const name of names) {
 const badges=buildPassportBadges({completedAssessments:['designid'],primaryDesign:name});
 const i=badges.findIndex(b=>b.title==='DesignID');
 assert.equal(badges[i].state,'earned');
 assert.equal(badges[i+1].title,name);
 assert.equal(badges[i+1].state,'earned');
 assert.equal(badges[i+1].group,'journey');
 assert.equal(badges[i+2].title,'Expertise');
 assert.equal(badges.filter(b=>b.title===name).length,1);
 assert.equal(badges.filter(b=>names.includes(b.title)&&b.group==='extension').length,0);
}
assert.equal(buildPassportBadges({completedAssessments:[],primaryDesign:'Architect'}).find(b=>b.title==='Architect').state,'ahead');
assert.equal(buildPassportBadges({completedAssessments:['designid'],primaryDesign:'unknown'}).filter(b=>names.includes(b.title)&&b.group==='extension').length,4);
const complete = buildPassportBadges({completedAssessments:['designid','spiritual_gifts','fruit_360','designpd'],primaryDesign:'Shepherd',completedCourses:['designid-foundations','spiritual-gifts-service','fruitlife-360-formation','designpd-alignment']});
for (const title of ['DesignID','Spiritual Gifts Assessment','FruitLife360','DesignPD','DesignID Course','Spiritual Gifts Course','FruitLife360 Course','DesignPD Course']) assert.equal(complete.find(b=>b.title===title).state,'earned');
for (const title of ['DesignPD','DesignPD Course']) assert.equal(fresh.find(b=>b.title===title).state,'locked');
const idOnly = buildPassportBadges({completedAssessments:['designid'],primaryDesign:'Shepherd'});
assert.equal(idOnly.find(b=>b.title==='DesignPD').state,'ahead');
assert.equal(idOnly.find(b=>b.title==='DesignID Course').state,'ahead');
assert.equal(complete.filter(b=>names.includes(b.title)).length,1);
assert.equal(new Set(complete.map(b=>b.title)).size,complete.length);
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {DydPassportBook}=load('components/dyd-passport-book.tsx');
for(const [label,badges] of [['fresh',fresh],['earned',complete]]) {
 const html=renderToStaticMarkup(React.createElement(DydPassportBook,{badges}));
 require('node:fs').writeFileSync(`tmp/passport-${label}-fixture.html`,html);
 for(const name of ['Spiritual Gifts','FruitLife360','DesignID']) assert(html.includes(`aria-label="${name} trail badges"`));
 assert(html.includes('Discover Your Divine Design Journey Badges'));
 assert(html.includes('Dig deeper trails'));
 if(label==='earned') {
  assert(!html.includes('Architect badge'));assert(!html.includes('Artisan badge'));assert(!html.includes('Steward badge'));
  assert.equal((html.match(/alt="Shepherd badge"/g)||[]).length,2);
  assert.equal((html.match(/alt="DesignID badge"/g)||[]).length,2);
 }
}
console.log('PASS: shared main/short milestones, all four primary results hide alternatives, distinct course awards, DesignPD prerequisite, unique earned count, rendered trail rows.');

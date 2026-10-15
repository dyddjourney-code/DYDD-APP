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
 assert.equal(badges.filter(b=>names.includes(b.title)&&b.group==='extension').length,3);
}
assert.equal(buildPassportBadges({completedAssessments:[],primaryDesign:'Architect'}).find(b=>b.title==='Architect').state,'ahead');
assert.equal(buildPassportBadges({completedAssessments:['designid'],primaryDesign:'unknown'}).filter(b=>names.includes(b.title)&&b.group==='extension').length,4);
console.log('PASS: four unearned designs; each earned primary moves after DesignID and before Expertise, without duplicate or guessed result; Pathways hidden.');

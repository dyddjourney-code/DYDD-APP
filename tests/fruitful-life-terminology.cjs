// Display-only rename: legacy IDs/routes remain valid; obsolete visible copy cannot return.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const old=/\bfruit[\s_-]*life[\s_-]*360\b/i,short=/\bFruitLife\b/,findings=[];
for(const base of ['app','lib','components']){function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,f.name);if(f.isDirectory())walk(file);else if(/\.tsx?$/.test(file)){const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);function visit(n){if((ts.isStringLiteral(n)||ts.isNoSubstitutionTemplateLiteral(n)||ts.isJsxText(n))&&(old.test(n.text.replace(/(?:https?:\/\/|\{\{base\}\})[^\s]+/g,""))||short.test(n.text))){
 const value=n.text.trim();const compatibility=/^[a-zA-Z0-9_./?=#&:%{}$+@-]+$/.test(value)&&(/[/_]|^(?:collection-|welcome-to-)?fruitlife-?360(?:-formation)?$/.test(value)||file==='lib/passport/state.ts'&&value==='FruitLife360'||file==='lib/passport-badges.ts'&&value==='FruitLife360');
 if(!compatibility)findings.push({file,line:sf.getLineAndCharacterOfPosition(n.pos).line+1,value:value.slice(0,120)});
 }ts.forEachChild(n,visit);}visit(sf);}}}walk(base);}
assert.deepEqual(findings,[],'Obsolete display terminology');
const load=require('../scripts/fruitlife-test-load.cjs');
assert.equal(load('lib/trails/catalog.ts').trailDefinitions.find(t=>t.id==='fruitlife-360').name,'Fruitful Life 360');
const course=load('lib/courses/fruitlife-360-formation.ts').fruitLife360Course;assert.equal(course.slug,'fruitlife-360-formation');assert.equal(course.title,'Fruitful Life 360 Formation');
const badges=load('lib/passport-badges.ts').buildPassportBadges({completedAssessments:['fruit_360'],completedCourses:['fruitlife-360-formation']});assert.equal(badges.find(b=>b.title==='Fruitful Life 360').state,'earned');assert.equal(badges.find(b=>b.title==='Fruitful Life 360 Course').state,'earned');
const copy=load('lib/lifecycle/templates.ts').lifecycleCopy.C04;assert(copy.subject.includes('Fruitful Life 360'));assert(copy.body.includes('/fruitlife360'));
for(const p of ['content/email-service-previews.json']){if(!fs.existsSync(p))continue;const s=fs.readFileSync(p,'utf8');assert(!/FruitLife(?:\s*360)?\b|Fruit\s+Life\s*360/.test(s),p);}
assert(!/\bFruitLife(?:\s*360)?\b/.test(fs.readFileSync('scripts/seed-fruitlife-jordan-demo.mjs','utf8')),'Demo regeneration must keep current display name');
console.log('PASS display terminology across runtime literals, course, trail, current assessment/course badges, generated email copy; legacy routes/keys preserved.');

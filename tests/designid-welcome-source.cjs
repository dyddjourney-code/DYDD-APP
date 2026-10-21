const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),load=require('../scripts/fruitlife-test-load.cjs');
const src=require('../content/designid-foundations/welcome-source-2026-10-21.json');
const rows=src.sheets[0].data[0].rowData;
assert.equal(src.sheets[0].properties.title,'DesignID Course');assert.deepEqual(rows[0].values.map(c=>c.formattedValue),['Module','Lesson','Lesson Title','Lesson Focus','Content','Image URL','Reflection']);
const c=rows[1].values,w=load('lib/courses/designid-welcome.ts').designIdWelcome;
assert.deepEqual(w.focus,['Welcome','Overview']);assert.equal(w.images[0].src,c[5].hyperlink);assert.equal(w.reflection,c[6].formattedValue);
const clean=s=>s.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
for(const l of c[4].formattedValue.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean)){
 if(l==='Welcome to DesignID'||l.startsWith('Your Design Snapshot:')||/^(Primary|Secondary|Integrative) Reflection:/.test(l))continue;
 if(l.startsWith('Inline text image: ')){assert(w.bodyHtml.includes(l.slice(19)));continue;}
 assert(clean(w.bodyHtml).includes(clean(l)),l);
}
assert.equal((w.bodyHtml.match(/<img /g)||[]).length,1);assert(!w.bodyHtml.includes('Shadow'));assert(!w.bodyHtml.includes('Shepherd</dd>'));assert(!w.bodyHtml.includes('Innovator</dd>'));
const q=load('lib/courses/designid-reflection-prompts.ts').getDesignIdReflectionPrompts('welcome-to-designid');assert.deepEqual(q,[{id:'welcome-to-designid-notice',prompt:w.reflection}]);
const {withDesignIdWelcome}=load('lib/reflections/catalog.ts');const old=[{...q[0],prompt:'old',version:'old'},{id:'welcome-to-designid-reflect',prompt:'historic'},{id:'welcome-to-designid-respond',prompt:'historic2'}];const updated=withDesignIdWelcome('designid-foundations',old);assert(updated.length>=3);assert.deepEqual(updated.filter(q=>q.id==='welcome-to-designid-reflect'||q.id==='welcome-to-designid-respond'),old.slice(1));assert.equal(old[0].prompt,'old');assert.equal(withDesignIdWelcome('other',old),old);assert.equal(withDesignIdWelcome('designid-foundations',updated),updated);
for(const path of ['lib/courses/designid-lesson-presentation.ts','lib/courses/designid-foundations.ts']){const tmp=path.replace(/\.ts$/,'.welcome-baseline.ts');fs.writeFileSync(tmp,cp.execFileSync('git',['show','0d55342:'+path]));try{const key=path.includes('presentation')?'designIdLessonPresentation':'designIdCourse';let a=load(path)[key],b=load(tmp)[key];if(key==='designIdCourse'){a=a.modules.flatMap(m=>m.lessons);b=b.modules.flatMap(m=>m.lessons);assert.deepEqual(a.filter(l=>l.slug!=='welcome-to-designid'&&!load('lib/courses/designid-authored-lessons.ts').designIdAuthoredLessons[l.slug]),b.filter(l=>l.slug!=='welcome-to-designid'&&!load('lib/courses/designid-authored-lessons.ts').designIdAuthoredLessons[l.slug]));assert.deepEqual(a[0].companionMoment,b[0].companionMoment);}else{delete a['welcome-to-designid'];delete b['welcome-to-designid'];for(const slug of Object.keys(load('lib/courses/designid-authored-lessons.ts').designIdAuthoredLessons)){delete a[slug];delete b[slug];}assert.deepEqual(a,b)}}finally{fs.unlinkSync(tmp)}}
console.log('PASS current rich headers/row2 focus2/full teaching/inlineimage/reflection1; oldkeys retained; unmodified neighboring lessons+all audio unchanged');

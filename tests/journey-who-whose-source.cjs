const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),load=require('../scripts/fruitlife-test-load.cjs');
const source=require('../content/journey/who-whose-source-2026-10-21.json');
const cells=source.sheets[0].data[1].rowData[0].values;
const units=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.flatMap(m=>m.units);
const u=units.find(x=>x.row===15);
assert.equal(u.slug,'identity-who-vs-whose-16');assert.deepEqual(u.focus,['Who','Whose']);assert.equal(u.media.image,cells[6].hyperlink);
const norm=s=>s.replace(/\s+/g,' ').trim();const body=[u.title,...u.lessonBody.flatMap(b=>b.type==='list'?b.items:b.type==='scripture'?`“${b.text}” — ${b.reference}`:b.text)].join(' ');
for(const line of cells[5].formattedValue.replace(/\r/g,'').split('\n').filter(Boolean).slice(1))assert(norm(body).includes(norm(line.replace(/^• /,''))),line);
const {whoWhoseCare:stages,whoWhosePrayer:prayer}=load('lib/journey/who-whose-care.ts');
assert.equal(norm(stages.map(x=>[x.title,x.explanation,x.question].join('\n')).join('\n')+' Prayer '+prayer),norm(cells[7].formattedValue));
assert.deepEqual(stages.map(s=>s.questionId),['child-of-god-response','old-label-truth','whose-before-who','whose-tomorrow']);
// Compile baseline in-place through the loader; compare all other source units and complete audio.
const ts=require('typescript');const baseline=cp.execFileSync('git',['show','2455cfb:lib/journey/dydd-course-outline.ts'],{encoding:'utf8'});
const tempfile='lib/journey/.who-baseline.ts';fs.writeFileSync(tempfile,baseline);try{const before=load(tempfile).dyddMainCourseOutline.flatMap(m=>m.units);assert.deepEqual(units.filter(x=>x.row!==15),before.filter(x=>x.row!==15));assert.deepEqual(u.companionMoment,before.find(x=>x.row===15).companionMoment);}finally{fs.unlinkSync(tempfile);}
const questions=load('lib/reflections/catalog.ts').getReflectionExperience('discover-your-divine-design').questions;
for(const stage of stages)assert(questions.some(q=>q.id===stage.questionId&&q.prompt===stage.question&&q.lessonSlug===u.slug));
assert.equal(u.lessonBody.filter(b=>b.type==='scripture').length,1);
assert.equal(u.lessonBody.find(b=>b.type==='scripture').reference,'1 John 3:1 (NIV)');
console.log('PASS current row15 body/focus/image/CARE/prayer exact; three preserved IDs plus cataloged Explore; other70 lessons/full audio unchanged');

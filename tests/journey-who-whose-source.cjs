const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),load=require('../scripts/fruitlife-test-load.cjs');
const source=require('../content/journey/who-whose-source-2026-10-21.json');
const cells=source.sheets[0].data[1].rowData[0].values;
const units=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.flatMap(m=>m.units);
const u=units.find(x=>x.row===15);
assert.equal(u.slug,'identity-who-vs-whose-16');assert.deepEqual(u.focus,['Who','Whose']);assert.equal(u.media.image,cells[6].hyperlink);
const norm=s=>s.replace(/\s+/g,' ').trim();const body=[u.title,...u.lessonBody.flatMap(b=>b.type==='list'?b.items:b.text)].join(' ');
for(const line of cells[5].formattedValue.replace(/\r/g,'').split('\n').filter(Boolean).slice(1))assert(norm(body).includes(norm(line.replace(/^• /,''))),line);
const {whoWhoseCare:stages,whoWhosePrayer:prayer}=load('lib/journey/who-whose-care.ts');
assert.equal(norm(stages.map(x=>[x.title,x.explanation,x.question].join('\n')).join('\n')+' Prayer '+prayer),norm(cells[7].formattedValue));
assert.deepEqual(stages.map(s=>s.questionId),['child-of-god-response','old-label-truth','whose-before-who',null]);
// Compile baseline in-place through the loader; compare all other source units and complete audio.
const ts=require('typescript');const baseline=cp.execFileSync('git',['show','2455cfb:lib/journey/dydd-course-outline.ts'],{encoding:'utf8'});
const tempfile='lib/journey/.who-baseline.ts';fs.writeFileSync(tempfile,baseline);try{const before=load(tempfile).dyddMainCourseOutline.flatMap(m=>m.units);assert.deepEqual(units.filter(x=>x.row!==15),before.filter(x=>x.row!==15));assert.deepEqual(u.companionMoment,before.find(x=>x.row===15).companionMoment);}finally{fs.unlinkSync(tempfile);}
assert.equal(cp.execFileSync('git',['diff','2455cfb','--','lib/journey/dydd-journey.ts','lib/reflections','lib/courses/course-companion-moment-data.ts'],{encoding:'utf8'}),'');
console.log('PASS current row15 body/focus/image/CARE/prayer exact; three stable IDs; other70 lessons/full audio/reflection catalog unchanged');

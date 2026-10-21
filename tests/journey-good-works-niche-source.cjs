const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),load=require('../scripts/fruitlife-test-load.cjs');
const source=require('../content/journey/good-works-niche-source-2026-10-21.json');
assert.deepEqual(source.sheets[0].data[0].rowData[0].values.map(c=>c.formattedValue),['Module','Section','Lesson','Lesson Title','Lesson Focus','Content','Image URL','CARE']);
const outline=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline,units=outline.flatMap(m=>m.units);
const norm=s=>s.replace(/\s+/g,' ').trim();
for(const [i,row] of [16,17].entries()){
 const cells=source.sheets[0].data[1].rowData[i].values,u=units.find(u=>u.row===row);
 assert.equal(u.slug,row===16?'identity-good-works-17':'identity-niche-18');assert.equal(u.title,cells[3].formattedValue);assert.deepEqual(u.focus,[cells[4].formattedValue]);assert.equal(u.media.image,cells[6].hyperlink);
 const body=u.lessonBody.flatMap(b=>b.type==='list'?b.items:b.type==='scripture'?[`“${b.text}”`, `— ${b.reference}`]:[b.text]).join(' ');
 for(const line of cells[5].formattedValue.replace(/\r/g,'').split('\n').map(s=>s.trim()).filter(Boolean))assert(norm(body).includes(norm(line.replace(/^• /,''))),line);
 assert(!cells[7].formattedValue,'Current CARE cell is empty: do not invent questions/prayer');
 const module=outline.find(m=>m.units.includes(u));assert.equal(load('lib/journey/workbook-experience.ts').getWorkbookExperience({module,moduleIndex:2,unit:u,unitIndex:i+3,section:u.section,sectionIndex:0}),null);
 assert(!load('lib/reflections/catalog.ts').getReflectionExperience('discover-your-divine-design').questions.some(q=>q.lessonSlug===u.slug),'No invented answer IDs');
}
assert.equal(units.find(u=>u.row===16).lessonBody.find(b=>b.type==='scripture').reference,'Ephesians 2:10');
const tmp='lib/journey/.good-niche-baseline.ts';fs.writeFileSync(tmp,cp.execFileSync('git',['show','940166a:lib/journey/dydd-course-outline.ts'],{encoding:'utf8'}));
try{const before=load(tmp).dyddMainCourseOutline.flatMap(m=>m.units);assert.deepEqual(units.filter(u=>![16,17].includes(u.row)),before.filter(u=>![16,17].includes(u.row)));for(const u of units)assert.deepEqual(u.companionMoment,before.find(b=>b.slug===u.slug).companionMoment);}finally{fs.unlinkSync(tmp)}
console.log('PASS CURRENT headers/rows16/17 full teaching/focus/rich image; empty CARE/prayer respected; stable IDs/catalog/audio and all other69lessons unchanged; no translation suffix added');

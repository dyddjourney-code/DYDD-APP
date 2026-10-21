const assert = require('node:assert/strict');
const fs = require('node:fs');
const load = require('../scripts/fruitlife-test-load.cjs');
const source = require('../content/journey/course-content-2026-10-20.json');
const { dyddMainCourseOutline: outline } = load('lib/journey/dydd-course-outline.ts');
const units = outline.flatMap(m => m.units);
const normalize = s => s.normalize('NFKC').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
for (let row = 2; row <= 14; row++) {
  const cells = source.values[row - 1];
  const unit = units.find(u => u.row === row);
  assert.equal(unit.title, cells[3], `Row ${row} title`);
  assert.deepEqual(unit.focus, cells[4].split(',').map(s => s.trim()).filter(Boolean).length ? cells[4].split(',').map(s => s.trim()).filter(Boolean) : [cells[3]]);
  const body = normalize([unit.title, ...unit.lessonBody.flatMap(b => b.type === 'list' ? b.items : [b.text || '', b.reference || '']), unit.closingScripture?.text || '', unit.closingScripture?.reference || ''].join(' '));
  for (let line of cells[7].split('\n').map(s => s.trim()).filter(Boolean)) {
    if (/^Use this image|^\[Insert Gear|^Dydi audio here/.test(line)) continue;
    line = line.replace('Scripture Call out:', '').replace(/^[•●]\s*/, '');
    assert(body.includes(normalize(line)), `Missing authored content row ${row}: ${line.slice(0, 70)}`);
  }
  const imageUrls = [...cells[8].matchAll(/https:\/\/[^\s]+/g)].map(m => m[0]);
  assert.deepEqual([unit.media.image, ...(unit.media.additionalImages || []).map(i => i.image)], imageUrls, `Row ${row} images`);
}
const identity = outline.find(m => m.slug === 'identity');
const newUnit = identity.units.find(u => u.slug === 'identity-assessment-time-designid');
assert.equal(newUnit.row, 18);assert.equal(newUnit.title, source.values[17][3]);
assert.equal(newUnit.section, 'Identity Assessment');assert.equal(newUnit.contentStatus, undefined);assert(newUnit.lessonBody.length > 0);assert.deepEqual(newUnit.teachingBlocks, []);
assert(newUnit.lessonBody.some(b => b.type === 'paragraph' && b.text.includes('Select Open Connected Trail below')));
assert(newUnit.lessonBody.some(b => b.type === 'list' && b.items.length === 3));
assert.equal(identity.units[identity.units.indexOf(newUnit) + 1].slug, 'identity-the-designid-lens-what-is-in-the-report-19');
assert.equal(new Set(units.map(u => u.slug)).size, units.length);
const resources = units.find(u => u.row === 5);
assert(resources.lessonBody.some(b => b.type === 'image' && b.src.includes('Book+front+cover')));
assert(resources.lessonBody.some(b => b.type === 'link' && b.href === '/gear#books'));
const handiwork = units.find(u => u.slug === 'identity-handiwork-15');
assert(handiwork.lessonBody[0].text.includes('a treasure beyond measure'));
assert.equal(handiwork.companionMoment.transcript.length, 19);
assert.equal(handiwork.companionMomentPosition, 'after-teaching');
// Optional pre-edit snapshot checks every existing ID, reflection prompt/version,
// later lesson and the recorded audio. The snapshot is not shipped to clients.
if (fs.existsSync('tmp/journey-content-before.json')) {
  const before = JSON.parse(fs.readFileSync('tmp/journey-content-before.json'));
  const oldUnits = before.outline.flatMap(m => m.units);
  for (const old of oldUnits) {
    const current = units.find(u => u.slug === old.slug);assert(current, `Lost stable lesson ${old.slug}`);
    if (old.row >= 19 || !['welcome-and-orientation','what-is-dydd','identity'].some(s => before.outline.find(m => m.slug === s)?.units.includes(old))) assert.deepEqual(current, old);
  }
  assert.equal(units.length, oldUnits.length + 1);
  assert.deepEqual(handiwork.companionMoment, oldUnits.find(u => u.slug === handiwork.slug).companionMoment);
  const current = load('lib/reflections/catalog.ts').reflectionExperiences;
  const stable = exps => exps.map(e => ({slug:e.slug,questions:e.questions.map(({lessonTitle, ...q}) => q)}));
  assert.deepEqual(stable(current.map(e=>({...e,questions:e.questions.filter(q=>q.id!=='whose-tomorrow')}))), stable(before.reflections));
}
console.log('PASS all 13 spreadsheet lessons: complete source text/focus/images, inline book/Gear, stable IDs and saved questions, preserved Dydi audio, authored DesignID assessment lesson in its stable slot.');

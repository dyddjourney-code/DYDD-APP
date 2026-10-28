const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const { reflectionReviewQuestions, withCurrentJourneyActivities, getReflectionExperience } = load('lib/reflections/catalog.ts');
const { reflectionExportText } = load('lib/reflections/export.ts');
const { dyddMainCourseOutline } = load('lib/journey/dydd-course-outline.ts');
const { getWorkbookExperience } = load('lib/journey/workbook-experience.ts');
const slug = 'discover-your-divine-design';
const retired = { id: 'welcome-obsolete-lesson-reflection', prompt: 'Original retired prompt', lessonSlug: 'welcome', lessonTitle: 'Original lesson', moduleTitle: 'Welcome', version: 'old' };
const snapshot = [retired, { ...retired, id: 'starting-why' }];
const original = JSON.stringify(snapshot);
const active = reflectionReviewQuestions(slug, snapshot, true);
const expected = new Set(['niche-working-declaration']);
for (const [moduleIndex, module] of dyddMainCourseOutline.entries()) for (const [unitIndex, unit] of module.units.entries()) {
  const workbook = getWorkbookExperience({ module, moduleIndex, unit, unitIndex, section: unit.section, sectionIndex: 0 });
  for (const prompt of workbook?.prompts ?? []) expected.add(prompt.id);
}
assert.deepEqual(new Set(active.map(q => q.id)), expected);
assert(!active.some(q => q.id === retired.id || q.id === 'starting-why'));
for (const slugPart of ['what-is-dydd-how-to-c-a-r-e-10', 'identity-love-your-neighbor-as-yourself-22', 'expertise-applied-capacity-31']) assert(!active.some(q => q.lessonSlug === slugPart));
assert.equal(reflectionReviewQuestions(slug, snapshot, false), snapshot, 'Archive is its actual snapshot, including obsolete lesson prompts');
assert.equal(reflectionReviewQuestions('designid-foundations', snapshot, true), snapshot, 'Other courses unchanged');
const extended = withCurrentJourneyActivities(slug, snapshot);
assert.equal(JSON.stringify(snapshot), original, 'No input snapshot mutation');
assert(extended.some(q => q.id === retired.id && q.prompt === retired.prompt));
assert(active.every(q => extended.some(p => p.id === q.id && p.prompt === q.prompt)));
assert.equal(withCurrentJourneyActivities(slug, extended), extended, 'Idempotent metadata update');
const round = { id: 'current', course_slug: slug, started_at: '2026-10-28T12:00:00Z', questions: extended };
const entry = { round_id: round.id, question_id: retired.id, prompt: retired.prompt, lesson_title: retired.lessonTitle, revision: 1, response: 'Historical answer', saved_at: round.started_at };
const entries = [entry, {...entry, revision: 2, response: 'Later historical answer'}, {...entry, question_id: 'entry-without-snapshot-key', response: 'Recovered orphan answer'}];
const text = reflectionExportText([round], entries, ['current']);
assert(text.includes('EARLIER ACTIVITY ANSWERS'));
for (const value of ['Historical answer', 'Later historical answer', 'Recovered orphan answer', retired.prompt, 'Revision: 1', 'Revision: 2', active[0].prompt]) assert(text.includes(value), value);
assert(!text.includes('Question: Original retired prompt'), 'Retired prompt not an unanswered current task');
const archiveText = reflectionExportText([{...round, id:'archive', questions:snapshot}], [], ['current']);
assert(archiveText.includes('Question: Original retired prompt'), 'Archive export uses frozen questions');
assert(getReflectionExperience(slug).questions.some(q => q.id === 'starting-why'), 'Legacy catalog key retained');
console.log(`PASS current activities: ${active.length} exact source-defined stable keys; no obsolete lesson tasks; additive/idempotent snapshot extension; archives untouched; retired/orphan answers and revisions export.`);

// Exercise the actual export route's single-round current/archive discrimination.
const currentId = '11111111-1111-4111-a111-111111111111';
const archiveId = '22222222-2222-4222-a222-222222222222';
const savedRounds = [{...round, id:currentId}, {...round, id:archiveId, started_at:'2026-10-17T12:00:00Z', questions:snapshot}];
const savedEntries = entries.map(e => ({...e, round_id:currentId}));
function query(table) {
  let filtered = table === 'reflection_rounds' ? savedRounds : savedEntries;
  let one = false;
  const builder = new Proxy({}, {get(_, key) {
    if (key === 'then') return resolve => resolve({data:one ? filtered[0] ?? null : filtered,error:null});
    return (...args) => {
      if (key === 'eq' && args[0] !== 'user_id') filtered = filtered.filter(row => row[args[0]] === args[1]);
      if (key === 'in') filtered = filtered.filter(row => args[1].includes(row[args[0]]));
      if (key === 'limit') filtered = filtered.slice(0,args[0]);
      if (key === 'maybeSingle') one = true;
      return builder;
    };
  }});
  return builder;
}
const route = load('app/api/course-reflections/export/route.ts', {
  '@/lib/reflections/preview':{previewParams:()=>null},
  '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'fixture'}}})},from:query})},
  '@/lib/lifecycle/application-mail':{sendApplicationEmail:async()=>{throw Error('No email expected');}},
});
(async()=>{
  const request=id=>new Request(`https://school.test/api/course-reflections/export?courseSlug=${slug}&scope=round&round=${id}`);
  const currentResponse=await route.GET(request(currentId));
  assert.equal(currentResponse.status,200);
  const currentText=await currentResponse.text();
  assert(currentText.includes(active[0].prompt));
  assert(currentText.includes('EARLIER ACTIVITY ANSWERS'));
  const archiveResponse=await route.GET(request(archiveId));
  assert.equal(archiveResponse.status,200);
  const archive=await archiveResponse.text();
  assert(archive.includes('Question: Original retired prompt'));
  assert(!archive.includes(active[0].prompt),'Single archived export never projected as current');
  console.log('PASS actual export route: current source projection, retired history, single archived-round snapshot preserved (mock DB; no external writes).');
})().catch(error=>{console.error(error);process.exitCode=1;});

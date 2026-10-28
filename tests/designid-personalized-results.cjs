const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const {designIdAuthoredLessons: lessons} = load('lib/courses/designid-authored-lessons.ts');
const {personalizeDesignIdAuthored: render} = load('lib/courses/designid-authored-personalization.ts');
const {buildDesignIdContext} = load('lib/assessments/student-context.ts', {'@/lib/supabase/admin': {}});
// Render saved values, never recalculate or invent bands. Include zero and all scale boundaries.
for (const section of ['summary', 'profileLanguage', 'scores', 'reportPayload', 'root']) {
  for (const [scores, bands, integrated] of [
    [[40, 39, 10, 0], ['Abundant', 'Steady', 'Limited', 'Drained'], 'Visionary'],
    [[60, 25, 24, 9], ['Abundant', 'Steady', 'Limited', 'Drained'], 'Guardian'],
  ]) {
    const names = ['Architect', 'Artisan', 'Shepherd', 'Steward'];
    const saved = {Integrative_Reflection: integrated, Integrative_Expression: 'Saved expression <private> & exact'};
    names.forEach((name, i) => { saved[name + '_Pts'] = scores[i]; saved['Band_' + name] = bands[i]; });
    const snapshot = {assessment_type: 'designid', scores: section === 'root' ? saved : {[section]: saved}};
    const before = JSON.stringify(snapshot);
    const context = {designId: buildDesignIdContext({latest: [snapshot]})};
    const capacity = render(lessons['reflection-capacity'].bodyHtml, context);
    names.forEach((name, i) => assert(capacity.includes(`<dt>${name}</dt><dd>${bands[i]} — ${scores[i]}</dd>`)));
    const html = render(lessons['integrative-reflections'].bodyHtml, context);
    assert(html.includes('<h3>Your Integrated Reflection</h3>'));
    assert(html.includes(`<p data-report="integrated-reflection">${integrated}</p>`));
    assert(html.includes('Saved expression &lt;private&gt; &amp; exact'));
    assert(!html.includes('{{'));
    assert.equal(JSON.stringify(snapshot), before, 'Presentation cannot mutate scores/report');
  }
}
for (const slug of ['reflection-capacity', 'integrative-reflections']) {
  const html = render(lessons[slug].bodyHtml, null);
  assert(html.includes('Not available in your saved report.'));
  assert(!html.includes('{{'));
}
const hostile = render(lessons['integrative-reflections'].bodyHtml, {designId: {integrativeReflection: '<script>unsafe</script>'}});
assert(!hostile.includes('<script>'));
assert(hostile.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
console.log('PASS saved numeric capacity boundaries/zero, ten report-shape/profile cases, integrated result/expression, missing states, escaping and immutable scores');

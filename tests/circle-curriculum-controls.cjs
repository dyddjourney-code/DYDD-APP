const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const load = require('../scripts/fruitlife-test-load.cjs');
const m = load('lib/circles/plan.ts');
const modules = load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline;
const units = modules.flatMap(m => m.units);
const sectionCount = units.filter((u, i) => !i || u.section !== units[i - 1].section || m.circleCurriculum[i].moduleSlug !== m.circleCurriculum[i - 1].moduleSlug).length;
for (let count = 1; count <= 104; count++) {
  const p = { ...m.blankCirclePlan(), name: 'Complete curriculum', startDate: '2026-11-03', rhythm: 'Every other week', meetingCount: count, assignments: m.suggestedAssignments(count) };
  assert.equal(m.validatePlan(p, true), null, `valid ${count}-meeting plan`);
  assert.equal(m.unassignedLessons(p).length, 0);
  const values = m.circleCurriculum.map(l => p.assignments[l.slug]);
  assert.equal(new Set(values).size, Math.min(count, units.length));
  assert(values.every((v, i) => v >= 1 && v <= count && (!i || v >= values[i - 1])));
  if (count <= 7) for (const module of modules) {
    assert.equal(new Set(module.units.map(u => p.assignments[u.slug])).size, 1, `${count}: whole ${module.slug}`);
  }
  if (count >= 8 && count <= sectionCount) for (let i = 1; i < units.length; i++) {
    if (values[i] !== values[i - 1]) assert(units[i].section !== units[i - 1].section || m.circleCurriculum[i].moduleSlug !== m.circleCurriculum[i - 1].moduleSlug, `${count}: authoritative section boundary`);
  }
}
let p = { ...m.blankCirclePlan(), name: 'Preserved', startDate: '2026-11-03', rhythm: 'Every other week' };
assert.equal(m.scheduledDates(p).at(-1), '2027-02-09');
const original = structuredClone(p.assignments);
for (const patch of [
  { rhythm: 'Weekly' }, { startDate: '2026-11-10' },
  { breaks: [{start: '2026-11-24', end: '2026-12-01'}] },
  { movedDates: { 2: '2026-11-18' } },
]) {
  const changed = m.updateCircleCalendar(p, patch);
  assert.deepEqual(changed.assignments, original);
  assert.equal(changed.meetingCount, 8);
  assert.equal(m.validatePlan(changed, true), null);
}
const finish = m.updateCircleCalendar(p, { paceMode: 'finish' });
assert.equal(finish.finishDate, '2027-02-09');
const holiday = m.updateCircleCalendar(finish, { breaks: [{start: '2026-12-01', end: '2026-12-29'}] });
assert.equal(holiday.finishDate, '2027-03-23');
assert.deepEqual(holiday.assignments, original);
assert.equal(m.validatePlan(holiday, true), null);
assert.deepEqual(m.resizeCirclePlan(p, 12).assignments, m.suggestedAssignments(12));
p = { ...p, assignments: { ...p.assignments, [m.circleCurriculum[0].slug]: 3 } };
const custom = m.resizeCirclePlan(p, 5);
for (const [slug, n] of Object.entries(p.assignments)) assert.equal(custom.assignments[slug], Math.min(n, 5));
const stale = structuredClone(p);
delete stale.assignments['identity-assessment-time-designid'];
stale.curriculum = stale.curriculum.filter(l => l.slug !== 'identity-assessment-time-designid');
const reopened = m.normalizePlan(stale);
assert.equal(m.unassignedLessons(reopened).length, 0);
assert.equal(reopened.assignments[m.circleCurriculum[0].slug], 3);
assert.equal(reopened.assignments['identity-assessment-time-designid'], 2);
assert.deepEqual(m.normalizePlan(JSON.parse(JSON.stringify(reopened))), reopened);
assert.throws(() => m.suggestedAssignments(0), RangeError);
assert.throws(() => m.suggestedAssignments(105), RangeError);

const time = load('components/circle-time-picker.tsx', { './circle-time-picker.module.css': {}, react: { ...React, useId: () => 'circle-time-qa' } });
for (let h = 0; h < 24; h++) for (let minute = 0; minute < 60; minute++) {
  const value = `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const parts = time.timeParts(value);
  assert.equal(time.meetingTime(parts.hour, parts.minute, parts.period), value);
}
for (const [value, h, period] of [['00:00', '12', 'AM'], ['12:00', '12', 'PM'], ['19:30', '7', 'PM']]) {
  const html = renderToStaticMarkup(React.createElement(time.CircleTimePicker, { value, onChange() {} }));
  assert(html.includes('<legend>Choose time</legend>'));
  for (const label of ['Hour', 'Minute', 'AM/PM']) assert(html.includes(`>${label}<select`));
  assert(html.includes(`value="${h}" selected=""`));
  assert(html.includes(`<option selected="">${period}</option>`));
  const ids = [...html.matchAll(/<select id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 3);
  for (const id of ids) assert(html.includes(`for="${id}"`));
}
function elements(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
}
let chosen;
let picker = elements(time.CircleTimePicker({ value: '19:30', onChange: v => chosen = v }));
picker.find(e => e.props?.id === 'circle-time-qa-period').props.onChange({ target: { value: 'AM' } });
assert.equal(chosen, '07:30');
picker = elements(time.CircleTimePicker({ value: '', onChange: v => chosen = v }));
picker.find(e => e.props?.id === 'circle-time-qa-hour').props.onChange({ target: { value: '12' } });
assert.equal(chosen, '12:00');
picker = elements(time.CircleTimePicker({ value: chosen, onChange: v => chosen = v }));
picker.find(e => e.type === 'button').props.onClick();
assert.equal(chosen, '');
const { CircleScheduleEditor } = load('components/circle-schedule-editor.tsx', {
  react: { ...React, useState: value => [value, () => {}] },
});
let changed;
let editor = elements(CircleScheduleEditor({ plan: p, change: v => changed = v }));
editor.find(e => e.props?.id === 'meeting-count').props.onChange({ target: { value: '5' } });
assert.deepEqual(changed.assignments, custom.assignments);
editor.find(e => e.props?.['aria-label'] === 'Date for meeting 2').props.onChange({ target: { value: '2026-11-18' } });
assert.equal(changed.movedDates['2'], '2026-11-18');
assert.deepEqual(changed.assignments, p.assignments);
editor = elements(CircleScheduleEditor({ plan: finish, change: v => changed = v }));
editor.find(e => e.type === 'button' && e.props.children === 'Skip this date').props.onClick();
assert.equal(changed.meetingCount, finish.meetingCount);
assert.deepEqual(changed.assignments, finish.assignments);
assert.equal(m.validatePlan(changed, true), null);
editor.find(e => e.props?.id === 'finish-date').props.onChange({ target: { value: '2026-12-29' } });
assert.equal(changed.meetingCount, 5);
assert.equal(m.unassignedLessons(changed).length, 0);
assert.equal(m.validatePlan(changed, true), null);
const moved = { ...finish, movedDates: { 2: '2026-11-18' } };
editor = elements(CircleScheduleEditor({ plan: moved, change: v => changed = v }));
editor.filter(e => e.type === 'button' && e.props.children === 'Skip this date')[1].props.onClick();
assert.equal(m.scheduledDates(changed)[1], '2026-12-01', 'Skipping a moved date must not revert to its old regular date');
assert.deepEqual(changed.assignments, moved.assignments);
assert.equal(m.validatePlan(changed, true), null);
editor.find(e => e.props?.id === 'finish-date').props.onChange({ target: { value: '2027-02-10' } });
assert.deepEqual(changed.movedDates, moved.movedDates, 'Explicit target preserves still-valid manual dates');
console.log('PASS: real editor events (count, finish target, skip, moved date) and time selection/clear.');
console.log('PASS: all 104 meeting counts; canonical modules/sections; complete reopen; biweekly/holiday/finish/date preservation; custom resize; all 1440 time round-trips and visible accessible labels.');

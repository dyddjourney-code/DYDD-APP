const assert = require("node:assert/strict"),
  load = require("../scripts/fruitlife-test-load.cjs");
const m = load("lib/circles/plan.ts");
let p = { ...m.blankCirclePlan(), name: "QA Circle", startDate: "2026-11-03" };
assert.equal(m.validatePlan(p, true), null);
assert.equal(m.circleCurriculum.length, 71);
assert.equal(m.circleCurriculum.find(l => l.slug === "identity-assessment-time-designid")?.moduleSlug, "identity");
assert.equal(p.assignments["identity-assessment-time-designid"], 2);
assert.equal(p.meetingCount, 8);
assert.equal(m.meetingLessons(p, 7).every(l => l.moduleSlug === "niche" && !l.slug.includes("congratulations")), true);
assert.deepEqual(m.meetingLessons(p, 8).map(l => l.slug), ["niche-congratulations-75", "niche-prayer-76", "niche-whats-next-77"]);
assert(m.meetingLessons(p, 7).length > 0);
assert.equal(m.normalizePlan({...p,meetingCount:7,assignments:m.suggestedAssignments(7)}).meetingCount, 7);
assert.equal(m.meetingLessons(p, 1).length, 11);
assert.equal(m.meetingLessons(p, 2)[0].moduleSlug, "identity");
assert.equal(m.scheduledDates(p).at(-1), "2026-12-22");
p.breaks = [{ start: "2026-11-24", end: "2026-12-01" }];
assert.equal(m.scheduledDates(p).at(-1), "2027-01-05");
assert.equal(m.scheduledDates(p)[3], "2026-12-08");
p.breaks = [];
p.paceMode = "finish";
p.finishDate = "2026-12-01";
assert.equal(m.countUntil(p), 5);
p.meetingCount = 5;
p.assignments = m.suggestedAssignments(5);
assert.equal(m.validatePlan(p, true), null);
assert.equal(m.scheduledDates(p).at(-1), "2026-12-01");
assert.equal(m.unassignedLessons(p).length, 0);
p.movedDates = { 2: "2026-11-03" };
assert.match(m.validatePlan(p, true), /order/);
p.movedDates = { 2: "2026-11-11" };
assert.equal(m.validatePlan(p, true), null);
p.assignments[m.circleCurriculum[0].slug] = 0;
assert.match(m.validatePlan(p, true), /every current lesson/);
assert.equal(m.validatePlan(p), null);
p = { ...m.blankCirclePlan(), name: "DST", startDate: "2026-10-27" };
assert.deepEqual(m.scheduledDates(p).slice(0, 3), [
  "2026-10-27",
  "2026-11-03",
  "2026-11-10",
]);
p.breaks = [{ start: "2026-12-10", end: "2026-11-10" }];
assert.match(m.validatePlan(p), /break/);
p = {
  ...m.blankCirclePlan(),
  name: "Couple",
  format: "Couple",
  expectedPeople: "2",
  startDate: "2026-11-03",
  participants: [
    { name: "One", email: "one@example.com" },
    { name: "Two", email: "two@example.com" },
  ],
};
assert.match(m.validatePlan(p, true), /people/);
p = { ...m.blankCirclePlan(), name: "New lessons", startDate: "2026-11-03" };
delete p.assignments[m.circleCurriculum.at(-1).slug];
assert.equal(m.unassignedLessons(p).length, 1);
assert.match(m.validatePlan(p, true), /every current lesson/);
const pdf = load("lib/circles/pdf.ts").circlePlanHtml({
  ...m.blankCirclePlan(),
  name: "<script>evil</script>",
  startDate: "2026-11-03",
});
assert(!pdf.includes("<script>evil"));
assert(pdf.includes("&lt;script&gt;"));
console.log(
  "PASS curriculum coverage, initial module grouping, breaks, finish dates, moves, DST, new/unassigned lessons, group limits, PDF escaping",
);

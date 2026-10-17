const assert = require("node:assert/strict");
const load = require("../scripts/fruitlife-test-load.cjs");
const { reflectionExperiences } = load("lib/reflections/catalog.ts");
const { learningCourses } = load("lib/courses/course-catalog.ts");
const { designIdCourse } = load("lib/courses/designid-foundations.ts");
const { dyddMainCourseOutline } = load("lib/journey/dydd-course-outline.ts");
const { getWorkbookExperience } = load("lib/journey/workbook-experience.ts");
assert.equal(reflectionExperiences.length, 5);
for (const e of reflectionExperiences) {
  assert(e.questions.length > 0);
  assert.equal(new Set(e.questions.map((q) => q.id)).size, e.questions.length);
  for (const q of e.questions)
    assert(q.id && q.prompt && q.lessonSlug && q.version);
}
const journey = reflectionExperiences[0];
for (const [moduleIndex, module] of dyddMainCourseOutline.entries())
  for (const [unitIndex, unit] of module.units.entries()) {
    const workbook = getWorkbookExperience({
      module,
      moduleIndex,
      unit,
      unitIndex,
      section: unit.section,
      sectionIndex: 0,
    });
    for (const p of workbook?.prompts ?? [])
      assert(
        journey.questions.find((q) => q.id === p.id && q.prompt === p.label),
        `Missing Journey workbook question ${p.id}`,
      );
    if (unit.reflectionPrompt)
      assert(
        journey.questions.some(
          (q) =>
            q.lessonSlug === unit.slug && q.prompt === unit.reflectionPrompt,
        ),
      );
  }
const { getDesignIdReflectionPrompts } = load(
  "lib/courses/designid-reflection-prompts.ts",
);
for (const lesson of designIdCourse.modules.flatMap((m) => m.lessons))
  for (const prompt of getDesignIdReflectionPrompts(lesson.slug))
    assert(
      reflectionExperiences
        .find((e) => e.slug === designIdCourse.slug)
        .questions.some(
          (q) => q.id === prompt.id && q.prompt === prompt.prompt,
        ),
    );
for (const slug of [
  "spiritual-gifts-service",
  "fruitlife-360-formation",
  "designpd-alignment",
]) {
  const course = learningCourses.find((c) => c.slug === slug),
    e = reflectionExperiences.find((e) => e.slug === slug);
  for (const lesson of course.modules
    .flatMap((m) => m.lessons)
    .filter((l) => l.reflectionPrompt))
    assert(
      e.questions.some(
        (q) => q.id === lesson.slug && q.prompt === lesson.reflectionPrompt,
      ),
    );
}
console.log(
  "PASS: all five experiences; every published lesson/workbook question; unique stable IDs and question versions.",
);

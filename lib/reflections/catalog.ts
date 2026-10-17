import { getDesignIdReflectionPrompts } from "@/lib/courses/designid-reflection-prompts";
import { dyddJourney } from "@/lib/journey/dydd-journey";
import { learningCourses } from "@/lib/courses/course-catalog";
import { designIdCourse } from "@/lib/courses/designid-foundations";
import { dyddMainCourseOutline } from "@/lib/journey/dydd-course-outline";
import { getWorkbookExperience } from "@/lib/journey/workbook-experience";

export type ReflectionQuestion = {
  id: string;
  lessonSlug: string;
  lessonTitle: string;
  moduleTitle: string;
  prompt: string;
  version: string;
};
export type ReflectionExperience = {
  slug: string;
  title: string;
  href: string;
  questions: ReflectionQuestion[];
};
const questionVersion = "2026-10-17";
const journeyQuestions: ReflectionQuestion[] = [];
for (const [moduleIndex, module] of dyddMainCourseOutline.entries()) {
  for (const [unitIndex, unit] of module.units.entries()) {
    if (unit.reflectionPrompt)
      journeyQuestions.push({
        id: `${unit.slug}-lesson-reflection`,
        lessonSlug: unit.slug,
        lessonTitle: unit.title,
        moduleTitle: module.title,
        prompt: unit.reflectionPrompt,
        version: questionVersion,
      });
    const experience = getWorkbookExperience({
      module,
      moduleIndex,
      unit,
      unitIndex,
      section: unit.section,
      sectionIndex: 0,
    });
    for (const prompt of experience?.prompts ?? []) {
      // A repeated workbook prompt represents one answer, shown at each relevant lesson.
      if (!journeyQuestions.some((q) => q.id === prompt.id))
        journeyQuestions.push({
          id: prompt.id,
          lessonSlug: unit.slug,
          lessonTitle: unit.title,
          moduleTitle: module.title,
          prompt: prompt.label,
          version: questionVersion,
        });
    }
  }
}
// Include supplementary chapter prompts from the original workbook too.
for (const stage of dyddJourney.stages) {
  const module = dyddMainCourseOutline.find(
    (m) =>
      m.slug ===
      (stage.slug === "welcome" ? "welcome-and-orientation" : stage.slug),
  );
  for (const prompt of [
    ...stage.prompts,
    ...stage.sections.flatMap((section) => section.prompts),
    ...(stage.pathfinder?.prompts ?? []),
  ]) {
    if (!journeyQuestions.some((q) => q.id === prompt.id))
      journeyQuestions.push({
        id: prompt.id,
        lessonSlug:
          module?.units[0]?.slug ?? dyddMainCourseOutline[0].units[0].slug,
        lessonTitle: module?.units[0]?.title ?? stage.title,
        moduleTitle: module?.title ?? stage.title,
        prompt: prompt.label,
        version: questionVersion,
      });
  }
}
journeyQuestions.push({
  id: "niche-working-declaration",
  lessonSlug:
    dyddMainCourseOutline
      .flatMap((m) => m.units)
      .find(
        (u) =>
          u.type === "pathfinder" && u.section === "Step in to your purpose",
      )?.slug ?? "niche",
  lessonTitle: "My working niche declaration",
  moduleTitle: "Niche",
  prompt: "My working niche declaration",
  version: questionVersion,
});
// Keep supplementary prompts beside their chapter, not at the end of the workbook.
const journeyLessonOrder = dyddMainCourseOutline.flatMap((m) =>
  m.units.map((u) => u.slug),
);
journeyQuestions.sort(
  (a, b) =>
    journeyLessonOrder.indexOf(a.lessonSlug) -
    journeyLessonOrder.indexOf(b.lessonSlug),
);
export const reflectionExperiences: ReflectionExperience[] = [
  {
    slug: "discover-your-divine-design",
    title: "Discover Your Divine Design",
    href: "/journey",
    questions: journeyQuestions,
  },
  {
    slug: designIdCourse.slug,
    title: "DesignID",
    href: `/courses/${designIdCourse.slug}`,
    questions: designIdCourse.modules.flatMap((m) =>
      m.lessons.flatMap((l) =>
        getDesignIdReflectionPrompts(l.slug).map((prompt) => ({
          id: prompt.id,
          lessonSlug: l.slug,
          lessonTitle: l.title,
          moduleTitle: m.title,
          prompt: prompt.prompt,
          version: questionVersion,
        })),
      ),
    ),
  },
  ...[
    "spiritual-gifts-service",
    "fruitlife-360-formation",
    "designpd-alignment",
  ].map((slug) => {
    const c = learningCourses.find((c) => c.slug === slug)!;
    return {
      slug,
      title: slug.startsWith("spiritual")
        ? "Spiritual Gifts"
        : slug.startsWith("fruit")
          ? "FruitLife360"
          : "DesignPD",
      href: `/courses/${slug}`,
      questions: c.modules.flatMap((m) =>
        m.lessons
          .filter((l) => l.reflectionPrompt)
          .map((l) => ({
            id: l.slug,
            lessonSlug: l.slug,
            lessonTitle: l.title,
            moduleTitle: m.title,
            prompt: l.reflectionPrompt!,
            version: questionVersion,
          })),
      ),
    };
  }),
];
export function getReflectionExperience(slug: string) {
  return reflectionExperiences.find((c) => c.slug === slug);
}

export function reflectionLessonExists(courseSlug: string, lessonSlug: string) {
  if (courseSlug === "discover-your-divine-design")
    return dyddMainCourseOutline.some((m) =>
      m.units.some((u) => u.slug === lessonSlug),
    );
  if (courseSlug === designIdCourse.slug)
    return designIdCourse.modules.some((m) =>
      m.lessons.some((l) => l.slug === lessonSlug),
    );
  return (
    learningCourses
      .find((c) => c.slug === courseSlug)
      ?.modules.some((m) => m.lessons.some((l) => l.slug === lessonSlug)) ??
    false
  );
}

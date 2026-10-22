import { designIdAuthoredLessons } from "@/lib/courses/designid-authored-lessons";
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
          prompt: experience?.kind === "pathfinder" && prompt.helper ? `${prompt.label}\n${prompt.helper}` : prompt.label,
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
          version: (designIdAuthoredLessons[l.slug]?.sourceRow ?? 0) >= 9 ? "2026-10-22" : l.slug === "welcome-to-designid" || designIdAuthoredLessons[l.slug] ? "2026-10-21" : "2026-10-19",
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

/** Add this pilot's new prompt only; never rewrite historical prompts or other courses. */
export function withWhoWhoseExplore(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "discover-your-divine-design" || questions.some(q => q.id === "whose-tomorrow")) return questions;
  const explore = getReflectionExperience(courseSlug)?.questions.find(q => q.id === "whose-tomorrow");
  if (!explore) return questions;
  const anchor = questions.findIndex(q => q.id === "whose-before-who");
  return [...questions.slice(0, anchor + 1), explore, ...questions.slice(anchor + 1)];
}

/** Refresh approved current DesignID prompt metadata, retaining retired keys and historic entries. */
export function withDesignIdWelcome(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "designid-foundations") return questions;
  const approved = getReflectionExperience(courseSlug)!.questions.filter(q => q.lessonSlug === "welcome-to-designid" || designIdAuthoredLessons[q.lessonSlug]);
  let result = questions;
  for (const canonical of approved) {
    const old = result.find(q => q.id === canonical.id);
    if (old?.prompt === canonical.prompt && old.version === canonical.version) continue;
    result = old ? result.map(q => q.id === canonical.id ? canonical : q) : [...result, canonical];
  }
  return result;
}

/** Upgrade only the current Lens snapshot. Entries retain their original prompt and revisions. */
export function withDesignIdLens(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "discover-your-divine-design") return questions;
  const approved = getReflectionExperience(courseSlug)!.questions.filter(q => q.lessonSlug === "identity-the-designid-lens-what-is-in-the-report-19");
  let result = questions;
  for (const canonical of approved) {
    const old = result.find(q => q.id === canonical.id);
    if (old?.prompt === canonical.prompt) continue;
    result = old ? result.map(q => q.id === canonical.id ? canonical : q) : [...result, canonical];
  }
  return result;
}

/** Current authored lesson metadata only; answers, revisions, and archived rounds stay intact. */
export function withIdentityBelievers(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "discover-your-divine-design") return questions;
  const approved = getReflectionExperience(courseSlug)!.questions.filter(q => q.lessonSlug === "identity-identity-among-believers-20");
  let result = questions;
  for (const canonical of approved) {
    const old = result.find(q => q.id === canonical.id);
    if (old?.prompt === canonical.prompt) continue;
    result = old ? result.map(q => q.id === canonical.id ? canonical : q) : [...result, canonical];
  }
  return result;
}

/** Current authored lesson metadata only; answers, revisions, and archived rounds stay intact. */
export function withDesignReflectionsLove(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "discover-your-divine-design") return questions;
  const approved = getReflectionExperience(courseSlug)!.questions.filter(q => q.lessonSlug === "identity-the-design-reflections-and-love-21");
  let result = questions;
  for (const canonical of approved) {
    const old = result.find(q => q.id === canonical.id);
    if (old?.prompt === canonical.prompt) continue;
    result = old ? result.map(q => q.id === canonical.id ? canonical : q) : [...result, canonical];
  }
  return result;
}

/** Current authored lesson metadata only; answers, revisions, and archived rounds stay intact. */
export function withOneAnother(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "discover-your-divine-design") return questions;
  const approved = getReflectionExperience(courseSlug)!.questions.filter(q => q.lessonSlug === "identity-reflections-and-one-anothering-23");
  let result = questions;
  for (const canonical of approved) {
    const old = result.find(q => q.id === canonical.id);
    if (old?.prompt === canonical.prompt) continue;
    result = old ? result.map(q => q.id === canonical.id ? canonical : q) : [...result, canonical];
  }
  return result;
}

/** Refresh current Pathfinder metadata without removing retired questions or answers. */
export function withPathfinder(courseSlug: string, questions: ReflectionQuestion[]) {
  if (courseSlug !== "discover-your-divine-design") return questions;
  const approved = getReflectionExperience(courseSlug)!.questions.filter(q => ["identity-declaration", "identity-service-reflections", "identity-love-for-others"].includes(q.id) || q.lessonSlug.startsWith("niche-"));
  let result = questions;
  for (const canonical of approved) {
    const old = result.find(q => q.id === canonical.id);
    if (old?.prompt === canonical.prompt) continue;
    result = old ? result.map(q => q.id === canonical.id ? canonical : q) : [...result, canonical];
  }
  return result;
}

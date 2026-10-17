import { designIdLessonBodies } from "./designid-source-html";
const clean = (text: string) =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
/** Source headings are deliberately narrow: teaching questions are not automatically workbook fields. */
export function getDesignIdReflectionPrompts(lessonSlug: string) {
  const source =
    designIdLessonBodies[lessonSlug as keyof typeof designIdLessonBodies] ?? "";
  const prompts = Array.from(
    source.matchAll(
      /<h[234][^>]*>([\s\S]*?)<\/h[234]>\s*<p[^>]*>([\s\S]*?)<\/p>/g,
    ),
  )
    .filter((match) => /^(Reflect|Notice|Respond)$/i.test(clean(match[1])))
    .map((match) => ({
      id: `${lessonSlug}-${clean(match[1]).toLowerCase()}`,
      prompt: clean(match[2]),
    }));
  return prompts.length
    ? prompts
    : [{ id: lessonSlug, prompt: "Where do you see this in real life?" }];
}

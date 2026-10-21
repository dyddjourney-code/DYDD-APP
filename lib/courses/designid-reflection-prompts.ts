import { designIdWelcome } from "./designid-welcome";
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
const lessonPrompts: Record<string, string> = {
  "what-is-in-the-report": "Which part of your DesignID report would you most like to understand, and what would that clarity help you do?",
  "your-design-profile": "Where do you recognize your primary and secondary reflections in a recent experience?",
  "reflection-capacity": "Where does your current capacity invite you to set a boundary, receive help, or make room for rest?",
  "exploring-the-dydd-ecosystem": "Which part of the DYDD journey connects most closely with what God is inviting you to explore next?",
  "call-to-arms": "What is one faithful step you will take with what God has revealed through your DesignID?",
};
export function getDesignIdReflectionPrompts(lessonSlug: string) {
  if (lessonSlug === "welcome-to-designid") return [{ id: "welcome-to-designid-notice", prompt: designIdWelcome.reflection }];
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
    : [{ id: lessonSlug, prompt: lessonPrompts[lessonSlug] ?? "What is one practical step this lesson invites you to take?" }];
}

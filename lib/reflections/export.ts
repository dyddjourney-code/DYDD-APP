import type { ReflectionEntry, ReflectionRound } from "./types";
import { getReflectionExperience } from "./catalog";

export function reflectionExportText(
  rounds: ReflectionRound[],
  entries: ReflectionEntry[],
) {
  const dated = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "America/New_York",
    }).format(new Date(value)) + " Eastern";
  const lines = [
    "DISCOVER YOUR DIVINE DESIGN — MY REFLECTIONS",
    `Exported ${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "America/New_York" }).format(new Date())}`,
    "Saved answers only. Unsaved drafts are not included.",
    "",
  ];
  for (const round of rounds) {
    lines.push(
      "=".repeat(60),
      getReflectionExperience(round.course_slug)?.title ?? round.course_slug,
      `Walkthrough started: ${dated(round.started_at)}`,
    );
    if (round.assessment_label)
      lines.push(`Connected report: ${round.assessment_label}`);
    const latest = new Map<string, ReflectionEntry>();
    for (const entry of entries)
      if (
        entry.round_id === round.id &&
        (!latest.has(entry.question_id) ||
          latest.get(entry.question_id)!.revision < entry.revision)
      )
        latest.set(entry.question_id, entry);
    let module = "",
      lesson = "";
    for (const question of round.questions) {
      if (module !== question.moduleTitle) {
        module = question.moduleTitle;
        lines.push("", `MODULE: ${module}`);
        lesson = "";
      }
      if (lesson !== question.lessonTitle) {
        lesson = question.lessonTitle;
        lines.push("", `Lesson: ${lesson}`);
      }
      const answer = latest.get(question.id);
      lines.push(
        "",
        `Question: ${question.prompt}`,
        "Answer:",
        answer?.response || "[Not answered in this walkthrough]",
      );
      if (answer) lines.push(`Saved: ${dated(answer.saved_at)}`);
    }
    lines.push("");
  }
  if (!rounds.length) lines.push("No saved reflection walkthroughs yet.");
  return lines.join("\n");
}

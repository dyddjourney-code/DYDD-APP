import type { ReflectionEntry, ReflectionRound } from "./types";
import { getReflectionExperience, reflectionReviewQuestions } from "./catalog";

export function reflectionExportText(
  rounds: ReflectionRound[],
  entries: ReflectionEntry[],
  currentRoundIds: string[] = [],
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
    const questions = reflectionReviewQuestions(round.course_slug, round.questions, currentRoundIds.includes(round.id));
    for (const question of questions) {
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
      if (answer) {
        if (answer.prompt && answer.prompt !== question.prompt) lines.push(`Question when saved: ${answer.prompt}`);
        lines.push(`Saved: ${dated(answer.saved_at)}`);
      }
    }
    const shown = new Set(questions.map(q => q.id));
    const historical = entries.filter(e => e.round_id === round.id && !shown.has(e.question_id));
    if (historical.length) {
      lines.push("", "EARLIER ACTIVITY ANSWERS (preserved history)");
      for (const id of new Set(historical.map(e => e.question_id))) {
        for (const entry of historical.filter(e => e.question_id === id).sort((a, b) => b.revision - a.revision)) {
          lines.push("", `Lesson: ${entry.lesson_title}`, `Question when saved: ${entry.prompt}`, `Revision: ${entry.revision}`, "Answer:", entry.response || "[Answer left blank]", `Saved: ${dated(entry.saved_at)}`);
        }
      }
    }
    lines.push("");
  }
  if (!rounds.length) lines.push("No saved reflection walkthroughs yet.");
  return lines.join("\n");
}

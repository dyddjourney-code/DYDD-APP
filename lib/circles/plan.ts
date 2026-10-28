import { dyddMainCourseOutline } from "@/lib/journey/dydd-course-outline";

export type CircleLesson = {
  slug: string;
  title: string;
  moduleSlug: string;
  moduleTitle: string;
  duration: string;
};
export const circleCurriculum: CircleLesson[] = dyddMainCourseOutline.flatMap(
  (m) =>
    m.units.map((u) => ({
      slug: u.slug,
      title: u.title,
      moduleSlug: m.slug,
      moduleTitle: m.title,
      duration: u.duration,
    })),
);
export const completionGoals = [
  "Finish assigned content before each meeting",
  "Work through assigned content together",
  "Begin together; finish before the next meeting",
  "Custom goal",
];
export const circleSizes: Record<
  string,
  { min: number; max: number; label: string }
> = {
  Couple: { min: 2, max: 2, label: "2 people" },
  "Small group": { min: 3, max: 19, label: "3–19 people" },
  Class: { min: 20, max: Infinity, label: "20+ people" },
};
export type CirclePlan = {
  name: string;
  format: string;
  startDate: string;
  time: string;
  timezone: string;
  rhythm: string;
  customDays: string;
  target: string;
  customGoal: string;
  expectedPeople: string;
  meetingMode: string;
  location: string;
  participants: { name: string; email: string }[];
  paceMode: string;
  meetingCount: number;
  finishDate: string;
  meetingMinutes: string;
  breaks: { start: string; end: string }[];
  movedDates: Record<string, string>;
  assignments: Record<string, number>;
  curriculum: CircleLesson[];
};
export type SavedCircle = {
  id: string;
  status: "draft" | "active" | "archived";
  plan: CirclePlan;
  revision: number;
  updated_at: string;
};
export function suggestedAssignments(count: number) {
  const modules = [...new Set(circleCurriculum.map((l) => l.moduleSlug))];
  const groups = Math.max(1, modules.length - 1);
  const closingLessons = new Set(["niche-congratulations-75", "niche-prayer-76", "niche-whats-next-77"]);
  return Object.fromEntries(
    circleCurriculum.map((l, index) => [
      l.slug,
      count === 8
        ? l.moduleSlug === "niche"
          ? closingLessons.has(l.slug) ? 8 : 7
          : Math.max(1, modules.indexOf(l.moduleSlug))
        : count === groups
        ? Math.max(1, modules.indexOf(l.moduleSlug))
        : Math.min(
            count,
            Math.floor((index * count) / circleCurriculum.length) + 1,
          ),
    ]),
  );
}
export function blankCirclePlan(): CirclePlan {
  const count = 8;
  return {
    name: "",
    format: "Small group",
    startDate: "",
    time: "",
    timezone: "America/New_York",
    rhythm: "Weekly",
    customDays: "14",
    target: completionGoals[0],
    customGoal: "",
    expectedPeople: "6",
    meetingMode: "In person",
    location: "",
    participants: [],
    paceMode: "pace",
    meetingCount: count,
    finishDate: "",
    meetingMinutes: "90",
    breaks: [],
    movedDates: {},
    assignments: suggestedAssignments(count),
    curriculum: circleCurriculum,
  };
}
export function isDate(s: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function addDays(s: string, days: number) {
  const d = new Date(s + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function interval(p: CirclePlan) {
  return p.rhythm === "Weekly"
    ? 7
    : p.rhythm === "Every other week"
      ? 14
      : Number(p.customDays);
}
export function isBreak(p: CirclePlan, day: string) {
  return p.breaks.some((b) => day >= b.start && day <= b.end);
}
export function scheduledDates(p: CirclePlan): string[] {
  if (
    !isDate(p.startDate) ||
    !Number.isInteger(interval(p)) ||
    interval(p) < 1 ||
    interval(p) > 365
  )
    return [];
  const result: string[] = [];
  let date = p.startDate;
  for (
    let attempts = 0;
    attempts < 10000 && result.length < p.meetingCount;
    attempts++, date = addDays(date, interval(p))
  ) {
    if (!isBreak(p, date))
      result.push(p.movedDates[String(result.length + 1)] || date);
  }
  return result;
}
export function countUntil(p: CirclePlan): number {
  if (
    !isDate(p.startDate) ||
    !isDate(p.finishDate) ||
    p.finishDate < p.startDate ||
    interval(p) < 1 ||
    interval(p) > 365
  )
    return 0;
  let count = 0,
    date = p.startDate;
  for (
    let i = 0;
    i < 10000 && date <= p.finishDate;
    i++, date = addDays(date, interval(p))
  )
    if (!isBreak(p, date)) count++;
  return count;
}
export function planGoal(p: CirclePlan) {
  return p.target === "Custom goal" ? p.customGoal : p.target;
}
export function meetingLessons(p: CirclePlan, meeting: number) {
  return p.curriculum.filter((l) => p.assignments[l.slug] === meeting);
}
export function unassignedLessons(p: CirclePlan) {
  return circleCurriculum.filter(
    (l) => !p.assignments[l.slug] || p.assignments[l.slug] > p.meetingCount,
  );
}
export function normalizePlan(value: unknown): CirclePlan {
  const p = value as Partial<CirclePlan>;
  return {
    ...blankCirclePlan(),
    ...p,
    curriculum:
      p.curriculum?.map(
        (l) => circleCurriculum.find((c) => c.slug === l.slug) || l,
      ) || circleCurriculum,
    customGoal:
      p.customGoal ||
      (p.target && !completionGoals.includes(p.target) ? p.target : ""),
    target:
      p.target && !completionGoals.includes(p.target)
        ? "Custom goal"
        : p.target || completionGoals[0],
  };
}
export function validatePlan(value: unknown, creating = false): string | null {
  if (!value || typeof value !== "object") return "Check your Circle details.";
  const p = value as CirclePlan;
  const fields = [
    "name",
    "format",
    "startDate",
    "time",
    "timezone",
    "rhythm",
    "customDays",
    "target",
    "customGoal",
    "expectedPeople",
    "meetingMode",
    "location",
    "paceMode",
    "finishDate",
    "meetingMinutes",
  ] as const;
  if (
    fields.some(
      (k) =>
        typeof p[k] !== "string" ||
        p[k].length > (k === "location" ? 500 : 300),
    )
  )
    return "Check your Circle details.";
  if (!p.name.trim()) return "Give your Circle a name.";
  const rule = circleSizes[p.format];
  if (
    !Object.hasOwn(circleSizes, p.format) ||
    !rule ||
    !Number.isInteger(+p.expectedPeople) ||
    +p.expectedPeople < rule.min ||
    +p.expectedPeople > rule.max
  )
    return "Choose the expected group size for this Circle type.";
  if (
    !Array.isArray(p.participants) ||
    p.participants.length + 1 > rule.max ||
    p.participants.length + 1 > +p.expectedPeople ||
    p.participants.some(
      (x) =>
        !x ||
        typeof x.name !== "string" ||
        !x.name.trim() ||
        x.name.length > 120 ||
        typeof x.email !== "string" ||
        x.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.email),
    ) ||
    new Set(p.participants.map((x) => x.email.toLowerCase())).size !==
      p.participants.length
  )
    return "Check the people and email addresses in your Circle.";
  if (
    !["Weekly", "Every other week", "Custom"].includes(p.rhythm) ||
    !Number.isInteger(interval(p)) ||
    interval(p) < 1 ||
    interval(p) > 365
  )
    return "Choose a meeting interval between 1 and 365 days.";
  if (
    !["pace", "finish"].includes(p.paceMode) ||
    !Number.isInteger(p.meetingCount) ||
    p.meetingCount < 1 ||
    p.meetingCount > 104
  )
    return "Choose 1–104 meetings.";
  if (
    (p.startDate && !isDate(p.startDate)) ||
    (p.finishDate && !isDate(p.finishDate)) ||
    (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) ||
    !Number.isInteger(+p.meetingMinutes) ||
    +p.meetingMinutes < 15 ||
    +p.meetingMinutes > 480
  )
    return "Check the meeting dates, time, and length (15–480 minutes).";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: p.timezone });
  } catch {
    return "Choose a valid time zone.";
  }
  if (
    !completionGoals.includes(p.target) ||
    !["In person", "Online", "Hybrid"].includes(p.meetingMode)
  )
    return "Choose your meeting format and completion goal.";
  if (
    !Array.isArray(p.breaks) ||
    p.breaks.length > 104 ||
    p.breaks.some(
      (b) => !b || !isDate(b.start) || !isDate(b.end) || b.end < b.start,
    )
  )
    return "Check each break’s start and end dates.";
  if (
    !p.movedDates ||
    typeof p.movedDates !== "object" ||
    Array.isArray(p.movedDates) ||
    Object.entries(p.movedDates).some(
      ([k, v]) =>
        !/^\d+$/.test(k) ||
        +k < 1 ||
        +k > p.meetingCount ||
        typeof v !== "string" ||
        !isDate(v),
    )
  )
    return "Check your moved meeting dates.";
  if (
    !Array.isArray(p.curriculum) ||
    p.curriculum.length > 500 ||
    p.curriculum.some(
      (l) =>
        !l ||
        ["slug", "title", "moduleSlug", "moduleTitle", "duration"].some(
          (k) =>
            typeof l[k as keyof CircleLesson] !== "string" ||
            l[k as keyof CircleLesson].length > 300,
        ),
    ) ||
    new Set(p.curriculum.map((l) => l.slug)).size !== p.curriculum.length
  )
    return "Refresh the course lesson list.";
  if (
    !p.assignments ||
    typeof p.assignments !== "object" ||
    Array.isArray(p.assignments) ||
    Object.keys(p.assignments).length > 500 ||
    Object.entries(p.assignments).some(
      ([slug, n]) =>
        !p.curriculum.some((l) => l.slug === slug) ||
        !Number.isInteger(n) ||
        n < 0 ||
        n > p.meetingCount,
    )
  )
    return "Assign each lesson to a valid meeting.";
  const dates = scheduledDates(p);
  if (
    p.startDate &&
    (dates.length !== p.meetingCount ||
      dates.some(
        (d, i) =>
          d < p.startDate || isBreak(p, d) || (i > 0 && d <= dates[i - 1]),
      ))
  )
    return "Keep meeting dates in order, with no duplicates or dates during a break.";
  if (
    creating &&
    (!p.startDate ||
      unassignedLessons(p).length ||
      (p.target === "Custom goal" && !p.customGoal.trim()))
  )
    return "Choose a start date, complete your goal, and assign every current lesson before creating your Circle.";
  if (
    p.paceMode === "finish" &&
    p.startDate &&
    (!p.finishDate ||
      countUntil(p) !== p.meetingCount ||
      dates.at(-1)! > p.finishDate)
  )
    return "Apply your finish-date schedule again after changing dates or breaks.";
  return null;
}

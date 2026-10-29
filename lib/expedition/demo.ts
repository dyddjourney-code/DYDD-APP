// Isolated fictional fixtures only. Never an assessment submission or live assignment.
export const storageKey = "dydd:expedition:fictional-team-demo:v1";
export const assessmentKeys = ["designId", "gifts", "designPd"] as const;
export type Assessment = typeof assessmentKeys[number];
export type Status = "unassigned" | "assigned" | "complete";
export const assessmentNames = { designId: "DesignID", gifts: "Spiritual Gifts", designPd: "DesignPD" };
export const reflections = ["Architect", "Artisan", "Shepherd", "Steward"] as const;
export const reflectionColors = ["#D4A451", "#647C9B", "#739D5E", "#5A496B"];
export const fixtures = [
  { name: "Maren Vale", role: "Expedition lead", color: "#4a6239", id: [38, 27, 21, 14], gifts: ["Leadership", "Teaching", "Wisdom", "Faith", "Administration"] },
  { name: "Ellis Rowan", role: "Community care", color: "#8a5f2d", id: [17, 23, 41, 19], gifts: ["Mercy", "Encouragement", "Hospitality", "Faith", "Service"] },
  { name: "Tobin Ashford", role: "Operations", color: "#456073", id: [21, 18, 24, 37], gifts: ["Administration", "Service", "Giving", "Leadership", "Helps"] },
  { name: "Cleo Fenwick", role: "Creative direction", color: "#735066", id: [23, 42, 19, 16], gifts: ["Teaching", "Creative Communication", "Encouragement", "Wisdom", "Faith"] },
] as const;
export type PersonState = { invited: boolean; statuses: Record<Assessment, Status>; reportRead: boolean; courseReviewed: boolean };
export type DemoState = { version: 1; organization: string; expedition: string; purpose: string; people: PersonState[]; conversation: string; launched: boolean };
export function initialState(): DemoState {
  return { version: 1, organization: "Cedar Reach Ministry — fictional", expedition: "Community Table Expedition", purpose: "Prepare a volunteer team for a neighborhood listening and hospitality project.", people: fixtures.map((_, i) => ({ invited: i < 2, statuses: { designId: "complete", gifts: i === 2 ? "assigned" : "complete", designPd: i === 1 ? "assigned" : i === 3 ? "unassigned" : "complete" }, reportRead: i === 0, courseReviewed: false })), conversation: "", launched: false };
}
export function validState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const s = value as DemoState;
  return s.version === 1 && [s.organization, s.expedition, s.purpose, s.conversation].every(v => typeof v === "string" && v.length <= 2000) && typeof s.launched === "boolean" && Array.isArray(s.people) && s.people.length === 4 && s.people.every(p => p && typeof p.invited === "boolean" && typeof p.reportRead === "boolean" && typeof p.courseReviewed === "boolean" && p.statuses && assessmentKeys.every(k => ["unassigned", "assigned", "complete"].includes(p.statuses[k])) && (p.statuses.designPd !== "complete" || p.statuses.designId === "complete"));
}
// Matches lib/designpd/engine.ts: signed percentage-point movement from 100-point DesignID.
export function pdMovement(id: readonly number[]) {
  const [architect, artisan, shepherd, steward] = id;
  return { plan: (shepherd + artisan - architect - steward) / 2, decide: (architect + shepherd - artisan - steward) / 2, do: (architect + artisan - shepherd - steward) / 2 };
}
export function teamData(state: DemoState) {
  const completed = (key: Assessment) => fixtures.filter((_, i) => state.people[i].statuses[key] === "complete" && (key !== "designPd" || state.people[i].statuses.designId === "complete"));
  const id = completed("designId"), gifts = completed("gifts"), pd = completed("designPd");
  const giftNames = [...new Set(gifts.flatMap(p => [...p.gifts]))].sort();
  return { id, gifts, pd, averages: reflections.map((_, i) => id.length ? Math.round(id.reduce((sum, p) => sum + p.id[i], 0) / id.length * 10) / 10 : null), giftRows: giftNames.map(name => ({ name, count: gifts.filter(p => (p.gifts as readonly string[]).includes(name)).length })), complete: state.people.reduce((sum, p) => sum + assessmentKeys.filter(k => p.statuses[k] === "complete").length, 0), ready: state.people.every(p => assessmentKeys.every(k => p.statuses[k] === "complete")) };
}

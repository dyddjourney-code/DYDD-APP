export const appliedCapacitySlug = "expertise-applied-capacity-31";
export const appliedCapacityImage = "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/f6369ba4-2812-4e2b-98d3-1b3113fb6e3b/image-gen+%284%2922.png?format=2500w";
export const capacityBands = [
  { name: "Drained", range: "0–9", phrase: "Grace that invites rest & partnership" },
  { name: "Limited", range: "10–24", phrase: "Grace that cultivates dependence" },
  { name: "Steady", range: "25–39", phrase: "Grace that sustains for endurance" },
  { name: "Abundant", range: "40–60", phrase: "Grace that empowers sharp focus" },
] as const;
export const capacityReflections = [
  { name: "Architect", color: "#D4A451", tint: "#FBF4E7", key: "architectPts", activities: "Completed tasks, submissions, presentations, sign-off" },
  { name: "Artisan", color: "#647C9B", tint: "#EEF2F7", key: "artisanPts", activities: "Strategy, design, improvement, assessment" },
  { name: "Steward", color: "#5A496B", tint: "#F1EDF5", key: "stewardPts", activities: "Details, research, proof, organizing" },
  { name: "Shepherd", color: "#739D5E", tint: "#F0F5EC", key: "shepherdPts", activities: "Social activities, meetings, debate, mission" },
] as const;
/** Preserve saved raw points. Missing/invalid values must never become zero. */
export function capacityScore(value: unknown): number | null {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "") return null;
  const score = Number(value);
  return Number.isFinite(score) && Number.isInteger(score) && score >= 0 && score <= 60 ? score : null;
}
/** Same boundaries as the canonical allocation engine; restrict to authored 0–60 range. */
export function capacityCategory(score: number | null): string | null {
  if (capacityScore(score) === null) return null;
  return capacityBands[score! >= 40 ? 3 : score! >= 25 ? 2 : score! >= 10 ? 1 : 0].name;
}
export function capacityMinutes(score: number, hours = 16) {
  return Math.round((hours * score / 100 * 60) / 15) * 15;
}
export function formatCapacityMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60), remainder = minutes % 60;
  const parts = [hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "", remainder ? `${remainder} ${remainder === 1 ? "minute" : "minutes"}` : ""].filter(Boolean);
  return parts.join(" ") || "0 minutes";
}
export type AppliedCapacityScores = Record<string, number | null>;

/** A small allowlist, never an arbitrary return URL. Origin survives copied URLs,
 * lesson redirects and reloads without relying on browser history/referrers. */
export type CourseOrigin = "field-kit" | "trailheads";
export function courseOrigin(value?: string): CourseOrigin {
  return value === "trailheads" ? "trailheads" : "field-kit";
}
export function withCourseOrigin(href: string, origin: CourseOrigin) {
  const [path, hash] = href.split("#");
  return `${path}${path.includes("?") ? "&" : "?"}origin=${origin}${hash ? `#${hash}` : ""}`;
}
export function courseCardHref(courseSlug: string, origin: CourseOrigin, fruitLifeLane = false) {
  const card = ({"designpd-alignment":"designpd", "fruitlife-360-formation":"fruitlife-360", "spiritual-gifts-service":"spiritual-gifts", "designid-foundations":"designid"} as Record<string,string>)[courseSlug];
  if (!card) return "/trailheads";
  return `/${origin}${fruitLifeLane ? "?lane=fruitlife" : ""}#${origin === "field-kit" ? "collection-" : ""}${card}`;
}

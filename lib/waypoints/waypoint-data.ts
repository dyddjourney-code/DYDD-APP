import waypointData from "./waypoints.json";

export type Waypoint = {
  body: string[];
  category: string;
  date: string;
  excerpt: string;
  id: string;
  reflection: string;
  releaseAt: string;
  scripture: string;
  scriptureText: string;
  scriptureTranslation: string;
  scriptureAttribution: string;
  reflections: Record<"Architect" | "Artisan" | "Shepherd" | "Steward", string>;
  tags: string[];
  title: string;
};

export const waypointArchive = waypointData satisfies Waypoint[];

export const waypointCategories = [
  "Identity",
  "Design",
  "Calling",
  "Spiritual Gifts",
  "Faithful Practice",
  "Relationships & Community",
  "Work & Leadership",
];

export function getReleasedWaypoints(now = new Date()) {
  const nowTime = now.getTime();

  return waypointArchive
    .filter((waypoint) => new Date(waypoint.releaseAt).getTime() <= nowTime)
    .sort(
      (a, b) =>
        new Date(b.releaseAt).getTime() - new Date(a.releaseAt).getTime(),
    );
}

const releasedWaypoints = getReleasedWaypoints();

export const currentWaypoint = releasedWaypoints[0] ?? waypointArchive[0];
export const previousWaypoint = releasedWaypoints[1] ?? waypointArchive[1];

export function personalizeWaypoint(waypoint: Waypoint, savedPrimary: string) {
  const primary = savedPrimary.trim();
  const reflection = Object.prototype.hasOwnProperty.call(waypoint.reflections, primary)
    ? waypoint.reflections[primary as keyof Waypoint["reflections"]]
    : waypoint.reflection;
  // Send only the selected reflection to the browser, including archive entries.
  const { reflections: _variants, ...visible } = waypoint;
  return { ...visible, reflection };
}

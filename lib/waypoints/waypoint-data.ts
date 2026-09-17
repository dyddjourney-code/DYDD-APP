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

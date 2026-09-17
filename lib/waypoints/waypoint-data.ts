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

export const currentWaypoint = waypointArchive[0];
export const previousWaypoint = waypointArchive[1];

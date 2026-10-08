"use client";

import { useMemo, useState } from "react";

type MapPoint = {
  body: string;
  cta: string;
  href: string;
  id: string;
  label: string;
  left: string;
  title: string;
  top: string;
  type: "place" | "trail";
};

const mapPoints: MapPoint[] = [
  {
    body:
      "Base Camp is the personal landing place. It holds the passport book, earned badges, account basics, and a clear push toward Ranger Station.",
    cta: "Return to Base Camp",
    href: "/base-camp",
    id: "base-camp",
    label: "Base Camp",
    left: "65.8%",
    title: "Your personal starting place",
    top: "93.5%",
    type: "place",
  },
  {
    body:
      "Ranger Station is the orientation room. Ask Dydi what to do next, watch the welcome video, and use the map before choosing a trail.",
    cta: "Ask at the desk",
    href: "#ranger-desk",
    id: "ranger-station",
    label: "Ranger Station",
    left: "66.9%",
    title: "The guided orientation room",
    top: "80.8%",
    type: "place",
  },
  {
    body:
      "Trailheads are where each course begins. Every trail shows time, effort, difficulty, and any required permission before you start.",
    cta: "Open Trailheads",
    href: "/trailheads",
    id: "trailheads",
    label: "Trailheads",
    left: "48%",
    title: "Choose the route",
    top: "38%",
    type: "place",
  },
  {
    body:
      "Fireside is a place to stop for teaching, encouragement, Scripture, live gatherings, and Waypoints that help people keep walking after the lesson is over.",
    cta: "Visit Fireside",
    href: "/fireside",
    id: "fireside",
    label: "Fireside",
    left: "15%",
    title: "A teaching stop along the way",
    top: "28%",
    type: "place",
  },
  {
    body:
      "Camp Circles are future group spaces for leaders, cohorts, facilitators, and shared progress through the DYDD journey.",
    cta: "Preview Camp Circles",
    href: "/camp-circle",
    id: "camp-circles",
    label: "Camp Circles",
    left: "91%",
    title: "Walk together",
    top: "69%",
    type: "place",
  },
  {
    body:
      "Waypoints are shorter pauses along the road: timely teachings, reflection prompts, podcasts, videos, and places to revisit.",
    cta: "Find Waypoints",
    href: "/fireside#waypoints",
    id: "waypoints",
    label: "Waypoints",
    left: "84%",
    title: "Places to pause",
    top: "35%",
    type: "place",
  },
  {
    body:
      "The main DYDD Journey is the hub. It ties together Identity, Expertise, Story, Desire, Gifts, and Niche while pulling in assessment insights as they become available.",
    cta: "Open the Journey",
    href: "/journey",
    id: "dydd-journey",
    label: "DYDD Journey",
    left: "53%",
    title: "The main route",
    top: "85%",
    type: "trail",
  },
  {
    body:
      "Spiritual Gifts is an open starting trail for naming how grace is showing up in service, maturity, and the body of Christ.",
    cta: "Start Spiritual Gifts",
    href: "/trailheads#spiritual-gifts",
    id: "spiritual-gifts",
    label: "Spiritual Gifts",
    left: "70%",
    title: "Grace expressed in service",
    top: "49%",
    type: "trail",
  },
  {
    body:
      "FruitLife 360 is an open starting trail for seeing formation, visible fruit, and growth conversations with honest encouragement.",
    cta: "Start FruitLife 360",
    href: "/trailheads#fruitlife-360",
    id: "fruitlife-360",
    label: "FruitLife 360",
    left: "60%",
    title: "Formation and visible fruit",
    top: "43%",
    type: "trail",
  },
  {
    body:
      "Design Pathways helps a person test possible next steps, notice direction, and move from insight into discernment.",
    cta: "Open Design Pathways",
    href: "/trailheads#design-pathways",
    id: "design-pathways",
    label: "Design Pathways",
    left: "90%",
    title: "Discernment and next steps",
    top: "18%",
    type: "trail",
  },
  {
    body:
      "DesignID can be started early. It gives the reflection language that later informs DesignPD and helps personalize the larger journey.",
    cta: "Start DesignID",
    href: "/trailheads#designid",
    id: "designid",
    label: "DesignID Trail",
    left: "41%",
    title: "Reflection and design language",
    top: "52%",
    type: "trail",
  },
];

const legendTrails = [
  { id: "dydd-journey", label: "Main DYDD Journey" },
  { id: "spiritual-gifts", label: "Spiritual Gifts" },
  { id: "fruitlife-360", label: "FruitLife 360" },
  { id: "design-pathways", label: "Design Pathways" },
  { id: "designid", label: "DesignID" },
];

const trailLines = [
  {
    d: "M75.4 0 C76.8 6 77.5 11 79.1 16.8 C80.5 22.8 82.7 28.7 84 34.5 C86.4 44.2 90.2 55.5 93.6 68.8 C95.2 75.4 96.5 82.4 97.2 85.3 C94.6 85.1 90.7 84.8 86.4 85.2 C78.6 85.3 68 84.6 58.8 83.5 C54.8 83.1 51.7 84.9 45.6 83.2 C40.6 81.8 37.5 77.6 34 73.1 C28.3 65.7 22.4 58.8 21 48.2 C19.6 39.1 18.3 30.8 19.2 25.8 C20.6 17.4 23.9 13.5 27.2 11.2 C30.9 8.8 35 7.2 37.7 6.6 C42.8 5.4 49.4 3.3 56 0",
    id: "dydd-journey",
  },
  {
    d: "M51.7 84.8 C51.1 78.8 50.6 73.9 51.3 71.3 C52.2 65.8 56.1 61.8 57.1 60.6 C59.6 56.2 61.8 49.7 66.7 46.3 C70 44.3 73.1 47 76.3 54.6 C80 63.6 80.6 67.4 79.9 68.1 C77.8 70.8 73.9 75.2 72.2 79.6 C69.9 82.8 63 84.5 58.8 83.5 C56 82.7 53.6 82.6 51.7 84.8",
    id: "spiritual-gifts",
  },
  {
    d: "M48.3 37.5 C52 36.2 56.1 34.9 59.8 32.7 C63.8 30.1 66.4 23 68.1 22 C72.8 20.3 77.2 21.8 80.4 23.2 M48.3 37.5 C51.7 41.3 53.4 49.1 55.1 53.5 C57.1 60.7 60.6 66.2 62.6 71.1",
    id: "fruitlife-360",
  },
  {
    d: "M80.4 23.2 C83.6 18.3 87.5 15.6 89.1 14.6 C93.6 13 97.4 13.4 100 13.9 M80.4 23.2 C78.5 28.1 75.2 35.6 74 40.7 C72.2 47.5 70.6 55.2 68.8 66.2",
    id: "design-pathways",
  },
  {
    d: "M37.7 6.6 C40.2 12.4 41.4 18.9 43.1 25.2 C44.9 31.6 48.3 37.5 48.3 37.5 C47.4 43.5 43.8 52.6 42.4 59.1 C40.5 68.4 38.8 79.7 36.8 87 C35.6 91.8 34 96 33.6 100 M79.9 68.1 C84.8 74.2 86.4 85.2 86.1 100",
    id: "designid",
  },
];

const trailDots = [
  {
    id: "dydd-journey",
    points: [
      [27.15, 11.26],
      [37.62, 6.8],
      [76.85, 9.78],
      [84.03, 34.32],
      [97.13, 85.02],
      [86.42, 85.02],
      [51.85, 84.91],
      [38.82, 79.7],
      [31.88, 68.44],
      [21.77, 47.93],
      [19.14, 25.82],
    ],
  },
  {
    id: "spiritual-gifts",
    points: [
      [51.32, 70.88],
      [57.06, 60.68],
      [61.78, 49.42],
      [72.25, 47.18],
      [80.02, 67.48],
    ],
  },
  {
    id: "fruitlife-360",
    points: [
      [48.27, 37.51],
      [53.47, 49.1],
      [57.06, 60.68],
      [68.12, 21.79],
      [80.44, 23.27],
    ],
  },
  {
    id: "design-pathways",
    points: [
      [89, 17.96],
      [80.44, 23.27],
      [72.25, 47.18],
      [68.78, 66.1],
    ],
  },
  {
    id: "designid",
    points: [
      [37.62, 6.8],
      [41.39, 18.7],
      [48.27, 37.51],
      [42.34, 59.19],
      [38.82, 79.7],
      [80.02, 67.48],
      [86.42, 85.02],
    ],
  },
];

export function RangerReliefMap() {
  const [activeId, setActiveId] = useState("ranger-station");
  const activePoint = useMemo(
    () => mapPoints.find((point) => point.id === activeId) ?? mapPoints[0],
    [activeId],
  );

  return (
    <section className="relief-map-workbench" aria-label="Interactive DYDD relief map">
      <div className="relief-map-stage-scroll">
        <div className="relief-map-stage">
          <img
            src="/brand/dydd-park-map-concept.png"
            alt="Illustrated DYDD park map with colored trails through a forest"
          />
          <svg className="relief-map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {trailLines.map((trail) => (
              <path
                className={`relief-route relief-route-${trail.id} ${activePoint.id === trail.id ? "active" : ""}`}
                d={trail.d}
                key={trail.id}
                pathLength={100}
              />
            ))}
            {trailDots.map((trail) => (
              <g
                className={`relief-route-dots relief-route-${trail.id} ${activePoint.id === trail.id ? "active" : ""}`}
                key={`${trail.id}-dots`}
              >
                {trail.points.map(([cx, cy], index) => (
                  <circle
                    cx={cx}
                    cy={cy}
                    key={`${trail.id}-${index}-${cx}-${cy}`}
                    r="0.95"
                    style={{ animationDelay: `${index * 70}ms` }}
                  />
                ))}
              </g>
            ))}
          </svg>
          <div
            className={`map-feature-fire ${activePoint.id === "camp-circles" ? "active" : ""}`}
            aria-hidden="true"
          />
          <div
            className={`map-feature-fireside ${activePoint.id === "fireside" ? "active" : ""}`}
            aria-hidden="true"
          >
            <span className="fireside-hut" />
            <span className="fireside-fire" />
            <span className="fireside-stump stump-one" />
            <span className="fireside-stump stump-two" />
            <span className="fireside-stump stump-three" />
            <span className="fireside-stump stump-four" />
            <span className="fireside-teacher" />
          </div>
          {mapPoints.map((point) => (
            <button
              className={`relief-map-marker ${point.type} marker-${point.id} ${activePoint.id === point.id ? "active" : ""}`}
              key={point.id}
              onClick={() => setActiveId(point.id)}
              onMouseEnter={() => setActiveId(point.id)}
              style={{ left: point.left, top: point.top }}
              type="button"
            >
              <span>{point.label}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="relief-map-panel">
        <p className="section-label">{activePoint.type === "trail" ? "Trail" : "Map stop"}</p>
        <h3>{activePoint.title}</h3>
        <p>{activePoint.body}</p>
        <a className="button primary" href={activePoint.href}>
          {activePoint.cta}
        </a>
      </aside>

      <div className="relief-map-legend" aria-label="Map legend">
        <span>Trail controls</span>
        {legendTrails.map((trail) => (
          <button
            className={activePoint.id === trail.id ? "active" : ""}
            key={trail.id}
            onClick={() => setActiveId(trail.id)}
            type="button"
          >
            {trail.label}
          </button>
        ))}
      </div>
    </section>
  );
}

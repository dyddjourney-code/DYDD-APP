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
    left: "16%",
    title: "Your personal starting place",
    top: "68%",
    type: "place",
  },
  {
    body:
      "Ranger Station is the orientation room. Ask Dydi what to do next, watch the welcome video, and use the map before choosing a trail.",
    cta: "Ask at the desk",
    href: "#ranger-desk",
    id: "ranger-station",
    label: "Ranger Station",
    left: "66%",
    title: "The guided orientation room",
    top: "76%",
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
    left: "14%",
    title: "A teaching stop along the way",
    top: "38%",
    type: "place",
  },
  {
    body:
      "Camp Circles are future group spaces for leaders, cohorts, facilitators, and shared progress through the DYDD journey.",
    cta: "Preview Camp Circles",
    href: "/camp-circle",
    id: "camp-circles",
    label: "Camp Circles",
    left: "85%",
    title: "Walk together",
    top: "64%",
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
    d: "M38 0 C36 6 29 9 23 13 C18 18 18 31 20 43 C23 58 29 72 38 82 C48 85 58 83 68 83 C77 85 88 86 98 86 M73 0 C76 7 77 15 78 24 C80 36 82 52 85 66 C88 78 92 84 98 86",
    id: "dydd-journey",
  },
  {
    d: "M53 75 C51 65 58 59 62 50 C68 45 75 47 79 56 C83 65 78 72 69 75 C62 79 56 80 53 75",
    id: "spiritual-gifts",
  },
  {
    d: "M48 39 C55 36 62 31 67 24 C73 20 78 22 81 23 M48 39 C52 45 55 55 58 64 C61 73 65 80 66 86",
    id: "fruitlife-360",
  },
  {
    d: "M81 23 C88 17 94 14 100 14 M81 23 C80 35 74 45 71 57 C69 66 69 73 69 82",
    id: "design-pathways",
  },
  {
    d: "M38 6 C42 18 45 30 48 39 C45 51 41 64 39 82 C37 91 35 96 34 100 M75 72 C82 78 86 86 86 100",
    id: "designid",
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
          </svg>
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

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
    top: "67%",
    type: "place",
  },
  {
    body:
      "Ranger Station is the orientation room. Ask Dydi what to do next, watch the welcome video, and use the map before choosing a trail.",
    cta: "Ask at the desk",
    href: "#ranger-desk",
    id: "ranger-station",
    label: "Ranger Station",
    left: "39%",
    title: "The guided orientation room",
    top: "48%",
    type: "place",
  },
  {
    body:
      "Trailheads are where each course begins. Every trail shows time, effort, difficulty, and any required permission before you start.",
    cta: "Open Trailheads",
    href: "/trailheads",
    id: "trailheads",
    label: "Trailheads",
    left: "63%",
    title: "Choose the route",
    top: "38%",
    type: "place",
  },
  {
    body:
      "Fireside holds teaching, encouragement, Scripture, live gatherings, and Waypoints that help people keep walking after the lesson is over.",
    cta: "Visit Fireside",
    href: "/fireside",
    id: "fireside",
    label: "Fireside",
    left: "75%",
    title: "Teaching and encouragement",
    top: "72%",
    type: "place",
  },
  {
    body:
      "Camp Circles are future group spaces for leaders, cohorts, facilitators, and shared progress through the DYD journey.",
    cta: "Preview Camp Circles",
    href: "/camp-circle",
    id: "camp-circles",
    label: "Camp Circles",
    left: "26%",
    title: "Walk together",
    top: "28%",
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
    top: "23%",
    type: "place",
  },
  {
    body:
      "The main DYD Journey is the hub. It ties together Identity, Expertise, Story, Desire, Gifts, and Niche while pulling in assessment insights as they become available.",
    cta: "Open the Journey",
    href: "/journey",
    id: "dydd-journey",
    label: "DYD Journey",
    left: "53%",
    title: "The main route",
    top: "63%",
    type: "trail",
  },
  {
    body:
      "DesignID can be started early. It gives the reflection language that later informs DesignPD and helps personalize the larger journey.",
    cta: "Start DesignID",
    href: "/trailheads#designid",
    id: "designid",
    label: "DesignID Trail",
    left: "47%",
    title: "Reflection and design language",
    top: "24%",
    type: "trail",
  },
  {
    body:
      "DesignPD comes after DesignID because it depends on the design language already discovered. It applies design through planning, deciding, and doing.",
    cta: "Preview DesignPD",
    href: "/trailheads#designpd",
    id: "designpd",
    label: "DesignPD Trail",
    left: "70%",
    title: "Practice and daily alignment",
    top: "54%",
    type: "trail",
  },
];

const legendTrails = [
  { id: "dydd-journey", label: "Main DYD Journey" },
  { id: "designid", label: "DesignID" },
  { id: "designpd", label: "DesignPD" },
  { id: "trailheads", label: "All Trailheads" },
  { id: "waypoints", label: "Waypoints" },
];

export function RangerReliefMap() {
  const [activeId, setActiveId] = useState("ranger-station");
  const activePoint = useMemo(
    () => mapPoints.find((point) => point.id === activeId) ?? mapPoints[0],
    [activeId],
  );

  return (
    <section className="relief-map-workbench" aria-label="Interactive DYD relief map">
      <div className="relief-map-stage">
        <img
          src="/brand/dydd-park-map-concept.png"
          alt="Illustrated DYD park map with colored trails through a forest"
        />
        {mapPoints.map((point) => (
          <button
            className={`relief-map-marker ${point.type} ${activePoint.id === point.id ? "active" : ""}`}
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

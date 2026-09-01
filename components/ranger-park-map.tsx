"use client";

import Link from "next/link";
import { useState } from "react";

type Trail = {
  color: string;
  detail: string;
  href: string;
  id: string;
  label: string;
  path: string;
  summary: string;
  waypoints: string[];
};

const trails: Trail[] = [
  {
    color: "#b88343",
    detail:
      "The full Discover Your Divine Design route gathers the whole story: identity, gifts, desire, expertise, story, and purpose. It is the broad trail for someone who wants the complete guided journey instead of a single assessment stop.",
    href: "/journey",
    id: "dydd-journey",
    label: "DYD Journey Trail",
    path: "M 268 208 C 332 126, 476 122, 552 184 S 706 290, 784 206",
    summary: "The full journey route through the major formation landmarks.",
    waypoints: ["Identity", "Gifts", "Desire", "Purpose"],
  },
  {
    color: "#577f91",
    detail:
      "The Spiritual Gifts trail is a shorter reflection loop for noticing grace for service, maturity, and love. The lake loop gives it a quieter feel: a place to pause, receive, and consider how gifts bless the body of Christ.",
    href: "/trailheads",
    id: "spiritual-gifts",
    label: "Spiritual Gifts Trail",
    path: "M 520 364 C 456 326, 384 356, 382 424 S 492 534, 574 484 S 600 402, 520 364",
    summary: "A reflective loop for gifts, service, and grace.",
    waypoints: ["Grace", "Service", "Maturity"],
  },
  {
    color: "#4f6f46",
    detail:
      "The DesignID trail helps a learner read the core pattern of how God has shaped their reflection, responsibility, creativity, care, and contribution. It is a strong first assessment path when someone needs language for their design.",
    href: "/courses/designid-foundations",
    id: "designid",
    label: "DesignID Trail",
    path: "M 268 208 C 218 250, 196 318, 226 374 S 328 456, 372 520",
    summary: "A focused trail for understanding the DesignID report.",
    waypoints: ["Reflection", "Pattern", "Language"],
  },
  {
    color: "#7e6b38",
    detail:
      "The FruitLife 360 trail looks at visible fruit through self-reflection and observer feedback. It helps a person see what is already life-giving and what might need attention, practice, or healing.",
    href: "/fruitlife360",
    id: "fruitlife360",
    label: "FruitLife 360 Trail",
    path: "M 268 208 C 348 278, 336 354, 292 418 S 254 522, 338 584",
    summary: "A feedback trail for fruit, growth, and visible impact.",
    waypoints: ["Fruit", "Feedback", "Growth"],
  },
];

export function RangerParkMap() {
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  return (
    <div className="ranger-park-map">
      <div className="ranger-park-map-canvas" aria-label="Interactive DYD park map">
        <svg
          aria-hidden="true"
          className="ranger-park-map-art"
          focusable="false"
          viewBox="0 0 920 640"
        >
          <defs>
            <pattern id="mapHatch" height="18" patternUnits="userSpaceOnUse" width="18">
              <path d="M 0 18 L 18 0" stroke="rgba(55, 86, 51, 0.1)" strokeWidth="2" />
            </pattern>
            <filter id="softPaper">
              <feTurbulence baseFrequency="0.012" numOctaves="2" seed="8" type="fractalNoise" />
              <feColorMatrix type="saturate" values="0.28" />
              <feBlend in="SourceGraphic" mode="multiply" />
            </filter>
          </defs>

          <rect fill="#eef0dc" height="640" rx="18" width="920" />
          <rect fill="url(#mapHatch)" height="640" opacity="0.9" width="920" />
          <path
            d="M 32 92 C 172 36, 284 54, 410 108 C 552 170, 676 74, 886 112 L 886 640 L 32 640 Z"
            fill="#dce7c9"
            filter="url(#softPaper)"
          />
          <path
            d="M 0 466 C 136 414, 256 434, 386 490 C 560 566, 706 472, 920 524 L 920 640 L 0 640 Z"
            fill="#cbdcb6"
            opacity="0.82"
          />
          <path
            d="M 582 368 C 640 400, 628 482, 558 512 C 484 546, 402 514, 384 450 C 366 390, 438 332, 510 352 C 538 360, 558 356, 582 368 Z"
            fill="#a9c7c3"
            opacity="0.86"
            stroke="#678f8e"
            strokeDasharray="8 9"
            strokeWidth="3"
          />
          <path
            d="M 78 556 C 180 476, 300 470, 404 534 S 628 600, 812 526"
            fill="none"
            opacity="0.34"
            stroke="#6f8d63"
            strokeDasharray="6 12"
            strokeLinecap="round"
            strokeWidth="6"
          />
          {trails.map((trail) => (
            <path
              d={trail.path}
              fill="none"
              key={trail.id}
              stroke={trail.color}
              strokeDasharray="14 12"
              strokeLinecap="round"
              strokeWidth={trail.id === "dydd-journey" ? 9 : 7}
            />
          ))}

          <g className="ranger-tree-cluster">
            {[
              [100, 128],
              [148, 102],
              [190, 158],
              [758, 118],
              [812, 152],
              [742, 468],
              [140, 486],
              [196, 534],
            ].map(([cx, cy]) => (
              <g key={`${cx}-${cy}`}>
                <path d={`M ${cx} ${cy - 34} L ${cx - 24} ${cy + 18} L ${cx + 24} ${cy + 18} Z`} fill="#557449" />
                <path d={`M ${cx} ${cy - 12} L ${cx - 30} ${cy + 42} L ${cx + 30} ${cy + 42} Z`} fill="#405f3d" />
                <rect fill="#7a5a35" height="24" rx="3" width="9" x={cx - 4.5} y={cy + 34} />
              </g>
            ))}
          </g>
        </svg>

        <button
          className="ranger-map-station"
          style={{ left: "29%", top: "33%" }}
          type="button"
          onClick={() => setSelectedTrail(trails[0])}
        >
          <span>Ranger Station</span>
        </button>

        {trails.map((trail) => (
          <button
            className={`ranger-trail-pin ranger-trail-pin-${trail.id}`}
            key={trail.id}
            style={{ ["--trail-color" as string]: trail.color }}
            type="button"
            onClick={() => setSelectedTrail(trail)}
          >
            <span>{trail.label}</span>
          </button>
        ))}
      </div>

      <div className="ranger-map-trail-list" aria-label="Map trail shortcuts">
        {trails.map((trail) => (
          <button
            className={selectedTrail?.id === trail.id ? "is-selected" : ""}
            key={trail.id}
            type="button"
            onClick={() => setSelectedTrail(trail)}
          >
            <span style={{ backgroundColor: trail.color }} />
            {trail.label}
          </button>
        ))}
      </div>

      {selectedTrail ? (
        <div className="ranger-trail-overlay" role="presentation">
          <section
            aria-label={selectedTrail.label}
            aria-modal="true"
            className="ranger-trail-modal"
            role="dialog"
          >
            <div className="ranger-trail-modal-header">
              <div>
                <p className="section-label">Trail preview</p>
                <h2>{selectedTrail.label}</h2>
              </div>
              <button
                aria-label="Close trail preview"
                className="page-help-close"
                type="button"
                onClick={() => setSelectedTrail(null)}
              >
                Close
              </button>
            </div>
            <p className="ranger-trail-summary">{selectedTrail.summary}</p>
            <p>{selectedTrail.detail}</p>
            <div className="ranger-trail-waypoints">
              {selectedTrail.waypoints.map((waypoint) => (
                <span key={waypoint}>{waypoint}</span>
              ))}
            </div>
            <Link className="button primary" href={selectedTrail.href}>
              Open this trail
            </Link>
          </section>
        </div>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { PageHelp } from "@/components/page-help";

const stationStops = [
  {
    action: "View trailheads",
    detail:
      "Choose the course or guided route that fits the learner's current need: the full Discover Your Divine Design journey, assessment-based courses, or a focused next step.",
    href: "/trailheads",
    label: "Trailheads",
    marker: "01",
    title: "Pick a route",
  },
  {
    action: "Open field kit",
    detail:
      "Find the assessments, reports, and earned markers that help personalize the journey and show what has already been discovered.",
    href: "/field-kit",
    label: "Field Kit",
    marker: "02",
    title: "Check the tools",
  },
  {
    action: "Open gear",
    detail:
      "Gather books, workbooks, workshops, and live experiences that support the next leg of the journey.",
    href: "/gear",
    label: "Gear",
    marker: "03",
    title: "Pack resources",
  },
];

const mapMarkers = [
  { label: "Base Camp", x: "20%", y: "68%" },
  { label: "Ranger Station", x: "34%", y: "48%" },
  { label: "Trailheads", x: "54%", y: "30%" },
  { label: "Field Kit", x: "66%", y: "58%" },
  { label: "Gear", x: "79%", y: "42%" },
];

export default function RangerStationPage() {
  return (
    <main className="journey-shell hq-standalone-page ranger-station-page">
      <header className="standalone-hero ranger-station-hero">
        <div>
          <p className="eyebrow">Ranger Station</p>
          <h1>Start with the map, then choose the trail.</h1>
          <p className="lede">
            The Ranger Station is the first orientation stop for the Discover
            Your Divine Design app. It explains the journey, points learners
            toward the right trailhead, and helps them gather the tools they
            need before they move forward.
          </p>
          <div className="ranger-station-actions">
            <Link className="button primary" href="/trailheads">
              View trailheads
            </Link>
            <Link className="button secondary" href="/field-kit">
              Open field kit
            </Link>
          </div>
        </div>
        <div className="ranger-station-help">
          <PageHelp
            title="Ranger Station Help"
            items={[
              "Use Ranger Station as the learner's orientation before they choose a course or tool.",
              "Use Trailheads for courses and guided routes.",
              "Use Field Kit and Gear for assessments, reports, books, workshops, and practical resources.",
            ]}
          />
        </div>
      </header>

      <section className="ranger-map-section" aria-label="Ranger Station map preview">
        <div className="ranger-map-copy">
          <p className="section-label">Park map</p>
          <h2>The whole journey in view.</h2>
          <p>
            This is the placeholder surface for the forestry-style map you are
            looking for. Once the image is chosen, this area can become the
            visual overview with trailheads, waypoints, and next-step markers
            layered on top.
          </p>
        </div>

        <div className="ranger-map-board" aria-label="Draft journey map">
          <div className="ranger-map-route" />
          {mapMarkers.map((marker) => (
            <span
              className="ranger-map-marker"
              key={marker.label}
              style={{ left: marker.x, top: marker.y }}
            >
              <strong>{marker.label}</strong>
            </span>
          ))}
        </div>
      </section>

      <section className="ranger-stops-section" aria-label="Ranger Station sections">
        <div className="catalog-heading compact">
          <p className="section-label">Inside Ranger Station</p>
          <h2>Three places to send the learner next.</h2>
        </div>

        <div className="ranger-stop-list">
          {stationStops.map((stop) => (
            <article className="ranger-stop-card" key={stop.label}>
              <span>{stop.marker}</span>
              <div>
                <small>{stop.label}</small>
                <h3>{stop.title}</h3>
                <p>{stop.detail}</p>
              </div>
              <Link className="button secondary" href={stop.href}>
                {stop.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

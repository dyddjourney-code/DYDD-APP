import Link from "next/link";
import { DyddOrientationSlider } from "@/components/dydd-orientation-slider";
import { PageHelp } from "@/components/page-help";
import { RangerParkMap } from "@/components/ranger-park-map";

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

const visualJourneyMap = [
  { icon: "base", label: "Start", size: "large", text: "Orient at Base Camp" },
  { icon: "dydd", label: "DYD", size: "large", text: "Open the main journey" },
  { image: "/brand/badges/identity-badge.svg", label: "Identity", text: "Whose you are" },
  { image: "/brand/badges/designid-badge.png", label: "DesignID", text: "Early assessment marker" },
  { image: "/brand/badges/expertise-badge.svg", label: "Expertise", text: "Skills and capacity" },
  { image: "/brand/badges/story-badge.svg", label: "Story", text: "Formation and testimony" },
  { image: "/brand/badges/desire-badge.svg", label: "Desire", text: "Holy motivation" },
  {
    image: "/brand/badges/spiritual-gifts-badge.png",
    label: "Gifts Tool",
    text: "Spiritual gifts assessment",
  },
  { image: "/brand/badges/gifts-badge.svg", label: "Gifts", text: "Grace-given service" },
  { image: "/brand/badges/niche-badge.svg", label: "Niche", text: "Purpose clarity" },
  {
    image: "/brand/badges/design-pathways-badge.png",
    label: "Pathways",
    text: "Choose the next path",
  },
  { image: "/brand/badges/designpd-badge.png", label: "DesignPD", text: "Practice and decisions" },
  { image: "/brand/badges/fruitlife-360-badge.png", label: "FruitLife 360", text: "Visible growth" },
];

export default function RangerStationPage() {
  return (
    <main className="journey-shell hq-standalone-page ranger-station-page">
      <div className="ranger-station-header-image">
        <img
          src="/brand/dydd-ranger-station-header.png"
          alt="Discover Your Divine Design Ranger Station forest sign"
        />
      </div>

      <header className="standalone-hero ranger-station-hero">
        <div className="ranger-welcome-copy">
          <div>
            <p className="eyebrow">Ranger Station</p>
            <h1>Welcome in before you choose the trail.</h1>
            <p className="lede">
              This is the first orientation stop for the Discover Your Divine
              Design journey. Come in, get the big picture, see how the pieces
              fit together, and then choose the route that fits the next step.
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
          <div className="ranger-welcome-note" aria-label="Ranger welcome note">
            <span>Welcome desk</span>
            <p>
              Before the map, every learner gets a simple orientation: what DYD is,
              why the journey matters, and how the tools branch from the main path.
            </p>
          </div>
        </div>
        <DyddOrientationSlider />
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
          <p className="section-label">DYD Park Map</p>
          <h2>The whole journey in view.</h2>
          <p>
            Start at the Ranger Station, then choose the route that matches the
            next step. Each trail opens a short guide so learners can understand
            what the path is for before they move.
          </p>
        </div>

        <RangerParkMap />
      </section>

      <section className="visual-journey-map ranger-journey-map" aria-label="Typical DYD journey map">
        <div className="card-heading">
          <p className="section-label">Typical journey map</p>
          <h2>A visible road for the whole experience.</h2>
          <p>
            The park map shows the branches. This road shows the normal flow of
            the fuller journey from orientation through assessments, reflection,
            purpose, practice, and growth.
          </p>
        </div>
        <ol>
          {visualJourneyMap.map((marker, index) => (
            <li key={`${marker.label}-${index}`}>
              <div className={`journey-map-marker${marker.size === "large" ? " large" : ""}`}>
                {marker.image ? (
                  <img src={marker.image} alt={`${marker.label} marker`} />
                ) : (
                  <span className="journey-map-letter">{marker.icon === "dydd" ? "DYD" : "BC"}</span>
                )}
              </div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{marker.label}</strong>
              <small>{marker.text}</small>
            </li>
          ))}
        </ol>
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

      <section className="ask-dydi-hq ranger-dydi-guide" id="ask-dydi" aria-label="Ask Dydi">
        <div className="dydi-host">
          <img src="/brand/characters/dydi-full-body.png" alt="Dydi host" />
          <div>
            <p className="section-label">Companion guide</p>
            <h2>Dydi stays near the trail.</h2>
            <p>
              The companion layer belongs beside the branching journey, especially
              where a person needs encouragement, interpretation, or a simple way
              to keep moving.
            </p>
          </div>
        </div>
        <form className="dydi-form">
          <label htmlFor="ranger-dydi-question">Ask from Ranger Station</label>
          <textarea
            id="ranger-dydi-question"
            name="question"
            placeholder="Which trail should I explore next?"
            rows={4}
          />
          <button className="button primary" type="button">
            Ask Dydi
          </button>
          <p className="helper-text">
            Staged for preview. Live companion responses will connect later.
          </p>
        </form>
      </section>
    </main>
  );
}

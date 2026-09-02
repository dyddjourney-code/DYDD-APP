import Link from "next/link";
import { AppNavIcon } from "@/components/app-sidebar";
import { DyddOrientationSlider } from "@/components/dydd-orientation-slider";
import { RangerParkMap } from "@/components/ranger-park-map";

const stationStops = [
  {
    detail:
      "Choose the course or guided route that fits the learner's current step.",
    href: "/trailheads",
    icon: "signpost",
    label: "Trailheads",
    title: "Pick a route",
  },
  {
    detail:
      "Find assessments, reports, and earned markers gathered along the way.",
    href: "/field-kit",
    icon: "map",
    label: "Field Kit",
    title: "Check the tools",
  },
  {
    detail:
      "Gather books, workbooks, workshops, and live experiences for the trail ahead.",
    href: "/gear",
    icon: "backpack",
    label: "Gear",
    title: "Pack resources",
  },
];

const visualJourneyMap = [
  { icon: "base", label: "Start", size: "large", text: "Orient at Base Camp" },
  { icon: "dydd", label: "DYDD", size: "large", text: "Open the main journey" },
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
        <div className="ranger-welcome-scene">
          <figure className="ranger-porch-card">
            <img
              src="/brand/dydd-ranger-welcome-dydi.png"
              alt="Dydi welcoming learners at the Discover Your Divine Design Ranger Station"
            />
          </figure>
          <div className="ranger-welcome-copy">
            <p className="eyebrow">DYDD Ranger Station</p>
            <h1>Welcome</h1>
            <p className="lede">
              We&apos;re glad you made it. We&apos;ve been looking forward to having
              some adventures together.
            </p>
          </div>
        </div>
        <DyddOrientationSlider />
      </header>

      <section className="ranger-map-section" aria-label="DYDD Ranger Station map preview">
        <div className="ranger-map-copy">
          <p className="section-label">DYDD Park Map</p>
          <h2>A first look around.</h2>
          <p>
            The map gives the learner a simple picture of the world they have
            entered. The guide below names the main places without turning this
            page into a control center.
          </p>
          <div className="ranger-map-guide" aria-label="Inside the DYDD Ranger Station">
            <p className="section-label">Inside the Ranger Station</p>
            {stationStops.map((stop) => (
              <Link className="ranger-map-guide-item" href={stop.href} key={stop.label}>
                <AppNavIcon name={stop.icon} />
                <div>
                  <strong>{stop.title}</strong>
                  <small>{stop.label}</small>
                  <p>{stop.detail}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <RangerParkMap />
      </section>

      <section className="visual-journey-map ranger-journey-map" aria-label="Typical DYDD journey map">
        <div className="card-heading">
          <p className="section-label">Typical journey map</p>
          <h2>The usual path from welcome to growth.</h2>
          <p>
            Some learners move straight through the main route. Others take a
            tool or trail first. This shows the normal road without forcing every
            person to start the same way.
          </p>
        </div>
        <ol>
          {visualJourneyMap.map((marker, index) => (
            <li key={`${marker.label}-${index}`}>
              <div className={`journey-map-marker${marker.size === "large" ? " large" : ""}`}>
                {marker.image ? (
                  <img src={marker.image} alt={`${marker.label} marker`} />
                ) : (
                  <span className="journey-map-letter">{marker.icon === "dydd" ? "DYDD" : "BC"}</span>
                )}
              </div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{marker.label}</strong>
              <small>{marker.text}</small>
            </li>
          ))}
        </ol>
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

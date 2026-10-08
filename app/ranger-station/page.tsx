import Link from "next/link";
import { RangerReliefMap } from "@/components/ranger-relief-map";
import { type ReviewSearchParams, withReviewQuery } from "@/lib/review/heather";

type RangerStationPageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

const rangerDeskPrompts = [
  "What should I do next?",
  "Which trail can I start today?",
  "How do my assessment results connect?",
  "Where should I go if I feel stuck?",
];

const trailheadStarts = [
  {
    image: "/brand/badges/spiritual-gifts-badge.png",
    label: "Spiritual Gifts",
    status: "Start now",
    text: "A no-cost first assessment for serving with grace and maturity.",
  },
  {
    image: "/brand/badges/fruitlife-360-badge.png",
    label: "FruitLife 360",
    status: "Start now",
    text: "A formation assessment for visible fruit and growth conversations.",
  },
  {
    image: "/brand/badges/designid-badge.png",
    label: "DesignID",
    status: "Start now",
    text: "The core reflection assessment for your personal design language.",
  },
  {
    image: "/brand/badges/design-pathways-badge.png",
    label: "Design Pathways",
    status: "Start now",
    text: "A discernment route for naming possible paths and testing next steps.",
  },
  {
    image: "/brand/badges/designpd-badge.png",
    label: "DesignPD",
    status: "Requires DesignID",
    text: "A deeper application trail for planning, deciding, and doing from your design.",
  },
];

export default async function RangerStationPage({ searchParams }: RangerStationPageProps) {
  const reviewParams = await searchParams;

  return (
    <main className="journey-shell hq-standalone-page ranger-station-page">
      <div className="ranger-station-header-image">
        <img
          src="/brand/dydd-ranger-station-header.png"
          alt="Discover Your Divine Design Ranger Station forest sign"
        />
      </div>

      <header className="standalone-hero ranger-station-hero">
        <div>
          <p className="eyebrow">DYDD Ranger Station</p>
          <h1>Welcome to Ranger Station.</h1>
          <p className="lede">
            This is the orientation point for the Discover Your Divine Design ecosystem.
            Start with the map, notice what each place is for, and choose the next faithful
            step that fits your season.
          </p>
        </div>
        <div className="ranger-station-welcome-notes" aria-label="Ranger Station overview">
          <article>
            <span>First</span>
            <strong>Explore the map</strong>
            <p>Use the DYDD Ecosystem Map to see the whole journey at a glance.</p>
          </article>
          <article>
            <span>Then</span>
            <strong>Ask for help</strong>
            <p>Use Dydi when you want guidance about where to go next.</p>
          </article>
          <article>
            <span>Always</span>
            <strong>Choose the next step</strong>
            <p>This is not a checklist. It is a guided path toward clarity and faithful action.</p>
          </article>
        </div>
      </header>

      <section className="ranger-map-section relief-map-section" aria-label="Interactive DYDD relief map">
        <div className="ranger-map-copy">
          <p className="section-label">DYDD Ecosystem Map</p>
        </div>
        <RangerReliefMap />
      </section>

      <section className="ranger-desk-section" id="ranger-desk" aria-label="Ranger desk">
        <article className="ranger-desk-card">
          <div className="ranger-desk-art" aria-label="Dydi at the ranger desk">
            <img src="/brand/dydi-ranger-hallway.webp" alt="Dydi standing in the Ranger Station hall" />
          </div>
          <div className="ranger-desk-copy">
            <p className="section-label">Ranger desk</p>
            <h2>Ask Dydi where to begin.</h2>
            <p>
              This is the first guidance point, like walking into a park ranger station
              and asking what is worth seeing today. Dydi can help connect a person&apos;s
              current season, assessment status, and next practical step.
            </p>
            <form className="dydi-form ranger-desk-form">
              <label htmlFor="ranger-desk-question">Ask Dydi</label>
              <textarea
                id="ranger-desk-question"
                name="question"
                placeholder="What should I do next?"
                rows={4}
              />
              <button className="button primary" type="button">
                Ask at the desk
              </button>
              <p className="helper-text">
                Preview interaction. Live responses will use DYDD guardrails, learner context,
                and the approved knowledge base.
              </p>
            </form>
          </div>
          <div className="ranger-desk-prompts" aria-label="Suggested Dydi questions">
            {rangerDeskPrompts.map((prompt) => (
              <button type="button" key={prompt}>{prompt}</button>
            ))}
          </div>
        </article>

        <aside className="ranger-video-card" aria-label="Welcome video">
          <div className="video-placeholder">
            <span>Welcome video</span>
            <strong>What can you do here?</strong>
          </div>
          <p>
            This block is ready for the short welcome video that explains Ranger Station,
            the map, Dydi, Trailheads, Waypoints, Fireside, and Camp Circles.
          </p>
        </aside>
      </section>

      <section className="visual-journey-map ranger-journey-map" aria-label="Where to start">
        <div className="card-heading">
          <p className="section-label">Where do I start?</p>
          <h2>Trailheads are the starting points.</h2>
          <p>
            The Discover Your Divine Design Journey is the main hub, but a person can
            also begin with a focused assessment trail. Some trails are open right away.
            Others depend on a previous step.
          </p>
        </div>
        <ol>
          {trailheadStarts.map((trail, index) => (
            <li key={`${trail.label}-${index}`}>
              <div className="journey-map-marker">
                <img src={trail.image} alt={`${trail.label} marker`} />
              </div>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{trail.label}</strong>
              <small>{trail.text}</small>
              <em>{trail.status}</em>
            </li>
          ))}
        </ol>
        <div className="ranger-start-actions">
          <Link className="button primary" href={withReviewQuery("/trailheads", reviewParams)}>
            Open Trailheads
          </Link>
          <Link className="button secondary" href={withReviewQuery("/journey", reviewParams)}>
            Preview main journey
          </Link>
        </div>
      </section>
    </main>
  );
}

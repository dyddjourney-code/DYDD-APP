import { RangerReliefMap } from "@/components/ranger-relief-map";

const rangerDeskPrompts = [
  "What should I do next?",
  "Which trail can I start today?",
  "How do my assessment results connect?",
  "Where should I go if I feel stuck?",
];

const pathStarts = [
  {
    accent: "main",
    eyebrow: "Recommended main path",
    image: "/brand/dydd-logo-transparent.webp",
    label: "Discover Your Divine Design Journey",
    status: "Most complete",
    text:
      "The holistic route through identity, design, gifting, calling, and next faithful steps. This path can include DesignID and Spiritual Gifts as part of the larger journey.",
  },
  {
    accent: "short",
    eyebrow: "Focused short path",
    image: "/brand/badges/designid-badge.png",
    label: "DesignID",
    status: "Can stand alone",
    text:
      "A focused way to understand your design language and walk through the DesignID course without starting the full journey first.",
  },
  {
    accent: "short",
    eyebrow: "Focused short path",
    image: "/brand/badges/spiritual-gifts-badge.png",
    label: "Spiritual Gifts",
    status: "Can stand alone",
    text:
      "A grace-for-service route that helps someone name gifts, grow in maturity, and connect gifting to love and faithful action.",
  },
  {
    accent: "short",
    eyebrow: "Focused short path",
    image: "/brand/badges/fruitlife-360-badge.png",
    label: "FruitLife 360",
    status: "Can stand alone",
    text:
      "A formation path using fruit, feedback, and honest reflection to help someone see where growth is visible and where grace can deepen.",
  },
  {
    accent: "extended",
    eyebrow: "Extended pathway",
    image: "/brand/badges/designpd-badge.png",
    label: "DesignPD",
    status: "After DesignID + DYDD Journey",
    text:
      "A deeper application route for planning, deciding, and doing from your design after the core discovery work has been walked.",
  },
  {
    accent: "extended",
    eyebrow: "Extended pathway",
    image: "/brand/badges/design-pathways-badge.png",
    label: "Design Pathways",
    status: "Requires DesignID",
    text:
      "A discernment route for naming possible paths, considering where to go next, and testing faithful steps with courage and clarity.",
  },
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

      <section className="visual-journey-map ranger-journey-map ranger-path-finder" aria-label="What path is right for me">
        <div className="card-heading">
          <p className="section-label">What path is right for me?</p>
          <h2>Choose the starting point that fits your season.</h2>
          <p>
            The full journey is the best first path for most people. A focused path can
            also stand alone when someone wants a smaller beginning, while extended
            pathways work best after key discovery pieces are already in place.
          </p>
        </div>
        <ol className="ranger-path-grid">
          {pathStarts.map((trail, index) => (
            <li className={`ranger-path-card ${trail.accent}`} key={`${trail.label}-${index}`}>
              <div className="journey-map-marker">
                <img src={trail.image} alt={`${trail.label} marker`} />
              </div>
              <span>{trail.eyebrow}</span>
              <strong>{trail.label}</strong>
              <small>{trail.text}</small>
              <em>{trail.status}</em>
            </li>
          ))}
        </ol>
        <p className="ranger-path-note">
          Simple rule: begin with the full journey when you want the whole picture, choose
          a focused path when you want one clear growth step, and save extended pathways
          for after the foundation has been laid.
        </p>
      </section>
    </main>
  );
}

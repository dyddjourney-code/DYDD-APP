import Link from "next/link";

const journeySteps = [
  "Identity",
  "Expertise",
  "Story",
  "Desire",
  "Gifts",
  "Niche",
];

const hqSignals = [
  "Private login",
  "Assessment access",
  "Workbook artifacts",
  "Companion guidance",
  "Niche builder",
];

export default function Home() {
  return (
    <main className="school-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Discover Your Divine Design</p>
          <h1>DYDD Headquarters</h1>
          <p className="lede">
            A private command center where each client can enter the DYDD
            Journey, gather assessment results and workbook artifacts, and
            receive companion-guided reflection one step at a time.
          </p>
          <div className="action-row" aria-label="Primary actions">
            <Link href="/login" className="button primary">
              Enter HQ
            </Link>
            <a href="#journey" className="button secondary">
              View journey
            </a>
          </div>
        </div>
        <div className="journey-panel" aria-label="DYDD HQ prototype summary">
          <div className="panel-header">
            <span>Prototype loop</span>
            <strong>HQ v0.2</strong>
          </div>
          <ol>
            <li>Sign in</li>
            <li>Open Journey HQ</li>
            <li>Connect assessments</li>
            <li>Capture workbook input</li>
            <li>Build a living niche draft</li>
          </ol>
        </div>
      </section>

      <section id="journey" className="band">
        <div>
          <p className="section-label">Client journey</p>
          <h2>Leave HQ with a clear next step.</h2>
        </div>
        <div className="module-grid">
          {journeySteps.map((step, index) => (
            <article className="module" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="build-plan">
        <div>
          <p className="section-label">First useful version</p>
          <h2>Build the trusted client loop before the whole platform.</h2>
        </div>
        <div className="step-list">
          {hqSignals.map((signal) => (
            <div className="step" key={signal}>
              <span />
              <p>{signal}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

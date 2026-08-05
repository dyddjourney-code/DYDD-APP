const modules = [
  "Welcome and orientation",
  "Understanding your design",
  "Biblical identity basics",
  "Evangelism foundations",
  "Design-aware reflection",
];

const buildSteps = [
  "Student login",
  "DesignID course import",
  "Progress tracking",
  "Personalized reflection panel",
  "Stripe enrollment",
];

export default function Home() {
  return (
    <main className="school-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Discover Your Divine Design</p>
          <h1>DYDD Online School</h1>
          <p className="lede">
            A buildable first home for courses, biblical basics, evangelism
            training, and companion-guided learning that can speak to each
            student's actual design.
          </p>
          <div className="action-row" aria-label="Primary actions">
            <a href="#build-plan" className="button primary">
              View build path
            </a>
            <a href="#course-map" className="button secondary">
              Course map
            </a>
          </div>
        </div>
        <div className="journey-panel" aria-label="School prototype summary">
          <div className="panel-header">
            <span>Prototype loop</span>
            <strong>Version 0.1</strong>
          </div>
          <ol>
            <li>Sign in</li>
            <li>Open DesignID Foundations</li>
            <li>Watch a lesson</li>
            <li>Answer a reflection</li>
            <li>Receive design-aware guidance</li>
          </ol>
        </div>
      </section>

      <section id="course-map" className="band">
        <div>
          <p className="section-label">Initial course</p>
          <h2>DesignID Foundations</h2>
        </div>
        <div className="module-grid">
          {modules.map((module, index) => (
            <article className="module" key={module}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{module}</h3>
            </article>
          ))}
        </div>
      </section>

      <section id="build-plan" className="build-plan">
        <div>
          <p className="section-label">First useful version</p>
          <h2>Build the core learning loop before the whole school.</h2>
        </div>
        <div className="step-list">
          {buildSteps.map((step) => (
            <div className="step" key={step}>
              <span />
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}


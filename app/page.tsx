import Link from "next/link";
import { designIdCourse } from "@/lib/courses/designid-foundations";

const journeySteps = [
  { label: "Identity", detail: "Whose you are" },
  { label: "Story", detail: "What shaped you" },
  { label: "Expertise", detail: "What you have cultivated" },
  { label: "Desire", detail: "What stirs your heart" },
  { label: "Gifts", detail: "How the Spirit empowers you" },
  { label: "Niche", detail: "Where design becomes service" },
];

const hqSignals = [
  "Private learner HQ",
  "Assessment vault",
  "DesignID Foundations",
  "Guided reflection",
  "Purpose synthesis",
];

const reflections = [
  {
    label: "Architect",
    text: "Vision, initiative, and the drive to build what serves a purpose.",
  },
  {
    label: "Artisan",
    text: "Craft, clarity, and the ability to shape truth with precision.",
  },
  {
    label: "Shepherd",
    text: "Care, empathy, and the instinct to strengthen people.",
  },
  {
    label: "Steward",
    text: "Order, responsibility, and faithful attention to what matters.",
  },
];

export default function Home() {
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );

  return (
    <main className="school-shell">
      <section className="brand-hero">
        <div className="hero-copy">
          <img
            className="brand-mark"
            src="/brand/designid-logo.webp"
            alt="DesignID"
          />
          <p className="eyebrow">On Purpose. For Purpose.</p>
          <h1>Discover Your Divine Design HQ</h1>
          <p className="lede">
            A private learning space for DesignID, assessment history, guided
            reflection, and the next faithful step in the DYDD Journey.
          </p>
          <div className="action-row" aria-label="Primary actions">
            <Link href="/login" className="button primary">
              Enter HQ
            </Link>
            <Link href="/courses/designid-foundations" className="button secondary">
              Open DesignID course
            </Link>
            <a href="#journey" className="button secondary">
              View journey
            </a>
          </div>
        </div>
        <div className="hero-art" aria-label="DYDD journey preview">
          <img
            src="/brand/dydd-book-cover.webp"
            alt="Discover Your Divine Design book cover"
          />
          <div className="verse-card">
            <p>
              “For we are God&apos;s handiwork, created in Christ Jesus to do
              good works.”
            </p>
            <span>Ephesians 2:10</span>
          </div>
        </div>
      </section>

      <section className="course-feature" aria-label="DesignID course access">
        <div className="feature-copy">
          <p className="section-label">Course access</p>
          <h2>DesignID Foundations now feels like the front door.</h2>
          <p>
            The course branch is no longer buried. It sits beside the learner
            HQ as the first class pathway, with the full module structure ready
            for deeper lesson-body migration.
          </p>
        </div>
        <div className="course-access-panel">
          <div className="mini-metrics" aria-label="Course metrics">
            <span>{designIdCourse.modules.length} modules</span>
            <span>{lessonCount} lessons</span>
            <span>GHL source adapted</span>
          </div>
          <Link className="button primary" href="/courses/designid-foundations">
            Review the course branch
          </Link>
        </div>
      </section>

      <section id="journey" className="band">
        <div>
          <p className="section-label">DYDD framework</p>
          <h2>The app should support the journey, not distract from it.</h2>
        </div>
        <div className="module-grid">
          {journeySteps.map((step, index) => (
            <article className="module" key={step.label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.label}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="reflection-band" aria-label="DesignID reflections">
        <div>
          <p className="section-label">Four reflections</p>
          <h2>DesignID gives language to how grace shows up.</h2>
        </div>
        <div className="reflection-grid">
          {reflections.map((reflection) => (
            <article key={reflection.label}>
              <span>{reflection.label}</span>
              <p>{reflection.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="build-plan">
        <div>
          <p className="section-label">Current product loop</p>
          <h2>A more polished shell for the first real learner experience.</h2>
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

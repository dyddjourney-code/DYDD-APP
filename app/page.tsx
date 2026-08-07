import Link from "next/link";
import { designIdCourse } from "@/lib/courses/designid-foundations";

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
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );

  return (
    <main className="school-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Discover Your Divine Design</p>
          <h1>DYDD Headquarters</h1>
          <p className="lede">
            The new HQ build now has a visible DesignID course branch, mapped
            assessment history, and the first field-lab look for processing the
            DYDD Journey.
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
        <div className="journey-panel field-log" aria-label="DYDD HQ release summary">
          <div className="panel-header">
            <span>Production build</span>
            <strong>HQ v0.3</strong>
          </div>
          <div className="release-stamp">
            <span>{designIdCourse.modules.length}</span>
            <small>DesignID modules</small>
          </div>
          <ol>
            <li>{lessonCount} course lessons staged</li>
            <li>Admin all-submissions view added</li>
            <li>Duplicate submission history preserved</li>
            <li>Gmail dot matching enabled</li>
            <li>Heather verification lives inside HQ admin</li>
          </ol>
        </div>
      </section>

      <section className="course-access-band" aria-label="DesignID course access">
        <div>
          <p className="section-label">Course access</p>
          <h2>DesignID Foundations is live in the app.</h2>
        </div>
        <div className="course-access-panel">
          <p>
            The GHL course code has been converted into an app-native course
            map so the branch can be reviewed before the full lesson body
            migration.
          </p>
          <div className="mini-metrics" aria-label="Course metrics">
            <span>{designIdCourse.modules.length} modules</span>
            <span>{lessonCount} lessons</span>
            <span>Review branch</span>
          </div>
          <Link className="button primary" href="/courses/designid-foundations">
            Review the course branch
          </Link>
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

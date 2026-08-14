import Link from "next/link";
import { enterHeatherPreview, enterNewPreview } from "@/app/login/actions";
import { allCourseSummaries } from "@/lib/courses/course-catalog";
import { designIdCourse } from "@/lib/courses/designid-foundations";

const includedItems = [
  {
    label: "Assessment shelf",
    text: "DesignID, DesignPD, Spiritual Gifts, and future tools gathered into one personal place.",
  },
  {
    label: "Course room",
    text: "Lessons that help the language of your design become part of daily life.",
  },
  {
    label: "Reflection desk",
    text: "Workbook prompts and next steps kept near the results that gave them meaning.",
  },
  {
    label: "Dydi's corner",
    text: "A guide station for slowing down, noticing what matters, and choosing a faithful next move.",
  },
];

const approachSteps = [
  {
    label: "Begin here",
    text: "Open the personal view and see the pieces of the DYDD journey in one place.",
  },
  {
    label: "Look around",
    text: "Move between results, course lessons, workbook reflection, and future guide prompts without losing the thread.",
  },
  {
    label: "Take the next step",
    text: "Choose one faithful action, then return as clarity grows through practice, prayer, and service.",
  },
];

const previewStats = [
  { label: "DesignID modules", value: designIdCourse.modules.length },
  {
    label: "DesignID lessons",
    value: designIdCourse.modules.reduce(
      (count, module) => count + module.lessons.length,
      0,
    ),
  },
  { label: "Mapped classes", value: allCourseSummaries.length },
];

export default function Home() {
  return (
    <main className="portal-shell">
      <section className="portal-hero" aria-label="DYDD portal entry">
        <div className="portal-hero-copy">
          <img
            className="brand-mark"
            src="/brand/dydd-logo.webp"
            alt="Discover Your Divine Design"
          />
          <p className="eyebrow">Private journey portal</p>
          <h1>Your design deserves more than a report.</h1>
          <p className="lede">
            The DYDD online school is being shaped as a guided headquarters for
            assessment results, course content, workbook reflection, and future
            companion conversations.
          </p>
          <div className="portal-access-panel" aria-label="Portal access">
            <div>
              <p className="section-label">Portal entry</p>
              <h2>Sign in or register to open your personal view.</h2>
            </div>
            <form action={enterHeatherPreview}>
              <button className="button primary portal-login-button" type="submit">
                Heather review
              </button>
            </form>
            <form action={enterNewPreview}>
              <button className="button secondary portal-login-button" type="submit">
                New person review
              </button>
            </form>
            <Link href="/login" className="button secondary">
              Register or email sign-in
            </Link>
            <p className="helper-text">
              Review mode opens the current staged personal view. The public
              portal does not display individual assessment records.
            </p>
          </div>
        </div>

        <div className="portal-journey-note" aria-label="Journey preview">
          {previewStats.map((stat) => (
            <p key={stat.label}>
              <span>{stat.value}</span>
              <small>{stat.label}</small>
            </p>
          ))}
        </div>
      </section>

      <section className="portal-value-band" aria-label="Value and approach">
        <div>
          <p className="section-label">On Purpose, For Purpose</p>
          <h2>Your life is not random, and your design is not accidental.</h2>
        </div>
        <div className="portal-purpose-copy">
          <p>
            Discover Your Divine Design helps people recognize how God has
            uniquely shaped their identity, expertise, story, desire, gifts, and
            niche so they can live and serve with clarity.
          </p>
          <blockquote>
            For we are God&apos;s handiwork, created in Christ Jesus to do good
            works, which God prepared in advance for us to do.
            <cite>Ephesians 2:10</cite>
          </blockquote>
        </div>
      </section>

      <section className="portal-included" aria-label="What is included">
        <div className="portal-section-heading">
          <p className="section-label">What is included</p>
          <h2>A living journey space, not a one-time score page.</h2>
        </div>
        <div className="portal-bento">
          {includedItems.map((item, index) => (
            <article
              className={`portal-feature portal-feature-${index + 1}`}
              key={item.label}
            >
              <h3>{item.label}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-flow" aria-label="How it works">
        <div>
          <p className="section-label">Opening the door</p>
          <h2>A calm launch point for the journey.</h2>
          <p>
            The portal should help a person orient, choose a next step, and keep
            moving without feeling sold to or sent into a maze.
          </p>
        </div>
        <div className="portal-overview-cards">
          {approachSteps.map((step) => (
            <article key={step.label}>
              <strong>{step.label}</strong>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ask-dydi" aria-label="Ask Dydi">
        <div className="dydi-host">
          <div className="dydi-figure">
            <img src="/brand/characters/dydi-full-body.png" alt="Dydi host" />
          </div>
          <div className="dydi-copy">
            <p className="section-label">Ask Dydi</p>
            <h2>Need help choosing where to begin?</h2>
            <p>
              Dydi is stationed beside the doorway as the future guide for the
              journey, helping someone understand what is available and choose a
              faithful next step.
            </p>
          </div>
        </div>
        <form className="dydi-form">
          <label htmlFor="dydi-question">What would you like to explore?</label>
          <textarea
            id="dydi-question"
            name="question"
            placeholder="I want to use DYDD with..."
            rows={5}
          />
          <button className="button primary" type="button">
            Ask Dydi
          </button>
          <p className="helper-text">
            This inquiry box is staged for the product preview. Live Dydi
            responses will connect later.
          </p>
        </form>
      </section>
    </main>
  );
}

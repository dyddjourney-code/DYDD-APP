import Link from "next/link";
import { enterHeatherPreview, enterNewPreview } from "@/app/login/actions";
import { designIdCourse } from "@/lib/courses/designid-foundations";

const includedItems = [
  {
    label: "Assessment vault",
    text: "A private place where DesignID, DesignPD, Spiritual Gifts, and future tools can be gathered under one journey.",
  },
  {
    label: "Guided course path",
    text: "A lesson-by-lesson walkthrough that can eventually adapt the teaching to each person's assessment language.",
  },
  {
    label: "Reflection workspace",
    text: "A place to collect prompts, responses, workbook artifacts, and the next faithful step.",
  },
  {
    label: "Companion layer",
    text: "Dydi can become the conversational guide that helps a person process their own records without turning the app into a static report.",
  },
];

const approachSteps = [
  "Register or sign in",
  "Connect assessment records",
  "Walk the course pathway",
  "Ask Dydi for guided reflection",
];

const previewStats = [
  { label: "DesignID modules", value: designIdCourse.modules.length },
  {
    label: "Staged lessons",
    value: designIdCourse.modules.reduce(
      (count, module) => count + module.lessons.length,
      0,
    ),
  },
  { label: "Core journey moves", value: 6 },
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

        <div className="portal-preview" aria-label="What the app includes">
          <div className="portal-preview-window">
            <div className="portal-window-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="portal-route-card">
              <small>DYDD HQ</small>
              <strong>Identity. Evidence. Guided next steps.</strong>
              <p>
                The personal view can gather course progress, assessment
                summaries, reflections, and Dydi prompts in one quiet workspace.
              </p>
            </div>
            <div className="portal-stat-grid">
              {previewStats.map((stat) => (
                <p key={stat.label}>
                  <span>{stat.value}</span>
                  <small>{stat.label}</small>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="portal-value-band" aria-label="Value and approach">
        <div>
          <p className="section-label">Why this exists</p>
          <h2>People need a guided path from insight to faithful action.</h2>
        </div>
        <p>
          Assessments can name important patterns, but the real value comes when
          a person can revisit the language, connect it to their story, ask
          better questions, and keep moving toward service, calling, and
          maturity.
        </p>
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
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.label}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-flow" aria-label="How it works">
        <div>
          <p className="section-label">How it works</p>
          <h2>Simple entry. Personal walkthrough. Better conversations.</h2>
        </div>
        <ol>
          {approachSteps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="ask-dydi" aria-label="Ask Dydi">
        <div>
          <p className="section-label">Ask Dydi</p>
          <h2>Curious how this could work for you or your group?</h2>
          <p>
            Ask about using the tool for a family, class, cohort, church,
            coaching client, or leadership group. This section will become the
            inquiry doorway for matching the app to the right use case.
          </p>
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

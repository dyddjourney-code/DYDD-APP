import Link from "next/link";
import { enterHeatherPreview, enterNewPreview } from "@/app/login/actions";
import { designIdCourse } from "@/lib/courses/designid-foundations";

const includedItems = [
  {
    label: "Your assessment shelf",
    text: "DesignID, DesignPD, Spiritual Gifts, and future tools can live together without turning the journey into a pile of separate reports.",
  },
  {
    label: "Course room",
    text: "A place to continue learning the language of your design after the first insight lands.",
  },
  {
    label: "Reflection desk",
    text: "Prompts, workbook thoughts, and next steps belong close to the results that gave them meaning.",
  },
  {
    label: "Dydi's corner",
    text: "A conversational guide can help the person slow down, notice what matters, and choose the next faithful move.",
  },
];

const approachSteps = [
  "Open your personal HQ",
  "Review what is already on the shelf",
  "Choose the next room to enter",
  "Continue with course, reflection, or Dydi",
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
        <div className="dydi-host">
          <img src="/brand/characters/dydi-full-body.png" alt="Dydi host" />
          <div>
            <p className="section-label">Ask Dydi</p>
            <h2>Need help choosing where to begin?</h2>
            <p>
              Dydi will eventually act like the guide in the room, helping
              someone make sense of what is available and choose a faithful next
              step.
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

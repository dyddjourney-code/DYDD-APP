import Link from "next/link";
import { isSandbox } from "@/lib/environment";
import { enterNewPreview } from "@/app/login/actions";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
    label: "Your next step",
    text: "Choose a course, revisit a saved reflection, or return to your personal Base Camp.",
  },
];

const approachSteps = [
  {
    label: "Begin here",
    text: "Open the personal view and see the pieces of the DYDD journey in one place.",
  },
  {
    label: "Look around",
    text: "Move between results, course lessons, workbook reflection, and your private workbook without losing the thread.",
  },
  {
    label: "Take the next step",
    text: "Choose one faithful action, then return as clarity grows through practice, prayer, and service.",
  },
];

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/hq");

  return (
    <main className="portal-shell">
      <section className="portal-hero" aria-label="DYDD portal entry">
        <div className="portal-hero-copy">
          <img
            className="brand-mark"
            src="/brand/dydd-logo.webp"
            alt="Discover Your Divine Design"
          />
          <p className="eyebrow">DYDD · Free beta</p>
          <h1>Your design deserves more than a report.</h1>
          <p className="lede">
            Explore your design through assessments, guided courses, and private
            reflections. Create your own account to save your progress.
            Everything in this beta is free—no payment details needed.
          </p>
          <div className="portal-access-panel" aria-label="Portal access">
            <div>
              <p className="section-label">Welcome to DYDD</p>
              <h2>Begin your DYDD Journey.</h2>
            </div>
            {isSandbox() ? <form action={enterNewPreview}><button className="button primary portal-login-button" type="submit">New person review</button></form> : <>
              <Link href="/login?mode=signup" className="button primary portal-login-button">Create your free account</Link>
              <Link href="/login" className="button secondary">Sign in</Link>
              <p className="helper-text">Your reflections and progress belong to your own account. Confirm your email to get started.</p>
            </>}
          </div>
        </div>

        <div className="portal-journey-note" aria-label="Your DYDD journey">
          <p><span>Discover</span><small>Explore your design</small></p>
          <p><span>Reflect</span><small>Keep your private workbook</small></p>
          <p><span>Grow</span><small>Put learning into practice</small></p>
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
            Start at Base Camp, explore the courses at Trailheads, and return to
            your saved results and reflections in Field Kit.
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

    </main>
  );
}

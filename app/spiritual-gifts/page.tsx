import Link from "next/link";
import { PageHelp } from "@/components/page-help";
import { createSpiritualGiftsSession } from "./actions";

type SpiritualGiftsPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsPage({ searchParams }: SpiritualGiftsPageProps) {
  const params = await searchParams;

  return (
    <main className="fruitlife-shell spiritual-gifts-shell">
      <nav className="course-nav" aria-label="Spiritual Gifts navigation">
        <Link href="/">DYDD School</Link>
        <Link href="/field-kit">Field Kit</Link>
      </nav>

      <header className="fruitlife-hero spiritual-gifts-hero">
        <div className="fruitlife-hero-copy">
          <p className="section-label">Spiritual Gifts Intake</p>
          <h1>Build the gifts channel inside the app.</h1>
          <p className="lede">
            Start a separate native Spiritual Gifts assessment session without touching the current
            live-facing assessment, form, sheet, Make, or PDFMonkey process.
          </p>
          <div className="fruitlife-hero-badges" aria-label="Spiritual Gifts workflow summary">
            <span>App-native intake</span>
            <span>22-gift inventory</span>
            <span>Result snapshot</span>
          </div>
        </div>
        <div className="fruitlife-hero-mark">
          <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        </div>
      </header>

      <PageHelp
        title="How this channel works"
        items={[
          "Create an app-owned Spiritual Gifts session first.",
          "Use the generated self link to complete the native assessment.",
          "The current live Spiritual Gifts process stays untouched while this channel is rebuilt.",
        ]}
      />

      <form action={createSpiritualGiftsSession} className="fruitlife-form fruitlife-signup">
        <input name="signup_source" type="hidden" value="vercel-spiritual-gifts-intake" />
        {params?.message ? <p className="form-message">{params.message}</p> : null}
        <section className="fruitlife-intake-overview">
          <p>
            <span>1</span>
            Participant
          </p>
          <p>
            <span>2</span>
            Self Link
          </p>
          <p>
            <span>3</span>
            Assessment
          </p>
          <p>
            <span>4</span>
            App Result
          </p>
        </section>
        <section className="fruitlife-panel">
          <p className="section-label">Participant Setup</p>
          <h2>Create the private app session.</h2>
          <div className="fruitlife-grid two">
            <label>
              Participant name
              <small>The name attached to the app-owned Spiritual Gifts result.</small>
              <input name="participant_name" required type="text" />
            </label>
            <label>
              Participant email
              <small>Used to connect the result to the learner record.</small>
              <input name="participant_email" required type="email" />
            </label>
          </div>
        </section>
        <section className="fruitlife-intake-note">
          <strong>What happens when you click create:</strong>
          <span>
            The app writes a separate Spiritual Gifts session, creates the self assessment link, and
            keeps all live external automation channels untouched.
          </span>
        </section>
        <button className="button primary" type="submit">
          Create Spiritual Gifts Session
        </button>
      </form>
    </main>
  );
}

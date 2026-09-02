import Link from "next/link";
import { PageHelp } from "@/components/page-help";
import { createFruitLifeSession } from "./actions";
import { ObserverInvitations } from "./observer-invitations";

type FruitLifeSignupPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FruitLifeSignupPage({
  searchParams,
}: FruitLifeSignupPageProps) {
  const params = await searchParams;

  return (
    <main className="fruitlife-shell">
      <nav className="course-nav" aria-label="FruitLife navigation">
        <Link href="/">DYDD School</Link>
        <Link href="/hq">HQ</Link>
      </nav>

      <header className="fruitlife-hero fruitlife-setup-hero">
        <div className="fruitlife-hero-copy">
          <p className="section-label">FruitLife 360 Intake</p>
          <h1>Begin a formation mirror.</h1>
          <p className="lede">
            Create the self link, invite trusted observers, and keep the full intake workflow inside
            the DYDD app.
          </p>
          <div className="fruitlife-hero-badges" aria-label="FruitLife workflow summary">
            <span>Self reflection</span>
            <span>Observer feedback</span>
            <span>Supabase workflow</span>
          </div>
        </div>
        <div className="fruitlife-hero-mark">
          <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
        </div>
      </header>

      <PageHelp
        items={[
          "Create the self-reflection session before inviting observers.",
          "Add observers now if you have them, or use the saved observer link later.",
          "Watch the status area after creation so reports, reminders, and artifacts stay organized.",
        ]}
        title="How FruitLife 360 works"
      />

      <form action={createFruitLifeSession} className="fruitlife-form fruitlife-signup">
        <input name="signup_source" type="hidden" value="vercel-fruitlife-intake" />
        {params?.message ? <p className="form-message">{params.message}</p> : null}
        <section className="fruitlife-intake-overview">
          <p>
            <span>1</span>
            Participant
          </p>
          <p>
            <span>2</span>
            Observers
          </p>
          <p>
            <span>3</span>
            Email Links
          </p>
          <p>
            <span>4</span>
            Watch Status
          </p>
        </section>
        <section className="fruitlife-panel">
          <p className="section-label">Participant Setup</p>
          <h2>Create the session and send the first link.</h2>
          <div className="fruitlife-grid two">
            <label>
              Participant name
              <small>The name printed in the workflow and report queue.</small>
              <input name="participant_name" required type="text" />
            </label>
            <label>
              Participant email
              <small>The app sends the self-reflection link here.</small>
              <input name="participant_email" required type="email" />
            </label>
            <label>
              Observer goal
              <small>Used for progress tracking if observer emails are not entered yet.</small>
              <input defaultValue="3" min="0" max="12" name="observer_goal" required type="number" />
            </label>
          </div>
        </section>

        <section className="fruitlife-panel">
          <p className="section-label">Observer Invitations</p>
          <h2>Add one observer, then add more if you are ready.</h2>
          <ObserverInvitations />
        </section>

        <section className="fruitlife-intake-note">
          <strong>What happens when you click create:</strong>
          <span>
            The app writes the session to Supabase, sends the participant email through Resend,
            sends observer emails when entered, and stores the links for HQ reminders.
          </span>
        </section>

        <button className="button primary" type="submit">
          Create and Send Links
        </button>
      </form>
    </main>
  );
}

import Link from "next/link";
import { createFruitLifeSession } from "./actions";

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

      <header className="fruitlife-hero">
        <div className="fruitlife-hero-mark">
          <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
        </div>
        <div>
          <p className="section-label">FruitLife 360 Intake</p>
          <h1>Start the reflection.</h1>
          <p className="lede">
            Create the self link, invite observers, and begin the app-owned report workflow in
            one clean pass.
          </p>
        </div>
      </header>

      <form action={createFruitLifeSession} className="fruitlife-form fruitlife-signup">
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
            <label>
              Signup source
              <small>Keep this for audit/history unless you are testing a special path.</small>
              <input defaultValue="vercel-fruitlife-intake" name="signup_source" type="text" />
            </label>
          </div>
        </section>

        <section className="fruitlife-panel">
          <p className="section-label">Observer Invitations</p>
          <h2>Add observers now, or leave them blank and share the observer link later.</h2>
          <div className="fruitlife-observer-roster">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="fruitlife-observer-row" key={index}>
                <span>{index + 1}</span>
                <label>
                  Name
                  <input name={`observer_name_${index + 1}`} type="text" />
                </label>
                <label>
                  Email
                  <input name={`observer_email_${index + 1}`} type="email" />
                </label>
                <label>
                  Relationship
                  <input name={`observer_relationship_${index + 1}`} type="text" />
                </label>
              </div>
            ))}
          </div>
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

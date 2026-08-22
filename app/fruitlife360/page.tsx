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
        <p className="section-label">FruitLife 360 Native Intake</p>
        <h1>FruitLife 360</h1>
        <p className="lede">
          Start a Vercel/Supabase FruitLife session, create secure self and
          observer links, and store the workflow beside the current live system.
        </p>
      </header>

      <form action={createFruitLifeSession} className="fruitlife-form fruitlife-signup">
        {params?.message ? <p className="form-message">{params.message}</p> : null}
        <section className="fruitlife-panel">
          <p className="section-label">Participant Setup</p>
          <h2>Create the session.</h2>
          <div className="fruitlife-grid two">
            <label>
              Participant name
              <input name="participant_name" required type="text" />
            </label>
            <label>
              Participant email
              <input name="participant_email" required type="email" />
            </label>
            <label>
              Observer goal
              <input defaultValue="3" min="0" max="12" name="observer_goal" required type="number" />
            </label>
            <label>
              Signup source
              <input defaultValue="vercel-fruitlife-intake" name="signup_source" type="text" />
            </label>
          </div>
        </section>
        <button className="button primary" type="submit">
          Create Native Intake Links
        </button>
      </form>
    </main>
  );
}

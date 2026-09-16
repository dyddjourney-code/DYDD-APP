import { redirect } from "next/navigation";
import { PageHelp } from "@/components/page-help";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createFruitLifeSession } from "./actions";
import { ObserverInvitations } from "./observer-invitations";

type FruitLifeSignupPageProps = {
  searchParams?: Promise<{
    message?: string;
    return_to?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FruitLifeSignupPage({
  searchParams,
}: FruitLifeSignupPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const returnTo = params?.return_to?.startsWith("/") ? params.return_to : "/fruitlife360/entry";

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/fruitlife360?return_to=${returnTo}`)}`);
  }

  return (
    <main className="fruitlife-shell fruitlife-public">
      <form action={createFruitLifeSession} className="fruitlife-form fruitlife-signup">
        <input name="signup_source" type="hidden" value="vercel-fruitlife-intake" />
        <input name="return_to" type="hidden" value={returnTo} />
        {params?.message ? <p className="form-message">{params.message}</p> : null}
        <section className="fruitlife-flow-header">
          <div>
            <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
            <div>
              <p className="section-label">FruitLife 360</p>
              <h1>Set up your assessment</h1>
              <p>
                Start with your own reflection. Add observers only if you want trusted feedback
                included in this report.
              </p>
            </div>
          </div>
          <PageHelp
            items={[
              "Use 0 observers for a self-assessment.",
              "Add observer names and emails only when you want feedback from others.",
              "After setup, the app sends your self-reflection link and tracks the report process.",
            ]}
            title="Help"
          />
        </section>
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
          <h2>Who is this assessment for?</h2>
          <p>
            Enter the participant details. For a self-assessment, leave the observer goal at 0.
          </p>
          <div className="fruitlife-grid two">
            <label>
              Participant name
              <small>This name appears in the app and report process.</small>
              <input name="participant_name" required type="text" />
            </label>
            <label>
              Participant email
              <small>The self-reflection link is sent here.</small>
              <input name="participant_email" required type="email" />
            </label>
            <label>
              Observer goal
              <small>Use 0 for self-assessment. Increase this only when inviting observers.</small>
              <input defaultValue="0" min="0" max="12" name="observer_goal" required type="number" />
            </label>
          </div>
        </section>

        <section className="fruitlife-panel">
          <p className="section-label">Optional Observers</p>
          <h2>Add trusted observers only if this report should include outside feedback.</h2>
          <ObserverInvitations />
        </section>

        <section className="fruitlife-intake-note">
          <strong>What happens next:</strong>
          <span>
            The app creates the session, emails the participant link, and tracks the report process
            in Base Camp.
          </span>
        </section>

        <button className="button primary" type="submit">
          Create Assessment
        </button>
      </form>
    </main>
  );
}

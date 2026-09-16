import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { FruitLifeCurrentAssessmentProcess } from "@/components/fruitlife-current-assessment-process";
import {
  fruitLifeIsActive,
  fruitLifeTokenFromSession,
  getFruitLifeDashboardSessions,
} from "@/lib/fruitlife360/dashboard";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FruitLifeEntryPageProps = {
  searchParams?: Promise<{
    preview?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FruitLifeEntryPage({ searchParams }: FruitLifeEntryPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = normalizeEmail(user?.email);
  const sessions = await getFruitLifeDashboardSessions({
    email,
    enabled: Boolean(user),
  });
  const activeSession = sessions.find((session) => fruitLifeIsActive(session)) ?? null;
  const latestSession = activeSession ?? sessions[0] ?? null;
  const token = fruitLifeTokenFromSession(latestSession);
  const isPreview = params?.preview === "fruit-person";

  return (
    <main className="fruitlife-shell fruitlife-public fruitlife-entry-shell">
      <section className="fruitlife-entry-hero" aria-label="FruitLife 360 entry">
        <div>
          <Link className="text-link" href="/">
            Discover Your Divine Design
          </Link>
          <p className="section-label">FruitLife 360</p>
          <h1>A focused place for your formation mirror.</h1>
          <p className="lede">
            Start one FruitLife 360 report process, invite trusted observers,
            watch progress, and return here until the report is ready.
          </p>
          <div className="fruitlife-entry-actions">
            {user ? (
              <Link className="button primary" href="/fruitlife360?return_to=/fruitlife360/entry">
                Start FruitLife 360
              </Link>
            ) : (
              <Link
                className="button primary"
                href="/login?next=/fruitlife360/entry"
              >
                Create account or sign in
              </Link>
            )}
            <a
              className="button secondary"
              href="https://form.jotform.com/253485055310048"
              rel="noopener"
              target="_blank"
            >
              Take Spiritual Gifts Free
            </a>
          </div>
        </div>
        <aside className="fruitlife-entry-price" aria-label="FruitLife price">
          <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
          <strong>$10</strong>
          <span>one report process</span>
          <p>Includes self reflection, observer links, progress tracking, and the finished report.</p>
        </aside>
      </section>

      <section className="fruitlife-entry-grid" aria-label="FruitLife focused portal">
        <article className="fruitlife-entry-panel">
          <p className="section-label">Focused access</p>
          <h2>Only the FruitLife lane.</h2>
          <p>
            Until the full DYDD app is ready, this page keeps the buyer in a
            simple assessment-only experience. No course catalog, no unfinished
            journey areas, and no extra decisions.
          </p>
          <div className="fruitlife-entry-steps">
            <span>Create account</span>
            <span>Purchase access</span>
            <span>Start session</span>
            <span>Track report</span>
          </div>
        </article>

        <article className="fruitlife-entry-panel">
          <p className="section-label">Account</p>
          <h2>{user ? "Signed in and ready." : "Account required."}</h2>
          <p>
            {user
              ? `You are signed in as ${user.email}. FruitLife sessions started here can stay attached to this account.`
              : "A participant will create an account or use email sign-in before starting. Observers can still use simple invitation links without accounts."}
          </p>
          {user ? (
            <form action={signOut}>
              <button className="button secondary" type="submit">
                Sign out
              </button>
            </form>
          ) : (
            <Link className="button secondary" href="/login?next=/fruitlife360/entry">
              Continue to email verification
            </Link>
          )}
        </article>
      </section>

      <section className="fruitlife-entry-panel fruitlife-entry-purchase">
        <div>
          <p className="section-label">Purchase step</p>
          <h2>$10 FruitLife 360 access.</h2>
          <p>
            Payment is staged here as the next integration point. For preview,
            the start button opens the current FruitLife setup flow so we can
            test the process before turning on checkout.
          </p>
        </div>
        {user ? (
          <Link className="button primary" href="/fruitlife360?return_to=/fruitlife360/entry">
            Continue to setup
          </Link>
        ) : (
          <Link className="button primary" href="/login?next=/fruitlife360/entry">
            Sign in to continue
          </Link>
        )}
      </section>

      {latestSession ? (
        <FruitLifeCurrentAssessmentProcess
          created={isPreview}
          session={latestSession}
          token={token}
        />
      ) : null}
    </main>
  );
}

import { redirect } from "next/navigation";
import { PageHelp } from "@/components/page-help";
import { userHasFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import { getFruitLifeDashboardSessions, fruitLifeIsActive } from "@/lib/fruitlife360/dashboard";
import { normalizeEmail } from "@/lib/identity/email";
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

function isFruitLifeAdmin(email: string | null | undefined) {
  const configured = (process.env.DYDD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  return new Set(["dyddjourney@gmail.com", ...configured]).has(normalizeEmail(email));
}

export default async function FruitLifeSignupPage({
  searchParams,
}: FruitLifeSignupPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const returnTo = params?.return_to?.startsWith("/") && !params.return_to.startsWith("//") ? params.return_to : "/field-kit#current-assessment-process";
  const legacyLane = returnTo.includes("lane=fruitlife");

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/fruitlife360?return_to=${returnTo}`)}`);
  }

  const hasAccess = legacyLane ? await userHasFruitLifeEntitlement(user.id) : true;

  if (legacyLane && !hasAccess && !isFruitLifeAdmin(user.email)) {
    redirect(
      `/field-kit?lane=fruitlife&checkout=required#current-assessment-process`,
    );
  }

  if (!legacyLane) {
    const sessions = await getFruitLifeDashboardSessions({ email: normalizeEmail(user.email), enabled: true });
    if (sessions.some(fruitLifeIsActive)) redirect("/field-kit#current-assessment-process");
  }
  const { data: profile } = await supabase.from("school_profiles").select("full_name").eq("id", user.id).maybeSingle();

  return (
    <main className="fruitlife-shell fruitlife-public">
      <form action={createFruitLifeSession} className="fruitlife-form fruitlife-signup">
        <input name="signup_source" type="hidden" value="vercel-fruitlife-intake" />
        <input name="return_to" type="hidden" value={returnTo} />
        {params?.message ? <p className="form-message">{params.message}</p> : null}
        <section className="fruitlife-flow-header">
          <div>
            <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
            <div>
              <h1>Set up your assessment</h1>
              <p>
                Start with your own reflection. Add observers only if you want trusted feedback
                included in this report.
              </p>
            </div>
          </div>
          <PageHelp
            items={[
              "Leave observers empty for a self-assessment.",
              "Add observer names and emails only when you want feedback from others.",
              "After setup, the app sends your self-reflection link and tracks the report process.",
            ]}
            title="Help"
          />
        </section>
        <section className="fruitlife-panel fruitlife-account-summary">
          <h2>Assessment for</h2>
          <div className="fruitlife-grid two">
            <label>
              Name
              <input value={profile?.full_name?.trim() || String(user.user_metadata?.full_name ?? "").trim()} readOnly name="participant_name" type="text" />
            </label>
            <label>
              Email
              <input value={user.email ?? ""} readOnly name="participant_email" required type="email" />
            </label>

          </div>
        </section>

        <section className="fruitlife-panel">
          <h2>Optional observers</h2>
          <p>If desired, add trusted observers for a full 360 report.</p>
          <ObserverInvitations />
        </section>

        <section className="fruitlife-intake-note">
          <strong>What happens next:</strong>
          <span>
            The app creates the session, emails the participant link, and tracks the report process
            in your Field Kit.
          </span>
        </section>

        <button className="button primary" type="submit">
          Start My Reflection
        </button>
      </form>
    </main>
  );
}

import { requirePersonalMembershipContent } from "@/lib/commerce/account-access";
import { redirect } from "next/navigation";
import { isDyddAdminEmail as isFruitLifeAdmin } from "@/lib/admin-access";
import { PageHelp } from "@/components/page-help";
import { getActiveFruitLifeEntitlement, userHasFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import crypto from "node:crypto";
import { getAssessmentEligibility } from "@/lib/assessment-timing/policy";
import { AssessmentTimingStatus } from "@/components/assessment-timing-status";
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

  if (!await getActiveFruitLifeEntitlement(user.id)) await requirePersonalMembershipContent(user, "/fruitlife360");
  const hasAccess = legacyLane ? await userHasFruitLifeEntitlement(user.id) : true;

  if (legacyLane && !hasAccess && !isFruitLifeAdmin(user.email)) {
    redirect(
      `/trailheads?lane=fruitlife&checkout=required#fruitlife-360`,
    );
  }

  const sessions = await getFruitLifeDashboardSessions({ email: normalizeEmail(user.email), enabled: true });
  const drafts = sessions.filter(session => fruitLifeIsActive(session) && !session.self_completed_at);
  const selfTiming = await getAssessmentEligibility(user.id, user.email ?? "", "fruitful_self", isFruitLifeAdmin(user.email));
  const { data: profile } = await supabase.from("school_profiles").select("full_name").eq("id", user.id).maybeSingle();

  return (
    <main className="fruitlife-shell fruitlife-public">
      {drafts.length ? <section className="fruitlife-panel">
        <h2>Continue an existing round</h2>
        {drafts.map(draft => <form action={createFruitLifeSession} key={draft.id}>
          <input type="hidden" name="resume_session_id" value={draft.id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <button className="button secondary" type="submit">Resume reflection from {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(draft.created_at))} · {draft.invites.map(invite => invite.observer_name || invite.observer_email).filter(Boolean).slice(0, 2).join(", ") || "Self-only"}</button>
        </form>)}
      </section> : null}
      <form action={createFruitLifeSession} className="fruitlife-form fruitlife-signup">
        <input name="creation_id" type="hidden" value={crypto.randomUUID()} />
        <input name="signup_source" type="hidden" value="vercel-fruitlife-intake" />
        <input name="return_to" type="hidden" value={returnTo} />
        {params?.message ? <p className="form-message">{params.message}</p> : null}
        <section className="fruitlife-flow-header">
          <div>
            <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="Fruitful Life 360 logo" />
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

        <AssessmentTimingStatus assessment="fruitful_self" timing={selfTiming} />
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

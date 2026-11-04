import { ContextualPurchases } from "@/components/contextual-purchases";
import { isReviewRequest, type ReviewSearchParams } from "@/lib/review/heather";
import { hasTestEntitlement } from "@/lib/commerce/test-entitlements";
import { testBillingEnabled } from "@/lib/commerce/test-billing-config";
import { hasIncludedPersonalAccess, hasLifetimePersonalAccess } from "@/lib/commerce/personal-access";
import { courseCardHref, courseOrigin } from "@/lib/trails/course-origin";
import Link from "next/link";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { redirect } from "next/navigation";
import { getAssessmentSnapshotsForUser, latestByAssessment } from "@/lib/assessments/student-context";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveDesignPdResponse } from "./actions";
import { DesignPdAssessmentForm } from "./assessment-form";

type DesignPdPageProps = {
  searchParams?: Promise<{ message?: string; origin?: string; checkout?: string; snapshot?: string } & ReviewSearchParams>;
};

export const dynamic = "force-dynamic";

export default async function DesignPdPage({ searchParams }: DesignPdPageProps) {
  const params = await searchParams;
  const origin = courseOrigin(params?.origin);
  const cardHref = courseCardHref("designpd-alignment", origin);
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user && testBillingEnabled() && isReviewRequest(params)) {
    return <main className="fruitlife-shell fruitlife-public designpd-shell"><h1>Explore your design in motion.</h1><p>DesignPD builds on your DesignID results to explore how you plan, decide, and do.</p><ContextualPurchases area="designpd" preview /></main>;
  }

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/designpd?origin=${origin}${params?.snapshot ? `&snapshot=${encodeURIComponent(params.snapshot)}` : ""}`)}`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("school_profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  const participantEmail = normalizeEmail(profile?.email ?? user.email);
  const participantName =
    profile?.full_name?.trim() ||
    String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim() ||
    user.email?.split("@")[0] ||
    "DesignPD Participant";
  const assessmentReport = await getAssessmentSnapshotsForUser(user.id, participantEmail);
  const latest = latestByAssessment(assessmentReport.all);
  const designId = params?.snapshot ? assessmentReport.all.find((snapshot) => snapshot.assessment_type === "designid" && snapshot.id === params.snapshot) : latest.find((snapshot) => snapshot.assessment_type === "designid");
  const hasDesignId = Boolean(designId);
  const paidAccess = Boolean(designId && await hasTestEntitlement(user.id,"designpd",designId.id));
  const savedDesignPd = assessmentReport.all.find((snapshot) => snapshot.assessment_type === "designpd" && snapshot.scores.designIdSnapshotId === designId?.id) ?? (!params?.snapshot ? latest.find((snapshot) => snapshot.assessment_type === "designpd") : undefined);

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell designpd-shell">
      {params?.checkout === "returned" ? <p role="status">You returned from Stripe. Your result unlock appears after the verified payment notification. <Link href={`/designpd?snapshot=${encodeURIComponent(params.snapshot || "")}`}>Refresh this result</Link>.</p> : params?.checkout === "cancelled" ? <p role="status">Checkout cancelled. No new access was granted.</p> : null}
      {params?.message ? <p className="fruitlife-form-error designid-page-message">{params.message}</p> : null}
      {hasDesignId ? (
        <DesignPdAssessmentForm
          action={saveDesignPdResponse}
          origin={origin}
          cardHref={cardHref}
          participantEmail={participantEmail}
          participantName={participantName}
          ownerAccess={paidAccess || await hasIncludedPersonalAccess(user.id) || isDyddAdminEmail(user.email)}
          designIdSnapshotId={designId?.id}
          paidAccess={paidAccess}
          testCheckoutAvailable={testBillingEnabled()}
          lifetimeAccess={await hasLifetimePersonalAccess(user.id)}
          savedReportHref={savedDesignPd ? `/designpd/report?snapshot=${encodeURIComponent(savedDesignPd.id)}` : undefined}
        />
      ) : (
        <section className="fruitlife-panel fruitlife-message-card">
          {testBillingEnabled() && <ContextualPurchases area="designpd" />}
          <img src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
          <p className="section-label">DesignPD prerequisite</p>
          <h1>Complete DesignID first.</h1>
          <p>
            DesignPD builds on your DesignID report. Once DesignID is saved in
            your Field Kit, this practical Plan, Decide, Do assessment will open.
          </p>
          <div className="spiritual-gifts-thanks-actions">
            <Link className="button primary" href="/designid">
              Start DesignID
            </Link>
            <Link className="button secondary" href={cardHref}>
              Back to Field Kit
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

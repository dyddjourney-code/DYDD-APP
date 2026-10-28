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
  searchParams?: Promise<{ message?: string; origin?: string }>;
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

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/designpd?origin=${origin}`)}`);
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
  const hasDesignId = latest.some((snapshot) => snapshot.assessment_type === "designid");
  const savedDesignPd = latest.find((snapshot) => snapshot.assessment_type === "designpd");

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell designpd-shell">
      {params?.message ? <p className="fruitlife-form-error designid-page-message">{params.message}</p> : null}
      {hasDesignId ? (
        <DesignPdAssessmentForm
          action={saveDesignPdResponse}
          origin={origin}
          cardHref={cardHref}
          participantEmail={participantEmail}
          participantName={participantName}
          ownerAccess={await hasIncludedPersonalAccess(user.id) || isDyddAdminEmail(user.email)}
          lifetimeAccess={await hasLifetimePersonalAccess(user.id)}
          savedReportHref={savedDesignPd ? `/designpd/report?snapshot=${encodeURIComponent(savedDesignPd.id)}` : undefined}
        />
      ) : (
        <section className="fruitlife-panel fruitlife-message-card">
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

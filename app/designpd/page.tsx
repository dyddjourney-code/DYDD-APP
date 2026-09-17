import Link from "next/link";
import { redirect } from "next/navigation";
import { getAssessmentSnapshotsForUser, latestByAssessment } from "@/lib/assessments/student-context";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveDesignPdResponse } from "./actions";
import { DesignPdAssessmentForm } from "./assessment-form";

type DesignPdPageProps = {
  searchParams?: Promise<{ message?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DesignPdPage({ searchParams }: DesignPdPageProps) {
  const params = await searchParams;
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/designpd")}`);
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

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell designpd-shell">
      {params?.message ? <p className="fruitlife-form-error designid-page-message">{params.message}</p> : null}
      {hasDesignId ? (
        <DesignPdAssessmentForm
          action={saveDesignPdResponse}
          participantEmail={participantEmail}
          participantName={participantName}
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
            <Link className="button secondary" href="/field-kit">
              Back to Field Kit
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

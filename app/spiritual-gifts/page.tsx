import Link from "next/link";
import { redirect } from "next/navigation";
import { FruitLifeMiniFooter } from "@/components/fruitlife-mini-footer";
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { SpiritualGiftsAssessmentForm } from "./assessment-form";
import { saveSpiritualGiftsPublicResponse } from "./actions";
import {
  displayDateTime,
  getAssessmentSnapshotsForUser,
  latestByAssessment,
} from "@/lib/assessments/student-context";
import { normalizeEmail } from "@/lib/identity/email";
import {
  heatherReviewEmail,
  heatherReviewName,
  isHeatherReviewRequest,
  isNewReviewRequest,
  jordanReviewEmail,
  jordanReviewName,
} from "@/lib/review/heather";
import { verifySpiritualGiftsAppIdentity } from "@/lib/spiritual-gifts/app-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SpiritualGiftsPageProps = {
  searchParams?: Promise<{
    app_email?: string;
    app_name?: string;
    app_sig?: string;
    channel?: string;
    key?: string;
    lane?: string;
    message?: string;
    review?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsPage({ searchParams }: SpiritualGiftsPageProps) {
  const params = await searchParams;
  const channel = params?.channel === "app" ? "app" : "public";
  const fruitLifeLane = params?.lane === "fruitlife";
  const reviewIdentity = isHeatherReviewRequest(params)
    ? { email: heatherReviewEmail, name: heatherReviewName }
    : isNewReviewRequest(params)
      ? { email: jordanReviewEmail, name: jordanReviewName }
      : null;
  const appIdentity =
    channel === "app"
      ? verifySpiritualGiftsAppIdentity({
          email: params?.app_email,
          name: params?.app_name,
          signature: params?.app_sig,
        })
      : null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (fruitLifeLane && channel !== "app" && !user) {
    redirect(`/login?next=${encodeURIComponent("/spiritual-gifts?lane=fruitlife")}`);
  }

  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const authDisplayName = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "").trim();
  const participantEmail = normalizeEmail(profile?.email ?? user?.email);
  const displayName =
    profile?.full_name?.trim() || authDisplayName || user?.email?.split("@")[0] || "Traveler";
  const assessmentReport = user
    ? await getAssessmentSnapshotsForUser(user.id, participantEmail)
    : { all: [], latest: [] };
  const spiritualGiftsSnapshot = latestByAssessment(assessmentReport.all).find(
    (snapshot) => snapshot.assessment_type === "spiritual_gifts",
  );
  const spiritualGiftsStatusHref =
    typeof spiritualGiftsSnapshot?.scores?.statusHref === "string" &&
    spiritualGiftsSnapshot.scores.statusHref
      ? spiritualGiftsSnapshot.scores.statusHref
      : null;
  const spiritualGiftsReportHref =
    spiritualGiftsStatusHref ??
    (spiritualGiftsSnapshot
      ? `/api/artifacts/${encodeURIComponent(spiritualGiftsSnapshot.id)}/download`
      : "/spiritual-gifts?channel=app&lane=fruitlife");
  const reviewer = user
    ? {
        email: profile?.email ?? user.email ?? "",
        name: profile?.full_name?.trim() || authDisplayName || user.email?.split("@")[0] || "",
      }
    : reviewIdentity ?? appIdentity ?? undefined;

  if (fruitLifeLane && channel !== "app") {
    return (
      <main className="journey-shell hq-standalone-page fruitlife-release-shell spiritual-gifts-mini-app">
        <FruitLifeMiniNav />
        <header className="standalone-hero spiritual-gifts-mini-hero">
          <div>
            <p className="eyebrow">Spiritual Gifts</p>
            <h1>Discover how God may have gifted you to serve.</h1>
            <p className="lede">
              This free assessment helps you name your strongest gift patterns,
              receive a personal report, and continue into the Spiritual Gifts course.
            </p>
            <div className="spiritual-gifts-mini-actions">
              <Link className="button primary" href="/spiritual-gifts?channel=app&lane=fruitlife">
                Take the free assessment
              </Link>
              {spiritualGiftsSnapshot ? (
                <Link className="button secondary" href={spiritualGiftsReportHref}>
                  Open report
                </Link>
              ) : null}
            </div>
          </div>
          <figure className="spiritual-gifts-mini-image">
            <img src="/brand/trailheads/spiritual-gifts-signpost.png" alt="Spiritual Gifts trail sign" />
          </figure>
        </header>

        <section className="spiritual-gifts-mini-intro" aria-label="Spiritual Gifts overview">
          <article>
            <span>1</span>
            <h2>Take the assessment.</h2>
            <p>Answer the free Spiritual Gifts questions while signed into this account.</p>
          </article>
          <article>
            <span>2</span>
            <h2>Receive your report.</h2>
            <p>The same PDF report is emailed to you and saved as an account artifact.</p>
          </article>
          <article>
            <span>3</span>
            <h2>Explore the course.</h2>
            <p>Use the course to understand your gifts as grace for humble service.</p>
          </article>
        </section>

        <section className="artifact-panel artifact-workbench spiritual-gifts-mini-artifacts" id="artifacts">
          <div className="card-heading">
            <p className="section-label">Artifact</p>
            <h2>Your Spiritual Gifts report</h2>
            <p>
              Completed reports appear here so your gifts language can carry into
              courses and the full DYDD app later.
            </p>
          </div>
          <div className="artifact-download-list">
            {spiritualGiftsSnapshot ? (
              <article className="artifact-download fieldkit-artifact-card">
                <div className="fieldkit-artifact-title">
                  <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
                  <div>
                    <span>Spiritual Gifts Report</span>
                    <p>
                      Completed{" "}
                      {displayDateTime(
                        spiritualGiftsSnapshot.source_submitted_at ?? spiritualGiftsSnapshot.created_at,
                      )}
                      .
                    </p>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Status</dt>
                    <dd>Completed</dd>
                  </div>
                  <div>
                    <dt>Account</dt>
                    <dd>{displayName}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{spiritualGiftsSnapshot.source ?? "Spiritual Gifts"}</dd>
                  </div>
                </dl>
                <div className="fieldkit-artifact-actions">
                  <Link className="button primary" href={spiritualGiftsReportHref}>
                    Open report
                  </Link>
                  <Link className="button secondary" href="/courses/spiritual-gifts-service?lane=fruitlife">
                    Explore course
                  </Link>
                </div>
              </article>
            ) : (
              <article className="artifact-download fieldkit-artifact-card">
                <div className="fieldkit-artifact-title">
                  <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
                  <div>
                    <span>No Spiritual Gifts report yet</span>
                    <p>Take the free assessment and the completed report will appear here.</p>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
        <FruitLifeMiniFooter />
      </main>
    );
  }

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell spiritual-gifts-standalone">
      <SpiritualGiftsAssessmentForm
        action={saveSpiritualGiftsPublicResponse}
        channel={channel}
        identitySignature={appIdentity?.signature}
        initialReviewer={reviewer}
        message={params?.message}
        reviewKey={reviewIdentity ? params?.key : undefined}
        reviewMode={reviewIdentity ? params?.review : undefined}
      />
    </main>
  );
}

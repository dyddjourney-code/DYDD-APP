import { TrailAnchor } from "@/components/trail-anchor";
import { isSandbox } from "@/lib/environment";
import { hasFullReport } from "@/lib/assessments/report-recovery";
import { previewParams, previewReflectionRounds } from "@/lib/reflections/preview";
import { isTrailAssessmentComplete } from "@/lib/trails/catalog";
import { FieldKitCollection } from "@/components/field-kit-collection";
import { FieldKitLegacyLinks } from "@/components/field-kit-legacy-links";
import { hasDesignPdCourseAccess } from "@/lib/designpd/access";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { FruitLifeMiniFooter } from "@/components/fruitlife-mini-footer";
import { FruitLifeCurrentAssessmentProcess } from "@/components/fruitlife-current-assessment-process";
import {
  assessmentLabels,
  displayDateTime,
  getAssessmentSnapshotsForParticipantMatch,
  getAssessmentSnapshotsForUser,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import {
  fruitLifeIsActive,
  fruitLifeReportArtifact,
  fruitLifeReportHref,
  fruitLifeReportModeLabel,
  fruitLifeTokenFromSession,
  getFruitLifeDashboardSessions,
} from "@/lib/fruitlife360/dashboard";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  getNewReviewReport,
  isHeatherReviewRequest,
  isNewReviewRequest,
  jordanReviewEmail,
  reviewQuery,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
type FieldKitPageProps = {
  searchParams?: Promise<
    ReviewSearchParams & {
      fruitlife?: string;
      fruitlife_session?: string;
      fruitlife_token?: string;
      checkout?: string;
      lane?: string;
    }
  >;
};
type FieldKitArtifact = {
  id?: string;
  completedAt?: string;
  experienceSlug?: string;
  action: string;
  pdfHref?: string;
  pdfReady?: boolean;
  courseAction?: string | null;
  courseHref?: string | null;
  detail: string;
  href: string;
  logo: string;
  meta: Array<[string, string]>;
  title: string;
};
export const dynamic = "force-dynamic";
function artifactDownloadHref(
  snapshot: AssessmentSnapshotSummary,
  reviewParams?: ReviewSearchParams | null,
) {
  return withReviewQuery(
    `/api/artifacts/${encodeURIComponent(snapshot.id)}/download?download=1`,
    reviewParams,
  );
}
function snapshotArtifactTitle(snapshot: AssessmentSnapshotSummary) {
  return `${assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type} · Saved assessment`;
}
async function getFieldKitAssessmentReport(
  userId: string,
  email: string,
  reviewParams?: ReviewSearchParams | null,
) {
  if (isHeatherReviewRequest(reviewParams)) {
    return getHeatherReviewReport(reviewParams);
  }
  if (isNewReviewRequest(reviewParams)) {
    return getNewReviewReport(reviewParams);
  }
  if (userId) {
    return getAssessmentSnapshotsForUser(userId, email);
  }
  if (email) {
    return getAssessmentSnapshotsForParticipantMatch({ emails: [email] });
  }
  return { all: [], latest: [] };
}
export default async function FieldKitPage({
  searchParams,
}: FieldKitPageProps) {
  const rawParams = await searchParams;
  const preview = previewParams(rawParams ?? {});
  const reviewParams = preview ? {...rawParams, ...preview} : rawParams;
  const fruitLifeLane = reviewParams?.lane === "fruitlife";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const reviewReport =
    (await getHeatherReviewReport(reviewParams)) ??
    (await getNewReviewReport(reviewParams));
  const fruitLifeReviewQuery = reviewQuery(reviewParams);
  if (!user && fruitLifeLane && !reviewReport) {
    redirect(`/login?next=${encodeURIComponent("/field-kit?lane=fruitlife")}`);
  }
  if (!user && !reviewReport) {
    redirect("/login?next=%2Ffield-kit");
  }
  const participantEmail = isHeatherReviewRequest(reviewParams)
    ? "willoughbyhs@gmail.com"
    : isNewReviewRequest(reviewParams)
      ? jordanReviewEmail
      : normalizeEmail(user?.email);
  const assessmentReport = reviewReport ??
    (await getFieldKitAssessmentReport(
      user?.id ?? "",
      participantEmail,
      reviewParams,
    )) ?? { all: [], latest: [] };
  const snapshotHistory = assessmentReport.all;
  const snapshotArtifactSources = fruitLifeLane
    ? snapshotHistory.filter((s) => s.assessment_type !== "fruit_360")
    : snapshotHistory;
  const fruitLifeSessions = await getFruitLifeDashboardSessions({
    email: participantEmail,
    enabled: Boolean(participantEmail),
  });
  const selectedFruitLifeSession =
    fruitLifeSessions.find(
      (session) => session.id === reviewParams?.fruitlife_session,
    ) ?? null;
  const activeFruitLifeSession =
    (selectedFruitLifeSession && fruitLifeIsActive(selectedFruitLifeSession)
      ? selectedFruitLifeSession
      : fruitLifeSessions.find(fruitLifeIsActive)) ?? null;
  const activeFruitLifeToken =
    selectedFruitLifeSession?.id === activeFruitLifeSession?.id &&
    reviewParams?.fruitlife_token
      ? reviewParams.fruitlife_token
      : fruitLifeTokenFromSession(activeFruitLifeSession);
  const fruitLifeReportSessions = fruitLifeSessions.filter((session) =>
    Boolean(fruitLifeReportArtifact(session)),
  );
  const designPdUnlocked = Boolean(
    user && hasDesignPdCourseAccess(user.email, snapshotHistory),
  );
  const artifacts: FieldKitArtifact[] = [
    ...snapshotArtifactSources
      .filter((snapshot) =>
        isTrailAssessmentComplete(snapshot.assessment_type, [snapshot]) ||
        (snapshot.assessment_type === "fruit_360" && fruitLifeReportSessions.some(s => s.report_snapshot_id === snapshot.id)),
      )
      .map((snapshot) => ({
        id: snapshot.id,
        completedAt: snapshot.source_submitted_at ?? snapshot.created_at,
        experienceSlug: (
          {
            designid: "designid-foundations",
            spiritual_gifts: "spiritual-gifts-service",
            fruit_360: "fruitlife-360-formation",
            designpd: "designpd-alignment",
          } as Record<string, string>
        )[snapshot.assessment_type],
        action: "View snapshot",
        pdfHref: hasFullReport(snapshot) ? artifactDownloadHref(snapshot, reviewParams) :
          snapshot.assessment_type === "fruit_360" && fruitLifeReportSessions.some(s => s.report_snapshot_id === snapshot.id)
            ? artifactDownloadHref(snapshot, reviewParams)
            : undefined,
        pdfReady: Boolean(
          snapshot.scores.reportArtifact ||
          (
            snapshot.scores.pdfMonkey as
              | {
                  storage?: unknown;
                }
              | undefined
          )?.storage,
        ),
        courseAction: "Explore course",
        courseHref:
          snapshot.assessment_type === "designid"
            ? "/courses/designid-foundations"
            : snapshot.assessment_type === "spiritual_gifts"
              ? "/courses/spiritual-gifts-service?origin=field-kit"
              : snapshot.assessment_type === "fruit_360"
                ? "/courses/fruitlife-360-formation?origin=field-kit"
                : snapshot.assessment_type === "designpd" && designPdUnlocked
                  ? "/courses/designpd-alignment?origin=field-kit"
                  : "/trailheads",
        detail: `Completed ${displayDateTime(snapshot.source_submitted_at ?? snapshot.created_at)}.`,
        href: withReviewQuery(
          `/api/artifacts/${encodeURIComponent(snapshot.id)}/download?view=snapshot`,
          reviewParams,
        ),
        logo:
          snapshot.assessment_type === "designid"
            ? "/brand/tools/designid-logo.webp"
            : snapshot.assessment_type === "spiritual_gifts"
              ? "/brand/tools/spiritual-gifts-logo.jpg"
              : snapshot.assessment_type === "designpd"
                ? "/brand/tools/designpd-logo.jpg"
                : snapshot.assessment_type === "fruit_360"
                  ? "/brand/tools/fruitful-life-360-logo.jpg"
                  : "/brand/tools/design-pathways-logo.jpg",
        meta: [
          ["Status", "Completed"],
          [
            "Completed",
            displayDateTime(
              snapshot.source_submitted_at ?? snapshot.created_at,
            ),
          ],
          ["Source", snapshot.source ?? "DYDD"],
        ] as Array<[string, string]>,
        title: snapshotArtifactTitle(snapshot),
      })),
    ...fruitLifeReportSessions.filter(session => !snapshotArtifactSources.some(s => s.id === session.report_snapshot_id)).map((session) => {
      const reportArtifact = fruitLifeReportArtifact(session);
      const reportTimestamp =
        reportArtifact?.created_at ?? session.updated_at ?? session.created_at;
      return {
        id: session.id,
        completedAt: reportTimestamp,
        experienceSlug: "fruitlife-360-formation",
        action: "Open report",
        pdfHref: withReviewQuery(fruitLifeReportHref(session) + "&download=1", reviewParams),
        pdfReady: true,
        courseAction: "Explore course",
        courseHref: "/courses/fruitlife-360-formation?origin=field-kit",
        detail: `Your ${fruitLifeReportModeLabel(session).toLowerCase()} FruitLife360 report is ready to review.`,
        href: withReviewQuery(fruitLifeReportHref(session), reviewParams),
        logo: "/brand/tools/fruitful-life-360-logo.jpg",
        meta: [
          ["Status", "Completed"],
          ["Report type", fruitLifeReportModeLabel(session)],
          ["Completed", displayDateTime(reportTimestamp)],
          ["Source", "FruitLife360"],
        ] as Array<[string, string]>,
        title: `FruitLife360 Report · ${fruitLifeReportModeLabel(session)}`,
      };
    }),
  ];
  if (fruitLifeLane) {
    const fruitLifeReturnPath = selectedFruitLifeSession
      ? `/field-kit?lane=fruitlife&fruitlife_session=${encodeURIComponent(selectedFruitLifeSession.id)}${
          activeFruitLifeToken
            ? `&fruitlife_token=${encodeURIComponent(activeFruitLifeToken)}`
            : ""
        }#current-assessment-process`
      : "/field-kit?lane=fruitlife#current-assessment-process";
    const fruitLifeArtifacts = artifacts.filter((artifact) =>
      artifact.meta.some(
        ([label, value]) => label === "Source" && value === "FruitLife360",
      ),
    );
    const checkoutMessage =
      reviewParams?.checkout === "success"
        ? "FruitLife360 is unlocked. You can start your assessment now."
        : reviewParams?.checkout === "required"
          ? "Purchase FruitLife360 to start a new assessment."
          : reviewParams?.checkout === "cancelled"
            ? "Checkout was cancelled. You can return whenever you are ready."
            : reviewParams?.checkout === "unverified"
              ? "Stripe did not verify that checkout yet. If payment completed, refresh in a moment."
              : reviewParams?.checkout === "config-error"
                ? "FruitLife360 checkout is not fully configured yet."
                : null;
    return (
      <main className="journey-shell hq-standalone-page fruitlife-release-shell">
        <FruitLifeMiniNav reviewQuery={fruitLifeReviewQuery} />
        <header className="standalone-hero fieldkit-hero fruitlife-fieldkit-hero">
          <div>
            <p className="eyebrow">FruitLife360</p>
            <h1>Your report process.</h1>
            <p className="lede">
              Start your FruitLife360, track self and observer responses, send
              reminders, and return for your completed report.
            </p>
          </div>
        </header>

        <section
          className="fieldkit-assessments-section"
          aria-label="FruitLife360 access"
        >
          {checkoutMessage ? (
            <p className="form-message">{checkoutMessage}</p>
          ) : null}
          <div className="trail-fieldkit-note">
            <div>
              <h2>Your next step starts at Trailheads.</h2>
              <p>
                Begin FruitLife360 or open its connected course there. Track
                your responses and collect your report here.
              </p>
            </div>
            <Link
              className="button primary"
              href={withReviewQuery(
                "/trailheads?lane=fruitlife#fruitlife-360",
                reviewParams,
              )}
            >
              Open FruitLife360 Trailhead
            </Link>
          </div>
        </section>

        <FruitLifeCurrentAssessmentProcess
          created={reviewParams?.fruitlife === "created"}
          notice={reviewParams?.fruitlife}
          returnTo={fruitLifeReturnPath}
          session={activeFruitLifeSession}
          token={activeFruitLifeToken}
        />

        <section className="artifact-panel artifact-workbench" id="artifacts">
          <div className="card-heading">
            <p className="section-label">Reports</p>
            <h2>FruitLife360 artifacts</h2>
          </div>
          <div className="artifact-download-list">
            {fruitLifeArtifacts.length ? (
              fruitLifeArtifacts.map((artifact) => (
                <article
                  className="artifact-download fieldkit-artifact-card"
                  key={artifact.title}
                >
                  <div className="fieldkit-artifact-title">
                    <img src={artifact.logo} alt={`${artifact.title} logo`} />
                    <div>
                      <span>{artifact.title}</span>
                      <p>{artifact.detail}</p>
                    </div>
                  </div>
                  <dl>
                    {artifact.meta.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="fieldkit-artifact-actions">
                    <Link className="button primary" href={artifact.href}>
                      {artifact.action}
                    </Link>
                    {artifact.courseHref && artifact.courseAction ? (
                      <Link
                        className="button secondary"
                        href={withReviewQuery(
                          artifact.courseHref,
                          reviewParams,
                        )}
                      >
                        {artifact.courseAction}
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <article className="artifact-download fieldkit-artifact-card">
                <div className="fieldkit-artifact-title">
                  <img
                    src="/brand/tools/fruitful-life-360-logo.jpg"
                    alt="FruitLife360 logo"
                  />
                  <div>
                    <span>No FruitLife360 report yet</span>
                    <p>
                      Your completed report will appear here when it is ready.
                    </p>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
        <section className="reflection-round-bar">
          <p className="section-label">Course Reflections</p>
          <h2>Your FruitLife360 reflection history.</h2>
          <p>
            Read your dated reflections, continue your current workbook, or
            begin a new round without replacing earlier answers.
          </p>
          <Link
            className="button primary"
            href={withReviewQuery(
              "/field-kit/reflections/fruitlife-360-formation",
              reviewParams,
            )}
          >
            Review my reflections
          </Link>
        </section>
        <FruitLifeMiniFooter />
      </main>
    );
  }
  const { data: reflectionRounds } = preview
    ? {data: await previewReflectionRounds(preview)}
    : user
    ? await supabase
        .from("reflection_rounds")
        .select("course_slug,started_at")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
    : { data: [] };
  return (
    <main className="journey-shell hq-standalone-page fieldkit-renewal">
      <TrailAnchor />
      <FieldKitLegacyLinks />
      <header className="standalone-hero fieldkit-hero">
        <div>
          <p className="eyebrow">Field Kit</p>
          <h1>What you’ve discovered. Ready to use.</h1>
          <p className="lede">
            Your reports and course reflections, together by trail. Revisit
            earlier discoveries, see your growth over time, and bring what you
            learn into your Journey.
          </p>
        </div>
      </header>

      {reviewReport ? (
        <aside className="notice">
          <p>
            <strong>Report preview collection</strong> · These are imported
            assessment records. Personal reflection editing and email use your
            signed-in account.
          </p>
          <Link href="/login?next=%2Ffield-kit">
            Open my personal Field Kit
          </Link>
        </aside>
      ) : null}
      <FieldKitCollection
        artifacts={artifacts}
        rounds={reflectionRounds ?? []}
        reviewParams={reviewParams}
      />
      <FruitLifeCurrentAssessmentProcess
        created={reviewParams?.fruitlife === "created"}
        notice={reviewParams?.fruitlife}
        session={activeFruitLifeSession}
        token={activeFruitLifeToken}
      />
    </main>
  );
}

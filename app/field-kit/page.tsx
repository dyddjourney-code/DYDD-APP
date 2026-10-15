import { hasDesignPdCourseAccess } from "@/lib/designpd/access";
import { getDesignIdEligibility } from "@/lib/designid/retake";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { PageHelp } from "@/components/page-help";
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { FruitLifeMiniFooter } from "@/components/fruitlife-mini-footer";
import { FruitLifeCurrentAssessmentProcess } from "@/components/fruitlife-current-assessment-process";
import { userHasFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import {
  assessmentLabels,
  displayDate,
  displayDateTime,
  getAssessmentSnapshotsForParticipantMatch,
  getAssessmentSnapshotsForUser,
  latestByAssessment,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import {
  fruitLifeArtifactTitle,
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
  heatherReviewName,
  isHeatherReviewRequest,
  isNewReviewRequest,
  jordanReviewEmail,
  newReviewName,
  reviewQuery,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { withSpiritualGiftsAppIdentity } from "@/lib/spiritual-gifts/app-identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FieldKitPageProps = {
  searchParams?: Promise<ReviewSearchParams & {
    fruitlife?: string;
    fruitlife_session?: string;
    fruitlife_token?: string;
    checkout?: string;
    lane?: string;
  }>;
};

type FieldKitArtifact = {
  action: string;
  courseAction?: string | null;
  courseHref?: string | null;
  detail: string;
  href: string;
  logo: string;
  meta: Array<[string, string]>;
  title: string;
};

type AssessmentProduct = {
  action: string;
  courseAction: string | null;
  courseAvailable?: boolean;
  courseHref: string | null;
  detail: string;
  href: string;
  logo: string;
  points: string[];
  price: string;
  status: string | null;
  title: string;
};

export const dynamic = "force-dynamic";

const purchaseAssessments: AssessmentProduct[] = [
  {
    action: "Start assessment",
    courseAction: "Continue to course",
    courseHref: "/courses/designid-foundations",
    detail:
      "Names reflection style, contribution language, energy patterns, and the way a person tends to experience purpose.",
    href: "/designid",
    logo: "/brand/tools/designid-logo.webp",
    points: ["Reflection pattern", "Report artifact", "Trailhead course included"],
    price: "Included with subscription",
    status: null,
    title: "DesignID",
  },
  {
    action: "Start assessment",
    courseAction: null,
    courseHref: null,
    detail:
      "Helps people see how they plan, decide, and move into action so purpose becomes more practical.",
    href: "/designpd",
    logo: "/brand/tools/designpd-logo.jpg",
    points: ["Plan, Decide, Do patterns", "Practical rhythms", "Trailhead course included"],
    price: "Optional expansion",
    status: null,
    title: "DesignPD",
  },
  {
    action: "Start assessment",
    courseAction: null,
    courseHref: null,
    detail:
      "A discernment assessment for clarifying pathway, next experiments, and the most helpful route forward.",
    href: "/field-kit",
    logo: "/brand/tools/design-pathways-logo.jpg",
    points: ["Pathway clarity", "Next-step experiments", "Trailhead course included"],
    price: "$10",
    status: null,
    title: "Design Pathways",
  },
];

const freeAssessments: AssessmentProduct[] = [
  {
    action: "Start assessment",
    courseAction: "Go to course",
    courseHref: "/courses/spiritual-gifts-service",
    detail:
      "A first-step tool for naming how the Spirit may be empowering service, maturity, and love.",
    href: "/spiritual-gifts",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    points: ["Gifts language", "Service reflection", "Trailhead course included"],
    price: "Included with subscription",
    status: "Completed",
    title: "Spiritual Gifts",
  },
  {
    action: "Start assessment",
    courseAction: null,
    courseHref: null,
    detail:
      "A 360-style mirror for visible fruit, feedback, and honest growth conversations over time.",
    href: "/fruitlife360",
    logo: "/brand/tools/fruitful-life-360-logo.jpg",
    points: ["Self reflection", "Observer feedback", "Trailhead course included"],
    price: "Included with subscription",
    status: null,
    title: "FruitLife360",
  },
];

const artifacts = [
  {
    action: "Open report",
    courseAction: "Explore course",
    courseHref: "/courses/designid-foundations",
    detail:
      "Your DesignID results are ready to review. The connected course helps you understand and apply what the report is showing.",
    href: "/courses/designid-foundations",
    logo: "/brand/tools/designid-logo.webp",
    meta: [
      ["Status", "Completed"],
      ["Reflection", "Shepherd"],
      ["Course", "Unlocked"],
    ],
    title: "DesignID Report",
  },
  {
    action: "Open report",
    courseAction: "Explore course",
    courseHref: "/trailheads",
    detail:
      "Your Spiritual Gifts results are ready to review. The connected course helps you explore how those gifts can be used in faithful service.",
    href: "/field-kit",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    meta: [
      ["Status", "Completed"],
      ["Result", "Loaded"],
      ["Course", "Unlocked"],
    ],
    title: "Spiritual Gifts Report",
  },
];

const assessmentFlow = [
  {
    detail:
      "Each assessment captures a focused snapshot of design, gifting, fruit, pathway, or practical action patterns. These will become your journey artifacts.",
    step: "1",
    title: "Take the assessment",
  },
  {
    detail:
      "Completed assessments open the Trailhead course connected to that tool so the learner can understand and apply the results.",
    step: "2",
    title: "Explore the Trailhead",
  },
  {
    detail:
      "Reports become artifacts that personalize Trailheads and the full Discover Your Divine Design Journey as progress is made.",
    step: "3",
    title: "Review the artifact",
  },
];

function AssessmentCard({
  assessment,
  kind,
}: {
  assessment: AssessmentProduct;
  kind: "Subscription" | "Expansion" | "Purchase";
}) {
  return (
    <article className="fieldkit-assessment-card">
      <div className="fieldkit-assessment-logo">
        <img src={assessment.logo} alt={`${assessment.title} logo`} />
      </div>
      <div className="fieldkit-assessment-copy">
        <span>{kind === "Subscription" ? "Included with subscription" : kind === "Expansion" ? "Optional expansion" : "Purchase assessment"}</span>
        <h3>{assessment.title}</h3>
        <p>{assessment.detail}</p>
        <div className="fieldkit-assessment-meta">
          <span>{assessment.price}</span>
          {assessment.status ? <strong>{assessment.status}</strong> : null}
        </div>
        <ul>
          {assessment.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
      <div className="fieldkit-assessment-actions">
        {assessment.status === "Purchased" ? (
          <span className="button secondary fieldkit-status-button">{assessment.status}</span>
        ) : (
          <Link className="button primary" href={assessment.href}>
            {assessment.action}
          </Link>
        )}
        {assessment.courseAction && assessment.courseHref ? (
          assessment.courseAvailable === false ? (
            <span className="button secondary fieldkit-status-button">
              {assessment.courseAction}
            </span>
          ) : (
            <Link className="button primary" href={assessment.courseHref}>
              {assessment.courseAction}
            </Link>
          )
        ) : null}
      </div>
    </article>
  );
}

function ownsAssessment(snapshots: AssessmentSnapshotSummary[], assessmentType: string) {
  return snapshots.some((snapshot) => snapshot.assessment_type === assessmentType);
}

function artifactDownloadHref(
  snapshot: AssessmentSnapshotSummary,
  reviewParams?: ReviewSearchParams | null,
) {
  const statusHref = snapshot.scores?.statusHref;
  const reportAccessUrl = snapshot.scores?.reportAccessUrl;

  if (
    typeof reportAccessUrl === "string" &&
    reportAccessUrl
  ) {
    return reportAccessUrl;
  }

  if (
    snapshot.assessment_type !== "spiritual_gifts" &&
    typeof statusHref === "string" &&
    statusHref
  ) {
    return statusHref;
  }

  return withReviewQuery(
    `/api/artifacts/${encodeURIComponent(snapshot.id)}/download`,
    reviewParams,
  );
}

function snapshotArtifactTitle(snapshot: AssessmentSnapshotSummary) {
  return `${assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type} Report`;
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

export default async function FieldKitPage({ searchParams }: FieldKitPageProps) {
  const reviewParams = await searchParams;
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
    (await getHeatherReviewReport(reviewParams)) ?? (await getNewReviewReport(reviewParams));
  const fruitLifeReviewQuery = reviewQuery(reviewParams);

  if (!user && fruitLifeLane && !reviewReport) {
    redirect(`/login?next=${encodeURIComponent("/field-kit?lane=fruitlife")}`);
  }

  if (!user && !reviewReport && process.env.DYDD_REVIEW_TOKEN) {
    redirect(`/field-kit?review=new&key=${encodeURIComponent(process.env.DYDD_REVIEW_TOKEN)}`);
  }

  const participantEmail = isHeatherReviewRequest(reviewParams)
    ? "willoughbyhs@gmail.com"
    : isNewReviewRequest(reviewParams)
      ? jordanReviewEmail
      : normalizeEmail(profile?.email ?? user?.email);
  const displayName = isHeatherReviewRequest(reviewParams)
    ? `${heatherReviewName} Preview`
    : isNewReviewRequest(reviewParams)
      ? newReviewName
      : profile?.full_name ?? user?.email ?? "Traveler";
  const firstName = displayName.replace(/\s+Preview$/, "").split(/\s+/)[0] ?? "Traveler";
  const assessmentReport = reviewReport ??
    (await getFieldKitAssessmentReport(user?.id ?? "", participantEmail, reviewParams)) ??
    { all: [], latest: [] };
  const snapshotHistory = assessmentReport.all;
  const snapshotLatest = latestByAssessment(snapshotHistory);
  const snapshotArtifactSources = fruitLifeLane
    ? snapshotLatest.filter((snapshot) => snapshot.assessment_type !== "fruit_360")
    : [
        ...snapshotLatest.filter((snapshot) => snapshot.assessment_type !== "fruit_360"),
        ...snapshotHistory.filter((snapshot) => snapshot.assessment_type === "fruit_360"),
      ];
  const fruitLifeSessions = await getFruitLifeDashboardSessions({
    email: participantEmail,
    enabled: Boolean(participantEmail),
  });
  const selectedFruitLifeSession =
    fruitLifeSessions.find((session) => session.id === reviewParams?.fruitlife_session) ?? null;
  const activeFruitLifeSession =
    (selectedFruitLifeSession && fruitLifeIsActive(selectedFruitLifeSession)
      ? selectedFruitLifeSession
      : fruitLifeSessions.find(fruitLifeIsActive)) ?? null;
  const activeFruitLifeToken =
    selectedFruitLifeSession?.id === activeFruitLifeSession?.id && reviewParams?.fruitlife_token
      ? reviewParams.fruitlife_token
      : fruitLifeTokenFromSession(activeFruitLifeSession);
  const hasFruitLifePurchaseAccess = user?.id
    ? await userHasFruitLifeEntitlement(user.id)
    : false;
  const fruitLifeReportSessions = fruitLifeSessions.filter((session) =>
    Boolean(fruitLifeReportArtifact(session)),
  );
  const hasDesignId = ownsAssessment(snapshotLatest, "designid");
  const hasDesignPd = ownsAssessment(snapshotLatest, "designpd");
  const designPdUnlocked = Boolean(user && hasDesignPdCourseAccess(user.email, snapshotHistory));
  const hasSpiritualGifts = ownsAssessment(snapshotLatest, "spiritual_gifts");
  const hasFruitLife = fruitLifeLane
    ? fruitLifeReportSessions.length > 0
    : ownsAssessment(snapshotLatest, "fruit_360") || fruitLifeReportSessions.length > 0;
  const hasOwnerAssessmentAccess = Boolean(user && isDyddAdminEmail(user.email));
  const designIdEligibility = user ? await getDesignIdEligibility(user.id, participantEmail, hasOwnerAssessmentAccess) : null;
  const purchaseCards = purchaseAssessments.map((assessment) => {
    const status =
      assessment.title === "DesignID"
        ? hasDesignId ? "Completed" : assessment.status
        : assessment.title === "DesignPD"
          ? hasDesignPd ? "Completed" : hasDesignId ? assessment.status : "Requires DesignID"
          : assessment.status;

    if (assessment.title === "DesignID" && hasOwnerAssessmentAccess) {
      return {
        ...assessment,
        action: hasDesignId ? "Take DesignID again" : "Start DesignID",
        price: "Owner access",
        status: hasDesignId ? "Completed · retakes available" : "Ready to start",
      };
    }

    if (assessment.title === "DesignID" && designIdEligibility && !designIdEligibility.allowed) {
      const savedDesignId = snapshotLatest.find(s => s.assessment_type === 'designid');
      return { ...assessment, action: 'View DesignID report', href: savedDesignId ? artifactDownloadHref(savedDesignId, reviewParams) : '/courses/designid-foundations',
        status: `Next assessment: ${designIdEligibility.nextEligibleLabel}` };
    }

    if (assessment.title === "DesignPD") {
      return {
        ...assessment,
        action: hasDesignId ? hasOwnerAssessmentAccess ? "Create DesignPD report" : "Explore DesignPD unlock" : "Complete DesignID first",
        price: hasOwnerAssessmentAccess ? "Owner access" : assessment.price,
        courseAction: designPdUnlocked ? "Explore course" : "Course opens with expansion",
        courseAvailable: designPdUnlocked,
        courseHref: "/courses/designpd-alignment",
        href: hasDesignId ? assessment.href : "/designid",
        status,
      };
    }

    return { ...assessment, status };
  });
  const freeCards = freeAssessments.map((assessment) => {
    const status =
      assessment.title === "Spiritual Gifts"
        ? hasSpiritualGifts ? "Completed" : null
        : assessment.title === "FruitLife360"
          ? activeFruitLifeSession ? "In progress" : hasFruitLife ? "Completed" : null
          : assessment.status;

    if (assessment.title === "Spiritual Gifts") {
      return {
        ...assessment,
        courseAction: hasSpiritualGifts ? "Go to course" : "Course available after assessment",
        courseAvailable: hasSpiritualGifts,
        href: withSpiritualGiftsAppIdentity(
          withReviewQuery("/spiritual-gifts?channel=app", reviewParams),
          {
            email: participantEmail,
            name: displayName.replace(/\s+Preview$/, ""),
          },
        ),
        status,
      };
    }

    if (assessment.title === "FruitLife360") {
      return { ...assessment, status, action: activeFruitLifeSession ? "Continue assessment" : "Start assessment",
        href: activeFruitLifeSession ? "/field-kit#current-assessment-process" : "/fruitlife360",
        courseAction: "Go to course", courseHref: "/courses/fruitlife-360-formation", courseAvailable: true };
    }
    return { ...assessment, status };
  });
  const subscriptionCards = [
    ...purchaseCards.filter(assessment => assessment.title === "DesignID"),
    ...freeCards,
  ];
  const expansionCards = purchaseCards.filter(assessment => assessment.title === "DesignPD");
  const artifacts: FieldKitArtifact[] = [
    ...snapshotArtifactSources.filter(snapshot => !(snapshot.assessment_type === "fruit_360" && fruitLifeReportSessions.some(session => session.report_snapshot_id === snapshot.id))).map((snapshot) => ({
      action: "Open report",
      courseAction: "Explore course",
      courseHref:
        snapshot.assessment_type === "designid"
          ? "/courses/designid-foundations"
          : snapshot.assessment_type === "spiritual_gifts"
            ? "/courses/spiritual-gifts-service"
            : snapshot.assessment_type === "fruit_360"
              ? "/courses/fruitlife-360-formation"
              : snapshot.assessment_type === "designpd" && designPdUnlocked
                ? "/courses/designpd-alignment"
                : "/trailheads",
      detail: `Completed ${displayDateTime(snapshot.source_submitted_at ?? snapshot.created_at)}.`,
      href: artifactDownloadHref(snapshot, reviewParams),
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
        ["Completed", displayDateTime(snapshot.source_submitted_at ?? snapshot.created_at)],
        ["Source", snapshot.source ?? "DYDD"],
      ] as Array<[string, string]>,
      title: snapshotArtifactTitle(snapshot),
    })),
    ...fruitLifeReportSessions.map((session) => {
      const reportArtifact = fruitLifeReportArtifact(session);
      const reportTimestamp = reportArtifact?.created_at ?? session.updated_at ?? session.created_at;

      return {
        action: "Open report",
        courseAction: "Explore course",
        courseHref: "/courses/fruitlife-360-formation",
        detail: `Your ${fruitLifeReportModeLabel(session).toLowerCase()} FruitLife360 report is ready to review.`,
        href: fruitLifeReportHref(session),
        logo: "/brand/tools/fruitful-life-360-logo.jpg",
        meta: [
          ["Status", "Completed"],
          ["Report type", fruitLifeReportModeLabel(session)],
          ["Completed", displayDateTime(reportTimestamp)],
          ["Source", "FruitLife360"],
        ] as Array<[string, string]>,
        title: fruitLifeArtifactTitle(session),
      };
    }),
  ];
  if (fruitLifeLane) {
    const fruitLifeReturnPath = selectedFruitLifeSession
      ? `/field-kit?lane=fruitlife&fruitlife_session=${encodeURIComponent(selectedFruitLifeSession.id)}${
          activeFruitLifeToken ? `&fruitlife_token=${encodeURIComponent(activeFruitLifeToken)}` : ""
        }#current-assessment-process`
      : "/field-kit?lane=fruitlife#current-assessment-process";
    const fruitLifeArtifacts = artifacts.filter((artifact) =>
      artifact.meta.some(([label, value]) => label === "Source" && value === "FruitLife360")
    );
    const fruitLifeStartHref = activeFruitLifeSession
      ? fruitLifeReturnPath
      : hasFruitLifePurchaseAccess
        ? `/fruitlife360?return_to=${encodeURIComponent("/field-kit?lane=fruitlife#current-assessment-process")}`
        : `/api/stripe/fruitlife-checkout?return_to=${encodeURIComponent("/field-kit?lane=fruitlife#current-assessment-process")}`;
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

        <section className="fieldkit-assessments-section" aria-label="FruitLife360 access">
          {checkoutMessage ? <p className="form-message">{checkoutMessage}</p> : null}
          <div className="fieldkit-assessment-list single">
            <AssessmentCard
              assessment={{
                action: activeFruitLifeSession
                  ? "Open progress"
                  : hasFruitLifePurchaseAccess
                    ? "Start FruitLife360"
                    : "Purchase FruitLife360",
                courseAction: hasFruitLife ? "Explore course" : "Course opens with your report",
                courseAvailable: hasFruitLife,
                courseHref: "/courses/fruitlife-360-formation?lane=fruitlife",
                detail:
                  "A formation mirror using self reflection and observer feedback to notice visible fruit, pressure patterns, and growth invitations.",
                href: fruitLifeStartHref,
                logo: "/brand/tools/fruitful-life-360-logo.jpg",
                points: ["Participant setup", "Observer invitations", "Progress tracking", "Report artifact"],
                price: "$10 each time",
                status: activeFruitLifeSession
                  ? "In progress"
                  : hasFruitLifePurchaseAccess
                    ? "Ready to start"
                    : null,
                title: "FruitLife360",
              }}
              kind="Purchase"
            />
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
            {fruitLifeArtifacts.length ? fruitLifeArtifacts.map((artifact) => (
              <article className="artifact-download fieldkit-artifact-card" key={artifact.title}>
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
                    <Link className="button secondary" href={withReviewQuery(artifact.courseHref, reviewParams)}>
                      {artifact.courseAction}
                    </Link>
                  ) : null}
                </div>
              </article>
            )) : (
              <article className="artifact-download fieldkit-artifact-card">
                <div className="fieldkit-artifact-title">
                  <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
                  <div>
                    <span>No FruitLife360 report yet</span>
                    <p>Your completed report will appear here when it is ready.</p>
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
    <main className="journey-shell hq-standalone-page">
      <header className="standalone-hero fieldkit-hero">
        <div>
          <p className="eyebrow">Field Kit</p>
          <h1>Tools for the journey.</h1>
          <p className="lede">
            Your subscription assessments and reports collect here, with optional
            expansions for the next step. Your journey stamps live in the Base Camp Passport.
          </p>
        </div>
        <div className="fieldkit-help">
          <PageHelp
            title="Field Kit Help"
            items={[
              "Your subscription includes DesignID, Spiritual Gifts, and FruitLife360. DesignPD is an optional expansion.",
              "Use Artifacts for completed reports and saved results.",
              "Visit your Passport in Base Camp for journey stamps and progress.",
            ]}
          />
        </div>
      </header>

      <section className="fieldkit-assessments-section" aria-label="Assessment products">
        <div className="catalog-heading fieldkit-section-heading">
          <h2>Journey Assessments</h2>
          <p>
            Assessments can stand on their own for focused insight, and they also feed the
            larger Discover Your Divine Design journey. Each one creates a result artifact,
            opens the related Trailhead course, and gives the system personal information it
            can use later inside course lessons and the main DYDD Journey.
          </p>
        </div>

        <div className="fieldkit-assessment-flow" aria-label="Assessment progression">
          {assessmentFlow.map((item) => (
            <article key={item.title}>
              <span>{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="fieldkit-product-columns">
          <section
            className="fieldkit-product-group"
            id="subscription-assessments"
            aria-label="Subscription assessments"
          >
            <div className="fieldkit-product-heading">
              <span>Your journey subscription</span>
              <h3>Included with subscription</h3>
            </div>
            <div className="fieldkit-assessment-list">
              {subscriptionCards.map((assessment) => (
                <AssessmentCard assessment={assessment} kind="Subscription" key={assessment.title} />
              ))}
            </div>
          </section>

          <section
            className="fieldkit-product-group"
            id="optional-expansions"
            aria-label="Optional expansions"
          >
            <div className="fieldkit-product-heading">
              <span>Go deeper</span>
              <h3>Optional expansion · DesignPD</h3>
              <p>Unlock DesignPD separately after DesignID. Your expansion includes the report and connected course.</p>
            </div>
            <div className="fieldkit-assessment-list">
              {expansionCards.map((assessment) => (
                <AssessmentCard assessment={assessment} kind="Expansion" key={assessment.title} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <FruitLifeCurrentAssessmentProcess
        created={reviewParams?.fruitlife === "created"}
        notice={reviewParams?.fruitlife}
        session={activeFruitLifeSession}
        token={activeFruitLifeToken}
      />

      <section className="artifact-panel artifact-workbench" id="artifacts">
        <div className="card-heading">
          <p className="section-label">Artifacts</p>
        </div>
        <p className="fieldkit-section-note">
          Hi {firstName}, here are the artifacts you've collected from your journey so far.
        </p>
        <div className="artifact-download-list">
          {artifacts.length ? artifacts.map((artifact) => (
            <article className="artifact-download fieldkit-artifact-card" key={artifact.title}>
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
                  <Link className="button secondary" href={artifact.courseHref}>
                    {artifact.courseAction}
                  </Link>
                ) : null}
                <Link className="button secondary" href="/gear">
                  Add feedback
                </Link>
              </div>
            </article>
          )) : (
            <article className="artifact-download fieldkit-artifact-card">
              <div className="fieldkit-artifact-title">
                <img src="/brand/tools/designid-logo.webp" alt="DYDD artifact logo" />
                <div>
                  <span>No completed artifacts yet</span>
                  <p>Finished assessment reports will appear here with completion dates.</p>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>

    </main>
  );
}

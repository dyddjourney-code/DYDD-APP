import Link from "next/link";
import { PageHelp } from "@/components/page-help";
import { FruitLifeCurrentAssessmentProcess } from "@/components/fruitlife-current-assessment-process";
import {
  assessmentLabels,
  displayDate,
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
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FieldKitPageProps = {
  searchParams?: Promise<ReviewSearchParams & {
    fruitlife?: string;
    fruitlife_session?: string;
    fruitlife_token?: string;
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
    action: "Purchase assessment",
    courseAction: "Continue to course",
    courseHref: "/courses/designid-foundations",
    detail:
      "Names reflection style, contribution language, energy patterns, and the way a person tends to experience purpose.",
    href: "/designid",
    logo: "/brand/tools/designid-logo.webp",
    points: ["Reflection pattern", "Report artifact", "Trailhead course included"],
    price: "$20",
    status: "Purchased",
    title: "DesignID",
  },
  {
    action: "Purchase assessment",
    courseAction: null,
    courseHref: null,
    detail:
      "Helps people see how they plan, decide, and move into action so purpose becomes more practical.",
    href: "/field-kit",
    logo: "/brand/tools/designpd-logo.jpg",
    points: ["Plan, Decide, Do patterns", "Practical rhythms", "Trailhead course included"],
    price: "$50",
    status: null,
    title: "DesignPD",
  },
  {
    action: "Purchase assessment",
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
    price: "Free",
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
    price: "Free",
    status: null,
    title: "Fruit Life 360",
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

const earnedBadges = [
  {
    image: "/brand/badges/designid-badge.png",
    note: "Earned badge: DesignID",
    title: "DesignID",
  },
  {
    image: "/brand/badges/shepherd-badge.svg",
    note: "Earned badge: Shepherd",
    title: "Shepherd",
  },
  {
    image: "/brand/badges/spiritual-gifts-badge.png",
    note: "Earned badge: Spiritual Gifts",
    title: "Spiritual Gifts",
  },
];

const nextBadge = {
  action: "Begin the first D.E.S.I.G.N. step inside the Discover Your Divine Design Journey.",
  image: "/brand/badges/identity-badge.svg",
  title: "Identity",
};

const journeyBadgePath = [
  { image: "/brand/badges/designid-badge.png", label: "DesignID", state: "earned" },
  { image: "/brand/badges/shepherd-badge.svg", label: "Shepherd", state: "earned" },
  { image: "/brand/badges/spiritual-gifts-badge.png", label: "Spiritual Gifts", state: "earned" },
  { image: "/brand/badges/identity-badge.svg", label: "Identity", state: "next" },
  { image: "/brand/badges/expertise-badge.svg", label: "Expertise", state: "ahead" },
  { image: "/brand/badges/story-badge.svg", label: "Story", state: "ahead" },
  { image: "/brand/badges/desire-badge.svg", label: "Desire", state: "ahead" },
  { image: "/brand/badges/gifts-badge.svg", label: "Gifts", state: "ahead" },
  { image: "/brand/badges/niche-badge.svg", label: "Niche", state: "ahead" },
  { image: "/brand/badges/designpd-badge.png", label: "DesignPD", state: "ahead" },
  { image: "/brand/badges/fruitlife-360-badge.png", label: "Fruit Life 360", state: "ahead" },
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

const badgeGroups = [
  {
    badges: [
      ["Identity", "/brand/badges/identity-badge.svg"],
      ["Expertise", "/brand/badges/expertise-badge.svg"],
      ["Story", "/brand/badges/story-badge.svg"],
      ["Desire", "/brand/badges/desire-badge.svg"],
      ["Gifts", "/brand/badges/gifts-badge.svg"],
      ["Niche", "/brand/badges/niche-badge.svg"],
    ],
    note: "Badges earned as the learner moves through the main Discover Your Divine Design Journey.",
    title: "D.E.S.I.G.N. Badges",
  },
  {
    badges: [
      ["DesignID", "/brand/badges/designid-badge.png"],
      ["Spiritual Gifts", "/brand/badges/spiritual-gifts-badge.png"],
      ["Design Pathways", "/brand/badges/design-pathways-badge.png"],
      ["DesignPD", "/brand/badges/designpd-badge.png"],
      ["Fruit Life 360", "/brand/badges/fruitlife-360-badge.png"],
    ],
    note: "Badges earned when each assessment or report is completed.",
    title: "Assessment Badges",
  },
  {
    badges: [
      ["Artisan", "/brand/badges/artisan-badge.svg"],
      ["Architect", "/brand/badges/architect-badge.svg"],
      ["Steward", "/brand/badges/steward-badge.svg"],
    ],
    note: "For awareness. The completed DesignID reflection badge is earned from the report, while the other reflection badges are references only.",
    title: "Reflection Badges",
  },
];

function AssessmentCard({
  assessment,
  kind,
}: {
  assessment: AssessmentProduct;
  kind: "Purchase" | "Free";
}) {
  return (
    <article className="fieldkit-assessment-card">
      <div className="fieldkit-assessment-logo">
        <img src={assessment.logo} alt={`${assessment.title} logo`} />
      </div>
      <div className="fieldkit-assessment-copy">
        <span>{kind} assessment</span>
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
          <Link className="button primary" href={assessment.courseHref}>
            {assessment.courseAction}
          </Link>
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
  const snapshotArtifactSources = [
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
  const fruitLifeReportSessions = fruitLifeSessions.filter((session) =>
    Boolean(fruitLifeReportArtifact(session)),
  );
  const hasDesignId = ownsAssessment(snapshotLatest, "designid");
  const hasDesignPd = ownsAssessment(snapshotLatest, "designpd");
  const hasDesignPathways = ownsAssessment(snapshotLatest, "design_pathways");
  const hasSpiritualGifts = ownsAssessment(snapshotLatest, "spiritual_gifts");
  const hasFruitLife = ownsAssessment(snapshotLatest, "fruit_360") || fruitLifeReportSessions.length > 0;
  const purchaseCards = purchaseAssessments.map((assessment) => {
    const status =
      assessment.title === "DesignID"
        ? hasDesignId ? "Completed" : assessment.status
        : assessment.title === "DesignPD"
          ? hasDesignPd ? "Completed" : assessment.status
          : assessment.title === "Design Pathways"
            ? hasDesignPathways ? "Completed" : assessment.status
            : assessment.status;

    return { ...assessment, status };
  });
  const freeCards = freeAssessments.map((assessment) => {
    const status =
      assessment.title === "Spiritual Gifts"
        ? hasSpiritualGifts ? "Completed" : null
        : assessment.title === "Fruit Life 360"
          ? activeFruitLifeSession ? "In progress" : hasFruitLife ? "Completed" : null
          : assessment.status;

    return { ...assessment, status };
  });
  const artifacts: FieldKitArtifact[] = [
    ...snapshotArtifactSources.map((snapshot) => ({
      action: "Open report",
      courseAction: "Explore course",
      courseHref:
        snapshot.assessment_type === "designid"
          ? "/courses/designid-foundations"
          : snapshot.assessment_type === "spiritual_gifts"
            ? "/courses/spiritual-gifts-service"
            : snapshot.assessment_type === "fruit_360"
              ? "/courses/fruitlife-360-formation"
              : "/trailheads",
      detail: `Completed ${displayDate(snapshot.source_submitted_at ?? snapshot.created_at)}.`,
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
        ["Completed", displayDate(snapshot.source_submitted_at ?? snapshot.created_at)],
        ["Source", snapshot.source ?? "DYDD"],
      ] as Array<[string, string]>,
      title: snapshotArtifactTitle(snapshot),
    })),
    ...fruitLifeReportSessions.map((session) => ({
      action: "Open report",
      courseAction: "Explore course",
      courseHref: "/courses/fruitlife-360-formation",
      detail: "Your completed FruitLife 360 report is ready to review.",
      href: fruitLifeReportHref(session),
      logo: "/brand/tools/fruitful-life-360-logo.jpg",
      meta: [
        ["Status", "Completed"],
        ["Completed", displayDate(session.updated_at ?? session.created_at)],
        ["Source", "FruitLife 360"],
      ] as Array<[string, string]>,
      title: fruitLifeArtifactTitle(session),
    })),
  ];
  const earnedBadgeCards = [
    hasDesignId
      ? {
          image: "/brand/badges/designid-badge.png",
          note: "Earned badge: DesignID",
          title: "DesignID",
        }
      : null,
    hasSpiritualGifts
      ? {
          image: "/brand/badges/spiritual-gifts-badge.png",
          note: "Earned badge: Spiritual Gifts",
          title: "Spiritual Gifts",
        }
      : null,
    hasDesignPd
      ? {
          image: "/brand/badges/designpd-badge.png",
          note: "Earned badge: DesignPD",
          title: "DesignPD",
        }
      : null,
    hasFruitLife
      ? {
          image: "/brand/badges/fruitlife-360-badge.png",
          note: "Earned badge: FruitLife 360",
          title: "FruitLife 360",
        }
      : null,
  ].filter(Boolean) as Array<{
    image: string;
    note: string;
    title: string;
  }>;
  const journeyBadgePath = [
    { image: "/brand/badges/designid-badge.png", label: "DesignID", state: hasDesignId ? "earned" : "ahead" },
    { image: "/brand/badges/spiritual-gifts-badge.png", label: "Spiritual Gifts", state: hasSpiritualGifts ? "earned" : "ahead" },
    { image: "/brand/badges/fruitlife-360-badge.png", label: "Fruit Life 360", state: hasFruitLife ? "earned" : "ahead" },
    { image: "/brand/badges/identity-badge.svg", label: "Identity", state: "next" },
    { image: "/brand/badges/expertise-badge.svg", label: "Expertise", state: "ahead" },
    { image: "/brand/badges/story-badge.svg", label: "Story", state: "ahead" },
    { image: "/brand/badges/desire-badge.svg", label: "Desire", state: "ahead" },
    { image: "/brand/badges/gifts-badge.svg", label: "Gifts", state: "ahead" },
    { image: "/brand/badges/niche-badge.svg", label: "Niche", state: "ahead" },
    { image: "/brand/badges/designpd-badge.png", label: "DesignPD", state: hasDesignPd ? "earned" : "ahead" },
  ];

  return (
    <main className="journey-shell hq-standalone-page">
      <header className="standalone-hero fieldkit-hero">
        <div>
          <p className="eyebrow">Field Kit</p>
          <h1>Tools for the journey.</h1>
          <p className="lede">
            Assessments, reports, and earned badges collect here so each learner can carry
            their discoveries into the next step.
          </p>
        </div>
        <div className="fieldkit-help">
          <PageHelp
            title="Field Kit Help"
            items={[
              "Use Assessments to open or purchase the tools that feed the Discover Your Divine Design journey.",
              "Use Artifacts for completed reports and saved results.",
              "Use Trail Badges to see earned markers first, with possible badges tucked away.",
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
            id="purchase-assessments"
            aria-label="Purchase assessments"
          >
            <div className="fieldkit-product-heading">
              <span>For purchase</span>
              <h3>Purchase assessments</h3>
            </div>
            <div className="fieldkit-assessment-list">
              {purchaseCards.map((assessment) => (
                <AssessmentCard assessment={assessment} kind="Purchase" key={assessment.title} />
              ))}
            </div>
          </section>

          <section
            className="fieldkit-product-group"
            id="free-assessments"
            aria-label="Free assessments"
          >
            <div className="fieldkit-product-heading">
              <span>No-cost entry points</span>
              <h3>Free assessments</h3>
            </div>
            <div className="fieldkit-assessment-list">
              {freeCards.map((assessment) => (
                <AssessmentCard assessment={assessment} kind="Free" key={assessment.title} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <FruitLifeCurrentAssessmentProcess
        created={reviewParams?.fruitlife === "created"}
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

      <section className="badge-panel" id="trail-badges">
        <div className="badge-board-heading">
          <div>
            <p className="section-label">Trail Badges</p>
            <p>Here are the badges you've earned so far, {firstName}.</p>
          </div>
        </div>

        <aside className="next-badge-card" aria-label="Next badge">
          <img src={nextBadge.image} alt={`${nextBadge.title} badge`} />
          <div>
            <span>Next badge</span>
            <strong>{nextBadge.title}</strong>
            <p>{nextBadge.action}</p>
          </div>
        </aside>

        <div className="earned-badge-grid" aria-label="Earned trail badges">
          {earnedBadgeCards.map((badge) => (
            <article className="trail-badge earned" key={badge.title}>
              <div className="badge-art">
                <img src={badge.image} alt={`${badge.title} badge`} />
                <span>Earned</span>
              </div>
              <div className="badge-copy">
                <strong>{badge.title}</strong>
                <p>{badge.note}</p>
              </div>
            </article>
          ))}
        </div>

        <section className="badge-journey-strip" aria-label="Journey badge progress">
          <div>
            <p className="section-label">Journey ahead</p>
            <p>Earned badges stay visible while the next markers show what is still ahead.</p>
          </div>
          <ol>
            {journeyBadgePath.map((badge, index) => (
              <li className={`badge-path-item ${badge.state}`} key={`${badge.label}-${index}`}>
                <img src={badge.image} alt={`${badge.label} badge`} />
                <span>{badge.label}</span>
                <small>
                  {badge.state === "earned"
                    ? "Earned"
                    : badge.state === "next"
                      ? "Next"
                      : "Ahead"}
                </small>
              </li>
            ))}
          </ol>
        </section>

        <details className="possible-badge-board" aria-label="Possible trail badges">
          <summary>
            <span>Discover more of the journey ahead.</span>
            <strong>Explore possible badges</strong>
          </summary>
          <div className="badge-accordion-groups">
            {badgeGroups.map((group) => (
              <section className="badge-group" key={group.title}>
                <div className="badge-group-heading">
                  <h3>{group.title}</h3>
                  <small>Preview</small>
                </div>
                <p className="badge-group-note">{group.note}</p>
                <div className="badge-grid">
                  {group.badges.map(([title, image]) => (
                    <article className="trail-badge locked" key={title}>
                      <div className="badge-art">
                        <img src={image} alt={`${title} badge`} />
                      </div>
                      <div className="badge-copy">
                        <span>Possible</span>
                        <strong>{title}</strong>
                        <p>Condition logic will connect during the Journey build.</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}

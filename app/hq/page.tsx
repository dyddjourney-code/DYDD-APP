import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import {
  assessmentLabels,
  displayDate,
  getAssessmentSnapshotsForUser,
  type StudentAssessmentReport,
  latestByAssessment,
  snapshotHighlights,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import { designIdCourse } from "@/lib/courses/designid-foundations";
import {
  canonicalizeParticipantEmail,
  normalizeEmail,
  participantEmailCandidates,
} from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  getNewReviewReport,
  heatherReviewName,
  isHeatherReviewRequest,
  isNewReviewRequest,
  newReviewName,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminSnapshotSummary = AssessmentSnapshotSummary & {
  assessment_participants:
    | {
        display_name: string | null;
        normalized_email: string | null;
      }
    | null;
  id: string;
};

type NamedParticipantSnapshot = AssessmentSnapshotSummary;

type HqPageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

const toolCatalog = [
  {
    assessmentType: "designid",
    detail: "Identity, contribution, reflection language, and a completed report.",
    label: "DesignID",
    price: "$20",
  },
  {
    assessmentType: "designpd",
    detail: "Plan, Decide, and Do patterns for practical daily alignment.",
    label: "DesignPD",
    price: "$50",
  },
  {
    assessmentType: "spiritual_gifts",
    detail: "A free first step for naming how the Spirit may be empowering service.",
    label: "Spiritual Gifts",
    price: "Free",
  },
  {
    assessmentType: "design_pathways",
    detail: "A free discernment layer for direction, experiments, and next steps.",
    label: "Design Pathways",
    price: "Free",
  },
  {
    assessmentType: "fruit_360",
    detail: "A free 360-style mirror for visible fruit and growth conversations.",
    label: "Fruit 360",
    price: "Free",
  },
];

const baseCampSteps = [
  { detail: "Open your available tools.", label: "Supply Tent" },
  { detail: "Review completed reports.", label: "Artifact Shelf" },
  { detail: "Enter a course path.", label: "Trailhead" },
  { detail: "Ask Dydi what to do next.", label: "Guide Fire" },
];

function isAdminEmail(email: string | null | undefined) {
  const configured = (process.env.DYDD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => canonicalizeParticipantEmail(value))
    .filter(Boolean);
  const adminEmails = new Set(["dyddjourney@gmail.com", ...configured]);

  return adminEmails.has(canonicalizeParticipantEmail(email));
}

async function getAdminAssessmentReport(enabled: boolean) {
  if (!enabled) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("assessment_snapshots")
    .select(
      "id,assessment_type,created_at,scores,source,source_submitted_at,assessment_participants(display_name,normalized_email)",
    )
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(120);

  const recent = ((data ?? []) as unknown as Array<
    Omit<AdminSnapshotSummary, "assessment_participants"> & {
      assessment_participants:
        | AdminSnapshotSummary["assessment_participants"]
        | AdminSnapshotSummary["assessment_participants"][];
    }
  >).map((snapshot) => ({
    ...snapshot,
    assessment_participants: Array.isArray(snapshot.assessment_participants)
      ? (snapshot.assessment_participants[0] ?? null)
      : snapshot.assessment_participants,
  }));
  const duplicateGroups = new Map<string, number>();

  for (const snapshot of recent) {
    const email =
      snapshot.assessment_participants?.normalized_email ?? "unknown-participant";
    const key = `${email}:${snapshot.assessment_type}`;
    duplicateGroups.set(key, (duplicateGroups.get(key) ?? 0) + 1);
  }

  return {
    duplicatePairsInRecentWindow: Array.from(duplicateGroups.values()).filter(
      (count) => count > 1,
    ).length,
    recent,
    totalInRecentWindow: recent.length,
  };
}

async function getHeatherAssessmentReport(enabled: boolean) {
  if (!enabled) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const heatherEmails = participantEmailCandidates("willoughbyhs@gmail.com");

  const { data: participants } = await supabaseAdmin
    .from("assessment_participants")
    .select("id,display_name,normalized_email")
    .in("normalized_email", heatherEmails)
    .returns<
      Array<{
        display_name: string | null;
        id: string;
        normalized_email: string | null;
      }>
    >();

  const participantIds = (participants ?? []).map((participant) => participant.id);

  if (!participantIds.length) {
    return {
      latest: [] as NamedParticipantSnapshot[],
      participantCount: 0,
      totalSnapshots: 0,
    };
  }

  const { data } = await supabaseAdmin
    .from("assessment_snapshots")
    .select("id,assessment_type,created_at,scores,source,source_submitted_at")
    .in("participant_id", participantIds)
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<NamedParticipantSnapshot[]>();

  return {
    latest: latestByAssessment(data ?? []) as NamedParticipantSnapshot[],
    participantCount: participantIds.length,
    totalSnapshots: data?.length ?? 0,
  };
}

function ownsAssessment(report: StudentAssessmentReport, assessmentType: string) {
  return report.latest.some(
    (snapshot) => snapshot.assessment_type === assessmentType,
  );
}

function artifactDownloadHref(snapshot: AssessmentSnapshotSummary) {
  return `/api/artifacts/${encodeURIComponent(snapshot.id)}/download`;
}

export default async function HqPage({ searchParams }: HqPageProps) {
  const reviewParams = await searchParams;
  const heatherPreview = isHeatherReviewRequest(reviewParams);
  const newPreview = isNewReviewRequest(reviewParams);
  const reviewReport =
    (await getHeatherReviewReport(reviewParams)) ?? getNewReviewReport(reviewParams);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !reviewReport) {
    redirect("/login");
  }

  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const assessmentReport: StudentAssessmentReport = reviewReport ??
    (await getAssessmentSnapshotsForUser(user?.id ?? "", normalizeEmail(user?.email)));
  const snapshots = assessmentReport.latest;
  const isAdmin = Boolean(user && isAdminEmail(user.email));
  const adminReport = await getAdminAssessmentReport(isAdmin);
  const heatherReport = await getHeatherAssessmentReport(isAdmin);

  const displayName = heatherPreview
    ? `${heatherReviewName} Preview`
    : newPreview
      ? newReviewName
      : profile?.full_name ?? user?.email ?? "Traveler";
  const hasDyddCourseAccess = heatherPreview;
  const hasDesignIdCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "designid");
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );
  const completedArtifactCount = snapshots.length;

  const courseCards = [
    {
      action: hasDesignIdCourseAccess ? "Open course" : "Included with DesignID",
      available: hasDesignIdCourseAccess,
      detail:
        "A focused course for understanding DesignID language after the assessment is purchased and completed.",
      href: withReviewQuery("/courses/designid-foundations", reviewParams),
      label: "DesignID Foundations",
      meta: `${designIdCourse.modules.length} modules · ${lessonCount} lessons`,
      price: "Included with DesignID",
    },
    {
      action: hasDyddCourseAccess ? "Continue course" : "Purchase access",
      available: hasDyddCourseAccess,
      detail:
        "The fuller DYDD course walkthrough, guided journey process, and deeper companion-supported formation path.",
      href: "#dydd-course",
      label: "Discover Your Divine Design Course",
      meta: "Paid course · bandwidth-heavy guided path",
      price: "Paid access",
    },
  ];

  return (
    <main className="hq-shell">
      <header className="hq-topbar">
        <div>
          <p className="eyebrow">Base camp headquarters</p>
          <h1>{displayName}</h1>
        </div>
        {reviewReport ? (
          <Link className="button secondary" href="/login">
            Real sign-in
          </Link>
        ) : (
          <form action={signOut}>
            <button className="button secondary" type="submit">
              Sign out
            </button>
          </form>
        )}
      </header>

      <section className="basecamp-hero" aria-label="DYDD headquarters">
        <div className="basecamp-copy">
          <p className="section-label">You have arrived</p>
          <h2>Set your pack down. Choose the next trail.</h2>
          <p>
            Headquarters is the staging place for tools, completed artifacts,
            course access, the journey process, and Dydi-guided reflection.
          </p>
          <div className="basecamp-actions">
            <a className="button primary" href="#ask-dydi">
              Ask Dydi
            </a>
            <a className="button secondary" href="#tools">
              View tools
            </a>
          </div>
        </div>
        <div className="basecamp-scene" aria-hidden="true">
          <img src="/brand/dydd-cabin-porch.png" alt="" />
          <div className="camp-sign">
            <span>DYDD HQ</span>
            <strong>Base Camp</strong>
          </div>
        </div>
      </section>

      <section className="hq-command-row" aria-label="HQ summary">
        <p>
          <span>{completedArtifactCount}</span>
          <small>Completed artifacts</small>
        </p>
        <p>
          <span>{hasDyddCourseAccess ? 2 : hasDesignIdCourseAccess ? 1 : 0}</span>
          <small>Course paths open</small>
        </p>
        <p>
          <span>{toolCatalog.length}</span>
          <small>Tools available after login</small>
        </p>
      </section>

      <section className="ask-dydi-hq" id="ask-dydi" aria-label="Ask Dydi">
        <div>
          <p className="section-label">Ask Dydi</p>
          <h2>What should I look at next?</h2>
          <p>
            This will become the first conversation point in HQ, helping a person
            understand what they own, what is missing, and where the next step
            should begin.
          </p>
        </div>
        <form className="dydi-form">
          <label htmlFor="hq-dydi-question">Ask from your headquarters</label>
          <textarea
            id="hq-dydi-question"
            name="question"
            placeholder="What should I do first with my current tools?"
            rows={4}
          />
          <button className="button primary" type="button">
            Ask Dydi
          </button>
          <p className="helper-text">
            Staged for preview. Live companion responses will connect later.
          </p>
        </form>
      </section>

      <section className="hq-grid" aria-label="DYDD HQ dashboard">
        <article className="journey-map">
          <div className="card-heading">
            <p className="section-label">Base camp map</p>
            <h2>Launch points</h2>
          </div>
          <ol>
            {baseCampSteps.map((step, index) => (
              <li key={step.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
                <em>{index === 0 ? "Ready" : "Staged"}</em>
              </li>
            ))}
          </ol>
        </article>

        <article className="tool-panel" id="tools">
          <div className="card-heading">
            <p className="section-label">Tools</p>
            <h2>Available after login</h2>
          </div>
          <div className="product-list">
            {toolCatalog.map((tool) => {
              const completed = ownsAssessment(assessmentReport, tool.assessmentType);
              return (
                <article className="product-row" key={tool.label}>
                  <div>
                    <strong>{tool.label}</strong>
                    <p>{tool.detail}</p>
                  </div>
                  <span>{completed ? "Completed" : tool.price}</span>
                  <a className="button secondary" href="#tools">
                    {completed ? "Review" : tool.price === "Free" ? "Start" : "Buy"}
                  </a>
                </article>
              );
            })}
          </div>
        </article>

        <article className="course-panel">
          <div className="card-heading">
            <p className="section-label">Courses</p>
            <h2>Course trailheads</h2>
          </div>
          <div className="course-card-list">
            {courseCards.map((course) => (
              <article
                className={course.available ? "course-card open" : "course-card locked"}
                id={course.label.startsWith("Discover") ? "dydd-course" : undefined}
                key={course.label}
              >
                <div>
                  <span>{course.price}</span>
                  <h3>{course.label}</h3>
                  <p>{course.detail}</p>
                  <small>{course.meta}</small>
                </div>
                {course.available ? (
                  <Link className="button secondary" href={course.href}>
                    {course.action}
                  </Link>
                ) : (
                  <a className="button secondary" href={course.href}>
                    {course.action}
                  </a>
                )}
              </article>
            ))}
          </div>
        </article>

        <article className="artifact-panel">
          <div className="card-heading">
            <p className="section-label">Artifacts</p>
            <h2>Completed shelf</h2>
          </div>
          {snapshots?.length ? (
            <div className="artifact-download-list">
              {snapshots.map((snapshot) => (
                <article className="artifact-download" key={snapshot.id}>
                  <div>
                    <span>
                      {assessmentLabels[snapshot.assessment_type] ??
                        snapshot.assessment_type}
                    </span>
                    <small>
                      Completed{" "}
                      {displayDate(
                        snapshot.source_submitted_at ?? snapshot.created_at,
                      )}
                    </small>
                  </div>
                  {snapshotHighlights(snapshot).length ? (
                    <dl>
                      {snapshotHighlights(snapshot).slice(0, 3).map((item) => (
                        <div key={item.label}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <a
                    className="button secondary"
                    href={artifactDownloadHref(snapshot)}
                  >
                    Download report
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="hq-empty-state">
              <strong>No completed artifacts yet.</strong>
              <p>
                This account is ready to use the free tools or purchase
                DesignID, DesignPD, and the DYDD course. Completed reports will
                appear here after the person finishes an assessment.
              </p>
            </div>
          )}
        </article>

        <article className="journey-builder">
          <div>
            <p className="section-label">Journey and niche builder</p>
            <h2>
              {hasDyddCourseAccess
                ? "Continue the DYDD journey."
                : "Unlock the DYDD course to open the journey."}
            </h2>
            <p>
              The journey process and niche builder belong with the broader
              Discover Your Divine Design course, where identity, story,
              expertise, desire, gifts, and assessments can be walked out over
              time.
            </p>
          </div>
          <a className="button primary" href="#dydd-course">
            {hasDyddCourseAccess ? "Continue journey" : "View course access"}
          </a>
        </article>

        {adminReport ? (
          <article className="admin-panel">
            <div className="card-heading">
              <p className="section-label">Admin report</p>
              <h2>All submissions</h2>
            </div>
            <div className="admin-metrics">
              <p>
                <span>{adminReport.totalInRecentWindow}</span>
                <small>Recent mirrored rows</small>
              </p>
              <p>
                <span>{adminReport.duplicatePairsInRecentWindow}</span>
                <small>Duplicate histories in this window</small>
              </p>
            </div>
            {heatherReport ? (
              <div className="named-check">
                <div>
                  <p className="section-label">Heather verification</p>
                  <h3>willoughbyhs@gmail.com is attached.</h3>
                  <p>
                    {heatherReport.participantCount
                      ? `${heatherReport.totalSnapshots} mirrored submissions are connected across ${heatherReport.participantCount} participant record${
                          heatherReport.participantCount === 1 ? "" : "s"
                        }.`
                      : "No mirrored submissions are attached yet for Heather's Gmail variants."}
                  </p>
                </div>
                {heatherReport.latest.length ? (
                  <div className="named-check-list">
                    {heatherReport.latest.map((snapshot) => (
                      <p key={snapshot.id}>
                        <span>
                          {assessmentLabels[snapshot.assessment_type] ??
                            snapshot.assessment_type}
                        </span>
                        <small>
                          {displayDate(
                            snapshot.source_submitted_at ?? snapshot.created_at,
                          )}
                          {" · "}
                          {snapshot.source ?? "DYDD source"}
                        </small>
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="admin-submission-list">
              {adminReport.recent.slice(0, 36).map((snapshot) => (
                <p key={snapshot.id}>
                  <span>
                    {snapshot.assessment_participants?.display_name ??
                      snapshot.assessment_participants?.normalized_email ??
                      "Unknown participant"}
                  </span>
                  <strong>
                    {assessmentLabels[snapshot.assessment_type] ??
                      snapshot.assessment_type}
                  </strong>
                  <small>
                    {displayDate(
                      snapshot.source_submitted_at ?? snapshot.created_at,
                    )}
                    {" · "}
                    {snapshot.source ?? "DYDD source"}
                  </small>
                </p>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}

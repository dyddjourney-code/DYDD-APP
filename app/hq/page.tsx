import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import {
  assessmentLabels,
  displayDate,
  getAssessmentSnapshotsForParticipantMatch,
  getAssessmentSnapshotsForUser,
  type StudentAssessmentReport,
  latestByAssessment,
  snapshotHighlights,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import { allCourseSummaries } from "@/lib/courses/course-catalog";
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

type FruitLifeDashboardSession = {
  artifacts: Array<{
    artifact_status: string;
    artifact_type: string;
    created_at: string;
    external_url: string | null;
    filename: string | null;
    provider: string;
  }>;
  created_at: string;
  id: string;
  observer_completed_count: number;
  observer_goal: number;
  participant_email: string | null;
  participant_name: string | null;
  report_status: string;
  report_url: string | null;
  response_count: number;
  self_completed_at: string | null;
  session_status: string;
  updated_at: string;
};

type HqPageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

const toolCatalog = [
  {
    assessmentType: "designid",
    detail: "Identity, contribution, reflection language, and a completed report.",
    href: "#tools",
    label: "DesignID",
    logo: "/brand/tools/designid-logo.webp",
    price: "$20",
  },
  {
    assessmentType: "designpd",
    detail: "Plan, Decide, and Do patterns for practical daily alignment.",
    href: "#tools",
    label: "DesignPD",
    logo: "/brand/tools/designpd-logo.jpg",
    price: "$50",
  },
  {
    assessmentType: "spiritual_gifts",
    detail: "A free first step for naming how the Spirit may be empowering service.",
    href: "#tools",
    label: "Spiritual Gifts",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    price: "Free",
  },
  {
    assessmentType: "design_pathways",
    detail: "A free discernment layer for direction, experiments, and next steps.",
    href: "#design-pathways",
    label: "Design Pathways",
    logo: "/brand/tools/design-pathways-logo.jpg",
    price: "Free",
  },
  {
    assessmentType: "fruit_360",
    detail: "A free 360-style mirror for visible fruit and growth conversations.",
    href: "/fruitlife360",
    label: "FruitLife 360",
    logo: "/brand/tools/fruitful-life-360-logo.jpg",
    price: "Free",
  },
];

const baseCampSteps = [
  { detail: "Open assessments, free tools, and next-step resources.", label: "Tool Bench" },
  { detail: "Step into DYDD, DesignID, DesignPD, or Spiritual Gifts courses.", label: "Course Table" },
  { detail: "Download completed reports and revisit past insights.", label: "Artifact Shelf" },
  { detail: "Move through the journey process, niche builder, and Dydi reflection.", label: "Trail Door" },
];

const fruitLifeStages = [
  {
    detail: "Create a Vercel/Supabase session and send the participant their self and observer links.",
    label: "Start intake",
    state: "Live",
  },
  {
    detail: "Track whether self reflection is done and how many observer responses have landed.",
    label: "Response watch",
    state: "Live",
  },
  {
    detail: "Prepare the same report payload the old Google Sheet and PDFMonkey path expects.",
    label: "Payload queue",
    state: "Live",
  },
  {
    detail: "Individual observer reminders and final PDF rendering are next after this UI pass.",
    label: "Reminder/report worker",
    state: "Next",
  },
];

function isAdminEmail(email: string | null | undefined) {
  const configured = (process.env.DYDD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => canonicalizeParticipantEmail(value))
    .filter(Boolean);
  const adminEmails = new Set(["dyddjourney@gmail.com", ...configured]);

  return adminEmails.has(canonicalizeParticipantEmail(email));
}

function titleizeStatus(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "not started";
}

function getFruitLifeCompletion(session: FruitLifeDashboardSession | null) {
  if (!session) {
    return { completed: 0, required: 1 };
  }

  const selfCount = session.self_completed_at ? 1 : 0;
  const required = 1 + Math.max(0, session.observer_goal);
  const completed = selfCount + Math.max(0, session.observer_completed_count);

  return { completed, required };
}

async function getFruitLifeDashboardSessions({
  email,
  enabled,
  isAdmin,
}: {
  email: string | null;
  enabled: boolean;
  isAdmin: boolean;
}) {
  if (!enabled || (!email && !isAdmin)) {
    return [];
  }

  const supabaseAdmin = createSupabaseAdminClient();
  let query = supabaseAdmin
    .from("fruitlife_360_sessions")
    .select(
      "id,participant_name,participant_email,session_status,report_status,observer_goal,observer_completed_count,response_count,self_completed_at,report_url,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(isAdmin ? 6 : 4);

  if (!isAdmin && email) {
    query = query.eq("participant_email", email);
  }

  const { data } = await query;
  const sessions = (data ?? []) as Omit<FruitLifeDashboardSession, "artifacts">[];
  const sessionIds = sessions.map((session) => session.id);

  if (!sessionIds.length) {
    return [];
  }

  const { data: artifacts } = await supabaseAdmin
    .from("fruitlife_360_report_artifacts")
    .select("session_id,artifact_type,artifact_status,provider,external_url,filename,created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  const artifactsBySession = new Map<string, FruitLifeDashboardSession["artifacts"]>();

  for (const artifact of artifacts ?? []) {
    const sessionId = String(artifact.session_id);
    const current = artifactsBySession.get(sessionId) ?? [];
    current.push({
      artifact_status: String(artifact.artifact_status),
      artifact_type: String(artifact.artifact_type),
      created_at: String(artifact.created_at),
      external_url: typeof artifact.external_url === "string" ? artifact.external_url : null,
      filename: typeof artifact.filename === "string" ? artifact.filename : null,
      provider: String(artifact.provider),
    });
    artifactsBySession.set(sessionId, current);
  }

  return sessions.map((session) => ({
    ...session,
    artifacts: artifactsBySession.get(session.id) ?? [],
  }));
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

  const report = await getAssessmentSnapshotsForParticipantMatch({
    displayNames: [heatherReviewName],
    emails: ["willoughbyhs@gmail.com"],
  });

  return {
    latest: report.latest as NamedParticipantSnapshot[],
    participantCount: report.latest.length ? 1 : 0,
    totalSnapshots: report.all.length,
  };
}

function ownsAssessment(report: StudentAssessmentReport, assessmentType: string) {
  return report.latest.some(
    (snapshot) => snapshot.assessment_type === assessmentType,
  );
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
  const hasDesignPdCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "designpd");
  const hasSpiritualGiftsCourseAccess =
    heatherPreview || ownsAssessment(assessmentReport, "spiritual_gifts");
  const hasFruitLifeCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "fruit_360");
  const fruitLifeDashboardEmail = heatherPreview
    ? "willoughbyhs@gmail.com"
    : newPreview
      ? null
      : normalizeEmail(profile?.email ?? user?.email);
  const fruitLifeSessions = await getFruitLifeDashboardSessions({
    email: fruitLifeDashboardEmail,
    enabled: Boolean(fruitLifeDashboardEmail || isAdmin),
    isAdmin,
  });
  const activeFruitLifeSession = fruitLifeSessions[0] ?? null;
  const fruitLifeCompletion = getFruitLifeCompletion(activeFruitLifeSession);
  const openCourseCount = [
    hasDyddCourseAccess,
    hasDesignIdCourseAccess,
    hasDesignPdCourseAccess,
    hasSpiritualGiftsCourseAccess,
    hasFruitLifeCourseAccess,
  ].filter(Boolean).length;
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );
  const completedArtifactCount = snapshots.length;

  const courseAccessBySlug: Record<string, boolean> = {
    "designid-foundations": hasDesignIdCourseAccess,
    "designpd-alignment": hasDesignPdCourseAccess,
    "discover-your-divine-design": hasDyddCourseAccess,
    "fruitlife-360-formation": hasFruitLifeCourseAccess,
    "spiritual-gifts-service": hasSpiritualGiftsCourseAccess,
  };
  const courseCards = allCourseSummaries.map((course) => {
    const available = courseAccessBySlug[course.slug] ?? false;

    return {
      action: available
        ? course.slug === "discover-your-divine-design"
          ? "Continue course"
          : "Open course"
        : course.price === "Free assessment"
          ? "Start free assessment"
          : course.price,
      available,
      detail: course.description,
      href: withReviewQuery(course.hrefBase, reviewParams),
      icon: course.logo,
      id: `${course.slug}-course`,
      label: course.title,
      meta:
        course.slug === "designid-foundations"
          ? `${designIdCourse.modules.length} modules · ${lessonCount} lessons`
          : `${course.moduleCount} modules · mapped for review`,
      price: course.price,
    };
  });

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
          <p className="section-label">You are inside the hut</p>
          <h2>Look around. Your next step has a place.</h2>
          <p>
            Headquarters gathers the workbench, course table, artifact shelf,
            journey door, and Dydi conversation corner into one natural launch
            point.
          </p>
          <div className="basecamp-actions">
            <a className="button primary" href="#ask-dydi">
              Talk with Dydi
            </a>
            <a className="button secondary" href="#tools">
              Look around HQ
            </a>
          </div>
        </div>
        <div className="basecamp-scene" aria-hidden="true">
          <img src="/brand/dydd-cabin-hut-only.png" alt="" />
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
          <span>{openCourseCount}</span>
          <small>Course paths open</small>
        </p>
        <p>
          <span>{toolCatalog.length}</span>
          <small>Tools available after login</small>
        </p>
        <p>
          <span>{fruitLifeSessions.length}</span>
          <small>FruitLife sessions visible</small>
        </p>
      </section>

      <section className="fruitlife-workbench" aria-label="FruitLife 360 workflow">
        <div className="fruitlife-workbench-lead">
          <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
          <p className="section-label">FruitLife 360 workflow</p>
          <h2>Start the intake, watch responses, then queue the report payload.</h2>
          <p>
            This is the new Vercel/Supabase path. It keeps the working report
            output target in view while moving intake, links, response storage,
            and status out of the fragile Sheet queue.
          </p>
          <div className="basecamp-actions">
            <Link className="button primary" href="/fruitlife360">
              Start FruitLife intake
            </Link>
            <a className="button secondary" href="#fruitlife-artifacts">
              View report state
            </a>
          </div>
          <div className="fruitlife-stage-grid">
            {fruitLifeStages.map((stage) => (
              <article key={stage.label}>
                <span>{stage.state}</span>
                <strong>{stage.label}</strong>
                <small>{stage.detail}</small>
              </article>
            ))}
          </div>
        </div>

        <div className="fruitlife-status-console">
          <div className="fruitlife-session-summary">
            <p className="section-label">Current session</p>
            <strong>
              {activeFruitLifeSession?.participant_name ??
                activeFruitLifeSession?.participant_email ??
                "No active FruitLife session yet"}
            </strong>
            <small>
              {activeFruitLifeSession
                ? `Updated ${displayDate(activeFruitLifeSession.updated_at)}`
                : "Create an intake to generate the self and observer links."}
            </small>
          </div>
          <div className="fruitlife-progress-meter">
            <span
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (fruitLifeCompletion.completed / fruitLifeCompletion.required) * 100,
                  ),
                )}%`,
              }}
            />
          </div>
          <div className="fruitlife-kpis">
            <p>
              <span>{activeFruitLifeSession?.self_completed_at ? "Done" : "Open"}</span>
              <small>Self reflection</small>
            </p>
            <p>
              <span>
                {activeFruitLifeSession?.observer_completed_count ?? 0}/
                {activeFruitLifeSession?.observer_goal ?? 3}
              </span>
              <small>Observers</small>
            </p>
            <p>
              <span>{titleizeStatus(activeFruitLifeSession?.report_status)}</span>
              <small>Report payload</small>
            </p>
          </div>
          <div className="fruitlife-session-list" id="fruitlife-artifacts">
            {fruitLifeSessions.length ? (
              fruitLifeSessions.map((session) => (
                <article key={session.id}>
                  <div>
                    <strong>{session.participant_name ?? session.participant_email}</strong>
                    <small>
                      {titleizeStatus(session.session_status)}
                      {" · "}
                      {session.observer_completed_count}/{session.observer_goal} observers
                    </small>
                  </div>
                  <span>
                    {session.artifacts.length
                      ? `${session.artifacts.length} artifact${
                          session.artifacts.length === 1 ? "" : "s"
                        }`
                      : "No artifact"}
                  </span>
                </article>
              ))
            ) : (
              <article>
                <div>
                  <strong>Ready for the first native intake</strong>
                  <small>After creation, this panel will show session progress.</small>
                </div>
                <span>Waiting</span>
              </article>
            )}
          </div>
        </div>
      </section>

      <section className="ask-dydi-hq" id="ask-dydi" aria-label="Ask Dydi">
        <div className="dydi-host">
          <img src="/brand/characters/dydi-full-body.png" alt="Dydi host" />
          <div>
            <p className="section-label">Ask Dydi</p>
            <h2>Start at the conversation corner.</h2>
            <p>
              Dydi is staged as the guide inside HQ, helping a person notice
              what they own, what is missing, and which station should get their
              attention next.
            </p>
          </div>
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
                <article
                  className="product-row"
                  id={tool.assessmentType === "design_pathways" ? "design-pathways" : undefined}
                  key={tool.label}
                >
                  <img src={tool.logo} alt={`${tool.label} logo`} />
                  <div>
                    <strong>{tool.label}</strong>
                    <p>{tool.detail}</p>
                  </div>
                  <span>{completed ? "Completed" : tool.price}</span>
                  <a className="button secondary" href={tool.href}>
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
                id={course.id}
                key={course.label}
              >
                <img src={course.icon} alt={`${course.label} icon`} />
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
                    href={artifactDownloadHref(snapshot, reviewParams)}
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
                ? "Continue the journey and shape the niche."
                : "Unlock the DYDD course to open the journey."}
            </h2>
            <p>
              The journey process and niche builder belong with the broader
              Discover Your Divine Design course, where identity, story,
              expertise, desire, gifts, and assessments can be walked out over
              time.
            </p>
            {hasDyddCourseAccess ? (
              <div className="niche-builder-steps">
                <span>Journey process</span>
                <span>Niche builder</span>
                <span>Companion reflection</span>
              </div>
            ) : null}
          </div>
          <Link className="button primary" href={withReviewQuery("/journey", reviewParams)}>
            {hasDyddCourseAccess ? "Continue journey" : "View course access"}
          </Link>
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

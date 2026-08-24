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
  compactValue,
  snapshotHighlights,
  snapshotSection,
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
  jordanReviewEmail,
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
  metadata: {
    observerLinks?: Array<{ email?: string; link?: string; name?: string; relationship?: string }>;
    selfLink?: string;
  } | null;
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

const fruitTrendMetrics = [
  { color: "var(--fruit-love)", key: "Love", label: "Love" },
  { color: "var(--fruit-joy)", key: "Joy", label: "Joy" },
  { color: "var(--fruit-peace)", key: "Peace", label: "Peace" },
  { color: "var(--fruit-patience)", key: "Patience", label: "Patience" },
  { color: "var(--fruit-kindness)", key: "Kindness", label: "Kindness" },
  { color: "var(--fruit-goodness)", key: "Goodness", label: "Goodness" },
  { color: "var(--fruit-faithfulness)", key: "Faithfulness", label: "Faithfulness" },
  { color: "var(--fruit-gentleness)", key: "Gentleness", label: "Gentleness" },
  { color: "var(--fruit-selfcontrol)", key: "Self-control", label: "Self-Control" },
];

const toolCatalog = [
  {
    assessmentType: "designid",
    detail: "Identity, contribution, reflection language, and a completed report.",
    href: "#field-kit",
    label: "DesignID",
    logo: "/brand/tools/designid-logo.webp",
    price: "$20",
  },
  {
    assessmentType: "designpd",
    detail: "Plan, Decide, and Do patterns for practical daily alignment.",
    href: "#field-kit",
    label: "DesignPD",
    logo: "/brand/tools/designpd-logo.jpg",
    price: "$50",
  },
  {
    assessmentType: "spiritual_gifts",
    detail: "A free first step for naming how the Spirit may be empowering service.",
    href: "#field-kit",
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
  {
    detail: "See the whole path and the next faithful step.",
    href: "/journey",
    label: "Journey",
    state: "Path",
  },
  {
    detail: "Choose the guided paths and assessments that start the work.",
    href: "#trailheads",
    label: "Trailheads",
    state: "Start",
  },
  {
    detail: "Return to completed reports and saved discoveries.",
    href: "#artifacts",
    label: "Artifacts",
    state: "Saved",
  },
  {
    detail: "Use practical tools for reflection, growth, and preparation.",
    href: "#field-kit",
    label: "Field Kit",
    state: "Prepare",
  },
  {
    detail: "Keep notes, prayers, and reflections in one place.",
    href: "#journal",
    label: "Journal",
    state: "Write",
  },
  {
    detail: "Find future studies, calls, events, and replays.",
    href: "#gatherings",
    label: "Gatherings",
    state: "Soon",
  },
];

const journeyMarkers = [
  {
    detail: "Begin with the full Discover Your Divine Design trail.",
    label: "Start Here",
    meta: "Main trail",
  },
  {
    detail: "Use DesignID early to name identity, contribution, and fit.",
    label: "DesignID",
    meta: "Early marker",
  },
  {
    detail: "Add Spiritual Gifts when the journey turns toward calling and service.",
    label: "Spiritual Gifts",
    meta: "Deeper trail",
  },
  {
    detail: "Use DesignPD and FruitLife 360 to practice, grow, and walk it out.",
    label: "Practice & Grow",
    meta: "Road ahead",
  },
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

function readScoreNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function fruitScoreFromSnapshot(snapshot: AssessmentSnapshotSummary, fruitKey: string) {
  const scores = snapshotSection(snapshot, "scores");
  const observer = readScoreNumber(scores, `${fruitKey}_Observer`);
  const self = readScoreNumber(scores, `${fruitKey}_Self`);

  return observer ?? self;
}

function reportModeLabel(value: string | null | undefined) {
  if (value === "FULL_360") return "Full 360";
  if (value === "SELF_ONLY") return "Self-only";
  return titleizeStatus(value);
}

function buildFruitLifeTrend(snapshots: AssessmentSnapshotSummary[]) {
  const fruitSnapshots = snapshots
    .filter((snapshot) => snapshot.assessment_type === "fruit_360")
    .sort((a, b) => {
      const dateA = new Date(a.source_submitted_at ?? a.created_at).getTime();
      const dateB = new Date(b.source_submitted_at ?? b.created_at).getTime();
      return dateA - dateB;
    });

  const datedRuns = fruitSnapshots.map((snapshot, index) => {
    const values = fruitTrendMetrics.flatMap((fruit) => {
      const value = fruitScoreFromSnapshot(snapshot, fruit.key);
      return value === null ? [] : [value];
    });
    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

    return {
      average,
      date: displayDate(snapshot.source_submitted_at ?? snapshot.created_at),
      id: snapshot.id,
      index,
      mode: compactValue(snapshotSection(snapshot, "summary").Report_Mode) || "FruitLife",
      mostVisible:
        compactValue(snapshotSection(snapshot, "summary").Most_Visible_Fruit_List) ||
        "Awaiting ranked fruit",
      snapshot,
    };
  });

  const latest = datedRuns.at(-1);
  const previous = datedRuns.length > 1 ? datedRuns.at(-2) : null;
  const changes = latest
    ? fruitTrendMetrics
        .map((fruit) => {
          const current = fruitScoreFromSnapshot(latest.snapshot, fruit.key);
          const prior = previous ? fruitScoreFromSnapshot(previous.snapshot, fruit.key) : null;
          return {
            ...fruit,
            current,
            delta: current !== null && prior !== null ? current - prior : null,
          };
        })
        .filter((fruit) => fruit.current !== null)
    : [];
  const sortedChanges = [...changes].sort((a, b) => {
    const deltaA = a.delta ?? 0;
    const deltaB = b.delta ?? 0;
    return deltaB - deltaA;
  });
  const topRiser = sortedChanges.find((fruit) => (fruit.delta ?? 0) > 0) ?? null;
  const growthWatch = [...changes]
    .filter((fruit) => fruit.current !== null)
    .sort((a, b) => (a.current ?? 0) - (b.current ?? 0))[0] ?? null;
  const overallDelta =
    latest && previous ? latest.average - previous.average : null;
  const pointSpacing = datedRuns.length > 1 ? 680 / (datedRuns.length - 1) : 0;
  const series = fruitTrendMetrics
    .map((fruit) => {
      const points = datedRuns.flatMap((run, index) => {
        const value = fruitScoreFromSnapshot(run.snapshot, fruit.key);
        if (value === null) return [];
        const x = 40 + pointSpacing * index;
        const y = 222 - ((Math.max(1, Math.min(5, value)) - 1) / 4) * 170;
        return [{ x, y, value }];
      });

      return { ...fruit, points };
    })
    .filter((fruit) => fruit.points.length);

  return { changes, datedRuns, growthWatch, latest, overallDelta, series, topRiser };
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
      "id,metadata,participant_name,participant_email,session_status,report_status,observer_goal,observer_completed_count,response_count,self_completed_at,report_url,created_at,updated_at",
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

function artifactLabel(snapshot: AssessmentSnapshotSummary) {
  const label = assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;

  if (snapshot.assessment_type !== "fruit_360") {
    return label;
  }

  const mode = compactValue(snapshotSection(snapshot, "summary").Report_Mode);
  return `${label} · ${reportModeLabel(mode)}`;
}

function sessionModeFromMetadata(session: FruitLifeDashboardSession) {
  const payloadArtifact = session.artifacts.find(
    (artifact) => artifact.artifact_type === "payload",
  );
  const mode =
    payloadArtifact?.filename?.includes("self")
      ? "SELF_ONLY"
      : session.observer_goal > 0
        ? "FULL_360"
        : "SELF_ONLY";

  return reportModeLabel(mode);
}

export default async function HqPage({ searchParams }: HqPageProps) {
  const reviewParams = await searchParams;
  const heatherPreview = isHeatherReviewRequest(reviewParams);
  const newPreview = isNewReviewRequest(reviewParams);
  const reviewReport =
    (await getHeatherReviewReport(reviewParams)) ?? (await getNewReviewReport(reviewParams));
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
  const welcomeName = displayName.replace(/\s+Preview$/, "").split(/\s+/)[0] ?? "Traveler";
  const hasDyddCourseAccess = heatherPreview;
  const hasDesignIdCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "designid");
  const hasDesignPdCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "designpd");
  const hasSpiritualGiftsCourseAccess =
    heatherPreview || ownsAssessment(assessmentReport, "spiritual_gifts");
  const hasFruitLifeCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "fruit_360");
  const fruitLifeDashboardEmail = heatherPreview
    ? "willoughbyhs@gmail.com"
    : newPreview
      ? jordanReviewEmail
      : normalizeEmail(profile?.email ?? user?.email);
  const fruitLifeSessions = await getFruitLifeDashboardSessions({
    email: fruitLifeDashboardEmail,
    enabled: Boolean(fruitLifeDashboardEmail || isAdmin),
    isAdmin,
  });
  const activeFruitLifeSession = fruitLifeSessions[0] ?? null;
  const fruitLifeCompletion = getFruitLifeCompletion(activeFruitLifeSession);
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );
  const artifactSnapshots = assessmentReport.all;

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
  const trailheadOrder = [
    "discover-your-divine-design-course",
    "designid-foundations-course",
    "spiritual-gifts-service-course",
    "designpd-alignment-course",
    "fruitlife-360-formation-course",
  ];
  const trailheadMetaById: Record<string, string> = {
    "discover-your-divine-design-course": "Main trail",
    "designid-foundations-course": "Early marker",
    "spiritual-gifts-service-course": "Calling marker",
    "designpd-alignment-course": "Practice marker",
    "fruitlife-360-formation-course": "Growth marker",
  };
  const trailheadCards = [...courseCards].sort((a, b) => {
    const aIndex = trailheadOrder.indexOf(a.id);
    const bIndex = trailheadOrder.indexOf(b.id);

    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });

  return (
    <main className="hq-shell">
      <header className="hq-topbar">
        <div>
          <p className="eyebrow">DYDD Base Camp</p>
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

      <section className="basecamp-hero" aria-label="DYDD Base Camp">
        <div className="basecamp-copy">
          <h2>Welcome, {welcomeName}.</h2>
          <p>
            This is your place to pause, gather what you have discovered, and
            choose the next faithful step.
          </p>
          <div className="basecamp-actions">
            <Link className="button primary" href={withReviewQuery("/journey", reviewParams)}>
              Begin the journey
            </Link>
            <a className="button secondary" href="#field-kit">
              Open the field kit
            </a>
          </div>
        </div>
        <div className="basecamp-scene" aria-hidden="true">
          <img src="/brand/dydd-cabin-hut-only.png" alt="" />
          <div className="camp-sign">
            <span>DYDD</span>
            <strong>Base Camp</strong>
          </div>
        </div>
      </section>

      <section className="journey-orientation" aria-label="Where to begin">
        <div className="orientation-copy">
          <p className="section-label">Where to begin</p>
          <h2>Your journey starts with Discover Your Divine Design.</h2>
          <p>
            Base Camp is the place to see where you are, what you already carry,
            and which part of the road is ready for your attention next.
          </p>
          <div className="basecamp-actions">
            <Link className="button primary" href={withReviewQuery("/journey", reviewParams)}>
              Open main trail
            </Link>
            <a className="button secondary" href="#trailheads">
              See trailheads
            </a>
          </div>
        </div>
        <ol className="orientation-route">
          {journeyMarkers.map((marker) => (
            <li key={marker.label}>
              <span>{marker.meta}</span>
              <strong>{marker.label}</strong>
              <small>{marker.detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="basecamp-wayfinding" aria-label="Base Camp wayfinding">
        {baseCampSteps.map((step) => {
          const href = step.href.startsWith("/")
            ? withReviewQuery(step.href, reviewParams)
            : step.href;

          return (
            <a href={href} key={step.label}>
              <span>{step.state}</span>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </a>
          );
        })}
      </section>

      <section className="hq-grid" aria-label="DYDD Base Camp pathways">
        <article className="course-panel trailhead-panel" id="trailheads">
          <div className="card-heading">
            <p className="section-label">Trailheads</p>
            <h2>Choose the trail, then follow the markers.</h2>
          </div>
          <div className="trailhead-map">
            <img
              className="trail-signpost-image"
              src="/brand/dydd-trailheads-signpost-dydi.png"
              alt="Dydi standing beside a jungle trail sign for the DYDD Journey and Basecamp"
            />
            <div className="trail-route-list">
              {trailheadCards.map((course) => (
                <article
                  className={course.available ? "trail-route open" : "trail-route locked"}
                  id={course.id}
                  key={course.label}
                >
                  <img src={course.icon} alt={`${course.label} icon`} />
                  <div>
                    <span>{trailheadMetaById[course.id] ?? "Trail marker"}</span>
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
          </div>
        </article>

        <article className="tool-panel fieldkit-panel" id="field-kit">
          <div className="card-heading">
            <p className="section-label">Field Kit</p>
            <h2>Prepare for the road ahead.</h2>
          </div>
          <div className="fieldkit-feature">
            <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
            <div>
              <strong>FruitLife 360</strong>
              <p>
                Pack this for growth work: saved runs, observer progress,
                artifacts, notes, and the next trailhead that helps explain
                what the results mean.
              </p>
              <div className="fieldkit-status">
                <span>
                  {activeFruitLifeSession
                    ? `${fruitLifeCompletion.completed}/${fruitLifeCompletion.required} responses`
                    : "Ready to start"}
                </span>
                <small>
                  {activeFruitLifeSession
                    ? `Updated ${displayDate(activeFruitLifeSession.updated_at)}`
                    : "Create the first FruitLife intake"}
                </small>
              </div>
            </div>
            <Link className="button secondary" href="/fruitlife360">
              Open
            </Link>
          </div>
          <div className="product-list fieldkit-list">
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

        <article className="artifact-panel artifact-workbench" id="artifacts">
          <div className="card-heading">
            <p className="section-label">Artifacts</p>
            <h2>Examine what you have already discovered.</h2>
          </div>
          {artifactSnapshots?.length ? (
            <div className="artifact-download-list">
              {artifactSnapshots.map((snapshot) => (
                <article className="artifact-download" key={snapshot.id}>
                  <div>
                    <span>{artifactLabel(snapshot)}</span>
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
            <p className="section-label">Main trail</p>
            <h2>
              {hasDyddCourseAccess
                ? "Continue Discover Your Divine Design."
                : "Open the Discover Your Divine Design trail."}
            </h2>
            <p>
              This opens the guided course path that gathers the book,
              workbook, assessments, reflection, and next steps into one
              formation trail.
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
            {hasDyddCourseAccess ? "Continue trail" : "View course access"}
          </Link>
        </article>

        <article className="journal-panel" id="journal">
          <div className="card-heading">
            <p className="section-label">Journal</p>
            <h2>Reflection that stays with the person.</h2>
          </div>
          <p>
            Notes, prayers, workbook responses, questions, and companion-guided
            reflections should live here instead of disappearing after a single
            session.
          </p>
          <div className="journal-lines">
            <span>Today I noticed...</span>
            <span>The place I need grace is...</span>
            <span>My next faithful step is...</span>
          </div>
        </article>

        <article className="gatherings-panel" id="gatherings">
          <div className="card-heading">
            <p className="section-label">Gatherings</p>
            <h2>Live and archived moments.</h2>
          </div>
          <p>
            This can hold future studies, live calls, podcasts, events, replays,
            and community invitations without making Base Camp feel crowded.
          </p>
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

      <section className="ask-dydi-hq" id="ask-dydi" aria-label="Ask Dydi">
        <div className="dydi-host">
          <img src="/brand/characters/dydi-full-body.png" alt="Dydi host" />
          <div>
            <p className="section-label">Companion guide</p>
            <h2>Dydi stays near the trail.</h2>
            <p>
              The guide layer belongs throughout the journey, especially where
              a person needs encouragement, interpretation, or a simple way to
              keep moving.
            </p>
          </div>
        </div>
        <form className="dydi-form">
          <label htmlFor="hq-dydi-question">Ask from Base Camp</label>
          <textarea
            id="hq-dydi-question"
            name="question"
            placeholder="Where should I begin today?"
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
    </main>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  rescindFruitLifeObserverInvite,
  sendFruitLifeReminder,
} from "@/app/fruitlife360/actions";
import { DydPassportBook, defaultPassportBadges } from "@/components/dyd-passport-book";
import { DyddOrientationSlider } from "@/components/dydd-orientation-slider";
import { FruitLifeSessionAutoRefresh } from "@/app/fruitlife360/session-auto-refresh";
import { signOut } from "@/app/login/actions";
import {
  assessmentLabels,
  buildDesignIdContext,
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
  invites: Array<{
    completed_at: string | null;
    id: string;
    invite_status: string;
    observer_email: string | null;
    observer_name: string | null;
    relationship_label: string | null;
  }>;
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
  searchParams?: Promise<ReviewSearchParams & {
    fruitlife?: string;
    fruitlife_session?: string;
    fruitlife_token?: string;
  }>;
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
    href: "/field-kit",
    label: "DesignID",
    logo: "/brand/tools/designid-logo.webp",
    price: "$20",
  },
  {
    assessmentType: "designpd",
    detail: "Plan, Decide, and Do patterns for practical daily alignment.",
    href: "/field-kit",
    label: "DesignPD",
    logo: "/brand/tools/designpd-logo.jpg",
    price: "$50",
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
  const { data: invites } = await supabaseAdmin
    .from("fruitlife_360_observer_invites")
    .select("session_id,id,observer_name,observer_email,relationship_label,invite_status,completed_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true });

  const artifactsBySession = new Map<string, FruitLifeDashboardSession["artifacts"]>();
  const invitesBySession = new Map<string, FruitLifeDashboardSession["invites"]>();

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

  for (const invite of invites ?? []) {
    const sessionId = String(invite.session_id);
    const current = invitesBySession.get(sessionId) ?? [];
    current.push({
      completed_at: typeof invite.completed_at === "string" ? invite.completed_at : null,
      id: String(invite.id),
      invite_status: String(invite.invite_status ?? "draft"),
      observer_email: typeof invite.observer_email === "string" ? invite.observer_email : null,
      observer_name: typeof invite.observer_name === "string" ? invite.observer_name : null,
      relationship_label:
        typeof invite.relationship_label === "string" ? invite.relationship_label : null,
    });
    invitesBySession.set(sessionId, current);
  }

  return sessions.map((session) => ({
    ...session,
    artifacts: artifactsBySession.get(session.id) ?? [],
    invites: invitesBySession.get(session.id) ?? [],
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

function reflectionIsPresent(reflectionText: string, reflection?: string) {
  if (!reflection) {
    return false;
  }

  return reflectionText.toLowerCase().includes(reflection);
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

function fruitLifeTokenFromSession(session: FruitLifeDashboardSession | null) {
  if (!session?.metadata?.selfLink) {
    return "";
  }

  try {
    return new URL(session.metadata.selfLink).searchParams.get("token") ?? "";
  } catch {
    return "";
  }
}

function fruitLifeStatusHref(session: FruitLifeDashboardSession, token: string) {
  if (!token) {
    return "/fruitlife360";
  }

  return `/fruitlife360/status?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(token)}`;
}

function fruitLifeIsActive(session: FruitLifeDashboardSession | null) {
  if (!session) {
    return false;
  }

  return !["report_ready", "report_sent", "completed", "sent"].includes(session.session_status);
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
  const fruitLifeDashboardEmail = heatherPreview
    ? "willoughbyhs@gmail.com"
    : newPreview
      ? jordanReviewEmail
      : normalizeEmail(profile?.email ?? user?.email);
  const hasDesignId = ownsAssessment(assessmentReport, "designid");
  const hasDesignPd = ownsAssessment(assessmentReport, "designpd");
  const hasDesignPathways = ownsAssessment(assessmentReport, "design_pathways");
  const hasSpiritualGifts = ownsAssessment(assessmentReport, "spiritual_gifts");
  const hasFruitLife = ownsAssessment(assessmentReport, "fruit_360");
  const passportBadges = defaultPassportBadges.map((badge) => {
    const isEarned =
      (badge.title === "DesignID" && hasDesignId) ||
      (badge.title === "DesignPD" && hasDesignPd) ||
      (badge.title === "Design Pathways" && hasDesignPathways) ||
      (badge.title === "Spiritual Gifts" && hasSpiritualGifts) ||
      (badge.title === "FruitLife 360" && hasFruitLife);

    return {
      ...badge,
      state: isEarned ? "earned" as const : badge.state,
    };
  });

  return (
    <main className="hq-shell hq-app-shell">
      <div className="hq-content">
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

      <section className="basecamp-hero" id="basecamp" aria-label="DYDD Base Camp">
        <div className="basecamp-copy">
          <p className="section-label basecamp-purpose-pill">On Purpose, For Purpose</p>
          <div className="basecamp-identity-lockup">
            <div>
              <h2>Welcome, {welcomeName}.</h2>
              <p>
                Base Camp is your personal landing place for the DYD journey.
              </p>
            </div>
            <Link className="button primary basecamp-launch-button" href="/ranger-station">
              Go to Ranger Station
            </Link>
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

      <section className="basecamp-orientation-band" aria-label="What is DYD">
        <div className="basecamp-orientation-copy">
          <p className="section-label">Welcome</p>
          <h2>What is DYD?</h2>
          <p>
            Discover Your Divine Design helps you understand how God has shaped your identity,
            design, story, desire, gifts, and purpose. Start here, then let Ranger Station help
            you choose the best next trail.
          </p>
          <Link className="button secondary" href="/ranger-station">
            Ask Dydi what to do next
          </Link>
        </div>
        <DyddOrientationSlider />
      </section>

      <DydPassportBook badges={passportBadges} firstName={welcomeName} />

      <section className="basecamp-account-layout" aria-label="Base Camp account overview">
        <article className="basecamp-account-card profile">
          <div className="card-heading">
            <p className="section-label">Account</p>
            <h2>Your starting record.</h2>
            <p>
              Base Camp stays simple until you choose a path.
            </p>
          </div>
          <dl className="account-detail-list">
            <div>
              <dt>Name</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile?.email ?? user?.email ?? fruitLifeDashboardEmail ?? "Preview account"}</dd>
            </div>
          </dl>
        </article>

        <article className="basecamp-account-card launch">
          <div className="card-heading">
            <p className="section-label">Next</p>
            <h2>Open Ranger Station.</h2>
            <p>
              The map, quick tracks, and next-step choices belong there.
            </p>
          </div>
          <div className="basecamp-launch-panel">
            <p>
              Start with the guide station, then choose the first trail that fits your season.
            </p>
            <Link className="button primary" href="/ranger-station">
              Launch the tool
            </Link>
          </div>
        </article>
      </section>

      <section className="basecamp-account-card purchases" aria-label="Purchase history">
        <div className="card-heading">
          <p className="section-label">Purchases</p>
          <h2>Nothing purchased yet.</h2>
          <p>
            After you begin a tool, course, or guided journey, access will appear here.
          </p>
        </div>
        <p className="empty-account-note">
          Ranger Station will help you decide whether to start with the free Spiritual Gifts
          assessment, FruitLife 360, DesignID, or the full Discover Your Divine Design journey.
        </p>
      </section>

      {adminReport ? (
        <section className="hq-grid" aria-label="Base Camp admin view">
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
        </section>
      ) : null}

      </div>
    </main>
  );
}

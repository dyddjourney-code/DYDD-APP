import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { assessmentSources } from "@/lib/assessments/sources";
import { designIdCourse } from "@/lib/courses/designid-foundations";
import {
  canonicalizeParticipantEmail,
  normalizeEmail,
  participantEmailCandidates,
} from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssessmentSnapshotSummary = {
  assessment_type: string;
  created_at: string;
  source: string | null;
  source_submitted_at: string | null;
};

type AdminSnapshotSummary = AssessmentSnapshotSummary & {
  assessment_participants:
    | {
        display_name: string | null;
        normalized_email: string | null;
      }
    | null;
  id: string;
};

type ParticipantRecord = {
  id: string;
  normalized_email: string | null;
  user_id: string | null;
};

type NamedParticipantSnapshot = AssessmentSnapshotSummary & {
  id: string;
};

const journeySteps = [
  { label: "Identity", state: "Ready" },
  { label: "Expertise", state: "Queued" },
  { label: "Story", state: "Queued" },
  { label: "Desire", state: "Queued" },
  { label: "Gifts", state: "Queued" },
  { label: "Niche", state: "Builder" },
];

const assessmentLabels: Record<string, string> = {
  design_pathways: "Design Pathways",
  designid: "DesignID",
  designpd: "DesignPD",
  fruit_360: "Fruit 360",
  spiritual_gifts: "Spiritual Gifts",
};

function displayDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function isAdminEmail(email: string | null | undefined) {
  const configured = (process.env.DYDD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => canonicalizeParticipantEmail(value))
    .filter(Boolean);
  const adminEmails = new Set(["dyddjourney@gmail.com", ...configured]);

  return adminEmails.has(canonicalizeParticipantEmail(email));
}

function latestByAssessment(snapshots: AssessmentSnapshotSummary[]) {
  const latest = new Map<string, AssessmentSnapshotSummary>();

  for (const snapshot of snapshots) {
    if (!latest.has(snapshot.assessment_type)) {
      latest.set(snapshot.assessment_type, snapshot);
    }
  }

  return Array.from(latest.values());
}

async function findOrAttachParticipant(userId: string, email: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: existingParticipant } = await supabaseAdmin
    .from("assessment_participants")
    .select("id,user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingParticipant) {
    return existingParticipant.id as string;
  }

  if (!email) {
    return null;
  }

  const emailCandidates = participantEmailCandidates(email);

  if (!emailCandidates.length) {
    return null;
  }

  const { data: emailParticipants } = await supabaseAdmin
    .from("assessment_participants")
    .select("id,user_id")
    .in("normalized_email", emailCandidates)
    .returns<ParticipantRecord[]>();

  const emailParticipant = emailParticipants?.[0];

  if (!emailParticipant) {
    return null;
  }

  if (!emailParticipant.user_id) {
    await supabaseAdmin
      .from("assessment_participants")
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("id", emailParticipant.id);
  }

  return emailParticipant.id as string;
}

async function getLatestAssessmentSnapshots(userId: string, email: string) {
  const participantId = await findOrAttachParticipant(userId, email);
  const supabaseAdmin = createSupabaseAdminClient();
  const query = supabaseAdmin
    .from("assessment_snapshots")
    .select("assessment_type,created_at,source,source_submitted_at")
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data } = participantId
    ? await query.eq("participant_id", participantId)
    : await query.eq("user_id", userId);

  return latestByAssessment((data ?? []) as AssessmentSnapshotSummary[]);
}

async function getAdminAssessmentReport(enabled: boolean) {
  if (!enabled) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("assessment_snapshots")
    .select(
      "id,assessment_type,created_at,source,source_submitted_at,assessment_participants(display_name,normalized_email)",
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
  const heatherEmails = participantEmailCandidates("willoughby.h.s@gmail.com");

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
    .select("id,assessment_type,created_at,source,source_submitted_at")
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

export default async function HqPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("school_profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  const snapshots = await getLatestAssessmentSnapshots(
    user.id,
    normalizeEmail(user.email),
  );
  const isAdmin = isAdminEmail(user.email);
  const adminReport = await getAdminAssessmentReport(isAdmin);
  const heatherReport = await getHeatherAssessmentReport(isAdmin);

  const displayName = profile?.full_name ?? user.email ?? "Traveler";
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );

  return (
    <main className="hq-shell">
      <header className="hq-topbar">
        <div>
          <p className="eyebrow">DYDD Headquarters</p>
          <h1>{displayName}</h1>
        </div>
        <form action={signOut}>
          <button className="button secondary" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="hq-hero" aria-label="Journey status">
        <div className="mission-brief">
          <p className="section-label">Current mission</p>
          <h2>Begin the DYDD Journey with Identity.</h2>
          <p>
            This dashboard will gather workbook answers, assessment results,
            artifacts, and companion conversations into one private HQ for each
            client.
          </p>
        </div>
        <div className="companion-brief">
          <span className="pulse-dot" aria-hidden="true" />
          <p className="section-label">Companion panel</p>
          <h3>Guidance is staged, not wide open.</h3>
          <p>
            The first guardrail is simple: the Companion helps interpret stored
            DYDD inputs and asks next-step questions. It does not replace
            pastoral care, counseling, medical care, or God&apos;s voice.
          </p>
        </div>
      </section>

      <section className="hq-grid" aria-label="DYDD HQ dashboard">
        <article className="journey-map">
          <div className="card-heading">
            <p className="section-label">Six-step path</p>
            <h2>Journey map</h2>
          </div>
          <ol>
            {journeySteps.map((step, index) => (
              <li key={step.label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong>
                <em>{step.state}</em>
              </li>
            ))}
          </ol>
        </article>

        <article className="assessment-panel">
          <div className="card-heading">
            <p className="section-label">Assessment access</p>
            <h2>Tools</h2>
          </div>
          <div className="tool-list">
            {assessmentSources.map((source) => (
              <div key={source.slug}>
                <span>{source.label}</span>
                <small>
                  {source.slug === "fruitlife_360"
                    ? "Source known, mirror pending"
                    : "Live source mapped"}
                </small>
              </div>
            ))}
            <div>
              <span>Desire Map</span>
              <small>Waiting for source mapping</small>
            </div>
            <div>
              <span>Story Inventory</span>
              <small>Waiting for source mapping</small>
            </div>
          </div>
        </article>

        <article className="artifact-panel">
          <div className="card-heading">
            <p className="section-label">Artifacts</p>
            <h2>Latest assessment vault</h2>
          </div>
          {snapshots?.length ? (
            <div className="snapshot-list">
              {snapshots.map((snapshot) => (
                <p key={`${snapshot.assessment_type}-${snapshot.created_at}`}>
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
          ) : (
            <p className="empty-state">
              No assessment snapshots are attached yet. DesignID, DesignPD, and
              Spiritual Gifts live sources will feed this area.
            </p>
          )}
        </article>

        <article className="course-panel">
          <div className="card-heading">
            <p className="section-label">Class branch</p>
            <h2>DesignID course</h2>
          </div>
          <p className="panel-copy">
            The GHL course code is now staged as app-native lesson structure:
            {` ${designIdCourse.modules.length} modules and ${lessonCount} lessons.`}
          </p>
          <div className="lesson-rail">
            {designIdCourse.modules.map((module) => (
              <div key={module.slug}>
                <strong>{module.title}</strong>
                <ul>
                  {module.lessons.slice(0, 4).map((lesson) => (
                    <li key={lesson.slug}>
                      <Link href={`/learn/designid-foundations/${lesson.slug}`}>
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link className="button secondary" href="/courses/designid-foundations">
            Open course map
          </Link>
        </article>

        <article className="niche-panel">
          <div className="card-heading">
            <p className="section-label">Niche builder</p>
            <h2>Live synthesis</h2>
          </div>
          <p>
            The niche builder will combine identity, expertise, story, desire,
            gifts, assessment language, and workbook responses into a living
            draft the client can refine with the Companion.
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
    </main>
  );
}

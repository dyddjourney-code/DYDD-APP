import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { assessmentSources } from "@/lib/assessments/sources";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AssessmentSnapshotSummary = {
  assessment_type: string;
  created_at: string;
  source: string | null;
  source_submitted_at: string | null;
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

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function displayDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
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

  const { data: emailParticipant } = await supabaseAdmin
    .from("assessment_participants")
    .select("id,user_id")
    .eq("normalized_email", email)
    .maybeSingle();

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

  const displayName = profile?.full_name ?? user.email ?? "Traveler";

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
                <small>Live source mapped</small>
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
      </section>
    </main>
  );
}

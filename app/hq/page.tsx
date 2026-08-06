import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const journeySteps = [
  { label: "Identity", state: "Ready" },
  { label: "Expertise", state: "Queued" },
  { label: "Story", state: "Queued" },
  { label: "Desire", state: "Queued" },
  { label: "Gifts", state: "Queued" },
  { label: "Niche", state: "Builder" },
];

const assessmentTools = [
  "DesignID",
  "DesignPD",
  "Spiritual Gifts",
  "Desire Map",
  "Story Inventory",
];

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

  const { data: snapshots } = await supabase
    .from("assessment_snapshots")
    .select("assessment_type,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4);

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
            {assessmentTools.map((tool) => (
              <div key={tool}>
                <span>{tool}</span>
                <small>Waiting for source mapping</small>
              </div>
            ))}
          </div>
        </article>

        <article className="artifact-panel">
          <div className="card-heading">
            <p className="section-label">Artifacts</p>
            <h2>Collected inputs</h2>
          </div>
          {snapshots?.length ? (
            <div className="snapshot-list">
              {snapshots.map((snapshot) => (
                <p key={`${snapshot.assessment_type}-${snapshot.created_at}`}>
                  {snapshot.assessment_type}
                </p>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              No assessment snapshots are attached yet. DesignID and DesignPD
              sheet access will feed this area.
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

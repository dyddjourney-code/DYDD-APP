import Link from "next/link";
import {
  getFruitLifeSessionStatus,
  rescindFruitLifeObserverInvite,
  sendFruitLifeReminder,
} from "../actions";
import { FruitLifeSessionAutoRefresh } from "../session-auto-refresh";

type FruitLifeStatusPageProps = {
  searchParams?: Promise<{
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";

function displayDate(value: string | null | undefined) {
  if (!value) return "Waiting";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function titleize(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "waiting";
}

export default async function FruitLifeStatusPage({
  searchParams,
}: FruitLifeStatusPageProps) {
  const params = await searchParams;
  const status = params?.session && params?.token
    ? await getFruitLifeSessionStatus(params.session, params.token)
    : null;

  if (!status) {
    return (
      <main className="fruitlife-shell fruitlife-public">
        <section className="fruitlife-hero compact">
          <p className="section-label">FruitLife 360</p>
          <h1>Status link not found.</h1>
          <p className="lede">This session link is missing, expired, or no longer valid.</p>
          <Link className="button secondary" href="/fruitlife360">
            Start a new session
          </Link>
        </section>
      </main>
    );
  }

  const { artifacts, canManage, invites, responses, session, token } = status;
  const selfResponse = responses.find((response: any) => response.response_type === "self");
  const completedObservers = invites.filter((invite) => invite.invite_status === "completed").length;
  const activeInvites = invites.filter((invite) => invite.invite_status !== "expired");
  const requiredCount = 1 + Math.max(0, Number(session.observer_goal ?? 0));
  const completedCount = (session.self_completed_at ? 1 : 0) + completedObservers;
  const progress = Math.min(100, Math.round((completedCount / Math.max(1, requiredCount)) * 100));
  const reportArtifact = artifacts.find(
    (artifact: any) => artifact.artifact_type === "pdf" && artifact.artifact_status === "ready",
  );
  const shouldRefresh = !["report_ready", "report_sent", "completed", "sent"].includes(
    session.session_status,
  );

  return (
    <main className="fruitlife-shell fruitlife-public">
      <FruitLifeSessionAutoRefresh enabled={shouldRefresh} />
      <section className="fruitlife-hero compact">
        <p className="section-label">FruitLife 360 Status</p>
        <h1>{session.participant_name ?? "FruitLife participant"}</h1>
        <p className="lede">
          Track self reflection, observer invitations, reminders, and report readiness.
        </p>
        {params?.message ? <p className="form-message">{params.message}</p> : null}
      </section>

      <section className="fruitlife-status-console fruitlife-status-page-card">
        <div className="fruitlife-session-summary">
          <p className="section-label">Session progress</p>
          <strong>{completedCount} of {requiredCount}</strong>
          <small>
            {titleize(session.session_status)} · report {titleize(session.report_status)}
          </small>
        </div>
        <div className="fruitlife-progress-meter" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="fruitlife-kpis">
          <p>
            <span>{session.self_completed_at ? "Submitted" : "Waiting"}</span>
            <small>Self</small>
          </p>
          <p>
            <span>{completedObservers}/{session.observer_goal}</span>
            <small>Observers</small>
          </p>
          <p>
            <span>{reportArtifact?.external_url ? "Ready" : titleize(session.report_status)}</span>
            <small>Report</small>
          </p>
        </div>
        <div className="fruitlife-latest-actions">
          {reportArtifact?.external_url ? (
            <Link href={reportArtifact.external_url}>Open report</Link>
          ) : null}
          {canManage ? (
            <form action={sendFruitLifeReminder}>
              <input name="session_id" type="hidden" value={session.id} />
              <input
                name="return_to"
                type="hidden"
                value={`/fruitlife360/status?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(token)}`}
              />
              <button type="submit">Send reminders</button>
            </form>
          ) : null}
          <Link href="/hq">Open HQ</Link>
        </div>
      </section>

      <section className="fruitlife-panel fruitlife-roster-panel">
        <p className="section-label">People</p>
        <h2>Self and observers</h2>
        <div className="fruitlife-status-roster">
          <article>
            <div>
              <strong>{session.participant_name ?? "Participant"}</strong>
              <small>{session.participant_email ?? "No email"}</small>
            </div>
            <span>{selfResponse ? "submitted" : "waiting"}</span>
            <small>{displayDate(session.self_completed_at)}</small>
          </article>
          {activeInvites.map((invite) => (
            <article key={invite.id}>
              <div>
                <strong>{invite.observer_name || "Observer"}</strong>
                <small>{invite.observer_email ?? "No email"}</small>
                <small>{invite.relationship_label ?? "Relationship not set"}</small>
              </div>
              <span>{titleize(invite.invite_status)}</span>
              <small>{displayDate(invite.completed_at)}</small>
              {canManage && invite.invite_status !== "completed" ? (
                <form action={rescindFruitLifeObserverInvite}>
                  <input name="session_id" type="hidden" value={session.id} />
                  <input name="token" type="hidden" value={token} />
                  <input name="invite_id" type="hidden" value={invite.id} />
                  <input
                    name="return_to"
                    type="hidden"
                    value={`/fruitlife360/status?session=${encodeURIComponent(session.id)}&token=${encodeURIComponent(token)}`}
                  />
                  <button type="submit">Rescind</button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="fruitlife-panel fruitlife-roster-panel">
        <p className="section-label">Artifacts</p>
        <h2>Report and workflow record</h2>
        {artifacts.length ? (
          <div className="fruitlife-artifact-roster">
            {artifacts.slice(0, 8).map((artifact: any) => (
              <article key={`${artifact.artifact_type}-${artifact.created_at}`}>
                <div>
                  <strong>{titleize(artifact.artifact_type)}</strong>
                  <small>{artifact.filename ?? artifact.provider}</small>
                </div>
                <span>{titleize(artifact.artifact_status)}</span>
                {artifact.external_url ? <Link href={artifact.external_url}>Open</Link> : null}
              </article>
            ))}
          </div>
        ) : (
          <p>No report artifacts have been created yet.</p>
        )}
      </section>
    </main>
  );
}

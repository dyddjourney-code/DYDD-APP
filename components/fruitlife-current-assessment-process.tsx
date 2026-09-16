import Link from "next/link";
import {
  rescindFruitLifeObserverInvite,
  sendFruitLifeReminder,
} from "@/app/fruitlife360/actions";
import { FruitLifeSessionAutoRefresh } from "@/app/fruitlife360/session-auto-refresh";
import { displayDate } from "@/lib/assessments/student-context";
import {
  fruitLifeIsActive,
  fruitLifePayloadArtifact,
  fruitLifeReportArtifact,
  fruitLifeReportHref,
  fruitLifeVisibleInvites,
  getFruitLifeCompletion,
  titleizeFruitLifeStatus,
  type FruitLifeDashboardSession,
} from "@/lib/fruitlife360/dashboard";

type FruitLifeCurrentAssessmentProcessProps = {
  created?: boolean;
  returnTo?: string;
  session: FruitLifeDashboardSession | null;
  token: string;
};

export function FruitLifeCurrentAssessmentProcess({
  created = false,
  returnTo: returnToPath,
  session,
  token,
}: FruitLifeCurrentAssessmentProcessProps) {
  if (!session || !fruitLifeIsActive(session)) {
    return null;
  }

  const completion = getFruitLifeCompletion(session);
  const progress = Math.min(
    100,
    Math.round((completion.completed / Math.max(1, completion.required)) * 100),
  );
  const reportArtifact = fruitLifeReportArtifact(session);
  const payloadArtifact = fruitLifePayloadArtifact(session);
  const visibleInvites = fruitLifeVisibleInvites(session);
  const completedObservers = visibleInvites.filter(
    (invite) => invite.invite_status === "completed",
  ).length;
  const pendingInvites = visibleInvites.filter((invite) => invite.invite_status !== "completed");
  const canSendReminders = Boolean(
    (session.metadata?.selfLink && !session.self_completed_at) || pendingInvites.length,
  );
  const returnTo =
    returnToPath ??
    `/field-kit?fruitlife_session=${encodeURIComponent(session.id)}${
      token ? `&fruitlife_token=${encodeURIComponent(token)}` : ""
    }#current-assessment-process`;

  return (
    <section
      className="fieldkit-current-process"
      id="current-assessment-process"
      aria-label="Current assessment process"
    >
      <FruitLifeSessionAutoRefresh enabled />
      <div className="card-heading">
        <p className="section-label">Active assessment</p>
        <h2>Current assessment process</h2>
        <p>
          FruitLife 360 is collecting the self reflection and observer feedback before the
          finished report moves into Artifacts.
        </p>
      </div>
      {created ? (
        <p className="journey-save-notice">
          FruitLife 360 started. The assessment tracker is active.
        </p>
      ) : null}
      <div className="fruitlife-control-grid">
        <article className="fruitlife-status-console">
          <div className="fruitlife-session-summary">
            <p className="section-label">FruitLife 360</p>
            <strong>
              {completion.completed} of {completion.required}
            </strong>
            <small>
              {titleizeFruitLifeStatus(session.session_status)} · report{" "}
              {titleizeFruitLifeStatus(session.report_status)}
            </small>
          </div>
          <div className="fruitlife-progress-meter" aria-label={`${progress}% complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="fruitlife-kpis">
            <p>
              <span>{session.self_completed_at ? "Complete" : "Waiting"}</span>
              <small>Self</small>
            </p>
            <p>
              <span>
                {session.observer_goal > 0 ? `${completedObservers}/${session.observer_goal}` : "Self"}
              </span>
              <small>Observers</small>
            </p>
            <p>
              <span>
                {reportArtifact?.external_url
                  ? "Ready"
                  : titleizeFruitLifeStatus(session.report_status)}
              </span>
              <small>Report</small>
            </p>
          </div>
          <div className="fruitlife-latest-actions">
            {session.metadata?.selfLink && !session.self_completed_at ? (
              <Link href={session.metadata.selfLink}>Open self link</Link>
            ) : null}
            {reportArtifact?.external_url ? (
              <Link href={fruitLifeReportHref(session)}>Open report</Link>
            ) : null}
            {canSendReminders ? (
              <form action={sendFruitLifeReminder}>
                <input name="session_id" type="hidden" value={session.id} />
                <input name="return_to" type="hidden" value={returnTo} />
                <button type="submit">Send reminders</button>
              </form>
            ) : null}
          </div>
          <p className="fruitlife-latest-note">
            This area refreshes while the assessment is still moving.
          </p>
        </article>

        <div className="fruitlife-session-list fruitlife-control-roster">
          <article>
            <div>
              <strong>{session.participant_name ?? "Participant"}</strong>
              <small>{session.participant_email ?? "No email"}</small>
              <div className="fruitlife-session-meta">
                <span>Self</span>
                <span>{displayDate(session.self_completed_at ?? session.created_at)}</span>
              </div>
            </div>
            <span>{session.self_completed_at ? "Complete" : "Waiting"}</span>
          </article>
          {visibleInvites.length === 0 ? (
            <article>
              <div>
                <strong>No observers</strong>
                <small>This session is set up as a self-assessment.</small>
                <div className="fruitlife-session-meta">
                  <span>Self-only</span>
                  <span>{displayDate(session.created_at)}</span>
                </div>
              </div>
              <span>Not needed</span>
            </article>
          ) : null}
          {visibleInvites.map((invite) => (
            <article key={invite.id}>
              <div>
                <strong>{invite.observer_name || "Observer"}</strong>
                <small>{invite.observer_email ?? "No email"}</small>
                <div className="fruitlife-session-meta">
                  <span>{invite.relationship_label ?? "Observer"}</span>
                  <span>{displayDate(invite.completed_at ?? session.created_at)}</span>
                </div>
              </div>
              <span>{titleizeFruitLifeStatus(invite.invite_status)}</span>
              {invite.invite_status !== "completed" && token ? (
                <form action={rescindFruitLifeObserverInvite}>
                  <input name="session_id" type="hidden" value={session.id} />
                  <input name="token" type="hidden" value={token} />
                  <input name="invite_id" type="hidden" value={invite.id} />
                  <input name="return_to" type="hidden" value={returnTo} />
                  <button type="submit">Cancel invite</button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      </div>
      <div className="fruitlife-inline-status-detail">
        <p>
          <strong>Status detail:</strong>{" "}
          {session.self_completed_at ? "Self reflection submitted." : "Waiting for self reflection."}{" "}
          {session.observer_goal > 0
            ? `${completedObservers} of ${session.observer_goal} observer responses submitted.`
            : "No observer responses are required for this self-assessment."}{" "}
          Report status: {titleizeFruitLifeStatus(session.report_status)}.
        </p>
        {payloadArtifact && !reportArtifact?.external_url ? (
          <p>The report is being generated. The PDF artifact will appear here when it is ready.</p>
        ) : null}
      </div>
    </section>
  );
}

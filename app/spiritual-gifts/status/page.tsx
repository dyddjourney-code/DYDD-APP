import Link from "next/link";
import { spiritualGifts } from "@/lib/spiritual-gifts/intake";
import { getSpiritualGiftsSessionStatus } from "../actions";

type SpiritualGiftsStatusPageProps = {
  searchParams?: Promise<{
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";

function titleize(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "not started";
}

function displayDate(value: string | null | undefined) {
  if (!value) return "Waiting";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function getSpiritualGiftByKey(key: string) {
  return spiritualGifts.find((gift) => gift.key === key);
}

export default async function SpiritualGiftsStatusPage({ searchParams }: SpiritualGiftsStatusPageProps) {
  const params = await searchParams;
  const status = params?.session && params?.token
    ? await getSpiritualGiftsSessionStatus(params.session, params.token)
    : null;

  if (!status) {
    return (
      <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
        <section className="fruitlife-hero compact">
          <p className="section-label">Spiritual Gifts</p>
          <h1>Status link not found.</h1>
          <p className="lede">This session link is missing, expired, or no longer valid.</p>
          <Link className="button secondary" href="/spiritual-gifts">
            Start a new session
          </Link>
        </section>
      </main>
    );
  }

  const { responses, session, token } = status;
  const response = responses[0] as any;
  const topGifts = (response?.derived_scores?.topGifts ?? []) as Array<{
    definition: string;
    key: string;
    label: string;
    rank: number;
    score: number;
    scriptures: string;
  }>;
  const selfLink = typeof session.metadata?.selfLink === "string" ? session.metadata.selfLink : "";
  const progress = session.submitted_at ? 100 : 50;

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
      <section className="fruitlife-hero compact">
        <p className="section-label">Spiritual Gifts Status</p>
        <h1>{session.participant_name ?? "Spiritual Gifts participant"}</h1>
        <p className="lede">
          Track the app-owned Spiritual Gifts assessment session and review the first native result.
        </p>
        {params?.message ? <p className="form-message">{params.message}</p> : null}
      </section>

      <section className="fruitlife-status-console fruitlife-status-page-card">
        <div className="fruitlife-session-summary">
          <p className="section-label">Session progress</p>
          <strong>{session.submitted_at ? "Result ready" : "Waiting for self"}</strong>
          <small>
            {titleize(session.session_status)} · report {titleize(session.report_status)}
          </small>
        </div>
        <div className="fruitlife-progress-meter" aria-label={`${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="fruitlife-kpis">
          <p>
            <span>{session.submitted_at ? "Submitted" : "Waiting"}</span>
            <small>Self</small>
          </p>
          <p>
            <span>{topGifts.length ? topGifts[0]?.label : "Pending"}</span>
            <small>Top gift</small>
          </p>
          <p>
            <span>{session.result_snapshot_id ? "Saved" : "Local result"}</span>
            <small>Snapshot</small>
          </p>
        </div>
        <div className="fruitlife-latest-actions">
          {!session.submitted_at && selfLink ? <Link href={selfLink}>Open self assessment</Link> : null}
          <Link href="/field-kit">Open Field Kit</Link>
          <Link href="/courses/spiritual-gifts-service">Open course</Link>
        </div>
      </section>

      <section className="spiritual-gifts-panel spiritual-gifts-results-panel">
        <p className="section-label">Top 5 Gifts</p>
        <h2>First app-native result</h2>
        {topGifts.length ? (
          <div className="spiritual-gifts-result-list">
            {topGifts.map((gift) => {
              const sourceGift = getSpiritualGiftByKey(gift.key);

              return (
                <article key={gift.key}>
                  <div>
                    <span>{gift.rank}</span>
                    <div>
                      <strong>{gift.label}</strong>
                      <small>{gift.scriptures}</small>
                    </div>
                  </div>
                  <meter max={5} min={1} value={gift.score} />
                  <p>{gift.definition}</p>
                  {sourceGift ? (
                    <div className="spiritual-gift-reflections compact">
                      {Object.entries(sourceGift.reflections).map(([reflection, text]) => (
                        <p key={reflection}>
                          <strong>{reflection}</strong>
                          <span>{text}</span>
                        </p>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p>
            The result will appear here after the self assessment is submitted. This is separate from
            the current live Spiritual Gifts report process.
          </p>
        )}
      </section>

      <section className="fruitlife-panel fruitlife-roster-panel">
        <p className="section-label">Session Record</p>
        <h2>App-owned channel</h2>
        <div className="fruitlife-status-roster">
          <article>
            <div>
              <strong>{session.participant_name ?? "Participant"}</strong>
              <small>{session.participant_email ?? "No email"}</small>
            </div>
            <span>{session.submitted_at ? "submitted" : "waiting"}</span>
            <small>{displayDate(session.submitted_at ?? session.created_at)}</small>
          </article>
        </div>
        <p className="fruitlife-latest-note">
          Source: native app channel. Live-facing Spiritual Gifts automations remain separate.
        </p>
      </section>
    </main>
  );
}

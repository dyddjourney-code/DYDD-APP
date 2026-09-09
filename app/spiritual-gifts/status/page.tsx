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
    percent: number;
    rank: number;
    reportBlurb?: string;
    score: number;
    scriptures: string;
    tier?: number;
    tiedAtScore?: boolean;
  }>;
  const rankedGifts = (response?.derived_scores?.rankedGifts ?? topGifts) as typeof topGifts;
  const deepDiveSource = (response?.derived_scores?.rankedGifts ?? topGifts) as Array<
    (typeof topGifts)[number] & {
      maturity?: {
        anchorScripture?: string;
        description?: string;
        growthAreas?: string;
        signsOfImmaturity?: string;
        stepsToGrow?: string;
      };
    }
  >;
  const deepDiveGifts = deepDiveSource.slice(0, 3);
  const tieSummary = response?.derived_scores?.tieSummary as
    | {
        cleanTopThree?: boolean;
        tiedAtTopFiveCutoff?: boolean;
        topFiveWouldOmitTiedGifts?: boolean;
        topTierCount?: number;
      }
    | undefined;
  const selfLink = typeof session.metadata?.selfLink === "string" ? session.metadata.selfLink : "";
  const progress = session.submitted_at ? 100 : 50;

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
      <section className="fruitlife-hero compact spiritual-gifts-status-hero">
        <div>
          <p className="section-label">Spiritual Gifts</p>
          <h1>{session.submitted_at ? "Your results are ready." : "Your assessment is waiting."}</h1>
          <p className="spiritual-gifts-result-owner">
            {session.participant_name ?? "Participant"}
            {session.participant_email ? ` · ${session.participant_email}` : ""}
          </p>
        </div>
        <p className="lede">
          This is an early app-based result. Use it as a starting point for prayer,
          service, and confirmation from people who know your fruit.
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
          {session.submitted_at ? (
            <Link href="/courses/spiritual-gifts-service">Open course</Link>
          ) : (
            <span>Course available after assessment</span>
          )}
        </div>
      </section>

      <section className="spiritual-gifts-panel spiritual-gifts-results-panel">
        <p className="section-label">Result</p>
        <h2>Your strongest gift patterns</h2>
        {topGifts.length ? (
          <>
            <div className="spiritual-gifts-report-note">
              <strong>
                {tieSummary?.topTierCount && tieSummary.topTierCount > 1
                  ? `${tieSummary.topTierCount} gifts share the top score.`
                  : "Your strongest gift emerged with the highest score."}
              </strong>
              <span>
                Use this as a first point of exploration. Spiritual gifts are best confirmed
                through prayer, actual fruit, and trusted people who have seen your life in motion.
              </span>
            </div>

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
                    <meter max={15} min={3} value={gift.score} />
                    <p>{gift.reportBlurb ?? gift.definition}</p>
                    <small>
                      Score {gift.score}/15 · {gift.percent}% strength
                      {gift.tiedAtScore ? " · tied score" : ""}
                    </small>
                    {sourceGift && gift.rank <= 3 ? (
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
          </>
        ) : (
          <p>
            The result will appear here after the self assessment is submitted. This is separate from
            the current live Spiritual Gifts report process.
          </p>
        )}
      </section>

      {deepDiveGifts.length ? (
        <section className="spiritual-gifts-panel spiritual-gifts-deep-dives">
          <p className="section-label">Explore First</p>
          <h2>Start with these three</h2>
          <p>
            These are not labels to wear. They are the first places to look for repeated grace,
            service fruit, and confirmation from trusted people.
          </p>
          {tieSummary?.topTierCount && tieSummary.topTierCount > 3 ? (
            <div className="spiritual-gifts-report-note warning">
              <strong>Large top-tier tie detected.</strong>
              <span>
                These deep dives are provisional because more than three gifts share the top score.
                A guided follow-up conversation should decide which gifts deserve deeper attention.
              </span>
            </div>
          ) : null}
          <div className="spiritual-gifts-deep-list">
            {deepDiveGifts.map((gift) => (
              <article key={gift.key}>
                <div>
                  <span>{gift.rank}</span>
                  <div>
                    <h3>{gift.label}</h3>
                    <small>{gift.maturity?.anchorScripture ?? gift.scriptures}</small>
                  </div>
                </div>
                <p>{gift.maturity?.description ?? gift.definition}</p>
                <div className="spiritual-gifts-growth-grid">
                  <p>
                    <strong>Growth areas</strong>
                    <span>{gift.maturity?.growthAreas ?? "Review with a trusted leader or mentor."}</span>
                  </p>
                  <p>
                    <strong>Watch for</strong>
                    <span>{gift.maturity?.signsOfImmaturity ?? "Overstatement, pressure, or self-definition without fruit."}</span>
                  </p>
                  <p>
                    <strong>Next steps</strong>
                    <span>{gift.maturity?.stepsToGrow ?? "Pray, serve, ask others what fruit they see, and test this humbly."}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {rankedGifts.length > 5 ? (
        <section className="spiritual-gifts-panel spiritual-gifts-ranked-list">
          <p className="section-label">Full List</p>
          <h2>All gifts in current order</h2>
          <div>
            {rankedGifts.map((gift) => (
              <p key={gift.key}>
                <span>{gift.rank}</span>
                <strong>{gift.label}</strong>
                <small>
                  {gift.score}/15 · {gift.percent}%{gift.tiedAtScore ? " · tied" : ""}
                </small>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="fruitlife-panel fruitlife-roster-panel">
        <p className="section-label">Session Record</p>
        <h2>Saved in the DYDD app</h2>
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

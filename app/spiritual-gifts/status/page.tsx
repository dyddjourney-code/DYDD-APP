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

function getSpiritualGiftByKey(key: string) {
  return spiritualGifts.find((gift) => gift.key === key);
}

const reflectionClasses: Record<string, string> = {
  Architect: "architect",
  Artisan: "artisan",
  Shepherd: "shepherd",
  Steward: "steward",
};

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
    reflections?: Record<string, string>;
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
  const channel = typeof session.metadata?.channel === "string" ? session.metadata.channel : "public_assessment";
  const isAppChannel = channel === "native_app";
  const topFiveCutoff = topGifts[4]?.score ?? null;
  const omittedTiedGifts =
    topFiveCutoff === null
      ? []
      : rankedGifts.filter((gift) => gift.rank > 5 && gift.score === topFiveCutoff);

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
      <section className="fruitlife-hero compact spiritual-gifts-status-hero">
        <div>
          <p className="section-label">Spiritual Gifts</p>
          <h1>{session.submitted_at ? "Your Spiritual Gifts results." : "Your assessment is waiting."}</h1>
          <p className="spiritual-gifts-result-owner">
            {session.participant_name ?? "Participant"}
            {session.participant_email ? ` · ${session.participant_email}` : ""}
          </p>
        </div>
        <p className="lede">
          Use these results as a starting point for prayer, service, and confirmation from
          people who have seen the fruit of your life.
        </p>
        {params?.message ? <p className="form-message">{params.message}</p> : null}
      </section>

      {!session.submitted_at && selfLink ? (
        <section className="spiritual-gifts-panel spiritual-gifts-result-cta">
          <p className="section-label">Continue</p>
          <h2>Your assessment is waiting.</h2>
          <p>Open the assessment link to complete your Spiritual Gifts responses.</p>
          <Link className="button primary" href={selfLink}>Open assessment</Link>
        </section>
      ) : null}

      <section className="spiritual-gifts-panel spiritual-gifts-results-panel">
        <p className="section-label">Result</p>
        <h2>Your Top 5 Spiritual Gifts</h2>
        {topGifts.length ? (
          <>
            <div className="spiritual-gifts-report-note">
              <strong>
                {omittedTiedGifts.length
                  ? "Several gifts share the fifth-place score."
                  : tieSummary?.topTierCount && tieSummary.topTierCount > 1
                    ? `${tieSummary.topTierCount} gifts share the top score.`
                    : "These five gifts rose to the top of your responses."}
              </strong>
              <span>
                Spiritual gifts are best confirmed through prayer, actual service fruit,
                and trusted people who have seen your life in motion.
                {omittedTiedGifts.length
                  ? ` ${omittedTiedGifts.map((gift) => gift.label).join(", ")} also tied at ${topFiveCutoff}/15.`
                  : ""}
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
                    {sourceGift ? (
                      <div className="spiritual-gift-reflections compact">
                        {Object.entries(sourceGift.reflections).map(([reflection, text]) => (
                          <p
                            className={`reflection-${reflectionClasses[reflection] ?? "default"}`}
                            key={reflection}
                          >
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
            <div className="spiritual-gifts-design-note">
              <h3>What were the Architect, Artisan, Shepherd, and Steward boxes?</h3>
              <p>
                Those short notes show how each Spiritual Gift may connect with the four DesignID
                reflections. They are not the main result. They are simple clues for how the same
                gift may express itself differently through identity, care, creativity, or stewardship.
              </p>
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

      {session.submitted_at ? (
        <section className="spiritual-gifts-panel spiritual-gifts-result-cta">
          <p className="section-label">{isAppChannel ? "Next Step" : "Invitation"}</p>
          <h2>
            {isAppChannel
              ? "Continue into the Spiritual Gifts course."
              : "Your Spiritual Gifts course is waiting inside DYDD."}
          </h2>
          <p>
            {isAppChannel
              ? "Because this result is connected to your account, the course can use your saved score as you work through the Trailhead."
              : "Create or sign into your Discover Your Divine Design account with this same email, then go to Trailheads and open the Spiritual Gifts course. The course is designed to help you explore these gifts with service, humility, and confirmation."}
          </p>
          <div className="spiritual-gifts-cta-actions">
            {isAppChannel ? (
              <>
                <Link className="button primary" href="/courses/spiritual-gifts-service">Open course</Link>
                <Link className="button secondary" href="/field-kit">Open Field Kit</Link>
              </>
            ) : (
              <>
                <Link className="button primary" href="/login">Create or sign into DYDD</Link>
                <Link className="button secondary" href="/trailheads#spiritual-gifts">View Spiritual Gifts Trailhead</Link>
              </>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}

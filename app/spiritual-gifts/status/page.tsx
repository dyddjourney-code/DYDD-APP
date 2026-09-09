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

type SpiritualGiftResult = {
  definition: string;
  key: string;
  label: string;
  maturity?: {
    anchorScripture?: string;
    description?: string;
    growthAreas?: string;
    signsOfImmaturity?: string;
    stepsToGrow?: string;
  };
  percent: number;
  rank: number;
  reflections?: Record<string, string>;
  reportBlurb?: string;
  score: number;
  scriptures: string;
  tier?: number;
  tiedAtScore?: boolean;
};

function splitReportList(value?: string) {
  return (value ?? "")
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function valueForGift(
  gift: SpiritualGiftResult,
  sourceGift: ReturnType<typeof getSpiritualGiftByKey>,
  key: "definition" | "reportBlurb" | "scriptures",
) {
  return sourceGift?.[key] ?? gift[key];
}

function maturityForGift(gift: SpiritualGiftResult) {
  return gift.maturity ?? getSpiritualGiftByKey(gift.key)?.maturity;
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
  const topGifts = (response?.derived_scores?.topGifts ?? []) as SpiritualGiftResult[];
  const rankedGifts = (response?.derived_scores?.rankedGifts ?? topGifts) as typeof topGifts;
  const savedDeepDiveGifts = (response?.derived_scores?.deepDiveGifts ?? []) as SpiritualGiftResult[];
  const deepDiveSource = savedDeepDiveGifts.length >= 3 ? savedDeepDiveGifts : rankedGifts;
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
  const shellClassName = [
    "fruitlife-shell",
    isAppChannel ? "spiritual-gifts-app-report" : "fruitlife-public",
    "spiritual-gifts-shell",
    "spiritual-gifts-report-page",
  ].join(" ");
  const topFiveCutoff = topGifts[4]?.score ?? null;
  const omittedTiedGifts =
    topFiveCutoff === null
      ? []
      : rankedGifts.filter((gift) => gift.rank > 5 && gift.score === topFiveCutoff);

  return (
    <main className={shellClassName}>
      <section className="spiritual-gifts-report-cover">
        <div className="spiritual-gifts-report-titlebar">
          <div>
            <p className="section-label">Spiritual Gifts</p>
            <h1>
              {session.submitted_at
                ? "Spiritual Gifts Assessment Report"
                : "Your assessment is waiting"}
            </h1>
            <dl className="spiritual-gifts-report-identity">
              <div>
                <dt>Name</dt>
                <dd>{session.participant_name ?? "Participant"}</dd>
              </div>
              {session.participant_email ? (
                <div>
                  <dt>Email</dt>
                  <dd>{session.participant_email}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        </div>

        <div className="spiritual-gifts-welcome-panel">
          <h2>Welcome to Your Spiritual Gifts Assessment Report</h2>
          <p>
            Thank you for taking the time to explore how God has uniquely equipped you
            to serve His Kingdom. Your design is not accidental, and your gifts have
            purpose, meaning, and eternal significance.
          </p>
          <p>
            Our prayer is that this report encourages you, helps clarify your calling,
            and helps you step confidently into the good works God has prepared for you.
          </p>
          <blockquote>
            Now to each one the manifestation of the Spirit is given for the common good.
            <cite>1 Corinthians 12:7</cite>
          </blockquote>
        </div>
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
        <p className="section-label">Top Results</p>
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
                const definition = valueForGift(gift, sourceGift, "definition");
                const howItShowsUp = valueForGift(gift, sourceGift, "reportBlurb");
                const scriptures = valueForGift(gift, sourceGift, "scriptures");
                const reflections = sourceGift?.reflections ?? gift.reflections;

                return (
                  <article key={gift.key}>
                    <div className="spiritual-gifts-result-heading">
                      <span>{gift.rank}</span>
                      <div>
                        <strong>{gift.label}</strong>
                        <small>
                          Score {gift.score}/15
                          {gift.tiedAtScore ? " - tied score" : ""}
                        </small>
                      </div>
                    </div>
                    <meter max={15} min={3} value={gift.score} />
                    <div className="spiritual-gifts-result-copy-grid">
                      <p>
                        <strong>Definition</strong>
                        <span>{definition}</span>
                      </p>
                      <p>
                        <strong>Scripture references</strong>
                        <span>{scriptures}</span>
                      </p>
                      <p className="wide">
                        <strong>How it shows up</strong>
                        <span>{howItShowsUp}</span>
                      </p>
                    </div>
                    {reflections ? (
                      <div className="spiritual-gift-reflections compact">
                        {Object.entries(reflections).map(([reflection, text]) => (
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
          <p className="section-label">Deep Dive</p>
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
            {deepDiveGifts.map((gift) => {
              const maturity = maturityForGift(gift);
              const growthAreas = splitReportList(maturity?.growthAreas);
              const signsOfImmaturity = splitReportList(maturity?.signsOfImmaturity);
              const stepsToGrow = splitReportList(maturity?.stepsToGrow);

              return (
                <article key={gift.key}>
                  <div className="spiritual-gifts-deep-heading">
                    <span>{gift.rank}</span>
                    <div>
                      <h3>Deep Dive: {gift.label}</h3>
                      <small>{maturity?.anchorScripture ?? gift.scriptures}</small>
                    </div>
                  </div>
                  <div className="spiritual-gifts-growth-grid">
                    <p>
                      <strong>Maturity overview</strong>
                      <span>{maturity?.description ?? gift.definition}</span>
                    </p>
                    <p>
                      <strong>Growth areas</strong>
                      <span>{growthAreas.length ? growthAreas.join(", ") : "Review with a trusted leader or mentor."}</span>
                    </p>
                    <p>
                      <strong>Signs of immaturity</strong>
                      <span>{signsOfImmaturity.length ? signsOfImmaturity.join(", ") : "Overstatement, pressure, or self-definition without fruit."}</span>
                    </p>
                    <p>
                      <strong>Steps to grow</strong>
                      <span>{stepsToGrow.length ? stepsToGrow.join(", ") : "Pray, serve, ask others what fruit they see, and test this humbly."}</span>
                    </p>
                  </div>
                </article>
              );
            })}
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

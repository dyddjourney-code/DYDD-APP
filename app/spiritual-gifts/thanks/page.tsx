import Link from "next/link";
import { getSpiritualGiftsSessionStatus } from "../actions";

const configuredJourneyHref = process.env.NEXT_PUBLIC_DYDD_JOURNEY_URL?.trim();
const publicJourneyHref = configuredJourneyHref && configuredJourneyHref !== "https://www.discoverdivine.design/"
  ? configuredJourneyHref
  : "https://www.discoverdivine.design/discover-your-divine-design-journey";

type SpiritualGiftsThanksPageProps = {
  searchParams?: Promise<{
    channel?: string;
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsThanksPage({ searchParams }: SpiritualGiftsThanksPageProps) {
  const params = await searchParams;
  const status = params?.session && params?.token
    ? await getSpiritualGiftsSessionStatus(params.session, params.token)
    : null;
  const channel = typeof status?.session.metadata?.channel === "string"
    ? status.session.metadata.channel
    : params?.channel;
  const isAppChannel = channel === "native_app" || channel === "app";

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell spiritual-gifts-thanks-shell">
      <section className="spiritual-gifts-thanks-card">
        <div className="spiritual-gifts-thanks-brand">
          <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        </div>
        <div className="spiritual-gifts-thanks-copy">
          <p className="section-label">Assessment submitted</p>
          <h1>{isAppChannel ? "Your Spiritual Gifts assessment is saved." : "Check your email for your PDF report."}</h1>
          <p>
            {isAppChannel
              ? "Your Spiritual Gifts assessment is connected to this DYDD account. Open Spiritual Gifts in Field Kit to review your Snapshot and available PDF report."
              : params?.message ??
                "Your Spiritual Gifts assessment has been submitted. Your PDF report is being delivered to the email address you provided."}
          </p>
        </div>
        {!isAppChannel ? (
          <div className="spiritual-gifts-thanks-cta">
            <p className="section-label">Keep exploring</p>
            <h2>Explore the Discover Your Divine Design journey.</h2>
            <p>
              Spiritual gifts are one piece of a larger path for recognizing how God has shaped your life
              for purpose, service, and faithful action.
            </p>
            <Link className="button primary" href={publicJourneyHref}>
              Explore the journey
            </Link>
          </div>
        ) : null}
        {isAppChannel ? (
          <div className="spiritual-gifts-thanks-actions">
            <Link className="button primary" href="/field-kit#collection-spiritual-gifts">
              Back to Spiritual Gifts in Field Kit
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

import Link from "next/link";
import { getSpiritualGiftsSessionStatus } from "../actions";

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
  const statusHref = params?.session && params?.token
    ? `/spiritual-gifts/status?session=${encodeURIComponent(params.session)}&token=${encodeURIComponent(params.token)}`
    : "/spiritual-gifts";

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell spiritual-gifts-thanks-shell">
      <section className="spiritual-gifts-thanks-card">
        <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        <div className="spiritual-gifts-thanks-copy">
          <p className="section-label">Assessment submitted</p>
          <h1>{isAppChannel ? "Saved to your account." : "Your result is ready."}</h1>
          <p>
            {isAppChannel
              ? "Your Spiritual Gifts assessment is connected to this DYDD account. You can review the result now or return to Field Kit."
              : params?.message ?? "Your Spiritual Gifts assessment has been saved. You can review your result now."}
          </p>
        </div>
        <div className="spiritual-gifts-thanks-actions">
          <Link className="button primary" href={statusHref}>
            View results
          </Link>
          {isAppChannel ? (
            <Link className="button secondary" href="/field-kit">
              Back to Field Kit
            </Link>
          ) : (
            <Link className="button secondary" href="/login">
              Create or sign in
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

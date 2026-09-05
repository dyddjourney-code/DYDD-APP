import Link from "next/link";

type SpiritualGiftsThanksPageProps = {
  searchParams?: Promise<{
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsThanksPage({ searchParams }: SpiritualGiftsThanksPageProps) {
  const params = await searchParams;
  const statusHref = params?.session && params?.token
    ? `/spiritual-gifts/status?session=${encodeURIComponent(params.session)}&token=${encodeURIComponent(params.token)}`
    : "/spiritual-gifts";

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
      <section className="fruitlife-hero compact">
        <p className="section-label">Spiritual Gifts</p>
        <h1>Submitted</h1>
        <p className="lede">
          {params?.message ?? "The Spiritual Gifts native app assessment was saved."}
        </p>
        <div className="action-row">
          <Link className="button secondary" href="/spiritual-gifts">
            Start another session
          </Link>
          <Link className="button secondary" href={statusHref}>
            View result
          </Link>
        </div>
      </section>
    </main>
  );
}

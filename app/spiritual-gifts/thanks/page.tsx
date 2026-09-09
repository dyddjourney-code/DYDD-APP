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
        <h1>Your assessment has been submitted.</h1>
        <p className="lede">
          {params?.message ?? "Your Spiritual Gifts assessment has been saved."}
        </p>
        <p className="lede">
          You can review your result now. You can also create a Discover Your Divine Design account
          with the same email so this result can travel with your learning path.
        </p>
        <div className="action-row">
          <Link className="button primary" href={statusHref}>
            View result
          </Link>
          <Link className="button secondary" href="/login">
            Create or sign in to account
          </Link>
        </div>
      </section>
    </main>
  );
}

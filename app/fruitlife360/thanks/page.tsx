import Link from "next/link";

type FruitLifeThanksPageProps = {
  searchParams?: Promise<{
    message?: string;
    observer?: string;
    self?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FruitLifeThanksPage({
  searchParams,
}: FruitLifeThanksPageProps) {
  const params = await searchParams;
  const statusHref = params?.session && params?.token
    ? `/fruitlife360/status?session=${encodeURIComponent(params.session)}&token=${encodeURIComponent(params.token)}`
    : "/fruitlife360";

  return (
    <main className="fruitlife-shell fruitlife-public">
      <section className="fruitlife-hero compact">
        <p className="section-label">FruitLife 360</p>
        <h1>Submitted</h1>
        <p className="lede">
          {params?.message ?? "The FruitLife 360 native intake step was saved."}
        </p>
        <div className="action-row">
          <Link className="button secondary" href="/fruitlife360">
            Start another session
          </Link>
          <Link className="button secondary" href={statusHref}>
            View session status
          </Link>
        </div>
      </section>
    </main>
  );
}

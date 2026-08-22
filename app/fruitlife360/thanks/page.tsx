import Link from "next/link";

type FruitLifeThanksPageProps = {
  searchParams?: Promise<{
    message?: string;
    observer?: string;
    self?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FruitLifeThanksPage({
  searchParams,
}: FruitLifeThanksPageProps) {
  const params = await searchParams;

  return (
    <main className="fruitlife-shell">
      <section className="fruitlife-hero compact">
        <p className="section-label">FruitLife 360</p>
        <h1>Saved</h1>
        <p className="lede">
          {params?.message ?? "The FruitLife 360 native intake step was saved."}
        </p>
        <div className="action-row">
          <Link className="button secondary" href="/fruitlife360">
            Start another session
          </Link>
          <Link className="button secondary" href="/hq">
            Open HQ
          </Link>
        </div>
      </section>

      {params?.self || params?.observer ? (
        <section className="fruitlife-panel fruitlife-link-panel">
          <p className="section-label">Test Links</p>
          <h2>Native Vercel links</h2>
          {params.self ? (
            <p>
              <span>Self link</span>
              <Link href={params.self}>{params.self}</Link>
            </p>
          ) : null}
          {params.observer ? (
            <p>
              <span>Observer link</span>
              <Link href={params.observer}>{params.observer}</Link>
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

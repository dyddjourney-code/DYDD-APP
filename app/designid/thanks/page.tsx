import Link from "next/link";

type DesignIdThanksPageProps = {
  searchParams?: Promise<{
    snapshot?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DesignIdThanksPage({ searchParams }: DesignIdThanksPageProps) {
  const params = await searchParams;
  const reportHref = params?.snapshot
    ? `/designid/report?snapshot=${encodeURIComponent(params.snapshot)}`
    : "/field-kit";

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designid-logo.webp" alt="DesignID logo" />
        <p className="section-label">Submitted</p>
        <h1>Your DesignID report is being prepared.</h1>
        <p>
          Your assessment has been saved in the app. The report artifact will appear in Field Kit,
          and the report link is sent to your account email when PDFMonkey finishes.
        </p>
        <div className="fieldkit-artifact-actions">
          <Link className="button primary" href={reportHref}>
            Open report
          </Link>
          <Link className="button secondary" href="/field-kit">
            Back to Field Kit
          </Link>
        </div>
      </section>
    </main>
  );
}

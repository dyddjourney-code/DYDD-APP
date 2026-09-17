import Link from "next/link";

type DesignPdThanksPageProps = {
  searchParams?: Promise<{ snapshot?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DesignPdThanksPage({ searchParams }: DesignPdThanksPageProps) {
  const params = await searchParams;
  const reportHref = params?.snapshot
    ? `/designpd/report?snapshot=${encodeURIComponent(params.snapshot)}`
    : "/field-kit";

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell designpd-shell">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
        <p className="section-label">DesignPD submitted</p>
        <h1>Your DesignPD report is being prepared.</h1>
        <p>
          Your Plan, Decide, Do response is saved to your account. If the PDF is
          ready, the report button will open it now; otherwise it will be
          available from Field Kit when generation finishes.
        </p>
        <div className="spiritual-gifts-thanks-actions">
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

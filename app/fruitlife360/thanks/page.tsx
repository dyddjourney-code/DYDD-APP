type FruitLifeThanksPageProps = {
  searchParams?: Promise<{
    message?: string;
    observer?: string;
    return_to?: string;
    self?: string;
    session?: string;
    token?: string;
    type?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function FruitLifeThanksPage({
  searchParams,
}: FruitLifeThanksPageProps) {
  const params = await searchParams;
  const backHref =
    params?.return_to?.startsWith("/") && !params.return_to.startsWith("//")
      ? params.return_to
      : "/field-kit?lane=fruitlife";

  return (
    <main className="fruitlife-shell fruitlife-public">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
        <p className="section-label">Submitted</p>
        <h1>Thank you for completing your FruitLife 360 reflection.</h1>
        <p>
          {params?.message ?? "The FruitLife 360 native intake step was saved."}
        </p>
        <p className="fruitlife-thanks-note">
          Your report has been emailed to you, and your FruitLife 360 progress is saved in the app.
        </p>
        <a className="button primary" href={backHref}>
          Back to FruitLife 360
        </a>
      </section>
    </main>
  );
}

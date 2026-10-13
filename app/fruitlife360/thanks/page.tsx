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
        <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
        <p className="section-label">Submitted</p>
        <h1>Thank you for completing your FruitLife360 reflection.</h1>
        <p>
          {params?.message ?? "The FruitLife360 native intake step was saved."}
        </p>
        <p className="fruitlife-thanks-note">
          Your report has been emailed to you, and your FruitLife360 progress is saved in the app.
        </p>
        <a className="button primary" href={backHref}>
          Back to FruitLife360
        </a>
      </section>
    </main>
  );
}

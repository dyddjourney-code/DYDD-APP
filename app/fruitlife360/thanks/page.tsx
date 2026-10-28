import Link from "next/link";
import { ClearSubmittedFruitLifeDraft } from "../clear-submitted-draft";
import { getFruitLifeSessionStatus } from "../actions";
import { fruitLifeCompletionState } from "../completion-state";
import { FruitLifeSessionAutoRefresh } from "../session-auto-refresh";

export const dynamic = "force-dynamic";
type Props = { searchParams?: Promise<{ session?: string; token?: string; type?: string }> };

export default async function FruitLifeThanksPage({ searchParams }: Props) {
  const params = await searchParams;
  const observer = params?.type === "observer";
  // Observer completion never exposes the participant's report or private tracker.
  const status = !observer && params?.session && params.token
    ? await getFruitLifeSessionStatus(params.session, params.token)
    : null;
  const completion = status ? fruitLifeCompletionState(status) : null;
  const statusHref = status
    ? `/fruitlife360/status?${new URLSearchParams({ session: status.session.id, token: status.token })}`
    : null;

  return (
    <main className="fruitlife-shell fruitlife-public">
      <section className="fruitlife-panel fruitlife-message-card" aria-labelledby="fruitlife-completion-title">
        {params?.session && params.token ? (
          <ClearSubmittedFruitLifeDraft session={params.session} token={params.token} type={observer ? "observer" : "self"} />
        ) : null}
        <FruitLifeSessionAutoRefresh enabled={Boolean(completion?.submitted && !completion.ready)} />
        <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
        <p className="section-label">{observer ? "Reflection received" : "FruitLife360 results"}</p>
        <h1 id="fruitlife-completion-title">
          {observer ? "Thank you for your FruitLife360 reflection." : completion?.heading ?? "Check your FruitLife360 reflection."}
        </h1>
        <p>
          {observer
            ? "Your observer feedback has been saved. Thank you for helping this person reflect and grow. You can close this page."
            : completion?.description ?? "Open your FruitLife360 collection in Field Kit to check your saved assessment and reports."}
        </p>
        {!observer ? (
          <div className="fieldkit-artifact-actions">
            {completion?.ready && status ? (
              <Link className="button primary" href={`/fruitlife360/report?session=${encodeURIComponent(status.session.id)}`} target="_blank" rel="noopener noreferrer" prefetch={false}>
                Open report
              </Link>
            ) : null}
            <Link className={`button ${completion?.ready ? "secondary" : "primary"}`} href="/courses/fruitlife-360-formation">
              Take the course
            </Link>
            {statusHref ? <Link className="button secondary" href={statusHref} prefetch={false}>View session progress</Link> : null}
            <Link className="button secondary" href="/field-kit#collection-fruitlife-360">FruitLife360 in Field Kit</Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

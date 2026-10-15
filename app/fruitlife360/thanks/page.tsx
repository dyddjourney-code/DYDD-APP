import Link from "next/link";
import { ClearSubmittedFruitLifeDraft } from "../clear-submitted-draft";
import { getFruitLifeSessionStatus } from "../actions";
export const dynamic = "force-dynamic";
type Props = { searchParams?: Promise<{ session?: string; token?: string; type?: string }> };
export default async function FruitLifeThanksPage({ searchParams }: Props) {
  const params = await searchParams;
  const observer = params?.type === "observer";
  const status = !observer && params?.session && params.token ? await getFruitLifeSessionStatus(params.session, params.token) : null;
  const ready = status?.artifacts.some((artifact: any) => artifact.artifact_type === "pdf" && artifact.artifact_status === "ready");
  const emailed = status?.artifacts.some((artifact: any) => artifact.artifact_type === "email" && artifact.artifact_status === "sent" && ["sent", "report_sent"].includes(status.session.report_status));
  return <main className="fruitlife-shell fruitlife-public"><section className="fruitlife-panel fruitlife-message-card">
    {params?.session && params.token ? <ClearSubmittedFruitLifeDraft session={params.session} token={params.token} type={observer ? "observer" : "self"} /> : null}
    <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
    <p className="section-label">Reflection received</p>
    <h1>Thank you for your FruitLife360 reflection.</h1>
    <p>{observer ? "Your observer feedback has been saved. Thank you for helping this person reflect and grow. You can close this page." : !status ? "Return to Field Kit to check your saved assessment." : !status.session.self_completed_at ? "Your assessment progress is available in Field Kit." : ready ? `Your report is ready in Field Kit.${emailed ? " It has also been emailed to you." : " Email delivery has not yet been confirmed."}` : status.session.observer_completed_count < status.session.observer_goal ? "Your self reflection is saved. We are waiting for your invited observers before creating your report. You can track progress and send reminders from Field Kit." : "Your self reflection is saved and your report is being prepared. It will appear in Field Kit when ready; we will email you when it is available."}</p>
    {!observer ? <Link className="button primary" href="/field-kit#current-assessment-process">Open Field Kit</Link> : null}
  </section></main>;
}

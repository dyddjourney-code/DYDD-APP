import { FruitLifeAssessmentForm } from "../assessment-form";
import { getFruitLifeSessionStatus, saveFruitLifeSelfResponse } from "../actions";

type FruitLifeSelfPageProps = {
  searchParams?: Promise<{
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export default async function FruitLifeSelfPage({
  searchParams,
}: FruitLifeSelfPageProps) {
  const params = await searchParams;
  const status = params?.session && params?.token
    ? await getFruitLifeSessionStatus(params.session, params.token)
    : null;
  const session = status?.session;

  if (!status || status.session.self_completed_at) {
    return (
      <main className="fruitlife-shell fruitlife-public">
        <section className="fruitlife-panel fruitlife-message-card">
          <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
          <h1>Reflection link unavailable.</h1>
          <p>This reflection link is missing, no longer valid, or already submitted. Return to Field Kit to see your progress.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="fruitlife-shell fruitlife-public">
      <FruitLifeAssessmentForm
        action={saveFruitLifeSelfResponse}
        initialReviewer={
          session
            ? {
                email: session.participant_email ?? "",
                name: session.participant_name ?? "",
                relationship: "Self",
              }
            : undefined
        }
        instrumentVersion={String(session?.metadata?.instrumentVersion ?? "legacy-native-v0")}
        invitationNotice={status.selfInvitationSent
          ? "A link to this same reflection has also been emailed to you. Continue here, or use that link to return before submitting. You only need to complete it once."
          : undefined}
        message={params?.message}
        participantName={session?.participant_name}
        responseType="self"
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

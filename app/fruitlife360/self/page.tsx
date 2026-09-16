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

export default async function FruitLifeSelfPage({
  searchParams,
}: FruitLifeSelfPageProps) {
  const params = await searchParams;
  const status = params?.session && params?.token
    ? await getFruitLifeSessionStatus(params.session, params.token)
    : null;
  const session = status?.session;

  if (params?.session && params?.token && !status) {
    return (
      <main className="fruitlife-shell fruitlife-public">
        <section className="fruitlife-panel fruitlife-message-card">
          <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
          <h1>Self link not found.</h1>
          <p>This self-reflection link is missing, expired, or no longer valid.</p>
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
        message={params?.message}
        participantName={session?.participant_name}
        responseType="self"
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

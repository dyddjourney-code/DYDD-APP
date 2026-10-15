import { FruitLifeAssessmentForm } from "../assessment-form";
import { getFruitLifeObserverContext, saveFruitLifeObserverResponse } from "../actions";

type FruitLifeObserverPageProps = {
  searchParams?: Promise<{
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export default async function FruitLifeObserverPage({
  searchParams,
}: FruitLifeObserverPageProps) {
  const params = await searchParams;
  const context = params?.session && params?.token
    ? await getFruitLifeObserverContext(params.session, params.token)
    : null;

  if (!context) return <main className="fruitlife-shell fruitlife-public"><section className="fruitlife-panel"><h1>Observer link unavailable.</h1><p>This invitation is missing, cancelled, or already completed. Please contact the participant if you need another invitation.</p></section></main>;

  return (
    <main className="fruitlife-shell fruitlife-public">
      <FruitLifeAssessmentForm
        action={saveFruitLifeObserverResponse}
        initialReviewer={context?.reviewer ?? undefined}
        instrumentVersion={context.instrumentVersion}
        message={params?.message}
        participantName={context?.participantName}
        responseType="observer"
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

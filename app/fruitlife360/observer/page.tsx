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

export default async function FruitLifeObserverPage({
  searchParams,
}: FruitLifeObserverPageProps) {
  const params = await searchParams;
  const context = params?.session && params?.token
    ? await getFruitLifeObserverContext(params.session, params.token)
    : null;

  return (
    <main className="fruitlife-shell fruitlife-public">
      <FruitLifeAssessmentForm
        action={saveFruitLifeObserverResponse}
        initialReviewer={context?.reviewer ?? undefined}
        message={params?.message}
        participantName={context?.participantName}
        responseType="observer"
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

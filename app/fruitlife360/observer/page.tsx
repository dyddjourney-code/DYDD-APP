import Link from "next/link";
import { FruitLifeAssessmentForm } from "../assessment-form";
import { saveFruitLifeObserverResponse } from "../actions";

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

  return (
    <main className="fruitlife-shell">
      <nav className="course-nav" aria-label="FruitLife navigation">
        <Link href="/">DYDD School</Link>
      </nav>
      <header className="fruitlife-hero compact">
        <p className="section-label">FruitLife 360</p>
        <h1>Observer Reflection</h1>
        <p className="lede">
          Offer clear encouragement and growth feedback for the participant.
          Your response is stored in the new Vercel/Supabase workflow.
        </p>
      </header>
      <FruitLifeAssessmentForm
        action={saveFruitLifeObserverResponse}
        message={params?.message}
        responseType="observer"
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

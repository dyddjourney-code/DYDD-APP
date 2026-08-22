import Link from "next/link";
import { FruitLifeAssessmentForm } from "../assessment-form";
import { saveFruitLifeSelfResponse } from "../actions";

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

  return (
    <main className="fruitlife-shell">
      <nav className="course-nav" aria-label="FruitLife navigation">
        <Link href="/fruitlife360">FruitLife setup</Link>
      </nav>
      <header className="fruitlife-hero compact">
        <p className="section-label">FruitLife 360</p>
        <h1>Self Reflection</h1>
        <p className="lede">
          This native form writes directly into Supabase and prepares the report
          workflow without touching the old sheet queue.
        </p>
      </header>
      <FruitLifeAssessmentForm
        action={saveFruitLifeSelfResponse}
        message={params?.message}
        responseType="self"
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

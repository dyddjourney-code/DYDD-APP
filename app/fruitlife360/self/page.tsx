import Link from "next/link";
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
        <section className="fruitlife-hero compact">
          <p className="section-label">FruitLife 360</p>
          <h1>Self link not found.</h1>
          <p className="lede">This self-reflection link is missing, expired, or no longer valid.</p>
          <Link className="button secondary" href="/fruitlife360">
            Start a new session
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="fruitlife-shell fruitlife-public">
      <nav className="course-nav fruitlife-public-nav" aria-label="FruitLife navigation">
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

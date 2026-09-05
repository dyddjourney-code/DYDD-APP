import Link from "next/link";
import { SpiritualGiftsAssessmentForm } from "../assessment-form";
import { getSpiritualGiftsSessionStatus, saveSpiritualGiftsSelfResponse } from "../actions";

type SpiritualGiftsSelfPageProps = {
  searchParams?: Promise<{
    message?: string;
    session?: string;
    token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsSelfPage({ searchParams }: SpiritualGiftsSelfPageProps) {
  const params = await searchParams;
  const status = params?.session && params?.token
    ? await getSpiritualGiftsSessionStatus(params.session, params.token)
    : null;
  const session = status?.session;

  if (params?.session && params?.token && !status) {
    return (
      <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
        <section className="fruitlife-hero compact">
          <p className="section-label">Spiritual Gifts</p>
          <h1>Self link not found.</h1>
          <p className="lede">This assessment link is missing, expired, or no longer valid.</p>
          <Link className="button secondary" href="/spiritual-gifts">
            Start a new session
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="fruitlife-shell fruitlife-public spiritual-gifts-shell">
      <nav className="course-nav fruitlife-public-nav" aria-label="Spiritual Gifts navigation">
        <Link href="/spiritual-gifts">Spiritual Gifts setup</Link>
      </nav>
      <header className="fruitlife-hero compact">
        <p className="section-label">Spiritual Gifts</p>
        <h1>Self Assessment</h1>
        <p className="lede">
          This native form saves inside the app and prepares an app-owned result without touching the
          current live-facing Spiritual Gifts process.
        </p>
      </header>
      <SpiritualGiftsAssessmentForm
        action={saveSpiritualGiftsSelfResponse}
        initialReviewer={
          session
            ? {
                email: session.participant_email ?? "",
                name: session.participant_name ?? "",
              }
            : undefined
        }
        message={params?.message}
        sessionId={params?.session}
        token={params?.token}
      />
    </main>
  );
}

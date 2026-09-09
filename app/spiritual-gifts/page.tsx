import Link from "next/link";
import { SpiritualGiftsAssessmentForm } from "./assessment-form";
import { saveSpiritualGiftsPublicResponse } from "./actions";

type SpiritualGiftsPageProps = {
  searchParams?: Promise<{
    message?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function SpiritualGiftsPage({ searchParams }: SpiritualGiftsPageProps) {
  const params = await searchParams;

  return (
    <main className="fruitlife-shell spiritual-gifts-shell">
      <nav className="course-nav" aria-label="Spiritual Gifts navigation">
        <Link href="/">DYDD School</Link>
        <Link href="/field-kit">Field Kit</Link>
      </nav>

      <header className="spiritual-gifts-public-intro">
        <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        <div>
          <p className="section-label">Spiritual Gifts</p>
          <h1>Discover how God may be gifting your service.</h1>
          <p className="lede">
            Enter your name and email, answer the reflection statements, and your result will be
            saved to your DYDD record.
          </p>
        </div>
      </header>

      <SpiritualGiftsAssessmentForm
        action={saveSpiritualGiftsPublicResponse}
        message={params?.message}
      />
    </main>
  );
}

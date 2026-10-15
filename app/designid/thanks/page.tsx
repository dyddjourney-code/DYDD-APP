import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapsConfirmationBuckets, mapsConfirmationItems, type MapsConfirmationResult } from "@/lib/designid/maps-confirmation";

type DesignIdThanksPageProps = {
  searchParams?: Promise<{
    snapshot?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DesignIdThanksPage({ searchParams }: DesignIdThanksPageProps) {
  const params = await searchParams;
  let confirmation: MapsConfirmationResult | null = null;
  if (params?.snapshot) {
    const client = await createSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/designid/thanks?snapshot=${params.snapshot}`)}`);
    const { data } = await createSupabaseAdminClient().from("assessment_snapshots")
      .select("scores").eq("id", params.snapshot).eq("user_id", user.id).eq("assessment_type", "designid").maybeSingle();
    confirmation = (data?.scores as { mapsConfirmation?: MapsConfirmationResult } | null)?.mapsConfirmation ?? null;
  }
  const reportHref = params?.snapshot
    ? `/designid/report?snapshot=${encodeURIComponent(params.snapshot)}`
    : "/field-kit";

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designid-logo.webp" alt="DesignID logo" />
        <p className="section-label">Submitted</p>
        <h1>Your DesignID report is being prepared.</h1>
        <p>
          Your assessment has been saved in the app. The report artifact will appear in Field Kit,
          and the report link is sent to your account email when PDFMonkey finishes.
        </p>
        {confirmation ? <section className="maps-confirmation-result">
          <p className="section-label">Your MAPS confirmation</p>
          <h2>A second perspective on your design.</h2>
          <p>{confirmation.note}</p>
          <dl>{mapsConfirmationBuckets.map((bucket) => <div key={bucket.id}>
            <dt><strong>{bucket.label}</strong></dt>
            <dd>{mapsConfirmationItems.filter((item) => confirmation.assignments[item.id] === bucket.id).map((item) => item.word).join(" · ")}</dd>
          </div>)}</dl>
        </section> : null}
        <div className="fieldkit-artifact-actions">
          <Link className="button primary" href={reportHref}>
            Open report
          </Link>
          <Link className="button secondary" href="/field-kit">
            Back to Field Kit
          </Link>
        </div>
      </section>
    </main>
  );
}

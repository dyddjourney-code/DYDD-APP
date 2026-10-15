import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DesignIdThanksPageProps = {
  searchParams?: Promise<{
    snapshot?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function DesignIdThanksPage({ searchParams }: DesignIdThanksPageProps) {
  const params = await searchParams;
  if (params?.snapshot) {
    const client = await createSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/designid/thanks?snapshot=${params.snapshot}`)}`);
    const { data } = await createSupabaseAdminClient().from("assessment_snapshots")
      .select("id").eq("id", params.snapshot).eq("user_id", user.id).eq("assessment_type", "designid").maybeSingle();
    if (!data) redirect("/field-kit");
  }
  const reportHref = params?.snapshot
    ? `/designid/report?snapshot=${encodeURIComponent(params.snapshot)}`
    : "/field-kit";

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designid-logo.webp" alt="DesignID logo" />
        <p className="section-label">Submitted</p>
        <h1>Your DesignID report is submitted.</h1>
        <p>
          Your assessment has been saved in the app. Find your report in Field Kit.
        </p>
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

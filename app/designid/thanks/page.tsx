import { ClearDesignIdDraft } from "./clear-draft";
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
  let participantEmail = "";
  let emailSent = false;
  let reportReady = false;
  if (params?.snapshot) {
    const client = await createSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/designid/thanks?snapshot=${params.snapshot}`)}`);
    const { data } = await createSupabaseAdminClient().from("assessment_snapshots")
      .select("id,scores").eq("id", params.snapshot).eq("user_id", user.id).eq("assessment_type", "designid").maybeSingle();
    if (!data) redirect("/field-kit");
    participantEmail = user.email ?? "";
    emailSent = data.scores?.resultEmail?.sent === true;
    reportReady = ['ready', 'success'].includes(data.scores?.pdfMonkey?.status);
  }
  const reportHref = params?.snapshot
    ? `/designid/report?snapshot=${encodeURIComponent(params.snapshot)}`
    : "/field-kit";

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell">
      {params?.snapshot ? <ClearDesignIdDraft email={participantEmail} /> : null}
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designid-logo.webp" alt="DesignID logo" />
        <p className="section-label">Submitted</p>
        <h1>{reportReady ? "Your DesignID report is ready." : "Your DesignID assessment is submitted."}</h1>
        <p>
          {reportReady
            ? emailSent
              ? "You can find it in your Field Kit, and a link has been emailed to you."
              : "You can find it in your Field Kit. We couldn’t confirm the email send; you can still open your report here."
            : "Your assessment has been saved in the app. Visit Field Kit to access your report when it is ready."}
        </p>
        <div className="fieldkit-artifact-actions">
          <Link className="button primary" href={reportHref} target="_blank" rel="noopener noreferrer">
            Open report
          </Link>
          <Link className="button secondary" href="/courses/designid-foundations">Continue This Trail</Link>
          <Link className="button secondary" href="/journey">Return to My Journey</Link>
          <Link className="button secondary" href="/field-kit">
            Back to Field Kit
          </Link>
        </div>
      </section>
    </main>
  );
}

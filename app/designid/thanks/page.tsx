import { ClearDesignIdDraft } from "./clear-draft";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnedArtifactSnapshot } from "@/lib/assessments/artifact-access";
import { normalizeEmail } from "@/lib/identity/email";

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
    const data = await getOwnedArtifactSnapshot(params.snapshot,user.id,normalizeEmail(user.email));
    if (!data || data.assessment_type!=='designid') redirect("/field-kit");
    participantEmail = user.email ?? "";
    emailSent = (data.scores?.resultEmail as Record<string,unknown>|undefined)?.sent === true;
    reportReady = data.source==='public_guest' ? data.owned_report_ready===true : ['ready', 'success'].includes(String((data.scores?.pdfMonkey as Record<string,unknown>|undefined)?.status));
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

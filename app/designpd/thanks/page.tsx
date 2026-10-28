import { savedDesignPdTendencies } from "@/lib/designpd/tendencies";
import { courseCardHref, courseOrigin, withCourseOrigin } from "@/lib/trails/course-origin";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DesignPdThanksPageProps = {
  searchParams?: Promise<{ snapshot?: string; origin?: string }>;
};

export const dynamic = "force-dynamic";

export default async function DesignPdThanksPage({ searchParams }: DesignPdThanksPageProps) {
  const params = await searchParams;
  const origin = courseOrigin(params?.origin);
  const cardHref = courseCardHref("designpd-alignment", origin);
  let tendencies: Array<{ label: string; value: string }> = [];
  let reportReady = false;
  let emailSent = false;
  let ownerReview = false;
  if (params?.snapshot) {
    const client = await createSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) redirect(`/login?next=${encodeURIComponent(`/designpd/thanks?snapshot=${params.snapshot}&origin=${origin}`)}`);
    const { data } = await createSupabaseAdminClient().from("assessment_snapshots")
      .select("id,scores").eq("id", params.snapshot).eq("user_id", user.id).eq("assessment_type", "designpd").maybeSingle();
    if (!data) redirect(cardHref);
    tendencies = savedDesignPdTendencies(data);
    reportReady = ["ready", "success"].includes(data.scores?.pdfMonkey?.status);
    emailSent = data.scores?.resultEmail?.sent === true;
    ownerReview = data.scores?.resultEmail?.reason === "owner_review_without_email";
  }
  const reportHref = params?.snapshot
    ? `/designpd/report?snapshot=${encodeURIComponent(params.snapshot)}`
    : cardHref;

  return (
    <main className="fruitlife-shell fruitlife-public designid-shell designpd-shell">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
        <p className="section-label">DesignPD submitted</p>
        <h1>{reportReady ? "Your DesignPD report is ready." : "Your DesignPD report is being prepared."}</h1>
        <p>
          {reportReady
            ? emailSent
              ? "You can find it in your Field Kit, and a link has been emailed to you."
              : ownerReview
                ? "You can find it in your Field Kit. No email was sent for this owner review."
                : "You can find it in your Field Kit. We couldn’t confirm the email send; you can still open your report here."
            : "Your report request has been saved. Visit Field Kit to access your report when it is ready."}
        </p>
        {tendencies.length ? <section className="personal-walkthrough" aria-label="Your saved DesignPD results">
          <h2>Your DesignPD results</h2>
          <dl className="lesson-insight-list">{tendencies.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
        </section> : null}
        <div className="spiritual-gifts-thanks-actions">
          <Link className="button primary" href={reportHref} target="_blank" rel="noopener noreferrer">
            Open report
          </Link>
          <Link className="button secondary" href={withCourseOrigin("/courses/designpd-alignment", origin)}>Continue This Trail</Link>
          <Link className="button secondary" href={cardHref}>
            {origin === "trailheads" ? "Back to Trailheads" : "Back to Field Kit"}
          </Link>
        </div>
      </section>
    </main>
  );
}

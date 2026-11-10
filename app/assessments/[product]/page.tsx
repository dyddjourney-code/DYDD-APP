import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessmentSnapshotsForUser } from "@/lib/assessments/student-context";
import { scoreDesignPd } from "@/lib/designpd/engine";
import { normalizeEmail } from "@/lib/identity/email";
import { standaloneDesignIdAccess } from "@/lib/public-assessments/access";
import { hasIncludedPersonalAccess } from "@/lib/commerce/personal-access";
import { hasTestEntitlement } from "@/lib/commerce/test-entitlements";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { hasPublicAssessmentEntitlement } from "@/lib/public-assessments/ledger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { beginAssessmentCheckout, generatePurchasedDesignPd, redeemAssessmentWaiver } from "../actions";
import { AssessmentAuthLinks, AssessmentPublicShell, publicAssessmentProducts, type PublicAssessmentProduct } from "../public-assessment-ui";
import { AssessmentSubmitButton } from "../submit-button";
import styles from "../public-assessments.module.css";

type Props = {
  params: Promise<{ product: string }>;
  searchParams?: Promise<{ message?: string | string[]; checkout?: string | string[] }>;
};

export const dynamic = "force-dynamic";

function isProduct(value: string): value is PublicAssessmentProduct {
  return Object.prototype.hasOwnProperty.call(publicAssessmentProducts, value);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { product } = await params;
  return {
    title: `${isProduct(product) ? publicAssessmentProducts[product].name : "Assessment"} | DYDD Sandbox`,
    robots: { index: false, follow: false },
  };
}

function AccessFields({ product, sourceId }: { product: "designid" | "designpd"; sourceId?: string }) {
  return <>
    <input type="hidden" name="product" value={product} />
    {sourceId ? <input type="hidden" name="sourceId" value={sourceId} /> : null}
  </>;
}

export default async function PublicAssessmentProductPage({ params, searchParams }: Props) {
  const { product: slug } = await params;
  if (!isProduct(slug)) notFound();
  const product = publicAssessmentProducts[slug];
  const query = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const verifiedUser = user?.email && user.email_confirmed_at ? user : null;
  const next = `/assessments/${slug}`;
  // Identity is established by Supabase, never by an email entered on this page.
  const snapshots = verifiedUser
    ? (await getAssessmentSnapshotsForUser(verifiedUser.id, normalizeEmail(verifiedUser.email))).all
    : [];
  // The trusted snapshot reader returns newest first. Invalid or incomplete results
  // cannot become a DesignPD source, even if they are newer than a valid result.
  const source = slug === "designpd" ? snapshots.find((snapshot) => {
    if (snapshot.assessment_type !== "designid") return false;
    try { scoreDesignPd(snapshot); return true; } catch { return false; }
  }) : undefined;
  const savedReport = snapshots.find(snapshot => snapshot.assessment_type === (slug === "spiritual-gifts" ? "spiritual_gifts" : slug)
    && (slug !== "designpd" || snapshot.scores.designIdSnapshotId === source?.id));
  const owned = verifiedUser && slug !== "spiritual-gifts" && (slug !== "designpd" || source)
    ? slug === "designid" ? (await standaloneDesignIdAccess(verifiedUser)).allowed
      : isDyddAdminEmail(verifiedUser.email) || await hasIncludedPersonalAccess(verifiedUser.id)
        || await hasTestEntitlement(verifiedUser.id, "designpd", source!.id)
        || await hasPublicAssessmentEntitlement(verifiedUser.id, "designpd", source!.id)
    : false;
  // Never echo arbitrary query content: a submitted code or personal detail must
  // not become part of the page's status message.
  const safeMessages: Record<string, string> = {
    "Verify your account email before continuing.": "Please confirm your account email before continuing.",
    "Public assessment activation is not available in this environment.": "Assessment activation is not available here yet.",
    "Complete a valid DesignID with this account before continuing.": "Complete an eligible DesignID with this account before continuing.",
    "Complete a valid 100-point DesignID with this account first.": "Complete an eligible DesignID with this account before continuing.",
    "That waiver could not be applied. Check its product and code, or contact support.": "That waiver could not be applied. Check the code and its assessment, or contact support.",
    "Stripe checkout is not connected yet. No payment was taken and no paid access was granted. You may use an authorized product waiver.": "Stripe checkout is not connected yet. No payment was taken. You can still use an authorized one-use waiver.",
    "Unlock this DesignPD report before generating it.": "Apply a DesignPD waiver before generating this report.",
  };
  const message = query?.checkout === "cancelled"
    ? "Checkout was cancelled. You can continue whenever you are ready."
    : query?.checkout === "returned"
      ? "You’re back. Access appears once payment is verified."
      : query?.message
        ? (typeof query.message === "string" && safeMessages[query.message]) || "Check your access below. If you need help continuing, please contact support."
        : null;

  return <AssessmentPublicShell>
    <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/assessments">Assessments</Link><span aria-hidden="true"> / </span><span>{product.name}</span></nav>
    {message ? <p className={styles.status} role="status">{message}</p> : null}
    <div className={styles.detailGrid}>
      <section className={styles.story}>
        <img className={styles.productLogo} src={product.logo} alt={product.name} />
        <p className={styles.eyebrow}>{product.eyebrow}</p>
        <h1>{product.heading}</h1>
        <p className={styles.lede}>{product.description}</p>
        <div className={styles.heroImage}><img src={product.image} alt="" /></div>
      </section>
      <aside className={styles.accessPanel} aria-labelledby="assessment-access-heading">
        <p className={styles.eyebrow}>{slug === "spiritual-gifts" ? "Free access" : owned ? "Access available" : "Your assessment access"}</p>
        <h2 id="assessment-access-heading">{slug === "spiritual-gifts" ? "A gift worth exploring." : owned ? "Your next step is ready." : "Make room for discovery."}</h2>
        {savedReport && slug !== "spiritual-gifts" ? <p><Link className={styles.secondary} href={`/assessments/report/${encodeURIComponent(savedReport.id)}`}>Open my saved {product.name} report preview</Link></p> : null}
        {slug === "spiritual-gifts" ? <>
          <p>The Spiritual Gifts experience is free. No checkout, subscription, or waiver is required.</p>
          <Link className={styles.primary} href={verifiedUser ? "/spiritual-gifts?channel=app" : `/login?${new URLSearchParams({next:"/spiritual-gifts?channel=app"})}`}>{verifiedUser ? "Start Spiritual Gifts" : "Continue to Spiritual Gifts"}<span aria-hidden="true"> →</span></Link>
          {!user ? <p className={styles.helper}>You’ll sign in or create an account in the existing Spiritual Gifts experience.</p> : null}
        </> : !user ? <>
          <p>Create your account or sign in to check your access, use a one-use waiver, and keep your results together.</p>
          {slug === "designpd" ? <p className={styles.prerequisite}>DesignPD needs a completed, eligible DesignID result in your account. There is no separate DesignPD questionnaire.</p> : null}
          <AssessmentAuthLinks next={next} />
          <p className={styles.helper}>Already have a waiver? Sign in first, then enter it securely here.</p>
        </> : !verifiedUser ? <>
          <p>Please confirm your account email before connecting assessment results or using a waiver.</p>
          <Link className={styles.secondary} href={`/login?${new URLSearchParams({ next })}`}>Return to account access</Link>
        </> : slug === "designpd" && !source ? <>
          <p className={styles.prerequisite}>Complete an eligible DesignID first.</p>
          <p>We couldn’t find a completed DesignID result that can be used for this report. Start there, then return here to continue. No new questionnaire is needed for DesignPD.</p>
          <Link className={styles.primary} href="/assessments/designid">Start with DesignID<span aria-hidden="true"> →</span></Link>
        </> : owned ? <>
          <p>{slug === "designid" ? "Your account has access to DesignID. Continue to the existing assessment; normal assessment timing still applies." : "Your account has access to DesignPD for the DesignID result shown below. Generate your report directly from that result."}</p>
          {slug === "designid" ? <Link className={styles.primary} href="/designid">Start DesignID<span aria-hidden="true"> →</span></Link> : <form action={generatePurchasedDesignPd}>
            <AccessFields product="designpd" sourceId={source?.id} />
            <AssessmentSubmitButton pendingLabel="Preparing your report…">Generate my DesignPD report</AssessmentSubmitButton>
          </form>}
        </> : <>
          <p>Have a one-use waiver? Apply it to your signed-in account to continue.</p>
          <form action={redeemAssessmentWaiver} className={styles.waiverForm}>
            <AccessFields product={slug} sourceId={source?.id} />
            <label htmlFor="assessment-waiver">One-use waiver code</label>
            <input id="assessment-waiver" name="code" type="text" required maxLength={160} autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-describedby="waiver-help" />
            <p id="waiver-help" className={styles.helper}>Your code is submitted securely, not placed in the page address. Each waiver can be used once.</p>
            <AssessmentSubmitButton pendingLabel="Checking your waiver…">Apply waiver</AssessmentSubmitButton>
          </form>
          <div className={styles.checkout}>
            <p className={styles.eyebrow}>Prefer to purchase?</p>
            <p>Live Stripe checkout will be connected later. No price is shown until the approved purchase is connected.</p>
            <form action={beginAssessmentCheckout}>
              <AccessFields product={slug} sourceId={source?.id} />
              <AssessmentSubmitButton secondary pendingLabel="Checking availability…">Check checkout availability</AssessmentSubmitButton>
            </form>
          </div>
        </>}
        {source ? <div className={styles.sourceNote}>
          <p className={styles.eyebrow}>Your DesignID source</p>
          <p>Latest eligible completed result{Number.isFinite(Date.parse(source.source_submitted_at || source.created_at)) ? ` · ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(source.source_submitted_at || source.created_at))}` : ""}</p>
          <p className={styles.helper}>Access and report generation apply to this saved result. No additional questions.</p>
        </div> : null}
        <p className={styles.support}>Need a hand? <Link href="/contact">Contact DYDD</Link></p>
      </aside>
    </div>
    <section className={styles.expectations} aria-label="What to expect">
      {product.details.map(([heading, detail], index) => <div key={heading}>
        <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
        <h2>{heading}</h2><p>{detail}</p>
      </div>)}
    </section>
  </AssessmentPublicShell>;
}

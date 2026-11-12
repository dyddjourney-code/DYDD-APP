import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentPublicShell, publicAssessmentProducts } from "./public-assessment-ui";
import styles from "./public-assessments.module.css";

export const metadata: Metadata = {
  title: "Explore Assessments | DYDD",
  description: "Explore DesignID, DesignPD, and the free Spiritual Gifts experience without an account.",
  robots: { index: false, follow: false },
};

export default function PublicAssessmentsPage() {
  return <AssessmentPublicShell>
    <section className={styles.catalogIntro}>
      <p className={styles.eyebrow}>Your next step in discovery</p>
      <h1>Know your design.<br />Find your next step.</h1>
      <p>Begin with identity, explore your gifts, or put an existing DesignID result into practice. Purchase, reflect, and receive your report — no account or app signup required.</p>
    </section>
    <section className={styles.productList} aria-label="Choose an assessment">
      {Object.entries(publicAssessmentProducts).map(([slug, product], index) => <article className={styles.productRow} key={slug}>
        <div className={styles.productIdentity}>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
          <img className={styles.catalogLogo} src={product.logo} alt={product.name} />
        </div>
        <div className={styles.productCopy}>
          <p className={styles.eyebrow}>{product.step}</p>
          <h2>{product.name}</h2>
          <p>{product.short}</p>
        </div>
        <div className={styles.catalogActions}>
          <Link className={styles.primary} href={slug === "spiritual-gifts" ? "/spiritual-gifts" : `/assessments/${slug}?guest=1`}>{slug === "spiritual-gifts" ? "Start free assessment" : `Purchase ${product.name} now`}</Link>
          <a className={styles.textLink} href={`https://www.discoverdivine.design/${slug === "spiritual-gifts" ? "spiritual-gifts-test" : slug}`} target="_blank" rel="noopener noreferrer">Explore {product.name}</a>
        </div>
      </article>)}
    </section>
    <section className={styles.accountNote} aria-labelledby="assessment-account-heading">
      <h2 id="assessment-account-heading">Your report. Your private link.</h2>
      <p>DesignID and DesignPD purchases use a private recovery link. Download your report and return to it without signing in. An email address alone can never retrieve your saved results.</p>
    </section>
  </AssessmentPublicShell>;
}

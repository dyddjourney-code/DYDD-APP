import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentPublicShell, publicAssessmentProducts } from "./public-assessment-ui";
import styles from "./public-assessments.module.css";

export const metadata: Metadata = {
  title: "Explore Assessments | DYDD Sandbox",
  description: "Explore DesignID, DesignPD, and the free Spiritual Gifts experience in the DYDD sandbox.",
  robots: { index: false, follow: false },
};

export default function PublicAssessmentsPage() {
  return <AssessmentPublicShell>
    <section className={styles.catalogIntro}>
      <p className={styles.eyebrow}>Your next step in discovery</p>
      <h1>Know your design.<br />Find your next step.</h1>
      <p>Begin with identity, explore your gifts, or put an existing DesignID result into practice. Your account keeps your assessment journey connected.</p>
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
        <Link className={styles.secondary} href={`/assessments/${slug}`}>Explore {product.name}<span aria-hidden="true"> →</span></Link>
      </article>)}
    </section>
    <section className={styles.accountNote} aria-labelledby="assessment-account-heading">
      <h2 id="assessment-account-heading">One account. Your own discovery.</h2>
      <p>Sign in or create an account from your chosen assessment. Access and saved reports are connected to your signed-in account, never retrieved through a public email search.</p>
    </section>
  </AssessmentPublicShell>;
}

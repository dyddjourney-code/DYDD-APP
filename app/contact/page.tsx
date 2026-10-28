import Link from "next/link";
import { ContactForm } from "./support-form";
import styles from "./support.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Contact support | DYDD", robots: { index: false, follow: false } };
export default function ContactPage() {
  return <main className={`journey-shell ${styles.shell}`}><div className={styles.layout}><header><p className="section-label">Contact support</p><h1>How can we help?</h1><p>Ask about account access, assessments, courses, or your journey data. You do not need to sign in.</p><p>Your request is saved privately for the DYDD support team. This form does not send email or forward your message to a personal inbox.</p><p>Please do not include passwords, payment card details, or sensitive assessment answers.</p><Link href="/privacy">Privacy details</Link></header><ContactForm /></div></main>;
}

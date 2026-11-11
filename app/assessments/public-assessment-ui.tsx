import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./public-assessments.module.css";

export const publicAssessmentProducts = {
  designid: {
    name: "DesignID",
    eyebrow: "Identity & contribution",
    heading: "Begin with the way you were designed.",
    description: "Discover how God’s design is reflected in the way you create, relate, think, and serve. Give language to your identity and contribution, without reducing yourself to a label.",
    short: "A clearer lens for identity, grace, and contribution.",
    logo: "/brand/tools/designid-logo.webp",
    image: "/brand/designid-course-cartoon-hero.png",
    step: "Start here",
    details: [
      ["Reflect on your design", "Complete the existing DesignID assessment in your own account."],
      ["Keep your results connected", "Return to your saved report and use it as the foundation for DesignPD."],
    ],
  },
  designpd: {
    name: "DesignPD",
    eyebrow: "Plan. Decide. Do.",
    heading: "Put your design into everyday motion.",
    description: "Explore how you naturally Plan, Decide, and Do. DesignPD builds directly on a completed, eligible DesignID result to bring your design into leadership, teamwork, and everyday life.",
    short: "Build on DesignID to understand how you Plan, Decide, and Do.",
    logo: "/brand/tools/designpd-logo.jpg",
    image: "/brand/designpd-course-cartoon-hero.jpg",
    step: "After DesignID",
    details: [
      ["Your DesignID is the starting point", "We use your latest eligible completed DesignID result, securely connected to your account."],
      ["A report, not another questionnaire", "Once access is available, generate your derived DesignPD report from that saved result."],
    ],
  },
  "spiritual-gifts": {
    name: "Spiritual Gifts",
    eyebrow: "Gifts & faithful service",
    heading: "Discover gifts you can put into service.",
    description: "Reflect on the ways you may be equipped to serve, encourage, and strengthen others. Begin the free Spiritual Gifts experience and keep your report connected to your DYDD account.",
    short: "Explore your gifts and the ways you can serve others. Free to begin.",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    image: "/brand/spiritual-gifts-course-cartoon-hero.webp",
    step: "Always free",
    details: [
      ["Start with reflection", "Use the existing Spiritual Gifts assessment, with no purchase or waiver required."],
      ["Continue your discovery", "Return to your account to explore your saved results and next steps."],
    ],
  },
} as const;

export type PublicAssessmentProduct = keyof typeof publicAssessmentProducts;

export function AssessmentPublicShell({ children }: { children: ReactNode }) {
  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link href="/assessments" className={styles.brand} aria-label="DYDD assessments home">
        <img src="/brand/dydd-logo-transparent.webp" alt="Discover Your Divine Design" />
      </Link>
      <span className={styles.sandboxBadge}>Assessments</span>
    </header>
    <p className={styles.sandboxNote}>DesignID and DesignPD reports are $19.99 USD each, one time. Spiritual Gifts is free. Assessment purchases do not include school membership or courses.</p>
    {children}
    <footer className={styles.footer}>
      <span>Discover Your Divine Design</span>
      <span>Reflection and development tools, not diagnoses or limitations.</span>
    </footer>
  </main>;
}

export function AssessmentAuthLinks({ next }: { next: string }) {
  return <div className={styles.actions}>
    <Link className={styles.primary} href={`/login?${new URLSearchParams({ mode: "signup", next })}`}>Create your account</Link>
    <Link className={styles.secondary} href={`/login?${new URLSearchParams({ next })}`}>Sign in</Link>
  </div>;
}

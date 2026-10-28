"use client";

import type { CourseOrigin } from "@/lib/trails/course-origin";
import { isFreeBeta } from "@/lib/environment";
import { useState } from "react";
import Link from "next/link";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  participantEmail: string;
  participantName: string;
  ownerAccess: boolean;
  lifetimeAccess?: boolean;
  savedReportHref?: string;
  origin?: CourseOrigin;
  cardHref?: string;
};

export function DesignPdAssessmentForm({action, participantEmail, participantName, ownerAccess, lifetimeAccess = false, savedReportHref, origin = "field-kit", cardHref = "/field-kit#collection-designpd"}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <form action={action} onSubmit={() => setIsSubmitting(true)} className="designid-form">
      <input type="hidden" name="origin" value={origin} />
      <nav className="course-nav" aria-label="DesignPD navigation"><Link href={cardHref}>{origin === "trailheads" ? "Back to Trailheads" : "Back to Field Kit"}</Link></nav>
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
        <h1>Explore your design in motion.</h1>
        <p>DesignPD builds on your DesignID results to explore how you tend to plan, decide, and do, with practical applications for everyday life.</p>
        <div className="spiritual-gifts-locked-identity" aria-label="Assessment account identity">
          <div><span>Name</span><strong>{participantName}</strong></div>
          <div><span>Email</span><strong>{participantEmail}</strong></div>
        </div>
        <p>No additional assessment questions are needed.</p>
        <p><strong>{lifetimeAccess ? "DesignPD is included in your lifetime personal all-access" : isFreeBeta() ? "DesignPD is included during the free beta" : "Unlock your DesignPD report · $15"}</strong></p>
        <p>{lifetimeAccess || isFreeBeta() ? "Create your report from your completed DesignID results, then explore the connected course. No payment is needed." : "A one-time add-on for this DesignID result, including the supporting course. Your purchased report stays available to reopen and download. A new DesignID result can be unlocked separately."}</p>
        {!ownerAccess ? <p>Checkout is coming soon. No payment will be taken here.</p> : <p>{lifetimeAccess ? "Lifetime personal access: no payment will be taken." : isFreeBeta() ? "Free beta access: no payment will be taken." : "Owner access: you can generate a report without payment."}</p>}
        {ownerAccess ? <label className="fruitlife-checkbox-row"><input type="checkbox" name="emailReport" value="yes" /> Email me a link to this report</label> : null}
        {savedReportHref ? <p><Link className="button secondary" href={savedReportHref}>Open saved DesignPD report</Link></p> : null}
        <button className="button primary" type="submit" disabled={isSubmitting || !ownerAccess}>{isSubmitting ? "Preparing your report..." : ownerAccess ? "Create my DesignPD report" : "Unlock DesignPD · $15 (coming soon)"}</button>
      </section>
    </form>
  );
}

"use client";

import type { CourseOrigin } from "@/lib/trails/course-origin";
import { useState } from "react";
import Link from "next/link";
import { designPdPendingUnlockMessage } from "@/lib/designpd/generation";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  participantEmail: string;
  participantName: string;
  ownerAccess: boolean;
  lifetimeAccess?: boolean;
  designIdSnapshotId?: string;
  paidAccess?: boolean;
  savedReportHref?: string;
  origin?: CourseOrigin;
  cardHref?: string;
};

export function DesignPdAssessmentForm({action, participantEmail, participantName, ownerAccess, lifetimeAccess = false, paidAccess = false, designIdSnapshotId, savedReportHref, origin = "field-kit", cardHref = "/field-kit#collection-designpd"}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <form action={action} onSubmit={() => setIsSubmitting(true)} className="designid-form">
      <input type="hidden" name="origin" value={origin} />
      <input type="hidden" name="designIdSnapshotId" value={designIdSnapshotId || ""} />
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
        <p><strong>{paidAccess ? "This DesignID result is unlocked in TEST mode" : lifetimeAccess ? "DesignPD is included in your lifetime personal all-access" : ownerAccess ? "DesignPD is included in your current access" : "One-time DesignPD unlock: pending"}</strong></p>
        <p>{ownerAccess ? "Create or update DesignPD from the selected eligible DesignID result. Earlier reports stay saved. Reopening or downloading a ready report does not generate another report." : designPdPendingUnlockMessage}</p>
        {paidAccess ? <p>Your existing TEST purchase covers only this DesignID result. It has not been converted into an account-wide unlock.</p> : null}
        {ownerAccess ? <label className="fruitlife-checkbox-row"><input type="checkbox" name="emailReport" value="yes" /> Email me a link to this report</label> : null}
        {savedReportHref ? <p><Link className="button secondary" href={savedReportHref}>Open saved report or status</Link></p> : null}
        {ownerAccess ? <button className="button primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Preparing your report..." : "Prepare or reopen my DesignPD report"}</button> : null}
      </section>
    </form>
  );
}

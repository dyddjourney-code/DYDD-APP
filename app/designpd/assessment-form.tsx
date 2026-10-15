"use client";

import { useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  participantEmail: string;
  participantName: string;
};

export function DesignPdAssessmentForm({action, participantEmail, participantName}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <form action={action} onSubmit={() => setIsSubmitting(true)} className="designid-form">
      <section className="fruitlife-panel fruitlife-message-card">
        <img src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
        <h1>Explore your design in motion.</h1>
        <p>DesignPD builds on your DesignID results to explore how you tend to plan, decide, and do, with practical applications for everyday life.</p>
        <div className="spiritual-gifts-locked-identity" aria-label="Assessment account identity">
          <div><span>Name</span><strong>{participantName}</strong></div>
          <div><span>Email</span><strong>{participantEmail}</strong></div>
        </div>
        <p>No additional assessment questions are needed.</p>
        <button className="button primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Preparing your report..." : "Create my DesignPD report"}</button>
      </section>
    </form>
  );
}

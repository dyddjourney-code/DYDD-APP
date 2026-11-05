import styles from "./assessment-timing-status.module.css";
import Link from "next/link";

export type TimedAssessment = "designid" | "spiritual_gifts" | "fruitful_self";
export type AssessmentTiming = {
  allowed: boolean;
  owner: boolean;
  nextEligible: string | null;
  nextEligibleLabel: string | null;
  previousAttemptId: string | null;
  previousCompletedAt?: string | null;
  reason?: string;
};
export type AssessmentTimingMap = Partial<Record<TimedAssessment, AssessmentTiming>>;

/** Status belongs around the instrument; never adds instructions to it. */
export function AssessmentTimingStatus({ assessment, timing }: {
  assessment: TimedAssessment;
  timing?: AssessmentTiming | null;
}) {
  if (!timing || (!timing.previousAttemptId && !timing.previousCompletedAt) || timing.owner || !timing.nextEligibleLabel) return null;
  return <div className={`assessment-timing-status ${styles.status}`}>
    <p>{assessment === "fruitful_self" ? <>Self-only assessment · </> : null}Available again on {timing.nextEligibleLabel}.</p>
    {timing.allowed && timing.nextEligible && Date.parse(timing.nextEligible) > Date.now()
      ? <p>Your early retake is available.</p> : null}
    {!timing.allowed ? <p><Link href={`/assessment-timing/request?type=${assessment}`} prefetch={false}>
      Made a mistake taking this assessment? Request an early retake.
    </Link></p> : null}
    <p><Link href="/assessment-timing">Assessment timing</Link></p>
  </div>;
}

/** The pre-purchase summary is deliberately compact and expandable. */
export function AssessmentTimingDisclosure() {
  return <div className={`assessment-timing-disclosure ${styles.disclosure}`}>
    <p>Unlimited access to your journey, learning, and saved results. Assessment retakes follow guided reflection intervals.</p>
    <details>
      <summary>Assessment timing</summary>
      <ul>
        <li>DesignID: at least 90 days between completed assessments; about six months of reflection is recommended.</li>
        <li>Spiritual Gifts: 30 days between completed assessments.</li>
        <li>Fruitful Life 360 self-only: 30 days between completed assessments.</li>
        <li>Fruitful Life 360 observer rounds: up to three distinct rounds in a rolling 90 days. Different groups can be active together; one response per observer per round.</li>
        <li>Observer reports: at most one new generation per round every 24 hours. Saved results and downloads remain available.</li>
        <li>DesignPD builds on DesignID, with no separate assessment timer. Updates use a later eligible DesignID result; existing purchase requirements still apply.</li>
      </ul>
      <Link href="/assessment-timing">Read about assessment timing</Link>
    </details>
  </div>;
}

import Link from "next/link";
import { isSandbox } from "@/lib/environment";
import { designPdPendingUnlockMessage } from "@/lib/designpd/generation";
import { withReviewQuery, type ReviewSearchParams } from "@/lib/review/heather";

/** Route into the existing owned-result gate; never create an unscoped checkout. */
export function DesignPdTrailOffer({ designIdSnapshotId, origin, reviewParams }: {
  designIdSnapshotId?: string;
  origin: "trailheads" | "field-kit";
  reviewParams?: ReviewSearchParams;
}) {
  const href = designIdSnapshotId
    ? `/designpd?origin=${origin}&snapshot=${encodeURIComponent(designIdSnapshotId)}`
    : "/designid";
  return (
    <aside className="designpd-trail-offer" aria-label="DesignPD optional purchase">
      <p className="section-label">Optional DesignPD expansion</p>
      <h4>Put your design into everyday practice.</h4>
      <p>Build on your DesignID discoveries to understand how you plan, decide, and do in your relationships, work, and service.</p>
      {!isSandbox() ? <p className="designpd-offer-price"><strong>$15</strong> / saved DesignID result · one time</p> : null}
      <p>{isSandbox() ? designPdPendingUnlockMessage : "Includes the DesignPD report and supporting class for that result. Each new DesignID result is a separate unlock. DesignID itself is included with Personal membership."}</p>
      <p>{designIdSnapshotId ? "Continue to review access for your saved result. Any existing unlock or included lifetime access is recognized before payment." : "Complete DesignID first, then choose the saved result you want to unlock. No separate DesignPD assessment is required."}</p>
      <Link className="button primary" href={withReviewQuery(href, reviewParams)}>{designIdSnapshotId ? "Open DesignPD for this result" : "Complete DesignID first"}</Link>
    </aside>
  );
}

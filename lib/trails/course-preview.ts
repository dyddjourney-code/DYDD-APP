import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { isSandbox } from "@/lib/environment";
import { isNewReviewRequest, type ReviewSearchParams } from "@/lib/review/heather";

// John uses the established isolated owner persona, not a learner entitlement.
export function isOwnerCoursePreview(params?: ReviewSearchParams | null) {
  return isSandbox() && (isNewReviewRequest(params) || isOwnerPreviewRequest(params));
}

// Existing Command Center navigation carries review=owner. Keep the same verified
// credential and existing private data keys; no new learner account is created.
export function designIdCourseReviewParams<T extends ReviewSearchParams>(params?: T): T | undefined {
  return isSandbox() && isOwnerPreviewRequest(params) ? { ...params!, review: "new" } : params;
}

// Compatibility for the existing DesignID entry points.
export const isDesignIdOwnerCoursePreview = isOwnerCoursePreview;

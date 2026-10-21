import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { isSandbox } from "@/lib/environment";
import { isNewReviewRequest, type ReviewSearchParams } from "@/lib/review/heather";

// Jordan is the established owner-authorized persona, not a learner entitlement.
export function isDesignIdOwnerCoursePreview(params?: ReviewSearchParams | null) {
  return isSandbox() && (isNewReviewRequest(params) || isOwnerPreviewRequest(params));
}

// Existing Command Center navigation carries review=owner. Keep the same verified
// credential, using Jordan's isolated persona rather than inventing an account.
export function designIdCourseReviewParams<T extends ReviewSearchParams>(params?: T): T | undefined {
  return isSandbox() && isOwnerPreviewRequest(params) ? { ...params!, review: "new" } : params;
}

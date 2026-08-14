import {
  buildDesignIdContext,
  getAssessmentSnapshotsForParticipantMatch,
  type StudentAssessmentReport,
  type StudentDesignContext,
} from "@/lib/assessments/student-context";

export const heatherReviewEmail = "willoughbyhs@gmail.com";
export const heatherReviewName = "Heather Willoughby";
export const heatherReviewEmails = [
  heatherReviewEmail,
  "heatherlawton312@gmail.com",
  "heather.willoughby@sbesinc.com",
];
export const heatherReviewNames = [heatherReviewName, "Heather Lawton"];
export const newReviewName = "Jordan Preview";

export type ReviewSearchParams = {
  key?: string;
  review?: string;
};

export function isHeatherReviewRequest(params?: ReviewSearchParams | null) {
  return (
    params?.review === "heather" &&
    Boolean(params.key) &&
    Boolean(process.env.DYDD_REVIEW_TOKEN) &&
    params.key === process.env.DYDD_REVIEW_TOKEN
  );
}

export function isNewReviewRequest(params?: ReviewSearchParams | null) {
  return (
    params?.review === "new" &&
    Boolean(params.key) &&
    Boolean(process.env.DYDD_REVIEW_TOKEN) &&
    params.key === process.env.DYDD_REVIEW_TOKEN
  );
}

export function isReviewRequest(params?: ReviewSearchParams | null) {
  return isHeatherReviewRequest(params) || isNewReviewRequest(params);
}

export function reviewQuery(params?: ReviewSearchParams | null) {
  if (!isReviewRequest(params)) {
    return "";
  }

  return `?review=${encodeURIComponent(params?.review ?? "")}&key=${encodeURIComponent(params?.key ?? "")}`;
}

export function withReviewQuery(path: string, params?: ReviewSearchParams | null) {
  return `${path}${reviewQuery(params)}`;
}

export async function getHeatherReviewReport(params?: ReviewSearchParams | null) {
  if (!isHeatherReviewRequest(params)) {
    return null;
  }

  return getAssessmentSnapshotsForParticipantMatch({
    displayNames: heatherReviewNames,
    emails: heatherReviewEmails,
  });
}

export function getNewReviewReport(params?: ReviewSearchParams | null) {
  if (!isNewReviewRequest(params)) {
    return null;
  }

  return { all: [], latest: [] };
}

export function buildHeatherReviewContext(
  assessmentReport: StudentAssessmentReport,
): StudentDesignContext {
  return {
    assessmentReport,
    designId: buildDesignIdContext(assessmentReport),
    displayName: heatherReviewName,
    isSignedIn: true,
  };
}

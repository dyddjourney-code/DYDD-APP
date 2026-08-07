import {
  buildDesignIdContext,
  getAssessmentSnapshotsForEmail,
  type StudentAssessmentReport,
  type StudentDesignContext,
} from "@/lib/assessments/student-context";

export const heatherReviewEmail = "willoughbyhs@gmail.com";
export const heatherReviewName = "Heather Willoughby";

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

export function reviewQuery(params?: ReviewSearchParams | null) {
  if (!isHeatherReviewRequest(params)) {
    return "";
  }

  return `?review=heather&key=${encodeURIComponent(params?.key ?? "")}`;
}

export function withReviewQuery(path: string, params?: ReviewSearchParams | null) {
  return `${path}${reviewQuery(params)}`;
}

export async function getHeatherReviewReport(params?: ReviewSearchParams | null) {
  if (!isHeatherReviewRequest(params)) {
    return null;
  }

  return getAssessmentSnapshotsForEmail(heatherReviewEmail);
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

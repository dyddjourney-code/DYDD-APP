import { isSandbox } from "@/lib/environment";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
export const jordanReviewEmail = "willoughby.john@gmail.com";
export const jordanReviewName = "John Willoughby";
export const newReviewName = "John";

export type ReviewSearchParams = {
  key?: string;
  review?: string;
};

export function isHeatherReviewRequest(params?: ReviewSearchParams | null) {
  return (
    isSandbox() && params?.review === "heather" &&
    Boolean(params.key) &&
    Boolean(process.env.DYDD_REVIEW_TOKEN) &&
    params.key === process.env.DYDD_REVIEW_TOKEN
  );
}

export function isNewReviewRequest(params?: ReviewSearchParams | null) {
  return (
    isSandbox() && params?.review === "new" &&
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
  const query = reviewQuery(params);

  if (!query) {
    return path;
  }

  const hashIndex = path.indexOf("#");
  const base = hashIndex < 0 ? path : path.slice(0, hashIndex);
  const hash = hashIndex < 0 ? "" : path.slice(hashIndex);
  return `${base}${base.includes("?") ? "&" : "?"}${query.slice(1)}${hash}`;
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

export async function getNewReviewReport(params?: ReviewSearchParams | null) {
  if (!isNewReviewRequest(params)) {
    return null;
  }

  // Private owner-authorized sandbox copy of John's authentic saved report.
  // Never query production at runtime or create a learner/report submission.
  if (isSandbox()) {
    const { data, error } = await createSupabaseAdminClient().storage
      .from("assessment-report-pdfs").download("sandbox-owner/john-assessment-report.json", { cacheNonce: crypto.randomUUID() }, { cache: "no-store" });
    if (data && !error) {
      const report = JSON.parse(await data.text()) as StudentAssessmentReport;
      if (Array.isArray(report.all) && Array.isArray(report.latest)) return report;
    }
    if (error && !["400", "404"].includes(String(error.statusCode)))
      throw Error("Your saved owner report could not be loaded. Please try again.");
  }
  return getAssessmentSnapshotsForParticipantMatch({
    displayNames: [jordanReviewName],
    emails: [jordanReviewEmail],
  });
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

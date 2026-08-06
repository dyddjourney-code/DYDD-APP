export const assessmentTypes = ["designid", "designpd", "spiritual_gifts"] as const;

export type AssessmentType = (typeof assessmentTypes)[number];

export type AssessmentSnapshotPayload = {
  assessmentType: AssessmentType;
  profileLanguage?: Record<string, unknown>;
  scores: Record<string, unknown>;
  sourceResponseId?: string;
  sourceSlug: string;
  sourceSubmittedAt?: string;
  summary?: Record<string, unknown>;
  userId: string;
};

export function isAssessmentType(value: string): value is AssessmentType {
  return assessmentTypes.includes(value as AssessmentType);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

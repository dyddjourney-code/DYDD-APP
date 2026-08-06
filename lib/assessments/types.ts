export const assessmentTypes = [
  "designid",
  "designpd",
  "spiritual_gifts",
  "fruit_360",
  "design_pathways",
] as const;

export type AssessmentType = (typeof assessmentTypes)[number];

export type AssessmentSnapshotPayload = {
  assessmentType: AssessmentType;
  participantEmail?: string;
  participantKey?: string;
  participantName?: string;
  profileLanguage?: Record<string, unknown>;
  scores: Record<string, unknown>;
  syncBatchId?: string;
  sourceResponseId?: string;
  sourceSlug: string;
  sourceSubmittedAt?: string;
  summary?: Record<string, unknown>;
  userId?: string;
};

export function isAssessmentType(value: string): value is AssessmentType {
  return assessmentTypes.includes(value as AssessmentType);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

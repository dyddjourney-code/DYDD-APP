import { participantEmailCandidates } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AssessmentSnapshotSummary = {
  assessment_type: string;
  created_at: string;
  id: string;
  scores: Record<string, unknown>;
  source: string | null;
  source_submitted_at: string | null;
};

export type ParticipantRecord = {
  id: string;
  normalized_email: string | null;
  user_id: string | null;
};

export type StudentAssessmentReport = {
  all: AssessmentSnapshotSummary[];
  latest: AssessmentSnapshotSummary[];
};

export type StudentDesignContext = {
  assessmentReport: StudentAssessmentReport;
  displayName: string;
  designId: Record<string, string>;
  isSignedIn: boolean;
};

export const assessmentLabels: Record<string, string> = {
  design_pathways: "Design Pathways",
  designid: "DesignID",
  designpd: "DesignPD",
  fruit_360: "Fruit 360",
  spiritual_gifts: "Spiritual Gifts",
};

export function displayDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function latestByAssessment(snapshots: AssessmentSnapshotSummary[]) {
  const latest = new Map<string, AssessmentSnapshotSummary>();

  for (const snapshot of snapshots) {
    if (!latest.has(snapshot.assessment_type)) {
      latest.set(snapshot.assessment_type, snapshot);
    }
  }

  return Array.from(latest.values());
}

export function snapshotSection(
  snapshot: AssessmentSnapshotSummary,
  section: "profileLanguage" | "scores" | "summary",
) {
  const value = snapshot.scores?.[section];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function compactValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

export function readableLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function highlightLabel(value: string) {
  const labels: Record<string, string> = {
    Decide_Tendency: "Decide",
    Do_Tendency: "Do",
    Plan_Tendency: "Plan",
    Top1_Name: "Top 1",
    Top2_Name: "Top 2",
    Top3_Name: "Top 3",
    Top1_Score: "Top 1 Score",
    Top2_Score: "Top 2 Score",
    Top3_Score: "Top 3 Score",
  };

  return labels[value] ?? readableLabel(value);
}

export function snapshotHighlights(snapshot: AssessmentSnapshotSummary) {
  const preferredKeysByAssessment: Record<string, string[]> = {
    designid: [
      "Primary",
      "Secondary",
      "Integrative_Reflection",
      "Reflection_Of_God",
      "Spiritual_Strength",
      "Potential_Shadow",
    ],
    designpd: [
      "Plan_Tendency",
      "Decide_Tendency",
      "Do_Tendency",
    ],
    spiritual_gifts: [
      "Top1_Name",
      "Top2_Name",
      "Top3_Name",
      "Top1_Score",
      "Top2_Score",
      "Top3_Score",
    ],
  };
  const preferredKeys = preferredKeysByAssessment[snapshot.assessment_type] ?? [
    "Primary",
    "Secondary",
    "Integrative_Reflection",
    "Top1_Name",
    "Top2_Name",
    "Top3_Name",
    "Plan_Tendency",
    "Decide_Tendency",
    "Do_Tendency",
  ];
  const items: Array<{ label: string; value: string }> = [];
  const sections = [
    snapshotSection(snapshot, "summary"),
    snapshotSection(snapshot, "profileLanguage"),
    snapshotSection(snapshot, "scores"),
  ];

  for (const source of sections) {
    for (const key of preferredKeys) {
      if (items.length >= 6) {
        return items;
      }

      const value = compactValue(source[key]);
      const label = highlightLabel(key);
      if (value && !items.some((item) => item.label === label)) {
        items.push({ label, value });
      }
    }
  }

  return items;
}

export async function findOrAttachParticipant(userId: string, email: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: existingParticipant } = await supabaseAdmin
    .from("assessment_participants")
    .select("id,user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingParticipant) {
    return existingParticipant.id as string;
  }

  const emailCandidates = participantEmailCandidates(email);

  if (!emailCandidates.length) {
    return null;
  }

  const { data: emailParticipants } = await supabaseAdmin
    .from("assessment_participants")
    .select("id,user_id")
    .in("normalized_email", emailCandidates)
    .returns<ParticipantRecord[]>();

  const emailParticipant = emailParticipants?.[0];

  if (!emailParticipant) {
    return null;
  }

  if (!emailParticipant.user_id) {
    await supabaseAdmin
      .from("assessment_participants")
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("id", emailParticipant.id);
  }

  return emailParticipant.id as string;
}

export async function getAssessmentSnapshotsForUser(
  userId: string,
  email: string,
) {
  const participantId = await findOrAttachParticipant(userId, email);
  const supabaseAdmin = createSupabaseAdminClient();
  const query = supabaseAdmin
    .from("assessment_snapshots")
    .select("id,assessment_type,created_at,scores,source,source_submitted_at")
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const { data } = participantId
    ? await query.eq("participant_id", participantId)
    : await query.eq("user_id", userId);

  const all = (data ?? []) as AssessmentSnapshotSummary[];

  return {
    all,
    latest: latestByAssessment(all),
  };
}

export async function getAssessmentSnapshotsForEmail(email: string) {
  const emailCandidates = participantEmailCandidates(email);

  if (!emailCandidates.length) {
    return { all: [], latest: [] };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: participants } = await supabaseAdmin
    .from("assessment_participants")
    .select("id")
    .in("normalized_email", emailCandidates)
    .returns<Array<{ id: string }>>();

  const participantIds = (participants ?? []).map((participant) => participant.id);

  if (!participantIds.length) {
    return { all: [], latest: [] };
  }

  const { data } = await supabaseAdmin
    .from("assessment_snapshots")
    .select("id,assessment_type,created_at,scores,source,source_submitted_at")
    .in("participant_id", participantIds)
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<AssessmentSnapshotSummary[]>();

  const all = data ?? [];

  return {
    all,
    latest: latestByAssessment(all),
  };
}

export function getLatestSnapshot(
  report: StudentAssessmentReport,
  assessmentType: string,
) {
  return report.latest.find(
    (snapshot) => snapshot.assessment_type === assessmentType,
  );
}

function readFirstValue(
  snapshot: AssessmentSnapshotSummary | undefined,
  keys: string[],
) {
  if (!snapshot) {
    return "";
  }

  const sections = [
    snapshotSection(snapshot, "summary"),
    snapshotSection(snapshot, "profileLanguage"),
    snapshotSection(snapshot, "scores"),
  ];

  for (const key of keys) {
    for (const section of sections) {
      const value = compactValue(section[key]);
      if (value) {
        return value;
      }
    }
  }

  return "";
}

export function buildDesignIdContext(report: StudentAssessmentReport) {
  const designId = getLatestSnapshot(report, "designid");

  return {
    architectBand: readFirstValue(designId, ["Band_Architect"]),
    architectPts: readFirstValue(designId, ["Architect_Pts"]),
    artisanBand: readFirstValue(designId, ["Band_Artisan"]),
    artisanPts: readFirstValue(designId, ["Artisan_Pts"]),
    integrativeExpression: readFirstValue(designId, [
      "Integrative_Expression",
      "Integrative_Summary",
    ]),
    integrativeReflection: readFirstValue(designId, [
      "Integrative_Reflection",
    ]),
    lastAssessmentDate: displayDate(
      designId?.source_submitted_at ?? designId?.created_at ?? null,
    ),
    primary: readFirstValue(designId, ["Primary"]),
    primaryReflection: readFirstValue(designId, [
      "Primary_Text",
      "Primary_Summary",
      "Primary",
    ]),
    primaryScripture: readFirstValue(designId, ["Primary_Scripture"]),
    reflectionShadow: readFirstValue(designId, [
      "Reflection_Shadow",
      "Potential_Shadow",
      "Shadow_Overview",
    ]),
    reportVersion: readFirstValue(designId, ["Report_Version"]),
    runCount: readFirstValue(designId, ["Run_Count"]),
    secondary: readFirstValue(designId, ["Secondary"]),
    secondaryScripture: readFirstValue(designId, ["Secondary_Scripture"]),
    shepherdBand: readFirstValue(designId, ["Band_Shepherd"]),
    shepherdPts: readFirstValue(designId, ["Shepherd_Pts"]),
    stewardBand: readFirstValue(designId, ["Band_Steward"]),
    stewardPts: readFirstValue(designId, ["Steward_Pts"]),
  };
}

export function hasDesignIdData(designId: Record<string, string>) {
  return Boolean(
    designId.primary ||
      designId.secondary ||
      designId.integrativeReflection ||
      designId.reflectionShadow,
  );
}

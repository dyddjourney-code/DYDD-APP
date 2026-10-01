import Link from "next/link";
import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { AppNavIcon } from "@/components/app-sidebar";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { normalizeEmail } from "@/lib/identity/email";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { spiritualGifts } from "@/lib/spiritual-gifts/intake";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveAssessmentGroupMember,
  assignParticipantToAssessmentGroup,
  assignParticipantsToAssessmentGroup,
  createAssessmentGroup,
} from "./actions";

type CommandCenterSearchParams = {
  assessment?: string;
  from?: string;
  group?: string;
  key?: string;
  message?: string;
  q?: string;
  review?: string;
  sort?: string;
  to?: string;
};

type CommandCenterPageProps = {
  searchParams?: Promise<CommandCenterSearchParams>;
};

type AssessmentParticipant = {
  display_name: string | null;
  id: string;
  normalized_email: string | null;
};

type AssessmentSnapshot = {
  assessment_participants: AssessmentParticipant | AssessmentParticipant[] | null;
  assessment_type: string;
  created_at: string;
  id: string;
  participant_canonical_key?: string;
  participant_id: string | null;
  scores: Record<string, unknown> | null;
  source: string | null;
  source_submitted_at: string | null;
};

type SnapshotDetail = {
  label: string;
  value: string;
};

type AssessmentGroup = {
  created_at: string;
  description: string | null;
  group_type: string;
  id: string;
  name: string;
  owner_user_id: string;
  status: string;
};

type AssessmentGroupMember = {
  assessment_participants: AssessmentParticipant | AssessmentParticipant[] | null;
  group_id: string;
  id: string;
  membership_status: string;
  participant_id: string;
};

type ParticipantRecord = {
  email: string;
  emailAliases: string[];
  groups: AssessmentGroupMember[];
  id: string;
  identityKey: string;
  name: string;
  participantIds: string[];
  snapshots: AssessmentSnapshot[];
};

type CircleComparisonMember = {
  color: string;
  id: string;
  initials: string;
  name: string;
};

type GroupDesignPdMember = CircleComparisonMember & {
  position: number;
  score: number;
  signedScore: number;
  stackIndex: number;
  tendency: string;
};

type GroupDesignPdOverflowBucket = {
  bucket: number;
  count: number;
  members: GroupDesignPdMember[];
  position: number;
};

const assessmentLabels: Record<string, string> = {
  design_pathways: "Design Pathways",
  designid: "DesignID",
  designpd: "DesignPD",
  fruit_360: "FruitLife 360",
  spiritual_gifts: "Spiritual Gifts",
};

const assessmentOrder = [
  "spiritual_gifts",
  "designid",
  "designpd",
  "fruit_360",
  "design_pathways",
];

const excludedDefaultGroupNames = new Set(["john's tests"]);
const circleComparisonColors = ["#4a6239", "#8a5f2d", "#456073", "#735066"];
const designIdMaxScore = 60;
const designIdRadarCenter = 160;
const designIdRadarRadius = 112;
const designIdGridScales = [
  { label: 15, scale: 0.25, x: 174, y: 144 },
  { label: 30, scale: 0.5, x: 190, y: 128 },
  { label: 45, scale: 0.75, x: 205, y: 113 },
  { label: 60, scale: 1, x: 222, y: 96 },
];
const designPdMaxAxisScore = 24;
const designPdTickMarks = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

const groupTypeLabels: Record<string, string> = {
  camp_circle: "Camp Circle",
  church_team: "Church Team",
  class_cohort: "Class Cohort",
  couple: "Couple",
  leadership_team: "Leadership Team",
  marriage_workshop: "Marriage Workshop",
  other: "Other",
};

export const dynamic = "force-dynamic";

function singleParticipant(value: AssessmentSnapshot["assessment_participants"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function displayDate(value: string | null | undefined) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function snapshotDateValue(snapshot: AssessmentSnapshot) {
  return new Date(snapshot.source_submitted_at ?? snapshot.created_at).getTime();
}

function participantIdentityKey(
  participantId: string | null | undefined,
  email: string | null | undefined,
) {
  return normalizeEmail(email) || participantId || "unknown-participant";
}

function participantEmailScore(email: string) {
  const [localPart = ""] = email.split("@");
  return (localPart.includes(".") ? 2 : 0) + Math.min(localPart.length / 100, 1);
}

function preferredParticipantEmail(emails: string[]) {
  return [...new Set(emails.filter(Boolean))].sort(
    (a, b) => participantEmailScore(b) - participantEmailScore(a) || a.localeCompare(b),
  )[0];
}

function preferredParticipantName(names: string[]) {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))]
    .sort((a, b) => {
      const aIsFallback = a === "Unnamed participant" || a.includes("@");
      const bIsFallback = b === "Unnamed participant" || b.includes("@");

      if (aIsFallback !== bIsFallback) return aIsFallback ? 1 : -1;
      return b.length - a.length || a.localeCompare(b);
    })[0];
}

function inputDateValue(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return value;
}

function dateBoundary(value: string | null | undefined, endOfDay = false) {
  const input = inputDateValue(value);
  if (!input) return null;

  const date = new Date(`${input}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isFinite(date.getTime()) ? date.getTime() : null;
}

function compactValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function compactPercent(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return `${value}%`;
  const stringValue = compactValue(value);
  return stringValue ? `${stringValue.replace(/%$/, "")}%` : "";
}

function titleizeAssessmentValue(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function scoreObject(snapshot: AssessmentSnapshot, key: string) {
  const value = snapshot.scores?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function snapshotSections(snapshot: AssessmentSnapshot) {
  return [
    scoreObject(snapshot, "summary"),
    scoreObject(snapshot, "profileLanguage"),
    scoreObject(snapshot, "scores"),
    snapshot.scores ?? {},
  ];
}

function firstSnapshotValue(snapshot: AssessmentSnapshot, keys: string[]) {
  for (const key of keys) {
    for (const section of snapshotSections(snapshot)) {
      const value = compactValue(section[key]);
      if (value) return value;
    }
  }

  return "";
}

function spiritualGiftRank(snapshot: AssessmentSnapshot, rank: number) {
  const topGifts = snapshot.scores?.topGifts;
  const gift = Array.isArray(topGifts) ? topGifts[rank - 1] : null;

  if (typeof gift === "object" && gift !== null) {
    const data = gift as Record<string, unknown>;
    const label = compactValue(data.label) || compactValue(data.name);
    const score =
      compactValue(data.score) ||
      compactValue(data.value) ||
      compactPercent(data.percentile);

    if (label) return { label, score };
  }

  const label = firstSnapshotValue(snapshot, [
    `Top${rank}_Name`,
    `Top_${rank}_Name`,
    `Top${rank}`,
  ]);
  const score = firstSnapshotValue(snapshot, [
    `Top${rank}_Score`,
    `Top_${rank}_Score`,
    `Top${rank}_Pct`,
    `Top_${rank}_Pct`,
  ]);

  return label ? { label, score } : null;
}

function spiritualGiftsSummary(snapshot: AssessmentSnapshot) {
  const giftNames = [1, 2, 3, 4, 5]
    .map((rank) => spiritualGiftRank(snapshot, rank)?.label ?? "")
    .filter(Boolean);

  return giftNames.length ? giftNames.join(", ") : "Top gifts saved";
}

function spiritualGiftDetails(snapshot: AssessmentSnapshot): SnapshotDetail[] {
  return [1, 2, 3, 4, 5]
    .map((rank) => {
      const gift = spiritualGiftRank(snapshot, rank);
      if (!gift) return null;
      return {
        label: `#${rank} ${gift.label}`,
        value: gift.score || "Saved",
      };
    })
    .filter((detail): detail is SnapshotDetail => Boolean(detail));
}

const designIdScoreFields = [
  { label: "Architect", keys: ["Architect_Pts", "architectPts", "architectScore"] },
  { label: "Artisan", keys: ["Artisan_Pts", "artisanPts", "artisanScore"] },
  { label: "Shepherd", keys: ["Shepherd_Pts", "shepherdPts", "shepherdScore"] },
  { label: "Steward", keys: ["Steward_Pts", "stewardPts", "stewardScore"] },
];

function designIdScoreDetails(snapshot: AssessmentSnapshot) {
  return designIdScoreFields
    .map((field) => ({
      label: field.label,
      value: firstSnapshotValue(snapshot, field.keys),
    }))
    .filter((detail) => detail.value)
    .sort((a, b) => Number(b.value) - Number(a.value));
}

function designIdSummary(snapshot: AssessmentSnapshot) {
  const primary =
    firstSnapshotValue(snapshot, ["primaryReflection", "primary", "Primary_Reflection", "Primary"]);
  const secondary =
    firstSnapshotValue(snapshot, ["secondaryReflection", "secondary", "Secondary_Reflection", "Secondary"]);

  return [primary, secondary].filter(Boolean).join(" / ") || "DesignID saved";
}

const designPdAxes = [
  {
    axisKey: "plan",
    label: "Plan",
    scoreKeys: ["Plan_Score", "planScore"],
    signedScoreKeys: ["Move_DreamerMinusDoer", "moveDreamerMinusDoer"],
    tendencyKeys: ["Plan_Tendency", "planTendency"],
  },
  {
    axisKey: "decide",
    label: "Decide",
    scoreKeys: ["Decide_Score", "decideScore"],
    signedScoreKeys: ["Move_Feel_ItMinusThink_It", "moveFeelItMinusThinkIt"],
    tendencyKeys: ["Decide_Tendency", "decideTendency"],
  },
  {
    axisKey: "do",
    label: "Do",
    scoreKeys: ["Do_Score", "doScore"],
    signedScoreKeys: ["Move_SoloMinusTogether", "moveSoloMinusTogether"],
    tendencyKeys: ["Do_Tendency", "doTendency"],
  },
];

function designPdAxisObjectValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return { tendency: compactValue(value), score: "" };
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { tendency: "", score: "" };
  }

  const data = value as Record<string, unknown>;

  return {
    tendency:
      compactValue(data.tendency) ||
      compactValue(data.label) ||
      compactValue(data.name) ||
      compactValue(data.value),
    score:
      compactValue(data.score) ||
      compactValue(data.allocation) ||
      compactValue(data.points),
  };
}

function designPdAxisDetails(snapshot: AssessmentSnapshot) {
  const axis = snapshot.scores?.axisTendencies;

  const axisTendencies =
    typeof axis === "object" && axis !== null && !Array.isArray(axis)
      ? (axis as Record<string, unknown>)
      : {};

  return designPdAxes
    .map((axisConfig) => {
      const axisObjectValue = designPdAxisObjectValue(axisTendencies[axisConfig.axisKey]);
      const tendency =
        axisObjectValue.tendency ||
        firstSnapshotValue(snapshot, axisConfig.tendencyKeys);
      const score =
        axisObjectValue.score ||
        firstSnapshotValue(snapshot, axisConfig.scoreKeys);

      if (!tendency && !score) return null;

      return {
        label: `${axisConfig.label} allocation`,
        value: [titleizeAssessmentValue(tendency), score ? `(${score})` : ""]
          .filter(Boolean)
          .join(" "),
      };
    })
    .filter((detail): detail is SnapshotDetail => Boolean(detail?.value));
}

function designPdSummary(snapshot: AssessmentSnapshot) {
  const axisDetails = designPdAxisDetails(snapshot);

  if (axisDetails.length) {
    return axisDetails
      .slice(0, 3)
      .map((detail) => `${detail.label}: ${detail.value.replace(/ \(\d+(?:\.\d+)?\)$/, "")}`)
      .join(" | ");
  }

  return "DesignPD saved";
}

function fruitLifeSummary(snapshot: AssessmentSnapshot) {
  const summary = scoreObject(snapshot, "summary");

  return (
    compactValue(summary.Most_Visible_Fruit_List) ||
    compactValue(summary.mostVisibleFruit) ||
    "FruitLife report saved"
  );
}

function snapshotDetails(snapshot: AssessmentSnapshot): SnapshotDetail[] {
  if (snapshot.assessment_type === "spiritual_gifts") {
    return spiritualGiftDetails(snapshot);
  }

  if (snapshot.assessment_type === "designid") {
    return [
      ...designIdScoreDetails(snapshot),
      { label: "Primary", value: firstSnapshotValue(snapshot, ["primaryReflection", "primary", "Primary_Reflection", "Primary"]) },
      { label: "Secondary", value: firstSnapshotValue(snapshot, ["secondaryReflection", "secondary", "Secondary_Reflection", "Secondary"]) },
      { label: "Integrated", value: firstSnapshotValue(snapshot, ["Integrative_Reflection", "integrativeReflection"]) },
      { label: "Confidence", value: firstSnapshotValue(snapshot, ["confidence"]) },
    ].filter((detail) => detail.value);
  }

  if (snapshot.assessment_type === "designpd") {
    return designPdAxisDetails(snapshot);
  }

  if (snapshot.assessment_type === "fruit_360") {
    const summary = scoreObject(snapshot, "summary");
    return [
      { label: "Most visible", value: compactValue(summary.Most_Visible_Fruit_List) || compactValue(summary.mostVisibleFruit) },
      { label: "Growth edge", value: compactValue(summary.Growth_Edge_List) || compactValue(summary.growthEdge) },
      { label: "Observers", value: compactValue(summary.Observer_Count) || compactValue(summary.observerCount) },
    ].filter((detail) => detail.value);
  }

  return [];
}

function snapshotSummary(snapshot: AssessmentSnapshot) {
  if (snapshot.assessment_type === "spiritual_gifts") return spiritualGiftsSummary(snapshot);
  if (snapshot.assessment_type === "designid") return designIdSummary(snapshot);
  if (snapshot.assessment_type === "designpd") return designPdSummary(snapshot);
  if (snapshot.assessment_type === "fruit_360") return fruitLifeSummary(snapshot);

  return "Assessment saved";
}

function reportHref(snapshot: AssessmentSnapshot, params?: CommandCenterSearchParams | null) {
  const scores = snapshot.scores ?? {};
  const reportAccessUrl = compactValue(scores.reportAccessUrl);
  const ownerQuery = new URLSearchParams();

  if (isOwnerPreviewRequest(params)) {
    ownerQuery.set("review", "owner");
    ownerQuery.set("key", params?.key ?? "");
  }

  const ownerQueryString = ownerQuery.toString();
  const suffix = ownerQueryString ? `&${ownerQueryString}` : "";

  if (reportAccessUrl) {
    const needsOwnerQuery =
      ownerQueryString &&
      (reportAccessUrl.includes("/designid/report?") ||
        reportAccessUrl.includes("/designpd/report?"));

    return needsOwnerQuery ? `${reportAccessUrl}${suffix}` : reportAccessUrl;
  }

  if (snapshot.assessment_type === "designid") {
    return `/designid/report?snapshot=${encodeURIComponent(snapshot.id)}${suffix}`;
  }

  if (snapshot.assessment_type === "designpd") {
    return `/designpd/report?snapshot=${encodeURIComponent(snapshot.id)}${suffix}`;
  }

  if (snapshot.assessment_type === "spiritual_gifts") {
    return `/spiritual-gifts/report?snapshot=${encodeURIComponent(snapshot.id)}${suffix}`;
  }

  const pdfMonkey = scoreObject(snapshot, "pdfMonkey");
  return compactValue(pdfMonkey.providerUrl);
}

function artifactHref(snapshot: AssessmentSnapshot, params?: CommandCenterSearchParams | null) {
  const query = new URLSearchParams();

  if (isOwnerPreviewRequest(params)) {
    query.set("review", "owner");
    query.set("key", params?.key ?? "");
  }

  const queryString = query.toString();
  return `/api/artifacts/${encodeURIComponent(snapshot.id)}/download${queryString ? `?${queryString}` : ""}`;
}

function commandCenterHref(
  values: Record<string, string | null | undefined>,
  params?: CommandCenterSearchParams | null,
) {
  const query = new URLSearchParams();

  if (isOwnerPreviewRequest(params)) {
    query.set("review", "owner");
    query.set("key", params?.key ?? "");
  }

  for (const [key, value] of Object.entries(values)) {
    if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `/command-center?${queryString}` : "/command-center";
}

function isParticipantInGroup(participant: ParticipantRecord, groupId: string) {
  return participant.groups.some(
    (membership) =>
      membership.group_id === groupId && membership.membership_status === "active",
  );
}

function isExcludedDefaultGroup(group: AssessmentGroup | undefined) {
  return Boolean(group && excludedDefaultGroupNames.has(group.name.trim().toLowerCase()));
}

function isParticipantInExcludedDefaultGroup(
  participant: ParticipantRecord,
  groups: AssessmentGroup[],
) {
  return participant.groups.some((membership) => {
    if (membership.membership_status !== "active") return false;
    return isExcludedDefaultGroup(groups.find((group) => group.id === membership.group_id));
  });
}

function groupParticipants(
  snapshots: AssessmentSnapshot[],
  memberships: AssessmentGroupMember[],
  groups: AssessmentGroup[],
) {
  const records = new Map<string, ParticipantRecord>();
  const snapshotIdsByParticipant = new Map<string, Set<string>>();

  for (const snapshot of snapshots) {
    if (!snapshot.participant_id) continue;
    const current = snapshotIdsByParticipant.get(snapshot.participant_id) ?? new Set<string>();
    current.add(snapshot.id);
    snapshotIdsByParticipant.set(snapshot.participant_id, current);
  }

  function participantRecordSeed({
    email,
    id,
    identityKey,
    name,
  }: {
    email: string;
    id: string;
    identityKey: string;
    name: string;
  }): ParticipantRecord {
    return {
      email,
      emailAliases: email && email !== "No email saved" ? [email] : [],
      groups: [],
      id,
      identityKey,
      name,
      participantIds: [id],
      snapshots: [],
    };
  }

  function mergeParticipantRecord(record: ParticipantRecord, participant: AssessmentParticipant | null) {
    if (!participant?.id) return record;

    if (!record.participantIds.includes(participant.id)) {
      record.participantIds.push(participant.id);
    }

    if (participant.normalized_email && !record.emailAliases.includes(participant.normalized_email)) {
      record.emailAliases.push(participant.normalized_email);
      record.email = preferredParticipantEmail(record.emailAliases) ?? record.email;
    }

    if (
      (!record.name || record.name === "Unnamed participant" || record.name === record.email) &&
      participant.display_name
    ) {
      record.name = participant.display_name;
    }

    const currentPrimaryCount = snapshotIdsByParticipant.get(record.id)?.size ?? 0;
    const candidateCount = snapshotIdsByParticipant.get(participant.id)?.size ?? 0;

    if (candidateCount > currentPrimaryCount) {
      record.id = participant.id;
    }

    return record;
  }

  for (const snapshot of snapshots) {
    const participant = singleParticipant(snapshot.assessment_participants);
    const participantId = snapshot.participant_id ?? participant?.id;

    if (!participantId) continue;
    const recordKey = participantIdentityKey(participantId, participant?.normalized_email);

    const current =
      records.get(recordKey) ??
      participantRecordSeed({
        email: participant?.normalized_email ?? "No email saved",
        id: participantId,
        identityKey: recordKey,
        name: participant?.display_name ?? participant?.normalized_email ?? "Unnamed participant",
      });

    mergeParticipantRecord(current, participant);
    current.snapshots.push({ ...snapshot, participant_canonical_key: current.identityKey });
    records.set(recordKey, current);
  }

  for (const membership of memberships) {
    const participant = singleParticipant(membership.assessment_participants);
    const recordKey = participantIdentityKey(membership.participant_id, participant?.normalized_email);
    const current =
      records.get(recordKey) ??
      participantRecordSeed({
        email: participant?.normalized_email ?? "No email saved",
        id: membership.participant_id,
        identityKey: recordKey,
        name: participant?.display_name ?? participant?.normalized_email ?? "Unnamed participant",
      });

    mergeParticipantRecord(current, participant);
    current.groups.push(membership);
    records.set(recordKey, current);
  }

  return collapseOverlappingParticipantRecords(Array.from(records.values()), groups).map((record) => ({
    ...record,
    snapshots: dedupeParticipantSnapshots(
      record.snapshots.map((snapshot) => ({
        ...snapshot,
        participant_canonical_key: record.identityKey,
      })),
    ).sort(
      (a, b) => snapshotDateValue(b) - snapshotDateValue(a),
    ),
  }));
}

function groupMemberKey(membership: AssessmentGroupMember) {
  return membership.id || `${membership.group_id}|${membership.participant_id}`;
}

function mergeParticipantRecords(target: ParticipantRecord, source: ParticipantRecord) {
  const targetSnapshotCount = target.snapshots.length;

  target.emailAliases = Array.from(new Set([...target.emailAliases, ...source.emailAliases]));
  target.email = preferredParticipantEmail(target.emailAliases) ?? target.email;
  target.name = preferredParticipantName([target.name, source.name]) ?? target.name;
  target.participantIds = Array.from(new Set([...target.participantIds, ...source.participantIds]));

  const groupKeys = new Set(target.groups.map(groupMemberKey));
  for (const group of source.groups) {
    const key = groupMemberKey(group);
    if (!groupKeys.has(key)) {
      target.groups.push(group);
      groupKeys.add(key);
    }
  }

  target.snapshots.push(...source.snapshots);

  if (source.snapshots.length > targetSnapshotCount) {
    target.id = source.id;
  }

  return target;
}

function snapshotOverlapKey(snapshot: AssessmentSnapshot) {
  const scores = snapshot.scores ?? {};
  const sourceResponseId =
    compactValue(scores.sourceResponseId) ||
    compactValue(scores.source_response_id) ||
    compactValue(scores.Response_ID) ||
    compactValue(scores.Submission_ID);
  const submittedAt = snapshot.source_submitted_at ?? "";
  const scoreSignature = JSON.stringify(scores);

  return [
    snapshot.assessment_type,
    sourceResponseId || submittedAt || snapshot.created_at,
    scoreSignature,
  ].join("|");
}

function recordsShareSavedSubmission(a: ParticipantRecord, b: ParticipantRecord) {
  const aKeys = new Set(a.snapshots.map(snapshotOverlapKey));
  return b.snapshots.some((snapshot) => aKeys.has(snapshotOverlapKey(snapshot)));
}

function collapseOverlappingParticipantRecords(records: ParticipantRecord[], groups: AssessmentGroup[]) {
  const byName = new Map<string, ParticipantRecord[]>();

  for (const record of records) {
    const nameKey = normalizedDuplicateName(record.name);

    if (!nameKey || nameKey === "unnamedparticipant") continue;
    byName.set(nameKey, [...(byName.get(nameKey) ?? []), record]);
  }

  const consumed = new Set<ParticipantRecord>();
  const collapsed: ParticipantRecord[] = [];

  for (const record of records) {
    if (consumed.has(record)) continue;

    const nameKey = normalizedDuplicateName(record.name);
    const nameMatches = nameKey ? byName.get(nameKey) ?? [] : [];
    const mergeKey = `name:${nameKey}`;
    const target = {
      ...record,
      emailAliases: [...record.emailAliases],
      groups: [...record.groups],
      identityKey: record.identityKey,
      participantIds: [...record.participantIds],
      snapshots: [...record.snapshots],
    };

    for (const candidate of nameMatches) {
      if (candidate === record || consumed.has(candidate)) continue;
      if (
        isParticipantInExcludedDefaultGroup(target, groups) !==
        isParticipantInExcludedDefaultGroup(candidate, groups)
      ) {
        continue;
      }
      if (!recordsShareSavedSubmission(target, candidate)) continue;

      target.identityKey = mergeKey;
      mergeParticipantRecords(target, candidate);
      consumed.add(candidate);
    }

    if (target.identityKey === mergeKey) {
      target.snapshots = target.snapshots.map((snapshot) => ({
        ...snapshot,
        participant_canonical_key: target.identityKey,
      }));
    }

    collapsed.push(target);
    consumed.add(record);
  }

  return collapsed;
}

function snapshotDedupeKey(snapshot: AssessmentSnapshot) {
  const participantKey =
    snapshot.participant_canonical_key ?? snapshot.participant_id ?? "unknown-participant";
  return [
    participantKey,
    snapshot.assessment_type,
    snapshot.source_submitted_at ?? snapshot.created_at,
  ].join("|");
}

function snapshotCompletenessScore(snapshot: AssessmentSnapshot) {
  const scores = snapshot.scores ?? {};
  const scoreSection = scores.scores;
  const summarySection = scores.summary;
  const profileSection = scores.profileLanguage;

  return (
    Object.keys(typeof scoreSection === "object" && scoreSection !== null ? scoreSection : {}).length +
    Object.keys(typeof summarySection === "object" && summarySection !== null ? summarySection : {}).length +
    Object.keys(typeof profileSection === "object" && profileSection !== null ? profileSection : {}).length
  );
}

function dedupeParticipantSnapshots(snapshots: AssessmentSnapshot[]) {
  const records = new Map<string, AssessmentSnapshot>();

  for (const snapshot of snapshots) {
    const key = snapshotDedupeKey(snapshot);
    const current = records.get(key);

    if (!current || snapshotCompletenessScore(snapshot) > snapshotCompletenessScore(current)) {
      records.set(key, snapshot);
    }
  }

  return Array.from(records.values());
}

function isGroupCurrentSnapshot(snapshot: AssessmentSnapshot) {
  if (snapshot.assessment_type !== "fruit_360") return true;

  const summary = scoreObject(snapshot, "summary");
  const scores = scoreObject(snapshot, "scores");
  const reportMode = compactValue(summary.Report_Mode) || compactValue(summary.reportMode);
  const observerCount = Number(
    compactValue(summary.Observer_Count) ||
      compactValue(summary.observerCount) ||
      compactValue(scores.Observer_Count) ||
      compactValue(scores.observerCount) ||
      0,
  );

  return reportMode !== "SELF_ONLY" && observerCount > 0;
}

function latestAssessmentSnapshots(snapshots: AssessmentSnapshot[], groupView = false) {
  const latest = new Map<string, AssessmentSnapshot>();

  for (const snapshot of groupView ? snapshots.filter(isGroupCurrentSnapshot) : snapshots) {
    const current = latest.get(snapshot.assessment_type);

    if (!current || snapshotDateValue(snapshot) > snapshotDateValue(current)) {
      latest.set(snapshot.assessment_type, snapshot);
    }
  }

  return assessmentOrder
    .map((assessmentType) => latest.get(assessmentType))
    .filter((snapshot): snapshot is AssessmentSnapshot => Boolean(snapshot));
}

function filterParticipants(
  participants: ParticipantRecord[],
  {
    assessment,
    from,
    group,
    q,
    sort,
    to,
  }: {
    assessment?: string;
    from?: string;
    group?: string;
    q?: string;
    sort?: string;
    to?: string;
  },
) {
  const query = q?.trim().toLowerCase();
  const fromDate = dateBoundary(from);
  const toDate = dateBoundary(to, true);

  const filtered = participants
    .map((participant) => {
      const visibleSnapshots = participant.snapshots.filter((snapshot) => {
        const snapshotDate = snapshotDateValue(snapshot);
        const matchesAssessment = !assessment || snapshot.assessment_type === assessment;
        const matchesFrom = !fromDate || snapshotDate >= fromDate;
        const matchesTo = !toDate || snapshotDate <= toDate;

        return matchesAssessment && matchesFrom && matchesTo;
      });

      return { ...participant, snapshots: visibleSnapshots };
    })
    .filter((participant) => {
    const matchesQuery =
      !query ||
      participant.name.toLowerCase().includes(query) ||
      participant.email.toLowerCase().includes(query);
    const matchesAssessmentAndDate =
      participant.snapshots.length || (!assessment && !fromDate && !toDate);
    const matchesGroup =
      !group ||
      participant.groups.some(
        (membership) =>
          membership.group_id === group && membership.membership_status === "active",
      );

    return matchesQuery && matchesAssessmentAndDate && matchesGroup;
  });

  return filtered.sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    const aLatest = Math.max(...a.snapshots.map(snapshotDateValue), 0);
    const bLatest = Math.max(...b.snapshots.map(snapshotDateValue), 0);
    if (sort === "oldest") return aLatest - bLatest;
    return bLatest - aLatest;
  });
}

function assessmentCounts(snapshots: AssessmentSnapshot[]) {
  return snapshots.reduce<Record<string, number>>((counts, snapshot) => {
    counts[snapshot.assessment_type] = (counts[snapshot.assessment_type] ?? 0) + 1;
    return counts;
  }, {});
}

function uniqueParticipantCount(snapshots: AssessmentSnapshot[]) {
  return new Set(
    snapshots
      .map((snapshot) => snapshot.participant_canonical_key ?? snapshot.participant_id)
      .filter(Boolean),
  ).size;
}

function tallyValues(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ count, label }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function topSpiritualGiftSignals(snapshots: AssessmentSnapshot[]) {
  return tallyValues(
    snapshots
      .filter((snapshot) => snapshot.assessment_type === "spiritual_gifts")
      .flatMap((snapshot) =>
        [1, 2, 3, 4, 5].map((rank) => spiritualGiftRank(snapshot, rank)?.label ?? ""),
      ),
  ).slice(0, 8);
}

function topDesignIdSignals(snapshots: AssessmentSnapshot[]) {
  return tallyValues(
    snapshots
      .filter((snapshot) => snapshot.assessment_type === "designid")
      .map((snapshot) =>
        firstSnapshotValue(snapshot, [
          "primaryReflection",
          "primary",
          "Primary_Reflection",
          "Primary",
        ]),
      ),
  ).slice(0, 6);
}

function topDesignPdSignals(snapshots: AssessmentSnapshot[]) {
  return tallyValues(
    snapshots
      .filter((snapshot) => snapshot.assessment_type === "designpd")
      .flatMap((snapshot) =>
        designPdAxisDetails(snapshot).map((detail) =>
          detail.value.replace(/ \(\d+(?:\.\d+)?\)$/, ""),
        ),
      ),
  ).slice(0, 6);
}

function participantInitials(name: string) {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function comparisonMembers(participants: ParticipantRecord[]) {
  return participants.slice(0, 2).map<CircleComparisonMember>((participant, index) => ({
    color: circleComparisonColors[index % circleComparisonColors.length],
    id: participant.id,
    initials: participantInitials(participant.name),
    name: participant.name,
  }));
}

function currentSnapshotForParticipant(participant: ParticipantRecord, assessmentType: string) {
  return latestAssessmentSnapshots(participant.snapshots, true).find(
    (snapshot) => snapshot.assessment_type === assessmentType,
  );
}

function numberSnapshotValue(snapshot: AssessmentSnapshot, keys: string[]) {
  const value = Number(firstSnapshotValue(snapshot, keys));
  return Number.isFinite(value) ? value : 0;
}

function numberLikeSnapshotValue(snapshot: AssessmentSnapshot, keys: string[]) {
  const rawValue = firstSnapshotValue(snapshot, keys);
  const value = Number(rawValue.replace(/%$/, ""));
  return Number.isFinite(value) ? value : 0;
}

function spiritualGiftRows(participants: ParticipantRecord[], members: CircleComparisonMember[]) {
  const rows = new Map<
    string,
    {
      gift: string;
      owners: { color: string; initials: string; name: string; rank: number }[];
    }
  >();

  participants.slice(0, members.length).forEach((participant, participantIndex) => {
    const snapshot = currentSnapshotForParticipant(participant, "spiritual_gifts");
    if (!snapshot) return;

    [1, 2, 3, 4, 5].forEach((rank) => {
      const gift = spiritualGiftRank(snapshot, rank)?.label;
      if (!gift) return;

      const row = rows.get(gift) ?? { gift, owners: [] };
      row.owners.push({
        color: members[participantIndex]?.color ?? circleComparisonColors[participantIndex % circleComparisonColors.length],
        initials: members[participantIndex]?.initials ?? participantInitials(participant.name),
        name: participant.name,
        rank,
      });
      rows.set(gift, row);
    });
  });

  return Array.from(rows.values()).sort(
    (a, b) => b.owners.length - a.owners.length || Math.min(...a.owners.map((owner) => owner.rank)) - Math.min(...b.owners.map((owner) => owner.rank)) || a.gift.localeCompare(b.gift),
  );
}

function missingSpiritualGiftLabels(giftRows: ReturnType<typeof spiritualGiftRows>) {
  const represented = new Set(giftRows.map((row) => row.gift.toLowerCase()));

  return spiritualGifts
    .map((gift) => gift.label)
    .filter((label) => !represented.has(label.toLowerCase()));
}

function designIdComparisonMembers(participants: ParticipantRecord[], members: CircleComparisonMember[]) {
  return participants.slice(0, members.length)
    .map((participant, index) => {
      const snapshot = currentSnapshotForParticipant(participant, "designid");
      if (!snapshot) return null;

      return {
        ...members[index],
        scores: designIdScoreFields.map((field) => ({
          label: field.label,
          value: numberSnapshotValue(snapshot, field.keys),
        })),
      };
    })
    .filter((member): member is CircleComparisonMember & { scores: { label: string; value: number }[] } => Boolean(member));
}

function designIdPolygonPoints(scores: { value: number }[]) {
  return scores
    .map((score, index) => {
      const angle = (-90 + index * 90) * (Math.PI / 180);
      const distance = Math.max(0, Math.min(score.value / designIdMaxScore, 1)) * designIdRadarRadius;
      return `${designIdRadarCenter + Math.cos(angle) * distance},${designIdRadarCenter + Math.sin(angle) * distance}`;
    })
    .join(" ");
}

function designPdAxisScore(snapshot: AssessmentSnapshot, axisConfig: (typeof designPdAxes)[number]) {
  const rawScore = numberSnapshotValue(snapshot, axisConfig.scoreKeys);
  const signedMovement = numberLikeSnapshotValue(snapshot, axisConfig.signedScoreKeys);
  const rawTendency = titleizeAssessmentValue(
    designPdAxisObjectValue(
      typeof snapshot.scores?.axisTendencies === "object" && snapshot.scores.axisTendencies !== null && !Array.isArray(snapshot.scores.axisTendencies)
        ? (snapshot.scores.axisTendencies as Record<string, unknown>)[axisConfig.axisKey]
        : "",
    ).tendency || firstSnapshotValue(snapshot, axisConfig.tendencyKeys),
  );
  const tendency = rawTendency.toLowerCase();
  const direction =
    tendency.includes("dreamer") || tendency.includes("feel") || tendency.includes("solo")
      ? -1
      : tendency.includes("doer") || tendency.includes("think") || tendency.includes("together")
        ? 1
        : 0;
  const signedScoreSource = signedMovement ? -signedMovement : direction * rawScore;
  const signedScore = Math.max(
    -designPdMaxAxisScore,
    Math.min(signedScoreSource, designPdMaxAxisScore),
  );
  const position = 50 + signedScore / designPdMaxAxisScore * 50;

  return {
    position: Math.max(0, Math.min(100, position)),
    score: Math.abs(rawScore || signedMovement),
    signedScore,
    tendency: rawTendency || "Balanced",
  };
}

function designPdComparisonAxes(participants: ParticipantRecord[], members: CircleComparisonMember[]) {
  return designPdAxes.map((axisConfig) => ({
    ...axisConfig,
    poles:
      axisConfig.axisKey === "plan"
        ? ["Dreamer", "Doer"]
        : axisConfig.axisKey === "decide"
          ? ["Feel It", "Think It"]
          : ["Solo", "Together"],
    members: participants.slice(0, members.length)
      .map((participant, index) => {
        const snapshot = currentSnapshotForParticipant(participant, "designpd");
        if (!snapshot) return null;

        return {
          ...members[index],
          ...designPdAxisScore(snapshot, axisConfig),
        };
      })
      .filter((member): member is CircleComparisonMember & { position: number; score: number; signedScore: number; tendency: string } => Boolean(member)),
  }));
}

function designPdAxisGap(members: { signedScore: number }[]) {
  if (members.length < 2) return null;
  return Math.abs(members[0].signedScore - members[1].signedScore);
}

function currentAssessmentParticipants(participants: ParticipantRecord[], assessmentType: string) {
  return participants
    .map((participant) => {
      const snapshot = currentSnapshotForParticipant(participant, assessmentType);
      return snapshot ? { participant, snapshot } : null;
    })
    .filter((item): item is { participant: ParticipantRecord; snapshot: AssessmentSnapshot } => Boolean(item));
}

function groupSpiritualGiftTopSignals(participants: ParticipantRecord[]) {
  const topOneCounts = new Map<string, { count: number; topFiveCount: number }>();

  for (const { snapshot } of currentAssessmentParticipants(participants, "spiritual_gifts")) {
    const topOne = spiritualGiftRank(snapshot, 1)?.label;
    const topFive = [1, 2, 3, 4, 5]
      .map((rank) => spiritualGiftRank(snapshot, rank)?.label ?? "")
      .filter(Boolean);

    for (const gift of topFive) {
      const current = topOneCounts.get(gift) ?? { count: 0, topFiveCount: 0 };
      current.topFiveCount += 1;
      topOneCounts.set(gift, current);
    }

    if (topOne) {
      const current = topOneCounts.get(topOne) ?? { count: 0, topFiveCount: 0 };
      current.count += 1;
      topOneCounts.set(topOne, current);
    }
  }

  return Array.from(topOneCounts.entries())
    .map(([label, values]) => ({ label, ...values }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || b.topFiveCount - a.topFiveCount || a.label.localeCompare(b.label));
}

function groupDesignIdStats(participants: ParticipantRecord[]) {
  const records = currentAssessmentParticipants(participants, "designid");
  const primaryCounts = tallyValues(
    records.map(({ snapshot }) =>
      firstSnapshotValue(snapshot, ["primaryReflection", "primary", "Primary_Reflection", "Primary"]),
    ),
  );
  const reflectionScores = designIdScoreFields.map((field) => {
    const values = records
      .map(({ snapshot }) => numberSnapshotValue(snapshot, field.keys))
      .filter((value) => value > 0);
    const average = values.length
      ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
      : 0;
    const highCount = values.filter((value) => value >= 45).length;

    return {
      average,
      highCount,
      label: field.label,
      recordCount: values.length,
    };
  });

  return {
    primaryCounts,
    reflectionScores,
    strongestAverage: [...reflectionScores].sort((a, b) => b.average - a.average)[0] ?? null,
  };
}

function groupDesignPdAxes(participants: ParticipantRecord[]) {
  const records = currentAssessmentParticipants(participants, "designpd");

  return designPdAxes.map((axisConfig) => {
    const allMembers = records.map(({ participant, snapshot }) => {
      const score = designPdAxisScore(snapshot, axisConfig);

      return {
        color: "#4a6239",
        id: participant.id,
        initials: participantInitials(participant.name),
        name: participant.name,
        stackIndex: 0,
        ...score,
      };
    });
    const membersByBucket = new Map<number, GroupDesignPdMember[]>();

    for (const member of allMembers) {
      const bucket = Math.round(member.position / 3) * 3;
      membersByBucket.set(bucket, [...(membersByBucket.get(bucket) ?? []), member]);
    }

    const visibleMembers: GroupDesignPdMember[] = [];
    const overflowBuckets: GroupDesignPdOverflowBucket[] = [];

    for (const [bucket, bucketMembers] of membersByBucket.entries()) {
      const sortedMembers = bucketMembers.sort((a, b) => a.initials.localeCompare(b.initials));
      sortedMembers.slice(0, 4).forEach((member, stackIndex) => {
        visibleMembers.push({ ...member, stackIndex });
      });

      if (sortedMembers.length > 4) {
        overflowBuckets.push({
          bucket,
          count: sortedMembers.length - 4,
          members: sortedMembers.slice(4),
          position: sortedMembers[0]?.position ?? 50,
        });
      }
    }

    const signedScores = allMembers.map((member) => member.signedScore);
    const maxStack = Math.min(4, Math.max(1, ...Array.from(membersByBucket.values()).map((items) => items.length)));
    const spread = signedScores.length
      ? Math.max(...signedScores) - Math.min(...signedScores)
      : 0;

    return {
      ...axisConfig,
      maxStack,
      members: visibleMembers.sort((a, b) => a.position - b.position || a.stackIndex - b.stackIndex),
      overflowBuckets: overflowBuckets.sort((a, b) => a.position - b.position),
      poles:
        axisConfig.axisKey === "plan"
          ? ["Dreamer", "Doer"]
          : axisConfig.axisKey === "decide"
            ? ["Feel It", "Think It"]
            : ["Solo", "Together"],
      spread,
    };
  });
}

function hasCurrentAssessment(participant: ParticipantRecord, assessmentType: string) {
  return Boolean(currentSnapshotForParticipant(participant, assessmentType));
}

function coupleAssessmentReady(participants: ParticipantRecord[], assessmentType: string) {
  return participants.length === 2 && participants.every((participant) => hasCurrentAssessment(participant, assessmentType));
}

function normalizedDuplicateName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function duplicateNameGroups(participants: ParticipantRecord[]) {
  const groups = new Map<string, ParticipantRecord[]>();

  for (const participant of participants) {
    const key = normalizedDuplicateName(participant.name);
    if (!key || key === "unnamedparticipant") continue;
    const current = groups.get(key) ?? [];
    current.push(participant);
    groups.set(key, current);
  }

  return Array.from(groups.values())
    .filter((items) => items.length > 1)
    .map((items) => ({
      count: items.length,
      label: items[0]?.name ?? "Possible duplicate",
      emails: items.map((item) => item.email).filter(Boolean),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

async function fetchAssessmentSnapshots({
  isAdmin,
  participantIds,
}: {
  isAdmin: boolean;
  participantIds: string[];
}) {
  const supabase = createSupabaseAdminClient();
  const pageSize = 1000;
  const snapshots: AssessmentSnapshot[] = [];

  if (!isAdmin && !participantIds.length) {
    return snapshots;
  }

  for (let page = 0; page < 10; page += 1) {
    let query = supabase
      .from("assessment_snapshots")
      .select(
        "id,assessment_type,created_at,participant_id,scores,source,source_submitted_at,assessment_participants(id,display_name,normalized_email)",
      )
      .order("source_submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);

    if (!isAdmin) {
      query = query.in("participant_id", participantIds);
    }

    const { data } = await query;
    const pageSnapshots = (data ?? []) as AssessmentSnapshot[];
    snapshots.push(...pageSnapshots);

    if (pageSnapshots.length < pageSize) {
      break;
    }
  }

  return snapshots;
}

async function getCommandCenterData({
  isAdmin,
  userId,
}: {
  isAdmin: boolean;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data: groups } = await supabase
    .from("assessment_groups")
    .select("id,name,group_type,description,status,owner_user_id,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  const visibleGroups = ((groups ?? []) as AssessmentGroup[]).filter(
    (group) => isAdmin || group.owner_user_id === userId,
  );
  const groupIds = visibleGroups.map((group) => group.id);
  const membershipQuery = supabase
    .from("assessment_group_members")
    .select("id,group_id,participant_id,membership_status,assessment_participants(id,display_name,normalized_email)")
    .eq("membership_status", "active");
  const { data: memberships } = groupIds.length
    ? await membershipQuery.in("group_id", groupIds)
    : { data: [] };
  const participantIds = ((memberships ?? []) as AssessmentGroupMember[]).map(
    (membership) => membership.participant_id,
  );
  const snapshots = await fetchAssessmentSnapshots({ isAdmin, participantIds });

  return {
    groups: visibleGroups,
    memberships: (memberships ?? []) as AssessmentGroupMember[],
    snapshots,
  };
}

export default async function CommandCenterPage({ searchParams }: CommandCenterPageProps) {
  const params = await searchParams;
  const isOwnerPreview = isOwnerPreviewRequest(params);
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user && !isOwnerPreview) {
    redirect(`/login?next=${encodeURIComponent("/command-center")}`);
  }

  const isAdmin = isOwnerPreview || isDyddAdminEmail(user?.email);
  const data = await getCommandCenterData({ isAdmin, userId: user?.id ?? "owner-preview" });
  const participants = groupParticipants(data.snapshots, data.memberships, data.groups);
  const activeGroup = data.groups.find((group) => group.id === params?.group) ?? null;
  const defaultParticipants = participants.filter(
    (participant) => !isParticipantInExcludedDefaultGroup(participant, data.groups),
  );
  const filteredParticipants = filterParticipants(participants, {
    assessment: params?.assessment,
    from: params?.from,
    group: params?.group,
    q: params?.q,
    sort: params?.sort,
    to: params?.to,
  });
  const showExcludedGroupRecords = activeGroup ? isExcludedDefaultGroup(activeGroup) : false;
  const filteredMainParticipants = showExcludedGroupRecords
    ? filteredParticipants
    : filteredParticipants.filter(
        (participant) => !isParticipantInExcludedDefaultGroup(participant, data.groups),
      );
  const populationParticipants = activeGroup
    ? participants.filter(
        (participant) =>
          isParticipantInGroup(participant, activeGroup.id) &&
          (showExcludedGroupRecords || !isParticipantInExcludedDefaultGroup(participant, data.groups)),
      )
    : defaultParticipants;
  const candidatePool = showExcludedGroupRecords ? participants : defaultParticipants;
  const activeGroupCandidates = activeGroup
    ? filterParticipants(candidatePool, {
        q: params?.q,
        sort: params?.sort ?? "name",
      })
        .filter((participant) => !isParticipantInGroup(participant, activeGroup.id))
    : [];
  const populationSnapshots = populationParticipants.flatMap((participant) =>
    activeGroup ? latestAssessmentSnapshots(participant.snapshots, true) : participant.snapshots,
  );
  const snapshotCount = populationSnapshots.length;
  const overallAssessmentCounts = assessmentCounts(populationSnapshots);
  const filteredSnapshots = filteredMainParticipants.flatMap((participant) =>
    activeGroup ? latestAssessmentSnapshots(participant.snapshots, true) : participant.snapshots,
  );
  const filteredAssessmentCounts = assessmentCounts(filteredSnapshots);
  const topGiftSignals = topSpiritualGiftSignals(filteredSnapshots);
  const topDesignId = topDesignIdSignals(filteredSnapshots);
  const topDesignPd = topDesignPdSignals(filteredSnapshots);
  const insightScope = activeGroup ? activeGroup.name : params?.q ? "Current search" : "Current view";
  const shouldShowLatestOnly = Boolean(activeGroup);
  const displayParticipants = shouldShowLatestOnly
    ? filteredMainParticipants.map((participant) => ({
        ...participant,
        snapshots: latestAssessmentSnapshots(participant.snapshots, true),
      }))
    : filteredMainParticipants;
  const showCoupleComparison = activeGroup?.group_type === "couple";
  const showGroupInterpretation = Boolean(activeGroup && !showCoupleComparison && displayParticipants.length > 1);
  const groupGiftTopSignals = showGroupInterpretation
    ? groupSpiritualGiftTopSignals(displayParticipants)
    : [];
  const groupDesignId = showGroupInterpretation
    ? groupDesignIdStats(displayParticipants)
    : { primaryCounts: [], reflectionScores: [], strongestAverage: null };
  const groupDesignPd = showGroupInterpretation
    ? groupDesignPdAxes(displayParticipants)
    : [];
  const widestDesignPdAxis = [...groupDesignPd].sort((a, b) => b.spread - a.spread)[0] ?? null;
  const circleParticipants = showCoupleComparison ? displayParticipants.slice(0, 2) : [];
  const hasTwoCoupleMembers = circleParticipants.length === 2;
  const coupleHasSpiritualGifts = coupleAssessmentReady(circleParticipants, "spiritual_gifts");
  const coupleHasDesignId = coupleAssessmentReady(circleParticipants, "designid");
  const coupleHasDesignPd = coupleAssessmentReady(circleParticipants, "designpd");
  const canShowCoupleDesignPd = isAdmin;
  const coupleReportReady = hasTwoCoupleMembers && (coupleHasSpiritualGifts || coupleHasDesignId || (canShowCoupleDesignPd && coupleHasDesignPd));
  const circleMembers = showCoupleComparison ? comparisonMembers(circleParticipants) : [];
  const giftComparisonRows = coupleHasSpiritualGifts
    ? spiritualGiftRows(circleParticipants, circleMembers)
    : [];
  const missingGiftLabels = coupleHasSpiritualGifts
    ? missingSpiritualGiftLabels(giftComparisonRows)
    : [];
  const designIdComparison = coupleHasDesignId
    ? designIdComparisonMembers(circleParticipants, circleMembers)
    : [];
  const designPdComparison = canShowCoupleDesignPd && coupleHasDesignPd
    ? designPdComparisonAxes(circleParticipants, circleMembers)
    : [];
  const coupleReportHref = activeGroup && coupleReportReady
    ? `/api/command-center/couple-report?${new URLSearchParams({
        group: activeGroup.id,
        ...(isOwnerPreview ? { key: params?.key ?? "", review: "owner" } : {}),
      }).toString()}`
    : "";

  return (
    <main className="command-center-shell">
      <section className="command-center-hero">
        <div>
          <p className="section-label">DYDD Command Center</p>
          <h1>{isAdmin ? "Kingdom overview" : "Camp Circle owner dashboard"}</h1>
          <p>
            Search people, review completed assessments, open available reports,
            and organize participants into classes, circles, couples, workshops,
            or teams.
          </p>
        </div>
        <div className="command-center-hero-card">
          <AppNavIcon name="group" />
          <span>{isAdmin ? "Full oversight" : "Owned groups"}</span>
          <strong>{populationParticipants.length}</strong>
          <small>{activeGroup ? "people in this group view" : "people in the default view"}</small>
        </div>
      </section>

      {params?.message ? <p className="command-center-message">{params.message}</p> : null}
      {isOwnerPreview ? (
        <p className="command-center-message">
          Private owner access is open. Group creation and assignments are enabled for this protected owner link.
        </p>
      ) : null}

      <section className="command-center-metrics" aria-label="Assessment command center summary">
        <article>
          <span>{activeGroup ? "Group records" : "Default records"}</span>
          <strong>{snapshotCount}</strong>
          <small>{populationParticipants.length} people represented</small>
        </article>
        {assessmentOrder.slice(0, 4).map((assessmentType) => (
          <article key={assessmentType}>
            <span>{assessmentLabels[assessmentType]}</span>
            <strong>{overallAssessmentCounts[assessmentType] ?? 0}</strong>
            <small>Saved results</small>
          </article>
        ))}
        <article>
          <span>Groups</span>
          <strong>{data.groups.length}</strong>
          <small>Classes, circles, couples, and teams</small>
        </article>
        <article>
          <span>Current filter</span>
          <strong>{filteredMainParticipants.length}</strong>
          <small>
            {filteredSnapshots.length} records across {uniqueParticipantCount(filteredSnapshots)} people
          </small>
        </article>
      </section>

      <section className="command-center-insights" aria-label="Assessment analytics">
        <div className="command-center-panel-heading">
          <p className="section-label">{insightScope}</p>
          <h2>Assessment signals</h2>
        </div>
        <div className="command-center-insight-grid">
          <article className="command-center-insight-card">
            <span>Assessment mix</span>
            {assessmentOrder.slice(0, 4).map((assessmentType) => {
              const count = filteredAssessmentCounts[assessmentType] ?? 0;
              const max = Math.max(...Object.values(filteredAssessmentCounts), 1);

              return (
                <div className="command-center-bar-row" key={assessmentType}>
                  <small>{assessmentLabels[assessmentType]}</small>
                  <div aria-hidden="true">
                    <i style={{ width: `${Math.max((count / max) * 100, count ? 8 : 0)}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </article>
          <article className="command-center-insight-card">
            <span>Recurring Spiritual Gifts</span>
            {topGiftSignals.length ? (
              topGiftSignals.map((item) => (
                <div className="command-center-rank-row" key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.count}</strong>
                </div>
              ))
            ) : (
              <p className="command-center-empty">No Spiritual Gifts results in this view yet.</p>
            )}
          </article>
          <article className="command-center-insight-card">
            <span>DesignID primary reflections</span>
            {topDesignId.length ? (
              topDesignId.map((item) => (
                <div className="command-center-rank-row" key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.count}</strong>
                </div>
              ))
            ) : (
              <p className="command-center-empty">No DesignID results in this view yet.</p>
            )}
          </article>
          <article className="command-center-insight-card">
            <span>DesignPD tendencies</span>
            {topDesignPd.length ? (
              topDesignPd.map((item) => (
                <div className="command-center-rank-row" key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.count}</strong>
                </div>
              ))
            ) : (
              <p className="command-center-empty">No DesignPD results in this view yet.</p>
            )}
          </article>
        </div>

        {showCoupleComparison ? (
          <section className="command-center-circle-visuals" aria-label="Couple group comparison visuals">
            <div className="command-center-panel-heading">
              <p className="section-label">Couple comparison</p>
              <h2>Marriage Design overlap view</h2>
            </div>
            <div className="circle-visual-grid">
              <article className="circle-visual-card spiritual-gift-overlap">
                <span>Spiritual Gifts overlap</span>
                {!hasTwoCoupleMembers ? (
                  <p className="command-center-empty">Add two active people to this couple group to begin the overlap view.</p>
                ) : giftComparisonRows.length ? (
                  <>
                    <div className="gift-overlap-table">
                      {giftComparisonRows.slice(0, 10).map((row) => (
                        <div className={row.owners.length > 1 ? "shared" : ""} key={row.gift}>
                          <strong>{row.gift}</strong>
                          <small className="gift-owner-pills">
                            {row.owners
                              .map((owner) => (
                                <span
                                  key={`${row.gift}-${owner.initials}-${owner.rank}`}
                                  style={{ "--member-color": owner.color } as CSSProperties}
                                >
                                  {owner.initials} #{owner.rank}
                                </span>
                              ))}
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className="gift-gap-strip">
                      <strong>Not in either current top five</strong>
                      {missingGiftLabels.length ? (
                        <small className="gift-gap-list">
                          {missingGiftLabels.map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </small>
                      ) : (
                        <small>No gaps found from the saved gift list.</small>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="command-center-empty">Spiritual Gifts overlap will appear after both partners have a current Spiritual Gifts result.</p>
                )}
              </article>

              <article className="circle-visual-card designid-capacity-card">
                <span>DesignID capacity overlay</span>
                {!hasTwoCoupleMembers ? (
                  <p className="command-center-empty">Add two active people to this couple group to begin the capacity overlay.</p>
                ) : designIdComparison.length ? (
                  <div className="designid-radar-wrap">
                    <svg viewBox="0 0 320 320" role="img" aria-label="DesignID reflection capacity comparison">
                      {designIdGridScales.map((grid) => (
                        <g key={grid.label}>
                          <polygon
                            className="designid-grid-ring"
                            points={designIdPolygonPoints(designIdScoreFields.map(() => ({ value: designIdMaxScore * grid.scale })))}
                          />
                          <text className="designid-grid-label" x={grid.x} y={grid.y}>
                            {grid.label}
                          </text>
                        </g>
                      ))}
                      <line className="designid-axis-line" x1="160" x2="160" y1="48" y2="272" />
                      <line className="designid-axis-line" x1="48" x2="272" y1="160" y2="160" />
                      {designIdComparison.map((member) => (
                        <g key={member.id}>
                          <polygon
                            className="designid-member-shape"
                            points={designIdPolygonPoints(member.scores)}
                            style={{ "--member-color": member.color } as CSSProperties}
                          />
                          {member.scores.map((score, scoreIndex) => {
                            const angle = (-90 + scoreIndex * 90) * (Math.PI / 180);
                            const distance = Math.max(0, Math.min(score.value / designIdMaxScore, 1)) * designIdRadarRadius;
                            const x = designIdRadarCenter + Math.cos(angle) * distance;
                            const y = designIdRadarCenter + Math.sin(angle) * distance;

                            return (
                              <g key={`${member.id}-${score.label}`}>
                                <circle
                                  className="designid-member-dot"
                                  cx={x}
                                  cy={y}
                                  r="9"
                                  style={{ "--member-color": member.color } as CSSProperties}
                                />
                                <text className="designid-member-initials" x={x} y={y}>{member.initials}</text>
                              </g>
                            );
                          })}
                        </g>
                      ))}
                      {designIdScoreFields.map((field, index) => {
                        const labelPoints = [
                          { x: 160, y: 24 },
                          { x: 288, y: 164 },
                          { x: 160, y: 298 },
                          { x: 34, y: 164 },
                        ];
                        const point = labelPoints[index];

                        return (
                          <text className="designid-axis-label" key={field.label} x={point.x} y={point.y}>
                            {field.label}
                          </text>
                        );
                      })}
                    </svg>
                    <div className="circle-visual-legend">
                      {designIdComparison.map((member) => (
                        <div key={member.id}>
                          <i style={{ background: member.color }} />
                          <strong>{member.initials}</strong>
                          <small>{member.name}</small>
                        </div>
                      ))}
                    </div>
                    <div className="designid-score-table" aria-label="DesignID reflection score table">
                      <div className="designid-score-table-head">
                        <span>Person</span>
                        {designIdScoreFields.map((field) => (
                          <span key={field.label}>{field.label}</span>
                        ))}
                      </div>
                      {designIdComparison.map((member) => (
                        <div className="designid-score-table-row" key={`${member.id}-scores`}>
                          <strong>
                            <i style={{ background: member.color }} />
                            {member.initials}
                          </strong>
                          {member.scores.map((score) => (
                            <span key={`${member.id}-${score.label}-score`}>{score.value}</span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="command-center-empty">DesignID capacity overlay will appear after both partners have a current DesignID result.</p>
                )}
              </article>

              <article className="circle-visual-card designpd-axis-card">
                <span>DesignPD tendencies</span>
                {!hasTwoCoupleMembers ? (
                  <p className="command-center-empty">Add two active people to this couple group to begin the tendency view.</p>
                ) : !canShowCoupleDesignPd ? (
                  <div className="couple-designpd-note">
                    <strong>DesignPD is a deeper paid layer.</strong>
                    <p>
                      Couple-facing reports can include Spiritual Gifts and DesignID first. DesignPD tendencies will appear here after that layer is unlocked.
                    </p>
                    <Link href="/field-kit">Explore DesignPD</Link>
                  </div>
                ) : designPdComparison.some((axis) => axis.members.length) ? (
                  <div className="designpd-axis-stack">
                    {designPdComparison.map((axis) => (
                      <div className="designpd-axis-row" key={axis.axisKey}>
                        <div className="designpd-axis-heading">
                          <strong>{axis.label}</strong>
                        </div>
                        <div className="designpd-axis-track">
                          <small>{axis.poles[0]}</small>
                          <div>
                            <i />
                            {axis.members.map((member) => (
                              <b
                                key={member.id}
                                style={{
                                  "--member-color": member.color,
                                  left: `${member.position}%`,
                                } as CSSProperties}
                                title={`${member.name}: ${member.tendency} (${member.score})`}
                              >
                                {member.initials}
                              </b>
                            ))}
                          </div>
                          <small>{axis.poles[1]}</small>
                        </div>
                      </div>
                    ))}
                    <div className="designpd-gap-row" aria-label="DesignPD tendency gaps">
                      {designPdComparison.map((axis) => {
                        const gap = designPdAxisGap(axis.members);

                        return (
                          <div key={`${axis.axisKey}-gap`}>
                            <small>{axis.label} gap</small>
                            <strong>{gap ?? "-"}</strong>
                          </div>
                        );
                      })}
                    </div>
                    <div className="designpd-score-key" aria-label="DesignPD tendency score key">
                      {circleMembers.slice(0, 2).map((member) => {
                        const memberAxes = designPdComparison
                          .map((axis) => {
                            const axisMember = axis.members.find((item) => item.id === member.id);
                            return axisMember ? `${axis.label}: ${axisMember.tendency} (${axisMember.score})` : "";
                          })
                          .filter(Boolean);

                        if (!memberAxes.length) return null;

                        return (
                          <div key={member.id}>
                            <i style={{ background: member.color }} />
                            <strong>{member.initials}</strong>
                            <small>{memberAxes.join(" | ")}</small>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="command-center-empty">DesignPD tendencies will appear after both partners have a current DesignPD result.</p>
                )}
              </article>
            </div>
            {coupleReportHref ? (
              <div className="couple-report-download">
                <div>
                  <strong>Marriage Design PDF</strong>
                  <small>
                    Download a Marriage Design artifact from the current completed sections
                    {canShowCoupleDesignPd ? ", including DesignPD when available" : ". DesignPD can be unlocked as a deeper layer"}.
                  </small>
                </div>
                <a href={coupleReportHref}>Download your couples report</a>
              </div>
            ) : showCoupleComparison ? (
              <div className="couple-report-download couple-report-download-disabled">
                <div>
                  <strong>Marriage Design PDF</strong>
                  <small>The download appears after both partners have Spiritual Gifts or DesignID results. DesignPD is added when unlocked.</small>
                </div>
                <span>Waiting for matching couple data</span>
              </div>
            ) : null}
          </section>
        ) : null}

        {showGroupInterpretation ? (
          <section className="command-center-group-interpretation" aria-label="Group data interpretation visuals">
            <div className="command-center-panel-heading">
              <p className="section-label">Group interpretation</p>
              <h2>{activeGroup?.name} group dashboard</h2>
            </div>
            <div className="group-interpretation-summary">
              <article>
                <span>Spiritual Gifts read</span>
                <strong>{groupGiftTopSignals[0]?.label ?? "Waiting for gifts"}</strong>
                <small>
                  {groupGiftTopSignals[0]
                    ? `${groupGiftTopSignals[0].count} people list this as their current #1 gift.`
                    : "Top-gift concentration appears after Spiritual Gifts results are saved."}
                </small>
              </article>
              <article>
                <span>DesignID center of gravity</span>
                <strong>{groupDesignId.strongestAverage?.label ?? "Waiting for DesignID"}</strong>
                <small>
                  {groupDesignId.strongestAverage
                    ? `Highest average reflection score: ${groupDesignId.strongestAverage.average}.`
                    : "Reflection averages appear after DesignID results are saved."}
                </small>
              </article>
              <article>
                <span>DesignPD widest spread</span>
                <strong>{widestDesignPdAxis?.label ?? "Waiting for DesignPD"}</strong>
                <small>
                  {widestDesignPdAxis?.members.length
                    ? `${widestDesignPdAxis.spread} points from one side of the tendency line to the other.`
                    : "Group tendency spread appears after DesignPD results are saved."}
                </small>
              </article>
            </div>

            <div className="group-visual-grid">
              <article className="group-visual-card group-gifts-card">
                <span>Spiritual Gifts current #1 distribution</span>
                <p>
                  This counts only each person&apos;s current top gift, then notes how often that same gift appears anywhere in the top five.
                </p>
                {groupGiftTopSignals.length ? (
                  <div className="group-horizontal-bars">
                    {groupGiftTopSignals.slice(0, 12).map((item) => {
                      const max = Math.max(...groupGiftTopSignals.map((signal) => signal.count), 1);

                      return (
                        <div className="group-horizontal-bar-row" key={item.label}>
                          <small>{item.label}</small>
                          <div aria-hidden="true">
                            <i style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }} />
                          </div>
                          <strong>{item.count}</strong>
                          <em>{item.topFiveCount} top 5</em>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="command-center-empty">No current Spiritual Gifts top-one data in this group yet.</p>
                )}
              </article>

              <article className="group-visual-card group-designid-card">
                <span>DesignID group capacity bars</span>
                <p>
                  This uses the current DesignID scores to show the group&apos;s average capacity across the four reflections.
                </p>
                {groupDesignId.reflectionScores.some((item) => item.recordCount) ? (
                  <div className="group-designid-bars">
                    {groupDesignId.reflectionScores.map((item) => (
                      <div className={`group-designid-bar-row ${item.label.toLowerCase()}`} key={item.label}>
                        <div>
                          <strong>{item.label}</strong>
                          <small>{item.highCount} people at 45+</small>
                        </div>
                        <div aria-hidden="true">
                          <i style={{ width: `${Math.max((item.average / designIdMaxScore) * 100, item.average ? 8 : 0)}%` }} />
                        </div>
                        <b>{item.average}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="command-center-empty">No current DesignID score data in this group yet.</p>
                )}
                {groupDesignId.primaryCounts.length ? (
                  <div className="group-primary-strip">
                    <strong>Primary reflection count</strong>
                    <div>
                      {groupDesignId.primaryCounts.map((item) => (
                        <span key={item.label}>{item.label}: {item.count}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            </div>

            <article className="group-visual-card group-designpd-card">
              <span>DesignPD group tendency map</span>
              <p>
                Each bubble is one person&apos;s initials. Matching or near-matching scores stack vertically so the group cluster stays visible.
              </p>
              {groupDesignPd.some((axis) => axis.members.length) ? (
                <div className="group-designpd-heatmap">
                  {groupDesignPd.map((axis) => (
                    <div className="group-designpd-axis" key={axis.axisKey}>
                      <div className="group-designpd-axis-title">
                        <strong>{axis.label}</strong>
                        <small>{axis.spread} point spread</small>
                      </div>
                      <div className="group-designpd-axis-track">
                        <small>{axis.poles[0]}</small>
                        <div
                          style={{ minHeight: `${160 + axis.maxStack * 27}px` }}
                        >
                          <div className="group-designpd-tick-row" aria-hidden="true">
                            {designPdTickMarks.map((tick) => (
                              <span
                                key={`${axis.axisKey}-${tick}`}
                                style={{ left: `${50 + tick / designPdMaxAxisScore * 50}%` }}
                              >
                                {Math.abs(tick)}
                              </span>
                            ))}
                          </div>
                          <i />
                          {axis.members.map((member) => (
                            <b
                              key={`${axis.axisKey}-${member.id}`}
                              style={{
                                left: `${member.position}%`,
                                top: `${76 + member.stackIndex * 27}px`,
                              }}
                              title={`${member.name}: ${member.tendency} (${member.signedScore > 0 ? "+" : ""}${member.signedScore})`}
                            >
                              {member.initials}
                            </b>
                          ))}
                          {axis.overflowBuckets.map((bucket) => (
                            <div
                              className="group-designpd-overflow"
                              key={`${axis.axisKey}-overflow-${bucket.bucket}`}
                              style={{ left: `${bucket.position}%` }}
                            >
                              <span />
                              <strong>+{bucket.count}</strong>
                              <small>
                                {bucket.members.map((member) => (
                                  <b
                                    key={`${axis.axisKey}-overflow-${member.id}`}
                                    title={`${member.name}: ${member.tendency} (${member.signedScore > 0 ? "+" : ""}${member.signedScore})`}
                                  >
                                    {member.initials}
                                  </b>
                                ))}
                              </small>
                            </div>
                          ))}
                        </div>
                        <small>{axis.poles[1]}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="command-center-empty">No current DesignPD tendency data in this group yet.</p>
              )}
            </article>
          </section>
        ) : null}
      </section>

      <section className="command-center-layout">
        <aside className="command-center-panel command-center-groups">
          <div className="command-center-panel-heading">
            <p className="section-label">Groups and batches</p>
            <h2>Create a container</h2>
          </div>
          <form action={createAssessmentGroup} className="command-center-form">
            {isOwnerPreview ? (
              <>
                <input name="review" type="hidden" value="owner" />
                <input name="key" type="hidden" value={params?.key ?? ""} />
              </>
            ) : null}
            <label>
              Group name
              <input name="name" placeholder="Grace Church Gifts Class" required />
            </label>
            <label>
              Type
              <select name="group_type" defaultValue="class_cohort">
                {Object.entries(groupTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Note
              <textarea
                name="description"
                placeholder="Optional context: class date, church, cohort, or workshop."
                rows={3}
              />
            </label>
            <button className="button primary" type="submit">
              Create Group
            </button>
          </form>

          <div className="command-center-group-list">
            <small className="command-center-group-list-label">Group views</small>
            <Link
              className={!params?.group ? "active" : ""}
              href={commandCenterHref({}, params)}
            >
              <span>All people</span>
              <small>{defaultParticipants.length} people, excluding John&apos;s Tests</small>
            </Link>
            {data.groups.map((group) => {
              const countExcludedGroupRecords = isExcludedDefaultGroup(group);
              const memberCount = participants.filter(
                (participant) =>
                  isParticipantInGroup(participant, group.id) &&
                  (countExcludedGroupRecords ||
                    !isParticipantInExcludedDefaultGroup(participant, data.groups)),
              ).length;

              return (
                <Link
                  className={params?.group === group.id ? "active" : ""}
                  href={commandCenterHref({ group: group.id }, params)}
                  key={group.id}
                >
                  <span>{group.name}</span>
                  <small>
                    {groupTypeLabels[group.group_type] ?? "Group"} | {memberCount} people
                  </small>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="command-center-panel command-center-results">
          <div className="command-center-panel-heading">
            <p className="section-label">
              {activeGroup ? activeGroup.name : "Assessment records"}
            </p>
            <h2>People and reports</h2>
          </div>

          <form className="command-center-filters">
            {isOwnerPreview ? (
              <>
                <input name="review" type="hidden" value="owner" />
                <input name="key" type="hidden" value={params?.key ?? ""} />
              </>
            ) : null}
            {params?.group ? <input name="group" type="hidden" value={params.group} /> : null}
            <input
              defaultValue={params?.q ?? ""}
              name="q"
              placeholder="Search by name or email"
              type="search"
            />
            <select defaultValue={params?.assessment ?? ""} name="assessment">
              <option value="">All assessments</option>
              {Object.entries(assessmentLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="command-center-date-filter">
              From
              <input defaultValue={inputDateValue(params?.from)} name="from" type="date" />
            </label>
            <label className="command-center-date-filter">
              To
              <input defaultValue={inputDateValue(params?.to)} name="to" type="date" />
            </label>
            <select defaultValue={params?.sort ?? "recent"} name="sort">
              <option value="recent">Newest first</option>
              <option value="name">Name A-Z</option>
              <option value="oldest">Oldest first</option>
            </select>
            <button className="button secondary" type="submit">
              Filter
            </button>
          </form>

          {!activeGroup && data.groups.length && filteredMainParticipants.length ? (
            <section className="command-center-add-panel">
              <div className="command-center-panel-heading">
                <p className="section-label">Batch group add</p>
                <h2>Add selected people to a group</h2>
              </div>
              <form action={assignParticipantsToAssessmentGroup} className="command-center-batch-form">
                <input name="assessment" type="hidden" value={params?.assessment ?? ""} />
                <input name="current_group" type="hidden" value={params?.group ?? ""} />
                <input name="from" type="hidden" value={params?.from ?? ""} />
                <input name="q" type="hidden" value={params?.q ?? ""} />
                <input name="sort" type="hidden" value={params?.sort ?? ""} />
                <input name="to" type="hidden" value={params?.to ?? ""} />
                {isOwnerPreview ? (
                  <>
                    <input name="review" type="hidden" value="owner" />
                    <input name="key" type="hidden" value={params?.key ?? ""} />
                  </>
                ) : null}
                <div className="command-center-batch-controls">
                  <select name="group_id" required defaultValue="">
                    <option value="" disabled>
                      Choose group
                    </option>
                    {data.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <button className="button secondary" type="submit">
                    Add selected
                  </button>
                </div>
                <div className="command-center-check-list">
                  {filteredMainParticipants.map((participant) => (
                    <label key={participant.id}>
                      <input name="participant_id" type="checkbox" value={participant.id} />
                      <span>
                        <strong>{participant.name}</strong>
                        <small>
                          {participant.email} | {participant.snapshots.length} saved assessment
                          {participant.snapshots.length === 1 ? "" : "s"}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </form>
            </section>
          ) : null}

          <div className="command-center-person-list">
            {displayParticipants.length ? (
              displayParticipants.map((participant) => (
                <article className="command-center-person" key={participant.id}>
                  <div className="command-center-person-header">
                    <div>
                      <h3>{participant.name}</h3>
                      <p>{participant.email}</p>
                    </div>
                    <form action={assignParticipantToAssessmentGroup}>
                      <input name="participant_id" type="hidden" value={participant.id} />
                      <input name="assessment" type="hidden" value={params?.assessment ?? ""} />
                      <input name="current_group" type="hidden" value={params?.group ?? ""} />
                      <input name="from" type="hidden" value={params?.from ?? ""} />
                      <input name="q" type="hidden" value={params?.q ?? ""} />
                      <input name="sort" type="hidden" value={params?.sort ?? ""} />
                      <input name="to" type="hidden" value={params?.to ?? ""} />
                      {isOwnerPreview ? (
                        <>
                          <input name="review" type="hidden" value="owner" />
                          <input name="key" type="hidden" value={params?.key ?? ""} />
                        </>
                      ) : null}
                      <select name="group_id" required defaultValue="">
                        <option value="" disabled>
                          Assign to group
                        </option>
                        {data.groups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <button className="button secondary" type="submit">
                        Add
                      </button>
                    </form>
                  </div>

                  {participant.groups.length ? (
                    <div className="command-center-group-tags">
                      {participant.groups.map((membership) => {
                        const group = data.groups.find((item) => item.id === membership.group_id);

                        return group ? (
                          <form action={archiveAssessmentGroupMember} key={membership.id}>
                            <input name="group_id" type="hidden" value={group.id} />
                            <input name="membership_id" type="hidden" value={membership.id} />
                            {isOwnerPreview ? (
                              <>
                                <input name="review" type="hidden" value="owner" />
                                <input name="key" type="hidden" value={params?.key ?? ""} />
                              </>
                            ) : null}
                            <button type="submit" title="Remove from active group view">
                              {group.name}
                            </button>
                          </form>
                        ) : null;
                      })}
                    </div>
                  ) : null}

                  <div className="command-center-assessment-grid">
                    {participant.snapshots.length ? (
                      participant.snapshots.map((snapshot) => {
                        const href = reportHref(snapshot, params);
                        const details = snapshotDetails(snapshot);

                        return (
                          <section className="command-center-assessment" key={snapshot.id}>
                            <span>{assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type}</span>
                            <strong>{snapshotSummary(snapshot)}</strong>
                            <small>
                              {displayDate(snapshot.source_submitted_at ?? snapshot.created_at)}
                              {snapshot.source ? ` | ${snapshot.source}` : ""}
                            </small>
                            {details.length ? (
                              <dl className="command-center-score-list">
                                {details.map((detail) => (
                                  <div key={`${snapshot.id}-${detail.label}`}>
                                    <dt>{detail.label}</dt>
                                    <dd>{detail.value}</dd>
                                  </div>
                                ))}
                              </dl>
                            ) : null}
                            {href ? (
                              <Link className="button text" href={href} target="_blank" rel="noreferrer">
                                Open Report
                              </Link>
                            ) : (
                              <em>No report link saved yet</em>
                            )}
                            <Link
                              className="button text"
                              href={artifactHref(snapshot, params)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download Snapshot
                            </Link>
                          </section>
                        );
                      })
                    ) : (
                      <p className="command-center-empty">
                        This person is in a group, but no assessment snapshot is visible yet.
                      </p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="command-center-empty large">
                <h3>{activeGroup ? "This group is empty." : "No people match this view."}</h3>
                <p>
                  {activeGroup
                    ? "Use the add-to-group list below to place recent assessment people into this group."
                    : "Clear the filters or choose a different group."}
                </p>
              </div>
            )}
          </div>

          {activeGroup ? (
            <section className="command-center-add-panel">
              <div className="command-center-panel-heading">
                <p className="section-label">Add people</p>
                <h2>Add people to {activeGroup.name}</h2>
              </div>
              {activeGroupCandidates.length ? (
                <form action={assignParticipantsToAssessmentGroup} className="command-center-batch-form">
                  <input name="group_id" type="hidden" value={activeGroup.id} />
                  <input name="return_to_group" type="hidden" value="true" />
                  {isOwnerPreview ? (
                    <>
                      <input name="review" type="hidden" value="owner" />
                      <input name="key" type="hidden" value={params?.key ?? ""} />
                    </>
                  ) : null}
                  <div className="command-center-check-list">
                    {activeGroupCandidates.map((participant) => (
                      <label key={participant.id}>
                        <input name="participant_id" type="checkbox" value={participant.id} />
                        <span>
                        <strong>{participant.name}</strong>
                        <small>
                          {participant.email} | {participant.snapshots.length} saved assessment
                          {participant.snapshots.length === 1 ? "" : "s"}
                        </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  <button className="button secondary" type="submit">
                    Add selected to {activeGroup.name}
                  </button>
                </form>
              ) : (
                <p className="command-center-empty">
                  Everyone matching the current search is already in this group.
                </p>
              )}
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}

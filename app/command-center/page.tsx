import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNavIcon } from "@/components/app-sidebar";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { canonicalizeParticipantEmail } from "@/lib/identity/email";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveAssessmentGroupMember,
  assignParticipantToAssessmentGroup,
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
  name: string;
  participantIds: string[];
  snapshots: AssessmentSnapshot[];
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
  return canonicalizeParticipantEmail(email) || participantId || "unknown-participant";
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

function designIdSummary(snapshot: AssessmentSnapshot) {
  const primary =
    firstSnapshotValue(snapshot, ["primaryReflection", "primary", "Primary_Reflection", "Primary"]);
  const secondary =
    firstSnapshotValue(snapshot, ["secondaryReflection", "secondary", "Secondary_Reflection", "Secondary"]);

  return [primary, secondary].filter(Boolean).join(" / ") || "DesignID saved";
}

function designPdSummary(snapshot: AssessmentSnapshot) {
  const axis = snapshot.scores?.axisTendencies;

  if (typeof axis === "object" && axis !== null && !Array.isArray(axis)) {
    return Object.entries(axis as Record<string, unknown>)
      .map(([key, value]) => `${key}: ${compactValue(value)}`)
      .filter((value) => !value.endsWith(":"))
      .slice(0, 3)
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
      { label: "Primary", value: firstSnapshotValue(snapshot, ["primaryReflection", "primary", "Primary_Reflection", "Primary"]) },
      { label: "Secondary", value: firstSnapshotValue(snapshot, ["secondaryReflection", "secondary", "Secondary_Reflection", "Secondary"]) },
      { label: "Integrated", value: firstSnapshotValue(snapshot, ["Integrative_Reflection", "integrativeReflection"]) },
      { label: "Confidence", value: firstSnapshotValue(snapshot, ["confidence"]) },
    ].filter((detail) => detail.value);
  }

  if (snapshot.assessment_type === "designpd") {
    const axis = snapshot.scores?.axisTendencies;
    if (typeof axis === "object" && axis !== null && !Array.isArray(axis)) {
      return Object.entries(axis as Record<string, unknown>)
        .slice(0, 6)
        .map(([label, value]) => ({ label, value: compactValue(value) }))
        .filter((detail) => detail.value);
    }
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

function groupParticipants(snapshots: AssessmentSnapshot[], memberships: AssessmentGroupMember[]) {
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
    name,
  }: {
    email: string;
    id: string;
    name: string;
  }): ParticipantRecord {
    return {
      email,
      emailAliases: email && email !== "No email saved" ? [email] : [],
      groups: [],
      id,
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
        name: participant?.display_name ?? participant?.normalized_email ?? "Unnamed participant",
      });

    mergeParticipantRecord(current, participant);
    current.snapshots.push({ ...snapshot, participant_canonical_key: recordKey });
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
        name: participant?.display_name ?? participant?.normalized_email ?? "Unnamed participant",
      });

    mergeParticipantRecord(current, participant);
    current.groups.push(membership);
    records.set(recordKey, current);
  }

  return Array.from(records.values()).map((record) => ({
    ...record,
    snapshots: dedupeParticipantSnapshots(record.snapshots).sort(
      (a, b) => snapshotDateValue(b) - snapshotDateValue(a),
    ),
  }));
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
      .flatMap((snapshot) => {
        const axis = snapshot.scores?.axisTendencies;

        if (typeof axis === "object" && axis !== null && !Array.isArray(axis)) {
          return Object.values(axis as Record<string, unknown>).map(compactValue);
        }

        return [
          firstSnapshotValue(snapshot, ["Plan_Tendency", "planTendency"]),
          firstSnapshotValue(snapshot, ["Decide_Tendency", "decideTendency"]),
          firstSnapshotValue(snapshot, ["Do_Tendency", "doTendency"]),
        ];
      }),
  ).slice(0, 6);
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
  const participants = groupParticipants(data.snapshots, data.memberships);
  const activeGroup = data.groups.find((group) => group.id === params?.group) ?? null;
  const baseParticipants = activeGroup
    ? participants
    : participants.filter(
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
  const filteredMainParticipants = activeGroup
    ? filteredParticipants
    : filteredParticipants.filter(
        (participant) => !isParticipantInExcludedDefaultGroup(participant, data.groups),
      );
  const populationParticipants = activeGroup
    ? participants.filter((participant) => isParticipantInGroup(participant, activeGroup.id))
    : baseParticipants;
  const candidatePool =
    activeGroup && isExcludedDefaultGroup(activeGroup) ? participants : baseParticipants;
  const activeGroupCandidates = activeGroup
    ? filterParticipants(candidatePool, {
        assessment: params?.assessment,
        from: params?.from,
        q: params?.q,
        sort: params?.sort,
        to: params?.to,
      })
        .filter((participant) => !isParticipantInGroup(participant, activeGroup.id))
        .slice(0, 40)
    : [];
  const populationSnapshots = populationParticipants.flatMap((participant) => participant.snapshots);
  const snapshotCount = populationSnapshots.length;
  const overallAssessmentCounts = assessmentCounts(populationSnapshots);
  const filteredSnapshots = filteredMainParticipants.flatMap((participant) => participant.snapshots);
  const filteredAssessmentCounts = assessmentCounts(filteredSnapshots);
  const topGiftSignals = topSpiritualGiftSignals(filteredSnapshots);
  const topDesignId = topDesignIdSignals(filteredSnapshots);
  const topDesignPd = topDesignPdSignals(filteredSnapshots);
  const possibleDuplicates = duplicateNameGroups(filteredMainParticipants);
  const insightScope = activeGroup ? activeGroup.name : params?.q ? "Current search" : "Current view";

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
          <strong>{participants.length}</strong>
          <small>people with assessment records or group membership</small>
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
          <span>All loaded records</span>
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
          <article className="command-center-insight-card">
            <span>Possible duplicate people</span>
            {possibleDuplicates.length ? (
              possibleDuplicates.map((item) => (
                <div className="command-center-duplicate-row" key={item.label}>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.emails.join(" | ")}</small>
                  </div>
                  <b>{item.count}</b>
                </div>
              ))
            ) : (
              <p className="command-center-empty">No duplicate names in this view.</p>
            )}
          </article>
        </div>
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
              <small>{baseParticipants.length} people, excluding John&apos;s Tests</small>
            </Link>
            {data.groups.map((group) => {
              const memberCount = data.memberships.filter(
                (membership) => membership.group_id === group.id,
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

          <div className="command-center-person-list">
            {filteredMainParticipants.length ? (
              filteredMainParticipants.map((participant) => (
                <article className="command-center-person" key={participant.id}>
                  <div className="command-center-person-header">
                    <div>
                      <h3>{participant.name}</h3>
                      <p>{participant.email}</p>
                    </div>
                    <form action={assignParticipantToAssessmentGroup}>
                      <input name="participant_id" type="hidden" value={participant.id} />
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
                <div className="command-center-add-list">
                  {activeGroupCandidates.map((participant) => (
                    <form action={assignParticipantToAssessmentGroup} key={participant.id}>
                      <input name="participant_id" type="hidden" value={participant.id} />
                      <input name="group_id" type="hidden" value={activeGroup.id} />
                      {isOwnerPreview ? (
                        <>
                          <input name="review" type="hidden" value="owner" />
                          <input name="key" type="hidden" value={params?.key ?? ""} />
                        </>
                      ) : null}
                      <div>
                        <strong>{participant.name}</strong>
                        <small>
                          {participant.email} | {participant.snapshots.length} saved assessment
                          {participant.snapshots.length === 1 ? "" : "s"}
                        </small>
                      </div>
                      <button className="button secondary" type="submit">
                        Add
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <p className="command-center-empty">
                  Everyone matching the current filters is already in this group.
                </p>
              )}
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}

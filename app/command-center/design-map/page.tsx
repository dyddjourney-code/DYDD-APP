import Link from "next/link";
import { redirect } from "next/navigation";
import { DesignMapBuilder, type DesignMapProfile } from "./design-map-builder";
import { isDyddAdminEmail } from "@/lib/admin-access";
import {
  compactValue,
  getAssessmentSnapshotsForParticipantMatch,
  getAssessmentSnapshotsForUser,
  getLatestSnapshot,
  snapshotSection,
  type AssessmentSnapshotSummary,
  type StudentAssessmentReport,
} from "@/lib/assessments/student-context";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DesignMapPageProps = {
  searchParams?: Promise<{
    key?: string;
    review?: string;
  }>;
};

export const dynamic = "force-dynamic";

const johnLiveSheetFallbackProfile: DesignMapProfile = {
  designId: {
    architect: "27",
    artisan: "34",
    integrative: "Interpreter",
    primary: "Artisan",
    secondary: "Shepherd",
    shadow: "Overidentifying with others' feelings or losing creative voice in caretaking",
    shepherd: "32",
    steward: "7",
  },
  designPd: {
    decideCore:
      "Your deciding naturally begins with internal conviction and relational awareness.",
    decideDescriptor: "Moderate Feel It",
    decideTendency: "Moderate Feel It",
    doCore:
      "Your action naturally leans toward independent ownership and self-directed movement.",
    doDescriptor: "Moderate Solo",
    doTendency: "Moderate Solo",
    planCore:
      "Your planning is led by vision and what could be, so possibility shows up early.",
    planDescriptor: "Strong Dreamer",
    planTendency: "Strong Dreamer",
  },
  spiritualGifts: ["Apostleship", "Service", "Faith", "Giving", "Mercy"],
};

function readSnapshotValue(snapshot: AssessmentSnapshotSummary | undefined, keys: string[]) {
  if (!snapshot) return "";

  const sections = [
    snapshotSection(snapshot, "summary"),
    snapshotSection(snapshot, "profileLanguage"),
    snapshotSection(snapshot, "scores"),
    snapshot.scores,
  ];

  for (const key of keys) {
    for (const section of sections) {
      const value = compactValue(section?.[key]);
      if (value) return value;
    }
  }

  return "";
}

function spiritualGiftLabel(snapshot: AssessmentSnapshotSummary | undefined, rank: number) {
  if (!snapshot) return "";
  const topGifts = snapshot.scores?.topGifts;

  if (Array.isArray(topGifts)) {
    const gift = topGifts[rank - 1];
    if (gift && typeof gift === "object" && !Array.isArray(gift)) {
      return compactValue((gift as Record<string, unknown>).label);
    }
  }

  return readSnapshotValue(snapshot, [`Top${rank}_Name`, `Top_${rank}_Name`]);
}

function buildProfile(report: StudentAssessmentReport): DesignMapProfile {
  const designId = getLatestSnapshot(report, "designid");
  const designPd = getLatestSnapshot(report, "designpd");
  const spiritualGifts = getLatestSnapshot(report, "spiritual_gifts");
  const gifts = [1, 2, 3, 4, 5].map((rank) => spiritualGiftLabel(spiritualGifts, rank)).filter(Boolean);

  return {
    designId: {
      architect: readSnapshotValue(designId, ["Architect_Pts", "Architect"]),
      artisan: readSnapshotValue(designId, ["Artisan_Pts", "Artisan"]),
      integrative: readSnapshotValue(designId, [
        "Integrative_Reflection",
        "Integrative_Expression",
        "Integrative_Summary",
      ]),
      primary: readSnapshotValue(designId, ["Primary", "Primary_Reflection"]),
      secondary: readSnapshotValue(designId, ["Secondary", "Secondary_Reflection"]),
      shadow: readSnapshotValue(designId, [
        "Reflection_Shadow",
        "Potential_Shadow",
        "Shadow_Overview",
      ]),
      shepherd: readSnapshotValue(designId, ["Shepherd_Pts", "Shepherd"]),
      steward: readSnapshotValue(designId, ["Steward_Pts", "Steward"]),
    },
    designPd: {
      decideCore: readSnapshotValue(designPd, ["Decide_Core", "decide_core"]),
      decideDescriptor: readSnapshotValue(designPd, ["Decide_Descriptor", "decide_descriptor"]),
      decideTendency: readSnapshotValue(designPd, ["Decide_Tendency", "decide_tendency"]),
      doCore: readSnapshotValue(designPd, ["Do_Core", "do_core"]),
      doDescriptor: readSnapshotValue(designPd, ["Do_Descriptor", "do_descriptor"]),
      doTendency: readSnapshotValue(designPd, ["Do_Tendency", "do_tendency"]),
      planCore: readSnapshotValue(designPd, ["Plan_Core", "plan_core"]),
      planDescriptor: readSnapshotValue(designPd, ["Plan_Descriptor", "plan_descriptor"]),
      planTendency: readSnapshotValue(designPd, ["Plan_Tendency", "plan_tendency"]),
    },
    spiritualGifts: gifts,
  };
}

function profileHasConnectedData(profile: DesignMapProfile) {
  return Boolean(
    profile.designId.primary ||
      profile.designId.secondary ||
      profile.designPd.planTendency ||
      profile.designPd.decideTendency ||
      profile.designPd.doTendency ||
      profile.spiritualGifts.length,
  );
}

async function getDesignMapReport(userId: string, email: string, isOwnerPreview: boolean) {
  if (userId && email) {
    const report = await getAssessmentSnapshotsForUser(userId, email);
    if (report.latest.length) return report;
  }

  if (isOwnerPreview || isDyddAdminEmail(email)) {
    return getAssessmentSnapshotsForParticipantMatch({
      displayNames: ["John Willoughby"],
      emails: ["dyddjourney@gmail.com", "john@discoverdivine.design", "willoughbyhs@gmail.com"],
    });
  }

  return { all: [], latest: [] };
}

export default async function CommandCenterDesignMapPage({ searchParams }: DesignMapPageProps) {
  const params = await searchParams;
  const isOwnerPreview = isOwnerPreviewRequest(params);
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user && !isOwnerPreview) {
    redirect(`/login?next=${encodeURIComponent("/command-center/design-map")}`);
  }

  const report = await getDesignMapReport(
    user?.id ?? "",
    user?.email ?? "",
    isOwnerPreview,
  );
  const reportProfile = buildProfile(report);
  const profile = profileHasConnectedData(reportProfile)
    ? reportProfile
    : johnLiveSheetFallbackProfile;
  const connectedCount = profileHasConnectedData(reportProfile)
    ? report.latest.filter((snapshot) =>
        ["designid", "designpd", "spiritual_gifts"].includes(snapshot.assessment_type),
      ).length
    : 3;

  return (
    <main className="design-map-shell">
      <section className="design-map-hero">
        <div>
          <p className="section-label">Command Center Prototype</p>
          <h1>Design Map Workbench</h1>
          <p>
            A first draft of the one-row-at-a-time journey map, connected to
            saved DesignID, DesignPD, and Spiritual Gifts signals.
          </p>
        </div>
        <div className="design-map-status-card">
          <span>Profile layers</span>
          <strong>{connectedCount}/3</strong>
          <small>DesignID, DesignPD, and Spiritual Gifts detected for this prototype view.</small>
        </div>
      </section>

      <section className="design-map-prototype-note" aria-label="Prototype scope">
        <strong>Prototype scope:</strong>
        <span>
          Draft entries are saved in this browser only. The next step, after the
          workflow feels right, is a real database-backed Design Map record per
          participant, group, or organization.
        </span>
        <Link href="/command-center">Back to Command Center</Link>
      </section>

      <DesignMapBuilder profile={profile} />
    </main>
  );
}

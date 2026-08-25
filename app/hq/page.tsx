import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import {
  assessmentLabels,
  buildDesignIdContext,
  displayDate,
  getAssessmentSnapshotsForParticipantMatch,
  getAssessmentSnapshotsForUser,
  type StudentAssessmentReport,
  latestByAssessment,
  compactValue,
  snapshotHighlights,
  snapshotSection,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import { allCourseSummaries } from "@/lib/courses/course-catalog";
import { designIdCourse } from "@/lib/courses/designid-foundations";
import {
  canonicalizeParticipantEmail,
  normalizeEmail,
  participantEmailCandidates,
} from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  getNewReviewReport,
  heatherReviewName,
  isHeatherReviewRequest,
  isNewReviewRequest,
  jordanReviewEmail,
  newReviewName,
  type ReviewSearchParams,
  withReviewQuery,
} from "@/lib/review/heather";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminSnapshotSummary = AssessmentSnapshotSummary & {
  assessment_participants:
    | {
        display_name: string | null;
        normalized_email: string | null;
      }
    | null;
  id: string;
};

type NamedParticipantSnapshot = AssessmentSnapshotSummary;

type FruitLifeDashboardSession = {
  artifacts: Array<{
    artifact_status: string;
    artifact_type: string;
    created_at: string;
    external_url: string | null;
    filename: string | null;
    provider: string;
  }>;
  created_at: string;
  id: string;
  metadata: {
    observerLinks?: Array<{ email?: string; link?: string; name?: string; relationship?: string }>;
    selfLink?: string;
  } | null;
  observer_completed_count: number;
  observer_goal: number;
  participant_email: string | null;
  participant_name: string | null;
  report_status: string;
  report_url: string | null;
  response_count: number;
  self_completed_at: string | null;
  session_status: string;
  updated_at: string;
};

type HqPageProps = {
  searchParams?: Promise<ReviewSearchParams>;
};

const fruitTrendMetrics = [
  { color: "var(--fruit-love)", key: "Love", label: "Love" },
  { color: "var(--fruit-joy)", key: "Joy", label: "Joy" },
  { color: "var(--fruit-peace)", key: "Peace", label: "Peace" },
  { color: "var(--fruit-patience)", key: "Patience", label: "Patience" },
  { color: "var(--fruit-kindness)", key: "Kindness", label: "Kindness" },
  { color: "var(--fruit-goodness)", key: "Goodness", label: "Goodness" },
  { color: "var(--fruit-faithfulness)", key: "Faithfulness", label: "Faithfulness" },
  { color: "var(--fruit-gentleness)", key: "Gentleness", label: "Gentleness" },
  { color: "var(--fruit-selfcontrol)", key: "Self-control", label: "Self-Control" },
];

const toolCatalog = [
  {
    assessmentType: "designid",
    detail: "Identity, contribution, reflection language, and a completed report.",
    href: "#field-kit",
    label: "DesignID",
    logo: "/brand/tools/designid-logo.webp",
    price: "$20",
  },
  {
    assessmentType: "designpd",
    detail: "Plan, Decide, and Do patterns for practical daily alignment.",
    href: "#field-kit",
    label: "DesignPD",
    logo: "/brand/tools/designpd-logo.jpg",
    price: "$50",
  },
  {
    assessmentType: "spiritual_gifts",
    detail: "A free first step for naming how the Spirit may be empowering service.",
    href: "#field-kit",
    label: "Spiritual Gifts",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    price: "Free",
  },
  {
    assessmentType: "design_pathways",
    detail: "A free discernment layer for direction, experiments, and next steps.",
    href: "#design-pathways",
    label: "Design Pathways",
    logo: "/brand/tools/design-pathways-logo.jpg",
    price: "Free",
  },
  {
    assessmentType: "fruit_360",
    detail: "A free 360-style mirror for visible fruit and growth conversations.",
    href: "/fruitlife360",
    label: "FruitLife 360",
    logo: "/brand/tools/fruitful-life-360-logo.jpg",
    price: "Free",
  },
];

const hqMenu = [
  {
    icon: "tent",
    label: "Base Camp",
    href: "#basecamp",
    children: [{ icon: "hiker", label: "Journey", href: "/journey" }],
  },
  { icon: "signpost", label: "Trailheads", href: "#trailheads" },
  {
    icon: "map",
    label: "Field Kit",
    href: "#field-kit",
    children: [
      { icon: "camera", label: "Artifact", href: "#artifacts" },
      { icon: "badge", label: "Trail Badges", href: "#trail-badges" },
    ],
  },
  {
    icon: "backpack",
    label: "Gear",
    href: "#gear",
    children: [
      { icon: "compass", label: "Journal", href: "#journal" },
      { icon: "flashlight", label: "Waypoints", href: "#waypoints" },
      { icon: "magnifier", label: "Pathfinder", href: "#pathfinder" },
    ],
  },
  { icon: "fireside", label: "Fireside", href: "#fireside" },
];

type TrailBadge = {
  condition: string;
  detail: string;
  group: "D.E.S.I.G.N." | "Tools" | "Reflections";
  image: string;
  kind:
    | "design_piece"
    | "design_pathways"
    | "designid"
    | "designpd"
    | "fruit_360"
    | "reflection"
    | "spiritual_gifts";
  reflection?: "architect" | "artisan" | "shepherd" | "steward";
  slug: string;
  title: string;
};

const trailBadges: TrailBadge[] = [
  {
    condition: "Complete the Identity marker in the DYDD journey.",
    detail: "Names who you are before what you do.",
    group: "D.E.S.I.G.N.",
    image: "/brand/badges/identity-badge.svg",
    kind: "design_piece",
    slug: "identity",
    title: "Identity",
  },
  {
    condition: "Complete the Expertise marker in the DYDD journey.",
    detail: "Recognizes the skills and capacities you carry.",
    group: "D.E.S.I.G.N.",
    image: "/brand/badges/expertise-badge.svg",
    kind: "design_piece",
    slug: "expertise",
    title: "Expertise",
  },
  {
    condition: "Complete the Story marker in the DYDD journey.",
    detail: "Honors the path God has been writing through your life.",
    group: "D.E.S.I.G.N.",
    image: "/brand/badges/story-badge.svg",
    kind: "design_piece",
    slug: "story",
    title: "Story",
  },
  {
    condition: "Complete the Desire marker in the DYDD journey.",
    detail: "Identifies the holy motivations that keep pulling you forward.",
    group: "D.E.S.I.G.N.",
    image: "/brand/badges/desire-badge.svg",
    kind: "design_piece",
    slug: "desire",
    title: "Desire",
  },
  {
    condition: "Complete the Gifts marker in the DYDD journey.",
    detail: "Connects grace-given gifts to faithful service.",
    group: "D.E.S.I.G.N.",
    image: "/brand/badges/gifts-badge.svg",
    kind: "design_piece",
    slug: "gifts",
    title: "Gifts",
  },
  {
    condition: "Complete the Niche marker and draft a clear Niche Declaration.",
    detail: "Marks the calling place where the design pieces converge.",
    group: "D.E.S.I.G.N.",
    image: "/brand/badges/niche-badge.svg",
    kind: "design_piece",
    slug: "niche",
    title: "Niche",
  },
  {
    condition: "Finish DesignID and connect the report to Base Camp.",
    detail: "Discovers your Reflection pattern and design language.",
    group: "Tools",
    image: "/brand/badges/designid-badge.png",
    kind: "designid",
    slug: "designid",
    title: "DesignID",
  },
  {
    condition: "Finish the Spiritual Gifts tool and connect the report.",
    detail: "Highlights gifts that build up the Body of Christ.",
    group: "Tools",
    image: "/brand/badges/spiritual-gifts-badge.png",
    kind: "spiritual_gifts",
    slug: "spiritual-gifts",
    title: "Spiritual Gifts",
  },
  {
    condition: "Complete the FruitLife 360 intake and review cycle.",
    detail: "Shows where the fruit of the Spirit is becoming visible.",
    group: "Tools",
    image: "/brand/badges/fruitlife-360-badge.png",
    kind: "fruit_360",
    slug: "fruitlife-360",
    title: "FruitLife 360",
  },
  {
    condition: "Finish DesignPD and connect the report to Base Camp.",
    detail: "Turns design insight into practical growth direction.",
    group: "Tools",
    image: "/brand/badges/designpd-badge.png",
    kind: "designpd",
    slug: "designpd",
    title: "DesignPD",
  },
  {
    condition: "Complete Design Pathways planning work.",
    detail: "Clarifies the best next path for your season and assignment.",
    group: "Tools",
    image: "/brand/badges/design-pathways-badge.png",
    kind: "design_pathways",
    slug: "design-pathways",
    title: "Design Pathways",
  },
  {
    condition: "Earned when Shepherd is part of your DesignID Reflection pattern.",
    detail: "Compassion, nurture, and people-centered care.",
    group: "Reflections",
    image: "/brand/badges/shepherd-badge.svg",
    kind: "reflection",
    reflection: "shepherd",
    slug: "shepherd",
    title: "Shepherd",
  },
  {
    condition: "Earned when Artisan is part of your DesignID Reflection pattern.",
    detail: "Creativity, expression, beauty, and meaning-making.",
    group: "Reflections",
    image: "/brand/badges/artisan-badge.svg",
    kind: "reflection",
    reflection: "artisan",
    slug: "artisan",
    title: "Artisan",
  },
  {
    condition: "Earned when Architect is part of your DesignID Reflection pattern.",
    detail: "Vision, structure, clarity, and new-order thinking.",
    group: "Reflections",
    image: "/brand/badges/architect-badge.svg",
    kind: "reflection",
    reflection: "architect",
    slug: "architect",
    title: "Architect",
  },
  {
    condition: "Earned when Steward is part of your DesignID Reflection pattern.",
    detail: "Faithfulness, wisdom, protection, and responsibility.",
    group: "Reflections",
    image: "/brand/badges/steward-badge.svg",
    kind: "reflection",
    reflection: "steward",
    slug: "steward",
    title: "Steward",
  },
];

function MenuIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2.1,
    viewBox: "0 0 32 32",
  };

  const icon =
    name === "tent" ? (
      <svg {...common}>
        <path d="M4.5 25.5h23" stroke="var(--green-dark)" />
        <path d="M7.5 25.5 16 7.5l8.5 18" fill="#f0d08a" stroke="var(--green-dark)" />
        <path d="M16 7.5v18" stroke="#6f4d20" />
        <path d="M16 25.5 20.5 17l4 8.5" fill="#d4a451" stroke="var(--green-dark)" />
      </svg>
    ) : name === "hiker" ? (
      <svg {...common}>
        <circle cx="16" cy="7.5" r="3" fill="#d4a451" stroke="var(--green-dark)" />
        <path d="m14.5 11 4 3.5-2.8 4.2 4.8 6.8" stroke="var(--green-dark)" />
        <path d="m16.8 14.8-5.3 3.3" stroke="var(--green-dark)" />
        <path d="m15.7 18.7-5.2 6.8" stroke="var(--green-dark)" />
        <path d="M21.5 10v16" stroke="#6f4d20" />
        <path d="M7 27.5c5.5-2.7 12.7-2.7 18 0" stroke="#759a5b" />
      </svg>
    ) : name === "signpost" ? (
      <svg {...common}>
        <path d="M16 6v21" stroke="var(--green-dark)" />
        <path d="M8 8.5h13.5l2.5 2.8-2.5 2.7H8z" fill="#e8c576" stroke="#6f4d20" />
        <path d="M24 17.5H10.5L8 20.2l2.5 2.8H24z" fill="#759a5b" stroke="var(--green-dark)" />
        <path d="M12 27h8" stroke="var(--green-dark)" />
      </svg>
    ) : name === "map" ? (
      <svg {...common}>
        <path d="m5.5 9 7-2.5 7 2.5 7-2.5v17l-7 2.5-7-2.5-7 2.5z" fill="#f7efd8" stroke="var(--green-dark)" />
        <path d="M12.5 6.5v17M19.5 9v17" stroke="#6f4d20" />
        <path d="M8 17c2-2 4.1-2.6 6.3-1.7 2.5 1 4.7.4 6.6-1.8" stroke="#759a5b" />
        <path d="M22.8 20.8 24.5 19l1.8 1.8-1.8 1.9z" fill="#d4a451" stroke="#6f4d20" />
      </svg>
    ) : name === "camera" ? (
      <svg {...common}>
        <path d="M8 11.5h4l1.7-2.5h5l1.7 2.5H24a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill="#f0d08a" stroke="var(--green-dark)" />
        <circle cx="16" cy="18.5" r="4.4" fill="#fffaf0" stroke="#6f4d20" />
        <circle cx="16" cy="18.5" r="1.5" fill="#759a5b" stroke="#759a5b" />
        <path d="M22.5 14h1" stroke="#6f4d20" />
      </svg>
    ) : name === "badge" ? (
      <svg {...common}>
        <path d="M16 5.5 25 10v8.8c0 5.1-3.6 7.9-9 9.7-5.4-1.8-9-4.6-9-9.7V10z" fill="#5d548b" stroke="var(--green-dark)" />
        <path d="M11.5 13.2h9l2.1 2.1-2.1 2.1h-9z" fill="#d4a451" stroke="#6f4d20" />
        <path d="M11 23.5 8.6 28l4.3-1 3.1 3 3.1-3 4.3 1-2.4-4.5" stroke="#6f4d20" />
        <path d="M13 21.2h6" stroke="#fffaf0" />
      </svg>
    ) : name === "backpack" ? (
      <svg {...common}>
        <path d="M11 11V9a5 5 0 0 1 10 0v2" stroke="var(--green-dark)" />
        <path d="M9 10.5h14a3 3 0 0 1 3 3v10.2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V13.5a3 3 0 0 1 3-3Z" fill="#759a5b" stroke="var(--green-dark)" />
        <path d="M10 18.2h12v8.5H10z" fill="#f0d08a" stroke="#6f4d20" />
        <path d="M6 16h4M22 16h4M13 14h6" stroke="#eaf0e2" />
      </svg>
    ) : name === "compass" ? (
      <svg {...common}>
        <circle cx="16" cy="16" r="10.5" fill="#fffaf0" stroke="var(--green-dark)" />
        <path d="m19.8 9.8-2.2 7.8-5.4 4.6 2.2-7.8z" fill="#d4a451" stroke="#6f4d20" />
        <circle cx="16" cy="16" r="1.4" fill="var(--green-dark)" stroke="var(--green-dark)" />
        <path d="M16 4.2v2M16 25.8v2M4.2 16h2M25.8 16h2" stroke="#759a5b" />
      </svg>
    ) : name === "flashlight" ? (
      <svg {...common}>
        <path d="M6 13.2h4.8l2.2 2.2v4.4L10.8 22H6z" fill="#d4a451" stroke="var(--green-dark)" />
        <path d="M12.8 15.5h12.7a2 2 0 0 1 2 2v.2a2 2 0 0 1-2 2H12.8z" fill="#759a5b" stroke="var(--green-dark)" />
        <path d="M17.4 15.5v4.2" stroke="#eaf0e2" />
        <path d="M21.5 14.2h3.5" stroke="#6f4d20" />
        <path d="M5.8 15.2 2.8 13.6M5.3 17.6H2.1M5.8 20l-3 1.6" stroke="#f0d08a" />
        <path d="M10.8 14.1v6.8" stroke="#fffaf0" />
      </svg>
    ) : name === "magnifier" ? (
      <svg {...common}>
        <circle cx="14" cy="14" r="7.5" fill="#fffaf0" stroke="var(--green-dark)" />
        <path d="m19.5 19.5 6.5 6.5" stroke="#6f4d20" />
        <path d="M10.7 14.2 13.2 17l4.5-5.5" stroke="#d4a451" />
        <path d="M23.5 23.5 26 21" stroke="#6f4d20" />
      </svg>
    ) : name === "fireside" ? (
      <svg {...common}>
        <path d="M11 26.5 22 22M10 22l12 4.5" stroke="#6f4d20" />
        <path d="M16.5 24.5c-4.4-2.2-6-5.5-4.7-9.8 1.4 1.4 2.6 2.1 3.5 2.1-.3-3.3.9-6 3.7-8.3.2 3.6 1.5 5.3 3.9 7 2.1 3.8.5 7-6.4 9Z" fill="#d96f2a" stroke="var(--green-dark)" />
        <path d="M16.6 22.2c-2.1-1.2-2.8-2.9-1.9-5.1 1 .9 1.9 1.2 2.6 1 .1-1.8.8-3.2 2.1-4.4 0 2 .7 3.1 1.8 4 1 2-.2 3.6-4.6 4.5Z" fill="#f6d36d" stroke="#6f4d20" />
      </svg>
    ) : null;

  return (
    <span aria-hidden="true" className={`hq-menu-icon icon-${name}`}>
      {icon}
    </span>
  );
}

const journeyMarkers = [
  {
    detail: "Begin with the full Discover Your Divine Design trail.",
    label: "Start Here",
    meta: "Main trail",
  },
  {
    detail: "Use DesignID early to name identity, contribution, and fit.",
    label: "DesignID",
    meta: "Early marker",
  },
  {
    detail: "Add Spiritual Gifts when the journey turns toward calling and service.",
    label: "Spiritual Gifts",
    meta: "Deeper trail",
  },
  {
    detail: "Use DesignPD and FruitLife 360 to practice, grow, and walk it out.",
    label: "Practice & Grow",
    meta: "Road ahead",
  },
];

const fruitLifeStages = [
  {
    detail: "Create a Vercel/Supabase session and send the participant their self and observer links.",
    label: "Start intake",
    state: "Live",
  },
  {
    detail: "Track whether self reflection is done and how many observer responses have landed.",
    label: "Response watch",
    state: "Live",
  },
  {
    detail: "Prepare the same report payload the old Google Sheet and PDFMonkey path expects.",
    label: "Payload queue",
    state: "Live",
  },
  {
    detail: "Individual observer reminders and final PDF rendering are next after this UI pass.",
    label: "Reminder/report worker",
    state: "Next",
  },
];

function isAdminEmail(email: string | null | undefined) {
  const configured = (process.env.DYDD_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => canonicalizeParticipantEmail(value))
    .filter(Boolean);
  const adminEmails = new Set(["dyddjourney@gmail.com", ...configured]);

  return adminEmails.has(canonicalizeParticipantEmail(email));
}

function titleizeStatus(value: string | null | undefined) {
  return value ? value.replace(/_/g, " ") : "not started";
}

function readScoreNumber(source: Record<string, unknown>, key: string) {
  const value = source[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function fruitScoreFromSnapshot(snapshot: AssessmentSnapshotSummary, fruitKey: string) {
  const scores = snapshotSection(snapshot, "scores");
  const observer = readScoreNumber(scores, `${fruitKey}_Observer`);
  const self = readScoreNumber(scores, `${fruitKey}_Self`);

  return observer ?? self;
}

function reportModeLabel(value: string | null | undefined) {
  if (value === "FULL_360") return "Full 360";
  if (value === "SELF_ONLY") return "Self-only";
  return titleizeStatus(value);
}

function buildFruitLifeTrend(snapshots: AssessmentSnapshotSummary[]) {
  const fruitSnapshots = snapshots
    .filter((snapshot) => snapshot.assessment_type === "fruit_360")
    .sort((a, b) => {
      const dateA = new Date(a.source_submitted_at ?? a.created_at).getTime();
      const dateB = new Date(b.source_submitted_at ?? b.created_at).getTime();
      return dateA - dateB;
    });

  const datedRuns = fruitSnapshots.map((snapshot, index) => {
    const values = fruitTrendMetrics.flatMap((fruit) => {
      const value = fruitScoreFromSnapshot(snapshot, fruit.key);
      return value === null ? [] : [value];
    });
    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

    return {
      average,
      date: displayDate(snapshot.source_submitted_at ?? snapshot.created_at),
      id: snapshot.id,
      index,
      mode: compactValue(snapshotSection(snapshot, "summary").Report_Mode) || "FruitLife",
      mostVisible:
        compactValue(snapshotSection(snapshot, "summary").Most_Visible_Fruit_List) ||
        "Awaiting ranked fruit",
      snapshot,
    };
  });

  const latest = datedRuns.at(-1);
  const previous = datedRuns.length > 1 ? datedRuns.at(-2) : null;
  const changes = latest
    ? fruitTrendMetrics
        .map((fruit) => {
          const current = fruitScoreFromSnapshot(latest.snapshot, fruit.key);
          const prior = previous ? fruitScoreFromSnapshot(previous.snapshot, fruit.key) : null;
          return {
            ...fruit,
            current,
            delta: current !== null && prior !== null ? current - prior : null,
          };
        })
        .filter((fruit) => fruit.current !== null)
    : [];
  const sortedChanges = [...changes].sort((a, b) => {
    const deltaA = a.delta ?? 0;
    const deltaB = b.delta ?? 0;
    return deltaB - deltaA;
  });
  const topRiser = sortedChanges.find((fruit) => (fruit.delta ?? 0) > 0) ?? null;
  const growthWatch = [...changes]
    .filter((fruit) => fruit.current !== null)
    .sort((a, b) => (a.current ?? 0) - (b.current ?? 0))[0] ?? null;
  const overallDelta =
    latest && previous ? latest.average - previous.average : null;
  const pointSpacing = datedRuns.length > 1 ? 680 / (datedRuns.length - 1) : 0;
  const series = fruitTrendMetrics
    .map((fruit) => {
      const points = datedRuns.flatMap((run, index) => {
        const value = fruitScoreFromSnapshot(run.snapshot, fruit.key);
        if (value === null) return [];
        const x = 40 + pointSpacing * index;
        const y = 222 - ((Math.max(1, Math.min(5, value)) - 1) / 4) * 170;
        return [{ x, y, value }];
      });

      return { ...fruit, points };
    })
    .filter((fruit) => fruit.points.length);

  return { changes, datedRuns, growthWatch, latest, overallDelta, series, topRiser };
}

function getFruitLifeCompletion(session: FruitLifeDashboardSession | null) {
  if (!session) {
    return { completed: 0, required: 1 };
  }

  const selfCount = session.self_completed_at ? 1 : 0;
  const required = 1 + Math.max(0, session.observer_goal);
  const completed = selfCount + Math.max(0, session.observer_completed_count);

  return { completed, required };
}

async function getFruitLifeDashboardSessions({
  email,
  enabled,
  isAdmin,
}: {
  email: string | null;
  enabled: boolean;
  isAdmin: boolean;
}) {
  if (!enabled || (!email && !isAdmin)) {
    return [];
  }

  const supabaseAdmin = createSupabaseAdminClient();
  let query = supabaseAdmin
    .from("fruitlife_360_sessions")
    .select(
      "id,metadata,participant_name,participant_email,session_status,report_status,observer_goal,observer_completed_count,response_count,self_completed_at,report_url,created_at,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(isAdmin ? 6 : 4);

  if (!isAdmin && email) {
    query = query.eq("participant_email", email);
  }

  const { data } = await query;
  const sessions = (data ?? []) as Omit<FruitLifeDashboardSession, "artifacts">[];
  const sessionIds = sessions.map((session) => session.id);

  if (!sessionIds.length) {
    return [];
  }

  const { data: artifacts } = await supabaseAdmin
    .from("fruitlife_360_report_artifacts")
    .select("session_id,artifact_type,artifact_status,provider,external_url,filename,created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  const artifactsBySession = new Map<string, FruitLifeDashboardSession["artifacts"]>();

  for (const artifact of artifacts ?? []) {
    const sessionId = String(artifact.session_id);
    const current = artifactsBySession.get(sessionId) ?? [];
    current.push({
      artifact_status: String(artifact.artifact_status),
      artifact_type: String(artifact.artifact_type),
      created_at: String(artifact.created_at),
      external_url: typeof artifact.external_url === "string" ? artifact.external_url : null,
      filename: typeof artifact.filename === "string" ? artifact.filename : null,
      provider: String(artifact.provider),
    });
    artifactsBySession.set(sessionId, current);
  }

  return sessions.map((session) => ({
    ...session,
    artifacts: artifactsBySession.get(session.id) ?? [],
  }));
}

async function getAdminAssessmentReport(enabled: boolean) {
  if (!enabled) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("assessment_snapshots")
    .select(
      "id,assessment_type,created_at,scores,source,source_submitted_at,assessment_participants(display_name,normalized_email)",
    )
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(120);

  const recent = ((data ?? []) as unknown as Array<
    Omit<AdminSnapshotSummary, "assessment_participants"> & {
      assessment_participants:
        | AdminSnapshotSummary["assessment_participants"]
        | AdminSnapshotSummary["assessment_participants"][];
    }
  >).map((snapshot) => ({
    ...snapshot,
    assessment_participants: Array.isArray(snapshot.assessment_participants)
      ? (snapshot.assessment_participants[0] ?? null)
      : snapshot.assessment_participants,
  }));
  const duplicateGroups = new Map<string, number>();

  for (const snapshot of recent) {
    const email =
      snapshot.assessment_participants?.normalized_email ?? "unknown-participant";
    const key = `${email}:${snapshot.assessment_type}`;
    duplicateGroups.set(key, (duplicateGroups.get(key) ?? 0) + 1);
  }

  return {
    duplicatePairsInRecentWindow: Array.from(duplicateGroups.values()).filter(
      (count) => count > 1,
    ).length,
    recent,
    totalInRecentWindow: recent.length,
  };
}

async function getHeatherAssessmentReport(enabled: boolean) {
  if (!enabled) {
    return null;
  }

  const report = await getAssessmentSnapshotsForParticipantMatch({
    displayNames: [heatherReviewName],
    emails: ["willoughbyhs@gmail.com"],
  });

  return {
    latest: report.latest as NamedParticipantSnapshot[],
    participantCount: report.latest.length ? 1 : 0,
    totalSnapshots: report.all.length,
  };
}

function ownsAssessment(report: StudentAssessmentReport, assessmentType: string) {
  return report.latest.some(
    (snapshot) => snapshot.assessment_type === assessmentType,
  );
}

function reflectionIsPresent(reflectionText: string, reflection?: string) {
  if (!reflection) {
    return false;
  }

  return reflectionText.toLowerCase().includes(reflection);
}

function artifactDownloadHref(
  snapshot: AssessmentSnapshotSummary,
  reviewParams?: ReviewSearchParams | null,
) {
  return withReviewQuery(
    `/api/artifacts/${encodeURIComponent(snapshot.id)}/download`,
    reviewParams,
  );
}

function artifactLabel(snapshot: AssessmentSnapshotSummary) {
  const label = assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;

  if (snapshot.assessment_type !== "fruit_360") {
    return label;
  }

  const mode = compactValue(snapshotSection(snapshot, "summary").Report_Mode);
  return `${label} · ${reportModeLabel(mode)}`;
}

function sessionModeFromMetadata(session: FruitLifeDashboardSession) {
  const payloadArtifact = session.artifacts.find(
    (artifact) => artifact.artifact_type === "payload",
  );
  const mode =
    payloadArtifact?.filename?.includes("self")
      ? "SELF_ONLY"
      : session.observer_goal > 0
        ? "FULL_360"
        : "SELF_ONLY";

  return reportModeLabel(mode);
}

export default async function HqPage({ searchParams }: HqPageProps) {
  const reviewParams = await searchParams;
  const heatherPreview = isHeatherReviewRequest(reviewParams);
  const newPreview = isNewReviewRequest(reviewParams);
  const reviewReport =
    (await getHeatherReviewReport(reviewParams)) ?? (await getNewReviewReport(reviewParams));
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !reviewReport) {
    redirect("/login");
  }

  const { data: profile } = user
    ? await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const assessmentReport: StudentAssessmentReport = reviewReport ??
    (await getAssessmentSnapshotsForUser(user?.id ?? "", normalizeEmail(user?.email)));
  const snapshots = assessmentReport.latest;
  const isAdmin = Boolean(user && isAdminEmail(user.email));
  const adminReport = await getAdminAssessmentReport(isAdmin);
  const heatherReport = await getHeatherAssessmentReport(isAdmin);

  const displayName = heatherPreview
    ? `${heatherReviewName} Preview`
    : newPreview
      ? newReviewName
      : profile?.full_name ?? user?.email ?? "Traveler";
  const welcomeName = displayName.replace(/\s+Preview$/, "").split(/\s+/)[0] ?? "Traveler";
  const hasDyddCourseAccess = heatherPreview;
  const hasDesignIdCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "designid");
  const hasDesignPdCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "designpd");
  const hasSpiritualGiftsCourseAccess =
    heatherPreview || ownsAssessment(assessmentReport, "spiritual_gifts");
  const hasFruitLifeCourseAccess = heatherPreview || ownsAssessment(assessmentReport, "fruit_360");
  const fruitLifeDashboardEmail = heatherPreview
    ? "willoughbyhs@gmail.com"
    : newPreview
      ? jordanReviewEmail
      : normalizeEmail(profile?.email ?? user?.email);
  const fruitLifeSessions = await getFruitLifeDashboardSessions({
    email: fruitLifeDashboardEmail,
    enabled: Boolean(fruitLifeDashboardEmail || isAdmin),
    isAdmin,
  });
  const activeFruitLifeSession = fruitLifeSessions[0] ?? null;
  const fruitLifeCompletion = getFruitLifeCompletion(activeFruitLifeSession);
  const designIdContext = buildDesignIdContext(assessmentReport);
  const reflectionText = [
    designIdContext.primary,
    designIdContext.secondary,
    designIdContext.integrativeReflection,
  ]
    .join(" ")
    .toLowerCase();
  const lessonCount = designIdCourse.modules.reduce(
    (count, module) => count + module.lessons.length,
    0,
  );
  const artifactSnapshots = assessmentReport.all;

  const courseAccessBySlug: Record<string, boolean> = {
    "designid-foundations": hasDesignIdCourseAccess,
    "designpd-alignment": hasDesignPdCourseAccess,
    "discover-your-divine-design": hasDyddCourseAccess,
    "fruitlife-360-formation": hasFruitLifeCourseAccess,
    "spiritual-gifts-service": hasSpiritualGiftsCourseAccess,
  };
  const courseCards = allCourseSummaries.map((course) => {
    const available = courseAccessBySlug[course.slug] ?? false;

    return {
      action: available
        ? course.slug === "discover-your-divine-design"
          ? "Continue course"
          : "Open course"
        : course.price === "Free assessment"
          ? "Start free assessment"
          : course.price,
      available,
      detail: course.description,
      href: withReviewQuery(course.hrefBase, reviewParams),
      icon: course.logo,
      id: `${course.slug}-course`,
      label: course.title,
      meta:
        course.slug === "designid-foundations"
          ? `${designIdCourse.modules.length} modules · ${lessonCount} lessons`
          : `${course.moduleCount} modules · mapped for review`,
      price: course.price,
    };
  });
  const trailheadOrder = [
    "discover-your-divine-design-course",
    "designid-foundations-course",
    "spiritual-gifts-service-course",
    "designpd-alignment-course",
    "fruitlife-360-formation-course",
  ];
  const trailheadMetaById: Record<string, string> = {
    "discover-your-divine-design-course": "Main trail",
    "designid-foundations-course": "Early marker",
    "spiritual-gifts-service-course": "Calling marker",
    "designpd-alignment-course": "Practice marker",
    "fruitlife-360-formation-course": "Growth marker",
  };
  const trailheadCards = [...courseCards].sort((a, b) => {
    const aIndex = trailheadOrder.indexOf(a.id);
    const bIndex = trailheadOrder.indexOf(b.id);

    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
  const badgeCards = trailBadges.map((badge) => {
    const earned =
      badge.kind === "designid"
        ? hasDesignIdCourseAccess
        : badge.kind === "designpd"
          ? hasDesignPdCourseAccess
          : badge.kind === "spiritual_gifts"
            ? hasSpiritualGiftsCourseAccess
            : badge.kind === "fruit_360"
              ? hasFruitLifeCourseAccess || fruitLifeCompletion.completed > 0
              : badge.kind === "design_pathways"
                ? ownsAssessment(assessmentReport, "design_pathways")
                : badge.kind === "reflection"
                  ? reflectionIsPresent(reflectionText, badge.reflection)
                  : false;

    return {
      ...badge,
      earned,
      status: earned ? "Earned" : badge.kind === "design_piece" ? "Planned" : "Locked",
    };
  });

  return (
    <main className="hq-shell hq-app-shell">
      <aside className="hq-sidebar" aria-label="DYDD navigation">
        <a className="hq-sidebar-brand" href="#basecamp">
          <img src="/brand/dydd-logo.webp" alt="Discover Your Divine Design" />
        </a>
        <nav className="hq-sidebar-nav">
          {hqMenu.map((item) => {
            const href = item.href.startsWith("/")
              ? withReviewQuery(item.href, reviewParams)
              : item.href;
            return (
              <div className="hq-nav-group" key={item.label}>
                <a className="hq-nav-item" href={href}>
                  <MenuIcon name={item.icon} />
                  <span>{item.label}</span>
                </a>
                {item.children ? (
                  <div className="hq-subnav">
                    {item.children.map((child) => {
                      const childHref = child.href.startsWith("/")
                        ? withReviewQuery(child.href, reviewParams)
                        : child.href;
                      return (
                        <a className="hq-subnav-item" href={childHref} key={child.label}>
                          <MenuIcon name={child.icon} />
                          <span>{child.label}</span>
                        </a>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
        <div className="hq-sidebar-note">
          <span>Preview</span>
          <strong>{welcomeName}</strong>
        </div>
      </aside>

      <div className="hq-content">
        <header className="hq-topbar">
          <div>
            <p className="eyebrow">DYDD Base Camp</p>
            <h1>{displayName}</h1>
          </div>
          {reviewReport ? (
            <Link className="button secondary" href="/login">
              Real sign-in
            </Link>
          ) : (
            <form action={signOut}>
              <button className="button secondary" type="submit">
                Sign out
              </button>
            </form>
          )}
        </header>

      <section className="basecamp-hero" id="basecamp" aria-label="DYDD Base Camp">
        <div className="basecamp-copy">
          <h2>Welcome, {welcomeName}.</h2>
          <p>
            This is your place to pause, gather what you have discovered, and
            choose the next faithful step.
          </p>
          <div className="basecamp-actions">
            <Link className="button primary" href={withReviewQuery("/journey", reviewParams)}>
              Begin the journey
            </Link>
            <a className="button secondary" href="#field-kit">
              Open the field kit
            </a>
          </div>
        </div>
        <div className="basecamp-scene" aria-hidden="true">
          <img src="/brand/dydd-cabin-hut-only.png" alt="" />
          <div className="camp-sign">
            <span>DYDD</span>
            <strong>Base Camp</strong>
          </div>
        </div>
      </section>

      <section className="journey-orientation" aria-label="Where to begin">
        <div className="orientation-copy">
          <p className="section-label">Where to begin</p>
          <h2>Your journey starts with Discover Your Divine Design.</h2>
          <p>
            Base Camp is the place to see where you are, what you already carry,
            and which part of the road is ready for your attention next.
          </p>
          <div className="basecamp-actions">
            <Link className="button primary" href={withReviewQuery("/journey", reviewParams)}>
              Open main trail
            </Link>
            <a className="button secondary" href="#trailheads">
              See trailheads
            </a>
          </div>
        </div>
        <ol className="orientation-route">
          {journeyMarkers.map((marker) => (
            <li key={marker.label}>
              <span>{marker.meta}</span>
              <strong>{marker.label}</strong>
              <small>{marker.detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="hq-grid" aria-label="DYDD Base Camp pathways">
        <article className="course-panel trailhead-panel" id="trailheads">
          <div className="card-heading">
            <p className="section-label">Trailheads</p>
            <h2>Choose the trail, then follow the markers.</h2>
          </div>
          <div className="trailhead-map">
            <img
              className="trail-signpost-image"
              src="/brand/dydd-trailheads-signpost-dydi.png"
              alt="Dydi standing beside a jungle trail sign for the DYDD Journey and Basecamp"
            />
            <div className="trail-route-list">
              {trailheadCards.map((course) => (
                <article
                  className={course.available ? "trail-route open" : "trail-route locked"}
                  id={course.id}
                  key={course.label}
                >
                  <img src={course.icon} alt={`${course.label} icon`} />
                  <div>
                    <span>{trailheadMetaById[course.id] ?? "Trail marker"}</span>
                    <h3>{course.label}</h3>
                    <p>{course.detail}</p>
                    <small>{course.meta}</small>
                  </div>
                  {course.available ? (
                    <Link className="button secondary" href={course.href}>
                      {course.action}
                    </Link>
                  ) : (
                    <a className="button secondary" href={course.href}>
                      {course.action}
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="tool-panel fieldkit-panel" id="field-kit">
          <div className="card-heading">
            <p className="section-label">Field Kit</p>
            <h2>Prepare for the road ahead.</h2>
          </div>
          <div className="fieldkit-feature">
            <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
            <div>
              <strong>FruitLife 360</strong>
              <p>
                Pack this for growth work: saved runs, observer progress,
                artifacts, notes, and the next trailhead that helps explain
                what the results mean.
              </p>
              <div className="fieldkit-status">
                <span>
                  {activeFruitLifeSession
                    ? `${fruitLifeCompletion.completed}/${fruitLifeCompletion.required} responses`
                    : "Ready to start"}
                </span>
                <small>
                  {activeFruitLifeSession
                    ? `Updated ${displayDate(activeFruitLifeSession.updated_at)}`
                    : "Create the first FruitLife intake"}
                </small>
              </div>
            </div>
            <Link className="button secondary" href="/fruitlife360">
              Open
            </Link>
          </div>
          <div className="product-list fieldkit-list">
            {toolCatalog.map((tool) => {
              const completed = ownsAssessment(assessmentReport, tool.assessmentType);
              return (
                <article
                  className="product-row"
                  id={tool.assessmentType === "design_pathways" ? "design-pathways" : undefined}
                  key={tool.label}
                >
                  <img src={tool.logo} alt={`${tool.label} logo`} />
                  <div>
                    <strong>{tool.label}</strong>
                    <p>{tool.detail}</p>
                  </div>
                  <span>{completed ? "Completed" : tool.price}</span>
                  <a className="button secondary" href={tool.href}>
                    {completed ? "Review" : tool.price === "Free" ? "Start" : "Buy"}
                  </a>
                </article>
              );
            })}
          </div>
        </article>

        <article className="artifact-panel artifact-workbench" id="artifacts">
          <div className="card-heading">
            <p className="section-label">Artifacts</p>
            <h2>Examine what you have already discovered.</h2>
          </div>
          {artifactSnapshots?.length ? (
            <div className="artifact-download-list">
              {artifactSnapshots.map((snapshot) => (
                <article className="artifact-download" key={snapshot.id}>
                  <div>
                    <span>{artifactLabel(snapshot)}</span>
                    <small>
                      Completed{" "}
                      {displayDate(
                        snapshot.source_submitted_at ?? snapshot.created_at,
                      )}
                    </small>
                  </div>
                  {snapshotHighlights(snapshot).length ? (
                    <dl>
                      {snapshotHighlights(snapshot).slice(0, 3).map((item) => (
                        <div key={item.label}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <a
                    className="button secondary"
                    href={artifactDownloadHref(snapshot, reviewParams)}
                  >
                    Download report
                  </a>
                </article>
              ))}
            </div>
          ) : (
            <div className="hq-empty-state">
              <strong>No completed artifacts yet.</strong>
              <p>
                This account is ready to use the free tools or purchase
                DesignID, DesignPD, and the DYDD course. Completed reports will
                appear here after the person finishes an assessment.
              </p>
            </div>
          )}
        </article>

        <article className="badge-panel" id="trail-badges">
          <div className="card-heading">
            <p className="section-label">Trail Badges</p>
            <h2>Visible markers for progress, growth, and calling.</h2>
          </div>
          <div className="badge-system-intro">
            <p>
              This first badge map gives the journey a set of earnable trail
              markers: the D.E.S.I.G.N. pieces, connected tools, and personal
              Reflection badges.
            </p>
            <span>
              {badgeCards.filter((badge) => badge.earned).length}/{badgeCards.length} earned
            </span>
          </div>
          {(["D.E.S.I.G.N.", "Tools", "Reflections"] as const).map((group) => (
            <section className="badge-group" key={group}>
              <div className="badge-group-heading">
                <h3>{group}</h3>
                <small>
                  {group === "D.E.S.I.G.N."
                    ? "Main journey markers"
                    : group === "Tools"
                      ? "Connected discovery work"
                      : "Personalized reflection markers"}
                </small>
              </div>
              <div className="badge-grid">
                {badgeCards
                  .filter((badge) => badge.group === group)
                  .map((badge) => (
                    <article
                      className={badge.earned ? "trail-badge earned" : "trail-badge locked"}
                      key={badge.slug}
                    >
                      <div className="badge-art">
                        <img src={badge.image} alt={`${badge.title} trail badge`} />
                        {badge.earned && badge.group === "Reflections" ? (
                          <span>{welcomeName}</span>
                        ) : null}
                      </div>
                      <div className="badge-copy">
                        <span>{badge.status}</span>
                        <strong>{badge.title}</strong>
                        <p>{badge.detail}</p>
                        <small>{badge.condition}</small>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </article>

        <article className="journey-builder">
          <div>
            <p className="section-label">Main trail</p>
            <h2>
              {hasDyddCourseAccess
                ? "Continue Discover Your Divine Design."
                : "Open the Discover Your Divine Design trail."}
            </h2>
            <p>
              This opens the guided course path that gathers the book,
              workbook, assessments, reflection, and next steps into one
              formation trail.
            </p>
            {hasDyddCourseAccess ? (
              <div className="niche-builder-steps">
                <span>Journey process</span>
                <span>Pathfinder</span>
                <span>Companion reflection</span>
              </div>
            ) : null}
          </div>
          <Link className="button primary" href={withReviewQuery("/journey", reviewParams)}>
            {hasDyddCourseAccess ? "Continue trail" : "View course access"}
          </Link>
        </article>

        <article className="gear-panel" id="gear">
          <div className="card-heading">
            <p className="section-label">Gear</p>
            <h2>Personal practices for the road ahead.</h2>
          </div>
          <div className="gear-grid">
            <section id="journal">
              <MenuIcon name="compass" />
              <strong>Journal</strong>
              <p>
                Notes, prayers, workbook responses, questions, and
                companion-guided reflections.
              </p>
              <div className="journal-lines">
                <span>Today I noticed...</span>
                <span>The place I need grace is...</span>
                <span>My next faithful step is...</span>
              </div>
            </section>
            <section id="waypoints">
              <MenuIcon name="flashlight" />
              <strong>Waypoints</strong>
              <p>
                Daily and weekly Scripture-centered rhythms for continued
                growth, direction, and next-step clarity.
              </p>
              <small>Planned</small>
            </section>
            <section id="pathfinder">
              <MenuIcon name="magnifier" />
              <strong>Pathfinder</strong>
              <p>
                A focused workspace for turning assessment insight into a clear
                serving direction.
              </p>
              <small>Planned</small>
            </section>
          </div>
        </article>

        <article className="fireside-panel" id="fireside">
          <div className="card-heading">
            <p className="section-label">Fireside</p>
            <h2>Live and archived moments.</h2>
          </div>
          <p>
            Podcasts, blog posts, live events, replays, studies, and community
            moments can gather here without crowding Base Camp.
          </p>
        </article>

        {adminReport ? (
          <article className="admin-panel">
            <div className="card-heading">
              <p className="section-label">Admin report</p>
              <h2>All submissions</h2>
            </div>
            <div className="admin-metrics">
              <p>
                <span>{adminReport.totalInRecentWindow}</span>
                <small>Recent mirrored rows</small>
              </p>
              <p>
                <span>{adminReport.duplicatePairsInRecentWindow}</span>
                <small>Duplicate histories in this window</small>
              </p>
            </div>
            {heatherReport ? (
              <div className="named-check">
                <div>
                  <p className="section-label">Heather verification</p>
                  <h3>willoughbyhs@gmail.com is attached.</h3>
                  <p>
                    {heatherReport.participantCount
                      ? `${heatherReport.totalSnapshots} mirrored submissions are connected across ${heatherReport.participantCount} participant record${
                          heatherReport.participantCount === 1 ? "" : "s"
                        }.`
                      : "No mirrored submissions are attached yet for Heather's Gmail variants."}
                  </p>
                </div>
                {heatherReport.latest.length ? (
                  <div className="named-check-list">
                    {heatherReport.latest.map((snapshot) => (
                      <p key={snapshot.id}>
                        <span>
                          {assessmentLabels[snapshot.assessment_type] ??
                            snapshot.assessment_type}
                        </span>
                        <small>
                          {displayDate(
                            snapshot.source_submitted_at ?? snapshot.created_at,
                          )}
                          {" · "}
                          {snapshot.source ?? "DYDD source"}
                        </small>
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="admin-submission-list">
              {adminReport.recent.slice(0, 36).map((snapshot) => (
                <p key={snapshot.id}>
                  <span>
                    {snapshot.assessment_participants?.display_name ??
                      snapshot.assessment_participants?.normalized_email ??
                      "Unknown participant"}
                  </span>
                  <strong>
                    {assessmentLabels[snapshot.assessment_type] ??
                      snapshot.assessment_type}
                  </strong>
                  <small>
                    {displayDate(
                      snapshot.source_submitted_at ?? snapshot.created_at,
                    )}
                    {" · "}
                    {snapshot.source ?? "DYDD source"}
                  </small>
                </p>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      <section className="ask-dydi-hq" id="ask-dydi" aria-label="Ask Dydi">
        <div className="dydi-host">
          <img src="/brand/characters/dydi-full-body.png" alt="Dydi host" />
          <div>
            <p className="section-label">Companion guide</p>
            <h2>Dydi stays near the trail.</h2>
            <p>
              The guide layer belongs throughout the journey, especially where
              a person needs encouragement, interpretation, or a simple way to
              keep moving.
            </p>
          </div>
        </div>
        <form className="dydi-form">
          <label htmlFor="hq-dydi-question">Ask from Base Camp</label>
          <textarea
            id="hq-dydi-question"
            name="question"
            placeholder="Where should I begin today?"
            rows={4}
          />
          <button className="button primary" type="button">
            Ask Dydi
          </button>
          <p className="helper-text">
            Staged for preview. Live companion responses will connect later.
          </p>
        </form>
      </section>
      </div>
    </main>
  );
}

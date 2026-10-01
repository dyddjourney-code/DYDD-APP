import { NextResponse, type NextRequest } from "next/server";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { spiritualGifts } from "@/lib/spiritual-gifts/intake";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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
  participant_id: string | null;
  scores: Record<string, unknown> | null;
  source_submitted_at: string | null;
};

type CoupleMember = {
  color: string;
  id: string;
  initials: string;
  name: string;
  snapshots: AssessmentSnapshot[];
};

const colors = ["#4a6239", "#8a5f2d"];
const resourcesUrl = "https://www.discoverdivine.design/resources";
const assetBaseUrl = "https://dydd-online-school.vercel.app";
const brandLogoPath = "/brand/dydd-logo-transparent.webp";
const sectionIconPaths = {
  designid: "/brand/tools/designid-icon-correct.png",
  designpd: "/brand/tools/designpd-icon-correct.png",
  spiritualGifts: "/brand/tools/spiritual-gifts-icon-correct.png",
};
const designPdMaxAxisScore = 24;
const designIdMaxScore = 60;
const designIdRadarCenter = 160;
const designIdRadarRadius = 112;

const designIdScoreFields = [
  { color: "#d4a451", label: "Architect", keys: ["Architect_Pts", "architectPts", "architectScore"], wash: "#fbf1dc" },
  { color: "#647c9b", label: "Artisan", keys: ["Artisan_Pts", "artisanPts", "artisanScore"], wash: "#e9eef5" },
  { color: "#739d5e", label: "Shepherd", keys: ["Shepherd_Pts", "shepherdPts", "shepherdScore"], wash: "#edf5e8" },
  { color: "#5a496b", label: "Steward", keys: ["Steward_Pts", "stewardPts", "stewardScore"], wash: "#eee9f3" },
];

const designPdAxes = [
  {
    axisKey: "plan",
    color: "#476b42",
    label: "Plan",
    wash: "#eef5e9",
    left: "Dreamer",
    right: "Doer",
    scoreKeys: ["Plan_Score", "planScore"],
    tendencyKeys: ["Plan_Tendency", "planTendency"],
  },
  {
    axisKey: "decide",
    color: "#739d5e",
    label: "Decide",
    wash: "#f2f8ee",
    left: "Feel It",
    right: "Think It",
    scoreKeys: ["Decide_Score", "decideScore"],
    tendencyKeys: ["Decide_Tendency", "decideTendency"],
  },
  {
    axisKey: "do",
    color: "#a3a158",
    label: "Do",
    wash: "#f8f7e9",
    left: "Solo",
    right: "Together",
    scoreKeys: ["Do_Score", "doScore"],
    tendencyKeys: ["Do_Tendency", "doTendency"],
  },
];

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "couple-overlay";
}

function compactValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function titleize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function participantInitials(name: string) {
  const parts = name.replace(/[^a-zA-Z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function singleParticipant(value: AssessmentSnapshot["assessment_participants"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function snapshotDateValue(snapshot: AssessmentSnapshot) {
  return new Date(snapshot.source_submitted_at ?? snapshot.created_at).getTime();
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

function numberSnapshotValue(snapshot: AssessmentSnapshot, keys: string[]) {
  const value = Number(firstSnapshotValue(snapshot, keys));
  return Number.isFinite(value) ? value : 0;
}

function spiritualGiftRank(snapshot: AssessmentSnapshot, rank: number) {
  const topGifts = snapshot.scores?.topGifts;
  const gift = Array.isArray(topGifts) ? topGifts[rank - 1] : null;

  if (typeof gift === "object" && gift !== null) {
    const data = gift as Record<string, unknown>;
    const label = compactValue(data.label) || compactValue(data.name);
    const score = compactValue(data.score) || compactValue(data.value);

    if (label) return { label, rank, score };
  }

  const label = firstSnapshotValue(snapshot, [`Top${rank}_Name`, `Top_${rank}_Name`, `Top${rank}`]);
  const score = firstSnapshotValue(snapshot, [`Top${rank}_Score`, `Top_${rank}_Score`]);

  return label ? { label, rank, score } : null;
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

function latestAssessmentSnapshots(snapshots: AssessmentSnapshot[]) {
  const latest = new Map<string, AssessmentSnapshot>();

  for (const snapshot of snapshots.filter(isGroupCurrentSnapshot)) {
    const current = latest.get(snapshot.assessment_type);
    if (!current || snapshotDateValue(snapshot) > snapshotDateValue(current)) {
      latest.set(snapshot.assessment_type, snapshot);
    }
  }

  return Array.from(latest.values());
}

function currentSnapshot(member: CoupleMember, assessmentType: string) {
  return latestAssessmentSnapshots(member.snapshots).find((snapshot) => snapshot.assessment_type === assessmentType);
}

function giftDefinition(label: string) {
  return spiritualGifts.find((gift) => gift.label.toLowerCase() === label.toLowerCase())?.definition ?? "";
}

function giftScriptures(label: string) {
  return spiritualGifts.find((gift) => gift.label.toLowerCase() === label.toLowerCase())?.scriptures ?? "";
}

function designIdScores(member: CoupleMember) {
  const snapshot = currentSnapshot(member, "designid");
  return designIdScoreFields.map((field) => ({
    band: capacityBand(snapshot ? numberSnapshotValue(snapshot, field.keys) : 0),
    label: field.label,
    value: snapshot ? numberSnapshotValue(snapshot, field.keys) : 0,
  }));
}

function capacityBand(score: number) {
  if (score >= 40) return "Abundant";
  if (score >= 25) return "Steady";
  if (score >= 10) return "Limited";
  return "Drained";
}

function designPdAxisScore(member: CoupleMember, axis: (typeof designPdAxes)[number]) {
  const snapshot = currentSnapshot(member, "designpd");
  if (!snapshot) return { score: 0, signedScore: 0, tendency: "Not saved" };

  const rawScore = numberSnapshotValue(snapshot, axis.scoreKeys);
  const rawTendency = titleize(firstSnapshotValue(snapshot, axis.tendencyKeys));
  const tendency = rawTendency.toLowerCase();
  const direction =
    tendency.includes(axis.left.toLowerCase().split(" ")[0])
      ? -1
      : tendency.includes(axis.right.toLowerCase().split(" ")[0])
        ? 1
        : 0;
  const signedScore = direction * Math.min(Math.abs(rawScore), designPdMaxAxisScore);

  return {
    score: rawScore,
    signedScore,
    tendency: rawTendency || "Balanced",
  };
}

function gapLevel(gap: number) {
  if (gap <= 5) {
    return {
      label: "close range",
      summary: "You are close enough here that the conversation is less about difference and more about shared stewardship.",
      tone: "Start by noticing what feels familiar to both of you.",
    };
  }

  if (gap <= 15) {
    return {
      label: "noticeable gap",
      summary: "This is enough difference to shape daily expectations, especially when pressure, pace, or decision-making speed increases.",
      tone: "Name the difference before it becomes an assumption.",
    };
  }

  if (gap <= 27) {
    return {
      label: "meaningful gap",
      summary: "This gap can become a real place of partnership or a recurring place of friction if it stays unnamed.",
      tone: "Build a clear agreement so the stronger capacity or tendency does not become pressure on the other spouse.",
    };
  }

  return {
    label: "wide gap",
    summary: "This is a strong contrast. It may be one of the clearest places where your marriage needs language, honor, boundaries, and shared practice.",
    tone: "Treat the gap as a design conversation, not a verdict on either person.",
  };
}

function designIdQuestions(label: string, gap: number) {
  if (gap <= 5) {
    return [
      `Where does shared ${label} capacity help us feel naturally aligned?`,
      "How can we keep this shared strength from becoming invisible or taken for granted?",
      "What would it look like to steward this similarity for service, family, and calling?",
    ];
  }

  if (gap <= 15) {
    return [
      `Where might one of us expect the other to carry ${label} energy the same way?`,
      "What is one situation where this difference shows up quietly before anyone names it?",
      "How can we turn this noticeable difference into a simple agreement instead of a repeated frustration?",
    ];
  }

  if (gap <= 27) {
    return [
      `Where does the higher ${label} capacity naturally carry more weight in our marriage?`,
      "What support, recovery, or role clarity does the lower-capacity spouse need here?",
      "How can we honor the stronger capacity without making it the only acceptable way to move?",
    ];
  }

  return [
    `What part of ${label} feels energizing for one of us and costly for the other?`,
    "What boundary or partnership agreement would keep this contrast from becoming pressure or resentment?",
    "Where might God be inviting us to stop comparing and start covering one another with grace?",
  ];
}

function designPdQuestions(axis: (typeof designPdAxes)[number], gap: number) {
  if (gap <= 5) {
    return [
      `Where does our shared ${axis.label.toLowerCase()} rhythm help us move together easily?`,
      `What might we both miss because neither of us naturally supplies much contrast on ${axis.label.toLowerCase()}?`,
      `How can we intentionally include both ${axis.left} and ${axis.right} when the moment calls for it?`,
    ];
  }

  if (gap <= 15) {
    return [
      `When does this ${axis.label.toLowerCase()} difference first show up in ordinary life?`,
      "What signal tells us we are turning a difference into a judgment?",
      `What simple agreement would help us respect both the ${axis.left} side and the ${axis.right} side?`,
    ];
  }

  if (gap <= 27) {
    return [
      `Where does one spouse tend to pull the ${axis.label.toLowerCase()} conversation in a different direction?`,
      "What does each person need to feel honored before the couple moves forward?",
      "How can we decide who leads this kind of moment without making the other person feel dismissed?",
    ];
  }

  return [
    `Where is this wide ${axis.label.toLowerCase()} contrast most obvious under pressure?`,
    "What recurring argument might actually be a tendency gap asking for a better process?",
    `How can we deliberately borrow the gift of both ${axis.left} and ${axis.right} before acting?`,
  ];
}

function sharedPoleLanguage(axis: (typeof designPdAxes)[number], scores: { signedScore: number }[]) {
  if (scores.length < 2) return "";
  const bothLeft = scores.every((score) => score.signedScore < 0);
  const bothRight = scores.every((score) => score.signedScore > 0);
  if (bothLeft) return `Because both of you lean ${axis.left}, notice what may get missed from the ${axis.right} side.`;
  if (bothRight) return `Because both of you lean ${axis.right}, notice what may get missed from the ${axis.left} side.`;
  return "";
}

function htmlList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function assetUrl(path: string) {
  return `${assetBaseUrl}${path}`;
}

function sectionHeading(title: string, iconPath: string, alt: string) {
  return `<div class="section-title">
    <h2>${escapeHtml(title)}</h2>
    <img src="${assetUrl(iconPath)}" alt="${escapeHtml(alt)}" />
  </div>`;
}

function designIdPolygonPoints(scores: { value: number }[]) {
  return scores
    .map((score, index) => {
      const angle = (-90 + index * 90) * (Math.PI / 180);
      const distance = Math.max(0, Math.min(score.value / designIdMaxScore, 1)) * designIdRadarRadius;
      const x = designIdRadarCenter + Math.cos(angle) * distance;
      const y = designIdRadarCenter + Math.sin(angle) * distance;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function designIdCapacitySvg(members: CoupleMember[]) {
  const memberScores = members.map((member) => ({
    ...member,
    scores: designIdScores(member),
  }));
  const rings = [0.25, 0.5, 0.75, 1]
    .map((scale) => `<g>
      <polygon class="designid-grid-ring" points="${designIdPolygonPoints(designIdScoreFields.map(() => ({ value: designIdMaxScore * scale })))}" />
      <text class="designid-grid-label" x="${designIdRadarCenter + designIdRadarRadius * scale + 6}" y="${designIdRadarCenter - 7}">${Math.round(designIdMaxScore * scale)}</text>
    </g>`)
    .join("");
  const memberShapes = memberScores
    .map((member) => {
      const points = member.scores
        .map((score, scoreIndex) => {
          const angle = (-90 + scoreIndex * 90) * (Math.PI / 180);
          const distance = Math.max(0, Math.min(score.value / designIdMaxScore, 1)) * designIdRadarRadius;
          return {
            label: score.label,
            x: designIdRadarCenter + Math.cos(angle) * distance,
            y: designIdRadarCenter + Math.sin(angle) * distance,
          };
        });

      return `<g>
        <polygon class="designid-member-shape" points="${designIdPolygonPoints(member.scores)}" style="--member-color:${member.color};" />
        ${points.map((point) => `<g>
          <circle class="designid-member-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="9" style="--member-color:${member.color};" />
          <text class="designid-member-initials" x="${point.x.toFixed(1)}" y="${point.y.toFixed(1)}">${escapeHtml(member.initials)}</text>
        </g>`).join("")}
      </g>`;
    })
    .join("");
  const axisLabels = [
    { label: "Architect", x: 160, y: 25 },
    { label: "Artisan", x: 287, y: 164 },
    { label: "Shepherd", x: 160, y: 297 },
    { label: "Steward", x: 34, y: 164 },
  ]
    .map((item) => `<text class="designid-axis-label" x="${item.x}" y="${item.y}">${item.label}</text>`)
    .join("");
  const legend = memberScores
    .map((member) => `<div><i style="background:${member.color};"></i><strong>${escapeHtml(member.initials)}</strong><small>${escapeHtml(member.name)}</small></div>`)
    .join("");
  const scoreTable = `<div class="visual-score-table">
    <div class="visual-score-table-head"><span>Person</span>${designIdScoreFields.map((field) => `<span>${escapeHtml(field.label)}</span>`).join("")}</div>
    ${memberScores.map((member) => `<div class="visual-score-table-row"><strong><i style="background:${member.color};"></i>${escapeHtml(member.initials)}</strong>${member.scores.map((score) => `<span>${score.value}</span>`).join("")}</div>`).join("")}
  </div>`;

  return `<div class="visual-page designid-visual-page">
    <div class="visual-frame">
      <svg viewBox="0 0 320 320" role="img" aria-label="DesignID reflection capacity comparison">
        ${rings}
        <line class="designid-axis-line" x1="160" x2="160" y1="48" y2="272" />
        <line class="designid-axis-line" x1="48" x2="272" y1="160" y2="160" />
        ${memberShapes}
        ${axisLabels}
      </svg>
      <div class="visual-legend">${legend}</div>
      ${scoreTable}
    </div>
  </div>`;
}

function designPdVisual(members: CoupleMember[]) {
  const axisRows = designPdAxes
    .map((axis) => {
      const axisScores = members.map((member) => {
        const score = designPdAxisScore(member, axis);
        return {
          ...member,
          ...score,
          position: ((score.signedScore + designPdMaxAxisScore) / (designPdMaxAxisScore * 2)) * 100,
        };
      });
      const gap = axisScores.length >= 2 ? Math.abs(axisScores[0].signedScore - axisScores[1].signedScore) : 0;

      return `<div class="designpd-visual-axis" style="--axis-color:${axis.color};--axis-wash:${axis.wash};">
        <div class="designpd-visual-heading"><strong>${escapeHtml(axis.label)}</strong><span>${gap} point gap</span></div>
        <div class="designpd-visual-track">
          <small>${escapeHtml(axis.left)}</small>
          <div>
            <i></i>
            ${axisScores.map((member) => `<b style="--member-color:${member.color};left:${member.position}%;" title="${escapeHtml(`${member.name}: ${member.tendency} (${member.score})`)}">${escapeHtml(member.initials)}</b>`).join("")}
          </div>
          <small>${escapeHtml(axis.right)}</small>
        </div>
      </div>`;
    })
    .join("");
  const scoreKey = members
    .map((member) => {
      const entries = designPdAxes.map((axis) => {
        const score = designPdAxisScore(member, axis);
        return `${axis.label}: ${score.tendency} (${score.score})`;
      });

      return `<div><i style="background:${member.color};"></i><strong>${escapeHtml(member.initials)}</strong><small>${escapeHtml(entries.join(" | "))}</small></div>`;
    })
    .join("");

  return `<div class="visual-page designpd-visual-page">
    <div class="designpd-visual-stack">
      ${axisRows}
      <div class="designpd-visual-key">${scoreKey}</div>
    </div>
  </div>`;
}

function sharedGiftsCopy(labels: string[]) {
  if (labels.length === 0) {
    return {
      heading: "No shared top-five gift in this snapshot",
      text: "That does not mean you lack spiritual agreement. It means your current top-five gifts may cover different parts of the Body, giving you more places to learn from one another and stand in the gap.",
    };
  }

  if (labels.length === 1) {
    return {
      heading: `Shared top-five gift: ${labels[0]}`,
      text: "One shared gift can become a common language for service, prayer, and encouragement. It is worth asking how this gift expresses differently in each of you.",
    };
  }

  if (labels.length <= 3) {
    return {
      heading: `Shared top-five gifts: ${labels.join(", ")}`,
      text: "Multiple shared gifts may point to a meaningful overlap in how you notice needs, serve others, and move toward ministry together. The invitation is to steward the overlap without assuming you express each gift the same way.",
    };
  }

  return {
    heading: `Strong shared gift pattern: ${labels.join(", ")}`,
    text: "A high number of shared gifts can create strong agreement and momentum. It can also create blind spots if you both overlook the same kinds of needs, so use the overlap with gratitude and humility.",
  };
}

function buildMarriageOverlayHtml(groupName: string, members: CoupleMember[]) {
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  const [first, second] = members;
  const memberNames = members.map((member) => member.name).join(" and ");

  const giftRows = members.map((member) => {
    const snapshot = currentSnapshot(member, "spiritual_gifts");
    const gifts = snapshot ? [1, 2, 3, 4, 5].map((rank) => spiritualGiftRank(snapshot, rank)).filter(Boolean) : [];

    return `<div class="person-panel">
      <h3>${escapeHtml(member.name)}</h3>
      ${gifts.length ? gifts.map((gift) => `<p><strong>${gift?.rank}. ${escapeHtml(gift?.label ?? "")}</strong><span>${escapeHtml(giftDefinition(gift?.label ?? "") || "A grace to notice, steward, and confirm in community.")}</span><em>${escapeHtml(giftScriptures(gift?.label ?? "") || "Scripture reference pending")}</em></p>`).join("") : "<p>No Spiritual Gifts snapshot is saved yet.</p>"}
    </div>`;
  }).join("");

  const sharedGiftLabels = (() => {
    if (!first || !second) return [];
    const firstSnapshot = currentSnapshot(first, "spiritual_gifts");
    const secondSnapshot = currentSnapshot(second, "spiritual_gifts");
    const firstGifts = new Set(
      firstSnapshot ? [1, 2, 3, 4, 5].map((rank) => spiritualGiftRank(firstSnapshot, rank)?.label.toLowerCase()).filter(Boolean) : [],
    );
    return secondSnapshot
      ? [1, 2, 3, 4, 5]
          .map((rank) => spiritualGiftRank(secondSnapshot, rank)?.label ?? "")
          .filter((label) => firstGifts.has(label.toLowerCase()))
      : [];
  })();
  const sharedGiftCopy = sharedGiftsCopy(sharedGiftLabels);

  const designIdRows = designIdScoreFields.map((field) => {
    const scores = members.map((member) => designIdScores(member).find((score) => score.label === field.label) ?? { band: "Not saved", label: field.label, value: 0 });
    const gap = scores.length >= 2 ? Math.abs(scores[0].value - scores[1].value) : 0;
    const level = gapLevel(gap);
    return `<section class="interpretation-row reflection-row" style="--reflection-color:${field.color};--reflection-wash:${field.wash};">
      <h3>${escapeHtml(field.label)} capacity <span>${gap} point gap</span></h3>
      <p>${escapeHtml(members.map((member, index) => `${member.initials}: ${scores[index].value} (${scores[index].band})`).join(" | "))}</p>
      <p><strong>${escapeHtml(titleize(level.label))}.</strong> ${escapeHtml(level.summary)} ${escapeHtml(level.tone)}</p>
      ${htmlList(designIdQuestions(field.label, gap))}
    </section>`;
  }).join("");

  const designPdRows = designPdAxes.map((axis) => {
    const axisScores = members.map((member) => designPdAxisScore(member, axis));
    const gap = axisScores.length >= 2 ? Math.abs(axisScores[0].signedScore - axisScores[1].signedScore) : 0;
    const sharedPole = sharedPoleLanguage(axis, axisScores);
    const level = gapLevel(gap);
    return `<section class="interpretation-row designpd-row" style="--axis-color:${axis.color};--axis-wash:${axis.wash};">
      <h3>${escapeHtml(axis.label)} tendency <span>${gap} point gap</span></h3>
      <p>${escapeHtml(members.map((member, index) => `${member.initials}: ${axisScores[index].tendency} (${axisScores[index].score})`).join(" | "))}</p>
      <p><strong>${escapeHtml(titleize(level.label))}.</strong> ${escapeHtml(level.summary)} ${escapeHtml(level.tone)}</p>
      ${sharedPole ? `<p>${escapeHtml(sharedPole)}</p>` : ""}
      ${htmlList(designPdQuestions(axis, gap))}
    </section>`;
  }).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Marriage Design - ${escapeHtml(groupName)}</title>
  <style>
    :root { --ink:#172116; --muted:#667263; --paper:#fbfaf4; --line:#dfe7d9; --green:#476b42; --dark:#243f27; --gold:#b88a43; --blue:#456073; }
    * { box-sizing:border-box; }
    body { margin:0; background:linear-gradient(180deg,#fbfaf4,#f4f1e8); color:var(--ink); font-family:Aptos,Segoe UI,Arial,sans-serif; padding:34px; }
    main { max-width:960px; margin:0 auto; background:white; border:1px solid var(--line); box-shadow:0 24px 70px rgba(70,58,35,.12); }
    header { background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; display:grid; gap:24px; grid-template-columns:minmax(0,1fr) auto; padding:34px; }
    header img { display:block; filter:brightness(0) invert(1); height:54px; max-width:230px; object-fit:contain; width:auto; }
    .header-copy { min-width:0; }
    .brand-mark { align-self:start; justify-self:end; }
    .eyebrow { color:#e4d2a7; font-size:12px; font-weight:900; letter-spacing:.12em; margin:0 0 10px; text-transform:uppercase; }
    h1 { font-size:38px; line-height:1.02; margin:0; max-width:720px; }
    h2 { color:var(--dark); font-size:25px; margin:0 0 14px; }
    h3 { color:var(--dark); font-size:17px; margin:0 0 8px; }
    h3 span { color:#111; float:right; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:14px; font-weight:950; }
    p { color:var(--muted); font-size:14px; line-height:1.58; margin:0 0 12px; }
    section { border-top:1px solid var(--line); padding:28px 34px; }
    .cover-meta { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:30px; }
    .cover-meta div { background:rgba(255,250,240,.1); border:1px solid rgba(255,250,240,.22); padding:14px; }
    .cover-meta small { color:#e4d2a7; display:block; font-size:11px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .cover-meta strong { display:block; font-size:16px; margin-top:5px; }
    .two-col { display:grid; gap:16px; grid-template-columns:repeat(2,minmax(0,1fr)); }
    .section-title { align-items:center; border-bottom:3px solid var(--green); display:flex; gap:18px; justify-content:space-between; margin-bottom:18px; padding-bottom:10px; }
    .section-title h2 { margin:0; }
    .section-title img { display:block; height:48px; object-fit:contain; width:48px; }
    .person-panel { border:2px solid rgba(71,107,66,.34); padding:18px; }
    .person-panel h3 { color:var(--green); }
    .person-panel p { border-top:1px solid rgba(36,63,39,.1); margin:0; padding:12px 0; }
    .person-panel p:first-of-type { border-top:0; }
    .person-panel strong, .person-panel span, .person-panel em { display:block; }
    .person-panel span { color:var(--muted); font-size:13px; line-height:1.45; margin-top:4px; }
    .person-panel em { color:var(--green); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; font-style:normal; font-weight:800; letter-spacing:.02em; margin-top:7px; }
    .scripture-note { background:#f3f8ef; border:1px solid rgba(71,107,66,.28); border-left:6px solid var(--green); margin-top:18px; padding:14px 16px; }
    .scripture-note p { color:var(--ink); margin:0; }
    .callout { background:#f3f8ef; border:1px solid rgba(71,107,66,.24); border-left:6px solid var(--dark); margin-top:18px; padding:18px; }
    .interpretation-row { border:1px solid var(--line); margin-top:12px; padding:18px; }
    .reflection-row { background:var(--reflection-wash); border:2px solid var(--reflection-color); box-shadow:0 10px 26px rgba(36,63,39,.08); }
    .reflection-row h3 { color:var(--reflection-color); }
    .reflection-row h3 span { color:#111; }
    .designpd-row { background:var(--axis-wash); border:2px solid var(--axis-color); box-shadow:0 10px 26px rgba(36,63,39,.08); }
    .designpd-row h3 { color:var(--axis-color); }
    .designpd-row h3 span { color:#111; }
    .visual-page { border:0; padding:4px 0 12px; }
    .visual-frame { display:grid; justify-items:center; gap:14px; }
    .visual-frame svg { height:auto; max-width:640px; width:100%; }
    .designid-grid-ring { fill:none; stroke:rgba(36,63,39,.16); stroke-width:1; }
    .designid-grid-label { fill:rgba(36,63,39,.46); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:9px; font-weight:850; }
    .designid-axis-line { stroke:rgba(36,63,39,.18); stroke-width:1.5; }
    .designid-axis-label { dominant-baseline:middle; fill:var(--dark); font-size:13px; font-weight:950; text-anchor:middle; }
    .designid-member-shape { fill:color-mix(in srgb, var(--member-color) 20%, transparent); stroke:var(--member-color); stroke-linejoin:round; stroke-width:3; }
    .designid-member-dot { fill:var(--member-color); stroke:#fffaf0; stroke-width:2; }
    .designid-member-initials { dominant-baseline:middle; fill:#fffaf0; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:8px; font-weight:950; text-anchor:middle; }
    .visual-legend { display:flex; flex-wrap:wrap; gap:10px; justify-content:center; }
    .visual-legend div, .designpd-visual-key div { align-items:center; background:#f7f9f5; border:1px solid rgba(36,63,39,.1); display:grid; gap:8px; grid-template-columns:10px auto minmax(0,1fr); padding:9px 11px; }
    .visual-legend i, .designpd-visual-key i, .visual-score-table i { border-radius:999px; display:block; height:10px; width:10px; }
    .visual-legend strong, .designpd-visual-key strong, .visual-score-table strong { color:var(--dark); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px; font-weight:950; }
    .visual-legend small, .designpd-visual-key small { color:var(--muted); font-size:12px; font-weight:800; }
    .visual-score-table { border:1px solid rgba(36,63,39,.12); width:100%; }
    .visual-score-table-head, .visual-score-table-row { display:grid; grid-template-columns:1.2fr repeat(4,1fr); }
    .visual-score-table-head span { background:#f3f8ef; color:var(--dark); font-size:11px; font-weight:950; letter-spacing:.04em; padding:8px; text-transform:uppercase; }
    .visual-score-table-row > * { align-items:center; border-top:1px solid rgba(36,63,39,.1); display:flex; gap:7px; padding:9px 8px; }
    .visual-score-table-row span { color:var(--ink); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; font-weight:900; }
    .designpd-visual-stack { display:grid; gap:22px; }
    .designpd-visual-axis { background:var(--axis-wash); border:2px solid var(--axis-color); padding:16px; }
    .designpd-visual-heading { align-items:baseline; display:flex; justify-content:space-between; }
    .designpd-visual-heading strong { color:var(--axis-color); font-size:16px; }
    .designpd-visual-heading span { color:#111; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; font-weight:950; }
    .designpd-visual-track { align-items:center; display:grid; gap:12px; grid-template-columns:78px minmax(0,1fr) 78px; margin-top:14px; }
    .designpd-visual-track small { color:var(--muted); font-size:12px; font-weight:900; }
    .designpd-visual-track small:last-child { text-align:right; }
    .designpd-visual-track > div { height:48px; position:relative; }
    .designpd-visual-track i { background:linear-gradient(90deg, color-mix(in srgb, var(--axis-color) 46%, #fff), rgba(36,63,39,.12), var(--axis-color)); border-radius:999px; display:block; height:8px; left:0; position:absolute; right:0; top:20px; }
    .designpd-visual-track i::after { background:rgba(36,63,39,.28); content:""; display:block; height:18px; left:50%; position:absolute; top:-5px; width:1px; }
    .designpd-visual-track b { align-items:center; background:var(--member-color); border:2px solid #fffaf0; border-radius:999px; box-shadow:0 5px 12px rgba(36,63,39,.14); color:#fffaf0; display:flex; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; font-weight:950; height:28px; justify-content:center; min-width:28px; padding:0 5px; position:absolute; top:10px; transform:translateX(-50%); }
    .designpd-visual-key { border-top:1px solid rgba(36,63,39,.1); display:grid; gap:8px; padding-top:12px; }
    .resource-grid { display:grid; gap:14px; grid-template-columns:repeat(3,minmax(0,1fr)); }
    .resource-card { background:#f7f9f5; border:1px solid rgba(36,63,39,.12); padding:16px; }
    .resource-card h3 { color:var(--green); }
    .resource-cta { align-items:center; background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; display:grid; gap:20px; grid-template-columns:minmax(0,1fr) 132px; margin-top:18px; padding:22px; }
    .resource-cta p, .resource-cta h3 { color:#fffaf0; }
    .resource-cta a { color:#fffaf0; font-weight:950; }
    .resource-cta img { background:#fff; display:block; height:132px; padding:8px; width:132px; }
    ul { color:var(--ink); margin:10px 0 0; padding-left:20px; }
    li { font-size:14px; line-height:1.5; margin:6px 0; }
    footer { background:#f7f3e8; border-top:1px solid var(--line); padding:26px 34px; }
    @media print { body { background:white; padding:0; } main { border:0; box-shadow:none; } section { break-inside:avoid; } .visual-section, .resource-section { break-before:page; } }
    @media (max-width:760px) { body { padding:12px; } header, .two-col, .cover-meta, .resource-grid, .resource-cta { grid-template-columns:1fr; } .brand-mark { justify-self:start; } h3 span { float:none; display:block; margin-top:4px; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="header-copy">
        <p class="eyebrow">Discover Your Divine Design Married Couples</p>
        <h1>Marriage Design</h1>
        <div class="cover-meta">
          <div><small>Couple</small><strong>${escapeHtml(memberNames || groupName)}</strong></div>
          <div><small>Group</small><strong>${escapeHtml(groupName)}</strong></div>
          <div><small>Created</small><strong>${escapeHtml(today)}</strong></div>
        </div>
      </div>
      <img class="brand-mark" src="${assetUrl(brandLogoPath)}" alt="Discover Your Divine Design" />
    </header>
    <section>
      <h2>How to Read This Overlay</h2>
      <p>This first draft is not a label, verdict, or compatibility score. It is a conversation starter. The goal is to help you notice where God may have given you shared strength, complementary capacity, and different movement patterns that can become wisdom when they are named with humility.</p>
    </section>
    <section>
      ${sectionHeading("Spiritual Gifts Overlap", sectionIconPaths.spiritualGifts, "Spiritual Gifts")}
      <div class="two-col">${giftRows}</div>
      <div class="scripture-note">
        <p><strong>*</strong> Be sure to explore these Bible verse references in context together. Let the passages shape the conversation, not just the gift names.</p>
      </div>
      <div class="callout">
        <h3>${escapeHtml(sharedGiftCopy.heading)}</h3>
        <p>${escapeHtml(sharedGiftCopy.text)}</p>
        ${htmlList([
          "Which gift in your spouse do you want to honor more intentionally?",
          "Where do your gifts help you serve together rather than compete for who is right?",
          "Where might one spouse stand in the gap for the other without becoming superior or resentful?",
        ])}
      </div>
    </section>
    <section class="visual-section">
      ${sectionHeading("DesignID Capacity Overlay", sectionIconPaths.designid, "DesignID")}
      ${designIdCapacitySvg(members)}
      <p>Capacity is about energy, rhythm, and grace under real life conditions. A gap may show where one spouse has more natural energy while the other may need support, recovery, or a different lane.</p>
      ${designIdRows}
    </section>
    <section class="visual-section">
      ${sectionHeading("DesignPD Tendencies", sectionIconPaths.designpd, "DesignPD")}
      ${designPdVisual(members)}
      <p>DesignPD helps you talk about how you plan, decide, and move. Gaps often explain recurring friction. Shared leanings often show what comes naturally as a couple and what may need outside attention.</p>
      ${designPdRows}
    </section>
    <section>
      <h2>Walk Forward From Here</h2>
      <p>A healthy couple does not use design language to win arguments. Use it to become curious faster, repair sooner, and build agreements that honor both people.</p>
      ${htmlList([
        "Start with gratitude: name one strength you see in your spouse before naming a gap.",
        "Turn every gap into a question before it becomes an accusation.",
        "Ask what your marriage needs that neither of you naturally carries first.",
        "Choose one small agreement for pressure, conflict, planning, or follow-through this week.",
      ])}
    </section>
    <section class="resource-section">
      <h2>Continue With Discover Your Divine Design</h2>
      <p>This Marriage Design snapshot is one conversation inside a larger journey of identity, gifts, formation, and faithful action. Use the resources below when you are ready to keep moving.</p>
      <div class="resource-grid">
        <div class="resource-card">
          <h3>Explore Assessments</h3>
          <p>Spiritual Gifts, DesignID, DesignPD, and future tools help you see different parts of the same design story.</p>
        </div>
        <div class="resource-card">
          <h3>Take the Journey</h3>
          <p>Books, workbooks, courses, and guided reflection help turn assessment language into growth and discipleship.</p>
        </div>
        <div class="resource-card">
          <h3>Bring It to a Circle</h3>
          <p>Camp Circles, marriage workshops, classes, and teams can use shared data to build healthier conversations.</p>
        </div>
      </div>
      <div class="resource-cta">
        <div>
          <h3>Resources, Courses, and Next Steps</h3>
          <p>Scan the code or visit <a href="${resourcesUrl}">${resourcesUrl}</a>.</p>
        </div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(resourcesUrl)}" alt="QR code for DYDD resources" />
      </div>
    </section>
    <footer>
      <p><strong>First draft note:</strong> This Marriage Overlay is an early prototype for Discover Your Divine Design couple conversations. Use it prayerfully, gently, and as a beginning point for dialogue.</p>
    </footer>
  </main>
</body>
</html>`;
}

async function getActor(request: NextRequest) {
  const ownerParams = {
    key: request.nextUrl.searchParams.get("key"),
    review: request.nextUrl.searchParams.get("review"),
  };

  if (isOwnerPreviewRequest(ownerParams)) {
    return { isAdmin: true, userId: "owner-preview" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { isAdmin: isDyddAdminEmail(user.email), userId: user.id };
}

export async function GET(request: NextRequest) {
  const groupId = request.nextUrl.searchParams.get("group");
  if (!groupId) {
    return NextResponse.json({ error: "Missing group id." }, { status: 400 });
  }

  const actor = await getActor(request);
  if (!actor) {
    return NextResponse.json({ error: "Sign in before downloading this couple artifact." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: group } = await supabase
    .from("assessment_groups")
    .select("id,name,owner_user_id")
    .eq("id", groupId)
    .maybeSingle();

  if (!group || (!actor.isAdmin && group.owner_user_id !== actor.userId)) {
    return NextResponse.json({ error: "You do not have access to this group." }, { status: 403 });
  }

  const { data: memberships } = await supabase
    .from("assessment_group_members")
    .select("id,participant_id,membership_status,assessment_participants(id,display_name,normalized_email)")
    .eq("group_id", groupId)
    .eq("membership_status", "active");

  const participantIds = ((memberships ?? []) as { participant_id: string }[]).map((membership) => membership.participant_id);
  if (participantIds.length < 2) {
    return NextResponse.json({ error: "This couple artifact needs at least two active group members." }, { status: 400 });
  }

  const { data: snapshots } = await supabase
    .from("assessment_snapshots")
    .select("id,assessment_type,created_at,participant_id,scores,source_submitted_at,assessment_participants(id,display_name,normalized_email)")
    .in("participant_id", participantIds)
    .order("source_submitted_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const snapshotsByParticipant = new Map<string, AssessmentSnapshot[]>();
  for (const snapshot of (snapshots ?? []) as AssessmentSnapshot[]) {
    if (!snapshot.participant_id) continue;
    snapshotsByParticipant.set(snapshot.participant_id, [
      ...(snapshotsByParticipant.get(snapshot.participant_id) ?? []),
      snapshot,
    ]);
  }

  const members = ((memberships ?? []) as {
    assessment_participants: AssessmentParticipant | AssessmentParticipant[] | null;
    participant_id: string;
  }[])
    .slice(0, 2)
    .map<CoupleMember>((membership, index) => {
      const participant = Array.isArray(membership.assessment_participants)
        ? membership.assessment_participants[0] ?? null
        : membership.assessment_participants;
      const name = participant?.display_name ?? participant?.normalized_email ?? `Partner ${index + 1}`;
      return {
        color: colors[index % colors.length],
        id: membership.participant_id,
        initials: participantInitials(name),
        name,
        snapshots: snapshotsByParticipant.get(membership.participant_id) ?? [],
      };
    });

  const html = buildMarriageOverlayHtml(String(group.name ?? "Couple"), members);
  const filename = `${slugify(String(group.name ?? "couple"))}-marriage-overlay.html`;

  return new NextResponse(html, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

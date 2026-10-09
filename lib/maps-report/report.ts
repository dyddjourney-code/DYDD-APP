import { mapsPhases, type MapsSubcategory } from "./content";

export type MapsAssessmentParticipant = {
  display_name: string | null;
  id: string;
  normalized_email: string | null;
};

export type MapsAssessmentSnapshot = {
  assessment_participants?: MapsAssessmentParticipant | MapsAssessmentParticipant[] | null;
  assessment_type: string;
  created_at: string;
  id: string;
  participant_id: string | null;
  scores: Record<string, unknown> | null;
  source_submitted_at: string | null;
};

export type MapsParticipantReportInput = {
  designIdSnapshot: MapsAssessmentSnapshot;
  designPdSnapshot: MapsAssessmentSnapshot;
  participant: MapsAssessmentParticipant;
};

type Reflection = "Architect" | "Artisan" | "Shepherd" | "Steward";

const reflectionFields: Array<{
  color: string;
  keys: string[];
  label: Reflection;
}> = [
  { color: "#d4a451", keys: ["Architect_Pts", "architectPts", "architectScore"], label: "Architect" },
  { color: "#647c9b", keys: ["Artisan_Pts", "artisanPts", "artisanScore"], label: "Artisan" },
  { color: "#739d5e", keys: ["Shepherd_Pts", "shepherdPts", "shepherdScore"], label: "Shepherd" },
  { color: "#5a496b", keys: ["Steward_Pts", "stewardPts", "stewardScore"], label: "Steward" },
];

const designPdAxes = [
  {
    axisKey: "plan",
    label: "Plan",
    oppositeNeed: "narrow the possible futures into one faithful next step",
    scoreKeys: ["Plan_Score", "planScore"],
    tendencyKeys: ["Plan_Tendency", "planTendency"],
  },
  {
    axisKey: "decide",
    label: "Decide",
    oppositeNeed: "test conviction with timing, evidence, counsel, cost, and fit",
    scoreKeys: ["Decide_Score", "decideScore"],
    tendencyKeys: ["Decide_Tendency", "decideTendency"],
  },
  {
    axisKey: "do",
    label: "Do",
    oppositeNeed: "add visible accountability, collaboration points, and a finish line",
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

function compactValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function scoreObject(snapshot: MapsAssessmentSnapshot | null | undefined, key: string) {
  const value = snapshot?.scores?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function snapshotSections(snapshot: MapsAssessmentSnapshot | null | undefined) {
  return [
    scoreObject(snapshot, "summary"),
    scoreObject(snapshot, "profileLanguage"),
    scoreObject(snapshot, "scores"),
    snapshot?.scores ?? {},
  ];
}

function firstSnapshotValue(snapshot: MapsAssessmentSnapshot | null | undefined, keys: string[]) {
  for (const key of keys) {
    for (const section of snapshotSections(snapshot)) {
      const value = compactValue(section[key]);
      if (value) return value;
    }
  }

  return "";
}

function numericSnapshotValue(snapshot: MapsAssessmentSnapshot, keys: string[]) {
  const value = Number(firstSnapshotValue(snapshot, keys).replace(/%$/, ""));
  return Number.isFinite(value) ? value : 0;
}

function titleize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function capacityBand(score: number) {
  if (score >= 40) return "Abundant";
  if (score >= 25) return "Steady";
  if (score >= 10) return "Limited";
  return "Drained";
}

function singleParticipant(value: MapsAssessmentSnapshot["assessment_participants"]) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function participantFromSnapshots(snapshots: MapsAssessmentSnapshot[]) {
  for (const snapshot of snapshots) {
    const participant = singleParticipant(snapshot.assessment_participants);
    if (participant) return participant;
  }

  return null;
}

export function latestMapsSnapshot(
  snapshots: MapsAssessmentSnapshot[],
  assessmentType: "designid" | "designpd",
) {
  return snapshots
    .filter((snapshot) => snapshot.assessment_type === assessmentType)
    .sort(
      (a, b) =>
        new Date(b.source_submitted_at ?? b.created_at).getTime() -
        new Date(a.source_submitted_at ?? a.created_at).getTime(),
    )[0];
}

export function hasMapsReportInputs(snapshots: MapsAssessmentSnapshot[]) {
  return Boolean(latestMapsSnapshot(snapshots, "designid") && latestMapsSnapshot(snapshots, "designpd"));
}

export function cleanMapsFilename(value: string) {
  return value.replace(/[^\w .'-]+/g, " ").replace(/\s+/g, " ").trim() || "MAPS Roadmap";
}

function reflectionProfile(designIdSnapshot: MapsAssessmentSnapshot) {
  return reflectionFields
    .map((field) => {
      const score = numericSnapshotValue(designIdSnapshot, field.keys);
      return {
        ...field,
        band: capacityBand(score),
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function reflectionNarrative(reflection: Reflection, subcategory: string) {
  const copy: Record<Reflection, string> = {
    Architect:
      "frames direction, sees what the work could become, and helps turn purpose into a path",
    Artisan:
      "gives language, shape, beauty, adaptation, and fit to what is emerging",
    Shepherd:
      "protects people, belonging, care, trust, and relational meaning inside the work",
    Steward:
      "guards responsibility, follow-through, order, maintenance, and sustainable completion",
  };

  return `${reflection} in ${subcategory} ${copy[reflection]}.`;
}

function capacitySupport(reflection: Reflection, band: string) {
  if (band === "Abundant") {
    return `${reflection} is a major carrying capacity here. Use it intentionally, but keep it from taking over the whole process.`;
  }

  if (band === "Steady") {
    return `${reflection} can contribute reliably here with normal support, clear scope, and a visible next step.`;
  }

  if (band === "Limited") {
    return `${reflection} can help in a focused way, but it needs boundaries, partnership, or a smaller assignment.`;
  }

  return `${reflection} is likely depleted here. Do not make this the unsupported carrying lane; reduce demand, add tools, or share ownership.`;
}

function designPdAxis(
  designPdSnapshot: MapsAssessmentSnapshot,
  axis: (typeof designPdAxes)[number],
) {
  const axisTendencies = designPdSnapshot.scores?.axisTendencies;
  const axisObject =
    typeof axisTendencies === "object" && axisTendencies !== null && !Array.isArray(axisTendencies)
      ? (axisTendencies as Record<string, unknown>)[axis.axisKey]
      : null;
  const axisObjectTendency =
    typeof axisObject === "object" && axisObject !== null && !Array.isArray(axisObject)
      ? compactValue((axisObject as Record<string, unknown>).tendency)
      : compactValue(axisObject);
  const axisObjectScore =
    typeof axisObject === "object" && axisObject !== null && !Array.isArray(axisObject)
      ? compactValue((axisObject as Record<string, unknown>).score)
      : "";

  return {
    label: axis.label,
    need: axis.oppositeNeed,
    score:
      axisObjectScore ||
      firstSnapshotValue(designPdSnapshot, axis.scoreKeys) ||
      firstSnapshotValue(designPdSnapshot, [`${axis.label}_Score`]),
    tendency: titleize(axisObjectTendency || firstSnapshotValue(designPdSnapshot, axis.tendencyKeys) || "Balanced"),
  };
}

function designPdProfile(designPdSnapshot: MapsAssessmentSnapshot) {
  return designPdAxes.map((axis) => designPdAxis(designPdSnapshot, axis));
}

function subcategoryLane(subcategory: string) {
  if (["Purpose", "Culture", "Motivation", "Assessment"].includes(subcategory)) return "Plan";
  if (["Insight", "Direction", "Proof", "Organization"].includes(subcategory)) return "Decide";
  return "Do";
}

function laneRead(lane: string) {
  if (lane === "Plan") {
    return "begin with imagination, meaning, and possibility, then narrow the frame before movement becomes too wide";
  }

  if (lane === "Decide") {
    return "turn insight into wise choice by adding criteria, evidence, counsel, and timing";
  }

  return "move into visible action with ownership, pacing, support, and a clear finish line";
}

function subcategoryRead(subcategory: MapsSubcategory, designIdSnapshot: MapsAssessmentSnapshot) {
  const profile = reflectionProfile(designIdSnapshot);
  const topThree = profile.slice(0, 3);
  const primary = profile.find((item) => item.label === subcategory.primaryReflection) ?? profile[0];
  const lowest = [...profile].sort((a, b) => a.score - b.score)[0];
  const lane = subcategoryLane(subcategory.name);

  return {
    gap:
      lowest.band === "Drained"
        ? `${lowest.label} is the capacity to protect. If ${subcategory.name} requires heavy ${lowest.label.toLowerCase()} load, the report should recommend support, automation, a template, or shared ownership.`
        : `${lowest.label} is the lowest current capacity, so keep the demand focused and do not let it become an invisible carrying load.`,
    interpretation: `${subcategory.name} asks this person to ${subcategory.demandQuestion.replace(/\?$/, "").toLowerCase()}. Their strongest current capacities are ${topThree.map((item) => `${item.label} ${item.score} (${item.band})`).join(", ")}. The key MAPS capacity for this page is ${primary.label}, which means the page should help them ${reflectionNarrative(primary.label, subcategory.name).replace(`${primary.label} in ${subcategory.name} `, "")}.`,
    lane,
    support:
      "Use a simple support pattern: one sentence, one audience or person served, one visible fruit, one next action, and one support mechanism.",
    strength: `${topThree.map((item) => item.label).join(", ")} gives this person a natural way to engage ${subcategory.name}: ${topThree.map((item) => reflectionNarrative(item.label, subcategory.name)).join(" ")}`,
  };
}

function htmlList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTermCards(subcategory: MapsSubcategory, lane: string) {
  return subcategory.terms
    .map(
      (term, index) => `<article class="maps-term-card">
        <div class="maps-term-index">${String.fromCharCode(65 + index)}</div>
        <div>
          <h4>${escapeHtml(term.name)}</h4>
          <p><strong>Organizational definition:</strong> ${escapeHtml(term.definition)}</p>
          <p><strong>Biblical definition:</strong> ${escapeHtml(term.biblical)}</p>
          <p><strong>Design capacity:</strong> ${escapeHtml(term.capacity)}</p>
          <p><strong>${escapeHtml(term.scripture)}:</strong> ${escapeHtml(term.scriptureSummary)}</p>
          <p><strong>${escapeHtml(lane)} lens:</strong> Use ${escapeHtml(term.name)} to ${escapeHtml(laneRead(lane))}.</p>
        </div>
      </article>`,
    )
    .join("");
}

function renderSubcategoryPage(
  subcategory: MapsSubcategory,
  designIdSnapshot: MapsAssessmentSnapshot,
  designPdSnapshot: MapsAssessmentSnapshot,
  phaseColor: string,
) {
  const read = subcategoryRead(subcategory, designIdSnapshot);
  const pdProfile = designPdProfile(designPdSnapshot);
  const capacityRows = reflectionProfile(designIdSnapshot)
    .map(
      (item) => `<div class="maps-capacity-row">
        <span><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>
        <strong>${item.score}</strong>
        <em>${escapeHtml(item.band)}</em>
        <small>${escapeHtml(capacitySupport(item.label, item.band))}</small>
      </div>`,
    )
    .join("");
  const pdRows = pdProfile
    .map(
      (axis) => `<div class="maps-pd-row">
        <span>${escapeHtml(axis.label)}</span>
        <strong>${escapeHtml(axis.tendency)}${axis.score ? ` (${escapeHtml(axis.score)})` : ""}</strong>
        <small>${escapeHtml(axis.need)}</small>
      </div>`,
    )
    .join("");

  return `<section class="maps-subcategory-page" style="--phase-color:${phaseColor}">
    <div class="maps-page-heading">
      <p>MAPS Personal Roadmap</p>
      <h2>${escapeHtml(subcategory.name)}</h2>
      <small>${escapeHtml(subcategory.terms.map((term) => term.name).join(" | "))}</small>
    </div>
    <div class="maps-definition-block">
      <h3>Simple Definition</h3>
      <p>${escapeHtml(subcategory.definition)}</p>
      <dl>
        <div><dt>Project demand question</dt><dd>${escapeHtml(subcategory.demandQuestion)}</dd></div>
        <div><dt>Core capacity need</dt><dd>${escapeHtml(subcategory.capacityNeed)}</dd></div>
        <div><dt>Common use</dt><dd>${escapeHtml(subcategory.applicationUse)}</dd></div>
      </dl>
    </div>
    <div class="maps-two-column">
      <article>
        <h3>Reflection Capacity Lens</h3>
        <p>${escapeHtml(read.interpretation)}</p>
        <h4>Strength</h4>
        <p>${escapeHtml(read.strength)}</p>
        <h4>Gap</h4>
        <p>${escapeHtml(read.gap)}</p>
        <h4>Support</h4>
        <p>${escapeHtml(read.support)}</p>
      </article>
      <article>
        <h3>Plan / Decide / Do Lens</h3>
        <p>This page sits primarily in the <strong>${escapeHtml(read.lane)}</strong> lane. The report should help the person ${escapeHtml(laneRead(read.lane))}.</p>
        <h4>Strength</h4>
        <p>Their DesignPD pattern shows how they naturally move when this page becomes real work.</p>
        <h4>Need</h4>
        <p>Give the opposite-side support before this page becomes overload or delay.</p>
        <h4>Gap</h4>
        <p>Watch for the page staying inspiring but not operational, or becoming operational without enough support.</p>
      </article>
    </div>
    <div class="maps-data-grid">
      <article>
        <h3>Core Capacity Need</h3>
        ${capacityRows}
      </article>
      <article>
        <h3>Movement Tendencies</h3>
        ${pdRows}
      </article>
    </div>
    <div class="maps-term-grid">
      ${renderTermCards(subcategory, read.lane)}
    </div>
    <div class="maps-reflection-box">
      <h3>Reflection Space</h3>
      ${htmlList([
        `What is one way ${subcategory.name} is already present in the project?`,
        `Where does this page reveal a strength, gap, or support need?`,
        "What is the next faithful action?",
      ])}
    </div>
  </section>`;
}

export function buildMapsRoadmapHtml({
  designIdSnapshot,
  designPdSnapshot,
  participant,
}: MapsParticipantReportInput) {
  const name = participant.display_name || participant.normalized_email || "Participant";
  const profile = reflectionProfile(designIdSnapshot);
  const pdProfile = designPdProfile(designPdSnapshot);
  const primary =
    firstSnapshotValue(designIdSnapshot, ["primaryReflection", "primary", "Primary_Reflection", "Primary"]) ||
    profile[0]?.label ||
    "DesignID";
  const secondary =
    firstSnapshotValue(designIdSnapshot, ["secondaryReflection", "secondary", "Secondary_Reflection", "Secondary"]) ||
    profile[1]?.label ||
    "";
  const integrative =
    firstSnapshotValue(designIdSnapshot, ["Integrative_Reflection", "integrativeReflection"]) ||
    "Integrated design";
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  const phasePages = mapsPhases
    .map(
      (phase) => `<section class="maps-phase-divider" style="--phase-color:${phase.color}">
        <p>MAPS Section</p>
        <h2>${escapeHtml(phase.name)}</h2>
        <span>${escapeHtml(phase.intro)}</span>
      </section>
      ${phase.subcategories
        .map((subcategory) =>
          renderSubcategoryPage(subcategory, designIdSnapshot, designPdSnapshot, phase.color),
        )
        .join("")}`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(name)} - MAPS Personal Roadmap</title>
  <style>
    :root { --ink:#172116; --muted:#5f6d5d; --paper:#fbfaf4; --line:#e4dccb; --green:#4a6239; --gold:#d4a451; }
    * { box-sizing:border-box; }
    body { margin:0; background:#f5f1e8; color:var(--ink); font-family:Aptos,Segoe UI,Arial,sans-serif; }
    main { background:white; margin:0 auto; max-width:980px; }
    .maps-cover { background:linear-gradient(135deg,#243f27,#4a6239); color:white; min-height:920px; padding:56px; page-break-after:always; }
    .maps-cover p { color:#f2e8ce; font-size:13px; font-weight:900; letter-spacing:.14em; margin:0 0 16px; text-transform:uppercase; }
    .maps-cover h1 { font-size:54px; line-height:1; margin:0 0 22px; max-width:780px; }
    .maps-cover h2 { color:#f9edc9; font-size:28px; margin:0 0 36px; }
    .maps-cover-grid { display:grid; gap:16px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:38px; }
    .maps-cover-grid div { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.22); padding:16px; }
    .maps-cover-grid span { color:#f2e8ce; display:block; font-size:11px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .maps-cover-grid strong { display:block; font-size:19px; margin-top:7px; }
    .maps-cover-summary { background:rgba(255,255,255,.12); border-left:6px solid var(--gold); margin-top:50px; max-width:760px; padding:24px; }
    .maps-cover-summary p { color:white; font-size:16px; font-weight:500; letter-spacing:0; line-height:1.55; text-transform:none; }
    .maps-phase-divider { align-items:flex-end; background:var(--phase-color); color:white; display:flex; flex-direction:column; justify-content:flex-end; min-height:680px; padding:56px; page-break-after:always; }
    .maps-phase-divider p { font-size:13px; font-weight:900; letter-spacing:.16em; margin:0 0 12px; text-transform:uppercase; }
    .maps-phase-divider h2 { font-size:62px; line-height:1; margin:0 0 20px; }
    .maps-phase-divider span { display:block; font-size:20px; line-height:1.5; max-width:680px; text-align:right; }
    .maps-subcategory-page { padding:42px; page-break-after:always; }
    .maps-page-heading { border-bottom:5px solid var(--phase-color); margin-bottom:24px; padding-bottom:16px; }
    .maps-page-heading p { color:var(--phase-color); font-size:12px; font-weight:900; letter-spacing:.12em; margin:0 0 6px; text-transform:uppercase; }
    .maps-page-heading h2 { font-size:38px; line-height:1; margin:0; }
    .maps-page-heading small { color:var(--muted); display:block; font-weight:800; margin-top:10px; }
    h3 { color:var(--ink); font-size:18px; margin:0 0 10px; }
    h4 { color:var(--phase-color); font-size:13px; letter-spacing:.05em; margin:14px 0 4px; text-transform:uppercase; }
    p, li, dd { color:var(--muted); font-size:12.5px; line-height:1.45; }
    .maps-definition-block { background:var(--paper); border:1px solid var(--line); padding:18px; }
    .maps-definition-block dl { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin:16px 0 0; }
    .maps-definition-block dt { color:var(--ink); font-size:11px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
    .maps-definition-block dd { margin:4px 0 0; }
    .maps-two-column, .maps-data-grid { display:grid; gap:16px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:18px; }
    .maps-two-column article, .maps-data-grid article { border:1px solid var(--line); padding:16px; }
    .maps-capacity-row, .maps-pd-row { border-top:1px solid var(--line); display:grid; gap:6px; grid-template-columns:1fr auto auto; padding:9px 0; }
    .maps-capacity-row:first-of-type, .maps-pd-row:first-of-type { border-top:0; }
    .maps-capacity-row span { align-items:center; display:flex; font-weight:900; gap:8px; }
    .maps-capacity-row i { border-radius:999px; display:inline-block; height:10px; width:10px; }
    .maps-capacity-row small, .maps-pd-row small { color:var(--muted); grid-column:1 / -1; line-height:1.35; }
    .maps-term-grid { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:18px; }
    .maps-term-card { border:1px solid var(--line); display:grid; gap:10px; grid-template-columns:auto 1fr; padding:14px; }
    .maps-term-index { align-items:center; background:var(--phase-color); border-radius:999px; color:white; display:flex; font-weight:950; height:28px; justify-content:center; width:28px; }
    .maps-term-card h4 { color:var(--ink); font-size:16px; letter-spacing:0; margin:0 0 8px; text-transform:none; }
    .maps-term-card p { font-size:10.5px; line-height:1.34; margin:0 0 7px; }
    .maps-reflection-box { border:2px dashed color-mix(in srgb, var(--phase-color) 45%, white); margin-top:18px; min-height:120px; padding:16px; }
    .maps-reflection-box ul { margin:0; padding-left:18px; }
    @media print {
      body { background:white; }
      main { max-width:none; }
      .maps-subcategory-page, .maps-phase-divider, .maps-cover { break-after:page; }
    }
  </style>
</head>
<body>
  <main>
    <section class="maps-cover">
      <p>Discover Your Divine Design</p>
      <h1>MAPS Personal Roadmap</h1>
      <h2>${escapeHtml(name)}</h2>
      <div class="maps-cover-grid">
        <div><span>DesignID</span><strong>${escapeHtml([primary, secondary].filter(Boolean).join(" / "))}</strong></div>
        <div><span>Integrated Reflection</span><strong>${escapeHtml(integrative)}</strong></div>
        <div><span>Generated</span><strong>${escapeHtml(today)}</strong></div>
      </div>
      <div class="maps-cover-grid">
        ${profile
          .map(
            (item) =>
              `<div><span>${escapeHtml(item.label)}</span><strong>${item.score} ${escapeHtml(item.band)}</strong></div>`,
          )
          .join("")}
      </div>
      <div class="maps-cover-grid">
        ${pdProfile
          .map(
            (axis) =>
              `<div><span>${escapeHtml(axis.label)}</span><strong>${escapeHtml(axis.tendency)}${axis.score ? ` ${escapeHtml(axis.score)}` : ""}</strong></div>`,
          )
          .join("")}
      </div>
      <div class="maps-cover-summary">
        <p>This report uses MAPS as a project-walk framework: Mission anchors the why, Approach clarifies what is true, Process makes the work sustainable, and Send moves it into completion. It is designed as an internal coaching and class companion, not a personality label.</p>
      </div>
    </section>
    ${phasePages}
  </main>
</body>
</html>`;
}

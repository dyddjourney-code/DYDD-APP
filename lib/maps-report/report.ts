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

const assetBaseUrl = "https://dydd-online-school.vercel.app";
const brandLogoPath = "/brand/dydd-logo-white-correct.png";
const resourcesUrl = "https://www.discoverdivine.design/resources";

function assetUrl(path: string) {
  return `${assetBaseUrl}${path}`;
}

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
    strength: `${topThree.map((item) => `${item.label} ${item.score}`).join(", ")} gives this person enough current capacity to engage ${subcategory.name} through vision, adaptation, and relational awareness before asking low-capacity areas to carry the page.`,
  };
}

function htmlList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTermCards(subcategory: MapsSubcategory, lane: string) {
  return subcategory.terms
    .map(
      (term, index) => `<article class="maps-term-card" style="--term-number:'${String.fromCharCode(65 + index)}'">
        <div class="maps-term-index">${String.fromCharCode(65 + index)}</div>
        <div>
          <h4>${escapeHtml(term.name)}</h4>
          <dl>
            <div><dt>Definition</dt><dd>${escapeHtml(term.definition)}</dd></div>
            <div><dt>Biblical lens</dt><dd>${escapeHtml(term.biblical)}</dd></div>
            <div><dt>Design capacity</dt><dd>${escapeHtml(term.capacity)}</dd></div>
            <div><dt>${escapeHtml(term.scripture)}</dt><dd>${escapeHtml(term.scriptureSummary)}</dd></div>
            <div><dt>${escapeHtml(lane)} movement</dt><dd>Use ${escapeHtml(term.name)} to ${escapeHtml(laneRead(lane))}.</dd></div>
          </dl>
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
      <div>
        <p>MAPS Personal Roadmap</p>
        <h2>${escapeHtml(subcategory.name)}</h2>
        <small>${escapeHtml(subcategory.terms.map((term) => term.name).join(" | "))}</small>
      </div>
      <span>${escapeHtml(read.lane)}</span>
    </div>
    <div class="maps-definition-block">
      <div>
        <h3>Simple Definition</h3>
        <p>${escapeHtml(subcategory.definition)}</p>
      </div>
      <dl>
        <div><dt>Project demand question</dt><dd>${escapeHtml(subcategory.demandQuestion)}</dd></div>
        <div><dt>Core capacity need</dt><dd>${escapeHtml(subcategory.capacityNeed)}</dd></div>
        <div><dt>Common use</dt><dd>${escapeHtml(subcategory.applicationUse)}</dd></div>
      </dl>
    </div>
    <div class="maps-lens-grid">
      <article class="maps-lens-card">
        <h3>Reflection Capacity Lens</h3>
        <p>${escapeHtml(read.interpretation)}</p>
        <div class="maps-mini-grid">
          <div><h4>Strength</h4><p>${escapeHtml(read.strength)}</p></div>
          <div><h4>Gap</h4><p>${escapeHtml(read.gap)}</p></div>
          <div><h4>Support</h4><p>${escapeHtml(read.support)}</p></div>
        </div>
      </article>
      <article class="maps-lens-card">
        <h3>Plan / Decide / Do Lens</h3>
        <p>This page sits primarily in the <strong>${escapeHtml(read.lane)}</strong> lane. The report should help the person ${escapeHtml(laneRead(read.lane))}.</p>
        <div class="maps-mini-grid">
          <div><h4>Strength</h4><p>Their DesignPD pattern shows how they naturally move when this page becomes real work.</p></div>
          <div><h4>Need</h4><p>Give the opposite-side support before this page becomes overload or delay.</p></div>
          <div><h4>Gap</h4><p>Watch for the page staying inspiring but not operational, or becoming operational without enough support.</p></div>
        </div>
      </article>
    </div>
    <div class="maps-data-grid">
      <article class="maps-data-card">
        <h3>Core Capacity Need</h3>
        ${capacityRows}
      </article>
      <article class="maps-data-card">
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
        <div class="maps-phase-divider-content">
          <p>MAPS Section</p>
          <h2>${escapeHtml(phase.name)}</h2>
          <span>${escapeHtml(phase.intro)}</span>
        </div>
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
    :root { --ink:#172116; --muted:#667263; --paper:#fbfaf4; --line:#dfe7d9; --green:#476b42; --dark:#243f27; --gold:#b88a43; --blue:#456073; }
    * { box-sizing:border-box; }
    body { margin:0; background:linear-gradient(180deg,#fbfaf4,#f4f1e8); color:var(--ink); font-family:Aptos,Segoe UI,Arial,sans-serif; padding:34px; }
    main { background:white; border:1px solid var(--line); box-shadow:0 24px 70px rgba(70,58,35,.12); margin:0 auto; max-width:960px; }
    h1 { font-size:40px; line-height:1.02; margin:0; max-width:720px; }
    h2 { color:var(--dark); font-size:30px; line-height:1.05; margin:0; }
    h3 { color:var(--dark); font-size:16px; margin:0 0 8px; }
    h4 { color:var(--phase-color); font-size:10.8px; letter-spacing:.06em; margin:0 0 4px; text-transform:uppercase; }
    p, li, dd { color:var(--muted); font-size:10.6px; line-height:1.3; margin:0; }
    dl { margin:0; }
    .maps-cover { background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; display:grid; gap:26px; grid-template-columns:minmax(0,1fr) auto; padding:32px 34px; }
    .maps-cover-copy { min-width:0; }
    .maps-cover-logo { align-self:start; display:block; filter:brightness(0) invert(1); height:54px; justify-self:end; max-width:230px; object-fit:contain; width:auto; }
    .maps-cover .eyebrow, .maps-phase-divider p, .maps-page-heading p { color:#e4d2a7; font-size:12px; font-weight:900; letter-spacing:.12em; margin:0 0 10px; text-transform:uppercase; }
    .maps-cover h1 { color:#fffaf0; }
    .maps-cover h2 { color:#f9edc9; font-size:24px; margin-top:8px; }
    .maps-cover-meta { display:grid; gap:12px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:30px; }
    .maps-cover-meta div { background:rgba(255,250,240,.1); border:1px solid rgba(255,250,240,.22); padding:14px; }
    .maps-cover-meta small { color:#e4d2a7; display:block; font-size:10px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .maps-cover-meta strong { color:#fffaf0; display:block; font-size:15px; margin-top:5px; }
    .maps-intro-section { border-top:1px solid var(--line); padding:20px 34px 22px; }
    .maps-purpose-card { background:#f3f8ef; border:1px solid rgba(71,107,66,.22); border-left:6px solid var(--gold); margin-bottom:14px; padding:16px 18px; }
    .maps-purpose-card h2 { color:var(--dark); font-size:22px; letter-spacing:.02em; margin:0 0 7px; text-transform:uppercase; }
    .maps-purpose-card p { color:var(--ink); font-size:13px; line-height:1.42; margin-bottom:8px; max-width:820px; }
    .maps-purpose-card blockquote { border-top:1px solid rgba(71,107,66,.18); color:var(--dark); font-size:11.4px; font-weight:800; line-height:1.32; margin:9px 0 0; padding-top:8px; }
    .maps-profile-grid { display:grid; gap:12px; grid-template-columns:1.05fr 1fr; }
    .maps-profile-panel { border:1px solid rgba(36,63,39,.12); padding:14px; }
    .maps-profile-panel h3 { color:var(--green); margin-bottom:10px; }
    .maps-profile-list { display:grid; gap:7px; }
    .maps-profile-list div { align-items:center; background:#f7f9f5; border:1px solid rgba(36,63,39,.1); display:grid; gap:8px; grid-template-columns:10px 1fr auto; padding:8px 9px; }
    .maps-profile-list i { border-radius:999px; display:block; height:10px; width:10px; }
    .maps-profile-list strong { color:var(--dark); font-size:11px; }
    .maps-profile-list span { color:var(--muted); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; font-weight:900; }
    .maps-phase-divider { background:linear-gradient(135deg,var(--phase-color),color-mix(in srgb,var(--phase-color) 78%,#111)); color:white; min-height:590px; padding:44px; page-break-after:always; }
    .maps-phase-divider-content { align-content:end; border:1px solid rgba(255,250,240,.28); display:grid; min-height:500px; padding:32px; }
    .maps-phase-divider h2 { color:white; font-size:62px; line-height:1; margin:0 0 18px; }
    .maps-phase-divider span { color:#fffaf0; display:block; font-size:17px; line-height:1.45; max-width:680px; }
    .maps-subcategory-page { min-height:740px; padding:22px 26px 72px; page-break-after:always; position:relative; }
    .maps-page-heading { align-items:end; border-bottom:4px solid var(--phase-color); display:grid; gap:18px; grid-template-columns:minmax(0,1fr) auto; margin-bottom:11px; padding-bottom:9px; }
    .maps-page-heading p { color:var(--phase-color); margin-bottom:5px; }
    .maps-page-heading h2 { font-size:30px; }
    .maps-page-heading small { color:var(--muted); display:block; font-size:11px; font-weight:800; margin-top:6px; }
    .maps-page-heading span { background:var(--phase-color); color:white; font-size:11px; font-weight:950; letter-spacing:.08em; padding:8px 12px; text-transform:uppercase; }
    .maps-definition-block { background:var(--paper); border:1px solid var(--line); border-left:5px solid var(--phase-color); display:grid; gap:12px; grid-template-columns:minmax(0,.9fr) minmax(0,1.35fr); padding:11px 14px; }
    .maps-definition-block p { color:var(--ink); font-size:11.4px; line-height:1.3; }
    .maps-definition-block dl { display:grid; gap:8px; grid-template-columns:repeat(3,minmax(0,1fr)); }
    .maps-definition-block dt, .maps-term-card dt { color:var(--dark); font-size:9px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
    .maps-definition-block dd { margin:3px 0 0; }
    .maps-lens-grid { display:grid; gap:9px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:9px; }
    .maps-lens-card, .maps-data-card { border:1px solid var(--line); padding:10px 11px; }
    .maps-lens-card > p { margin-bottom:7px; }
    .maps-mini-grid { display:grid; gap:6px; grid-template-columns:repeat(3,minmax(0,1fr)); }
    .maps-mini-grid div { background:#f7f9f5; border:1px solid rgba(36,63,39,.1); padding:6px; }
    .maps-mini-grid p { font-size:8.6px; line-height:1.18; }
    .maps-data-grid { display:grid; gap:9px; grid-template-columns:1fr 1fr; margin-top:9px; }
    .maps-capacity-row, .maps-pd-row { border-top:1px solid var(--line); display:grid; gap:4px; grid-template-columns:1fr auto auto; padding:5px 0; }
    .maps-capacity-row:first-of-type, .maps-pd-row:first-of-type { border-top:0; }
    .maps-capacity-row span, .maps-pd-row span { align-items:center; color:var(--dark); display:flex; font-size:11px; font-weight:900; gap:8px; }
    .maps-capacity-row i { border-radius:999px; display:inline-block; height:9px; width:9px; }
    .maps-capacity-row strong, .maps-pd-row strong { color:var(--dark); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10.8px; }
    .maps-capacity-row em { color:var(--phase-color); font-size:10px; font-style:normal; font-weight:900; }
    .maps-capacity-row small, .maps-pd-row small { color:var(--muted); font-size:8.6px; grid-column:1 / -1; line-height:1.18; }
    .maps-term-grid { display:grid; gap:8px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:9px; }
    .maps-term-card { border:1px solid var(--line); border-top:4px solid var(--phase-color); display:grid; gap:7px; grid-template-columns:auto 1fr; padding:8px; }
    .maps-term-index { align-items:center; background:var(--phase-color); color:white; display:flex; font-weight:950; height:24px; justify-content:center; width:24px; }
    .maps-term-card h4 { color:var(--dark); font-size:14px; letter-spacing:0; margin:0 0 6px; text-transform:none; }
    .maps-term-card dl { display:grid; gap:4px; }
    .maps-term-card dd { font-size:7.2px; line-height:1.08; margin:1px 0 0; }
    .maps-reflection-box { background:linear-gradient(135deg,#f7f9f5,#fffdf8); border:1px dashed var(--phase-color); bottom:18px; left:26px; min-height:42px; padding:6px 9px; position:absolute; right:26px; }
    .maps-reflection-box h3 { font-size:12px; margin-bottom:3px; }
    .maps-reflection-box ul { display:grid; gap:5px; grid-template-columns:repeat(3,minmax(0,1fr)); margin:0; padding-left:14px; }
    .maps-reflection-box li { font-size:8.2px; line-height:1.1; }
    .maps-resource-section { border-top:1px solid var(--line); padding:28px 34px; }
    .maps-resource-section h2 { margin-bottom:10px; }
    .maps-resource-cta { align-items:center; background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; display:grid; gap:18px; grid-template-columns:minmax(0,1fr) 118px; margin-top:14px; padding:18px; }
    .maps-resource-cta p, .maps-resource-cta h3 { color:#fffaf0; }
    .maps-resource-cta a { color:#fffaf0; font-weight:950; }
    .maps-resource-cta img { background:#fff; display:block; height:118px; padding:7px; width:118px; }
    @page { size: Letter; margin: 0.24in; }
    @media print {
      body { background:white; padding:0; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      main { border:0; box-shadow:none; max-width:none; }
      .maps-intro-section { break-after:page; }
      .maps-subcategory-page, .maps-phase-divider { break-after:page; }
      .maps-lens-card, .maps-data-card, .maps-term-card, .maps-reflection-box { break-inside:avoid; }
    }
    @media (max-width:760px) { body { padding:12px; } .maps-cover, .maps-cover-meta, .maps-profile-grid, .maps-definition-block, .maps-lens-grid, .maps-data-grid, .maps-term-grid, .maps-reflection-box ul, .maps-resource-cta { grid-template-columns:1fr; } .maps-cover-logo { justify-self:start; } }
  </style>
</head>
<body>
  <main>
    <section class="maps-cover">
      <div class="maps-cover-copy">
        <p class="eyebrow">Discover Your Divine Design</p>
        <h1>MAPS Personal Roadmap</h1>
        <h2>${escapeHtml(name)}</h2>
        <div class="maps-cover-meta">
          <div><small>DesignID</small><strong>${escapeHtml([primary, secondary].filter(Boolean).join(" / "))}</strong></div>
          <div><small>Integrated Reflection</small><strong>${escapeHtml(integrative)}</strong></div>
          <div><small>Generated</small><strong>${escapeHtml(today)}</strong></div>
        </div>
      </div>
      <img class="maps-cover-logo" src="${assetUrl(brandLogoPath)}" alt="Discover Your Divine Design" />
    </section>
    <section class="maps-intro-section">
      <div class="maps-purpose-card">
        <h2>From Purpose to Movement</h2>
        <p>This report uses MAPS as a project-walk framework: Mission anchors the why, Approach clarifies what is true, Process makes the work sustainable, and Send moves it into completion. It is designed as an internal coaching and class companion, not a personality label.</p>
        <blockquote>The goal is a faithful roadmap: clear enough to move, personal enough to coach, and structured enough to use with a class, cohort, client, or ministry project.</blockquote>
      </div>
      <div class="maps-profile-grid">
        <article class="maps-profile-panel">
          <h3>DesignID Capacity Snapshot</h3>
          <div class="maps-profile-list">
        ${profile
          .map(
            (item) =>
              `<div><i style="background:${item.color}"></i><strong>${escapeHtml(item.label)}</strong><span>${item.score} ${escapeHtml(item.band)}</span></div>`,
          )
          .join("")}
          </div>
        </article>
        <article class="maps-profile-panel">
          <h3>DesignPD Movement Snapshot</h3>
          <div class="maps-profile-list">
        ${pdProfile
          .map(
            (axis) =>
              `<div><i style="background:var(--green)"></i><strong>${escapeHtml(axis.label)}</strong><span>${escapeHtml(axis.tendency)}${axis.score ? ` ${escapeHtml(axis.score)}` : ""}</span></div>`,
          )
          .join("")}
          </div>
        </article>
      </div>
    </section>
    ${phasePages}
    <section class="maps-resource-section">
      <h2>Continue the MAPS Walk</h2>
      <p>This roadmap is most useful when it becomes a coaching conversation, class lab, or project rhythm. Use it to name the next faithful action, the support needed, and the specific part of the project that should move now.</p>
      <div class="maps-resource-cta">
        <div>
          <h3>Resources, Courses, and Next Steps</h3>
          <p>Visit <a href="${resourcesUrl}">${resourcesUrl}</a> for Discover Your Divine Design resources.</p>
        </div>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(resourcesUrl)}" alt="QR code for DYDD resources" />
      </div>
    </section>
  </main>
</body>
</html>`;
}

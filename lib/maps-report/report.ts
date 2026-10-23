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
    scoreKeys: ["Plan_Score", "planScore"],
    tendencyKeys: ["Plan_Tendency", "planTendency"],
  },
  {
    axisKey: "decide",
    label: "Decide",
    scoreKeys: ["Decide_Score", "decideScore"],
    tendencyKeys: ["Decide_Tendency", "decideTendency"],
  },
  {
    axisKey: "do",
    label: "Do",
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

function polarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function ringSegmentPath(cx: number, cy: number, outer: number, inner: number, start: number, end: number) {
  const outerStart = polarPoint(cx, cy, outer, start);
  const outerEnd = polarPoint(cx, cy, outer, end);
  const innerEnd = polarPoint(cx, cy, inner, end);
  const innerStart = polarPoint(cx, cy, inner, start);
  const largeArcFlag = end - start > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outer} ${outer} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${inner} ${inner} 0 ${largeArcFlag} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function arcPath(cx: number, cy: number, radius: number, start: number, end: number, sweep = 1) {
  const startPoint = polarPoint(cx, cy, radius, start);
  const endPoint = polarPoint(cx, cy, radius, end);
  const difference = Math.abs(end - start);
  const largeArcFlag = difference > 180 ? 1 : 0;

  return [
    `M ${startPoint.x.toFixed(2)} ${startPoint.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} ${sweep} ${endPoint.x.toFixed(2)} ${endPoint.y.toFixed(2)}`,
  ].join(" ");
}

function scoreRadius(score: number) {
  return 82 + (score / 60) * 78;
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
      const available = firstSnapshotValue(designIdSnapshot, field.keys) !== "";
      const score = numericSnapshotValue(designIdSnapshot, field.keys);
      return {
        ...field,
        band: available ? capacityBand(score) : "Not available",
        available,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Shared teaching is in content.ts; only these participant lenses vary by scores.
export const mapsShortFormVersion = "2026-10-23-personalized-v3";

const reflectionContribution: Record<Reflection, string> = {
  Architect: "Frame direction.",
  Artisan: "Shape message and fit.",
  Shepherd: "Care for people and meaning.",
  Steward: "Organize follow-through.",
};

function capacitySupport(_reflection: Reflection, band: string) {
  if (band === "Abundant") return "Lead; leave room for others.";
  if (band === "Steady") return "Use clear scope.";
  if (band === "Limited") return "Small scope; partner up.";
  if (band === "Drained") return "Share ownership; use tools.";
  return "Review missing capacity before choosing support.";
}

const movementCopy = {
  Plan: {
    positive: ["Imagine the outcome.", "Choose one direction from the possibilities.", "Possibilities can outgrow the next step."],
    negative: ["Find a practical starting point.", "Make room for a fresh possibility before acting.", "An early solution can narrow the vision."],
    balanced: ["Connect possibility with practical steps.", "Choose vision or detail as this task needs.", "Avoid reopening a workable plan."],
  },
  Decide: {
    positive: ["Notice conviction and people’s needs.", "Test the choice with evidence and counsel.", "Conviction can outrun the evidence."],
    negative: ["Weigh evidence and clear criteria.", "Include people’s experience and inner conviction.", "Analysis can miss the human cost."],
    balanced: ["Bring conviction and evidence together.", "Use both people’s needs and clear criteria.", "Set a decision time; avoid endless weighing."],
  },
  Do: {
    positive: ["Take ownership and start independently.", "Add a check-in partner and a clear finish line.", "Independent work can hide a need for help."],
    negative: ["Build momentum through shared effort.", "Name your own next action and decision space.", "Waiting for agreement can delay action."],
    balanced: ["Move between independent and shared work.", "Choose an owner and useful collaboration points.", "Keep handoffs explicit as roles change."],
  },
} as const;


const movementSidebar = {
  Plan: {
    positive: ["Pause briefly to choose one direction.", "Schedule a direction check before each new idea."],
    negative: ["Try one fresh possibility.", "Require a possibility check before committing."],
    balanced: "Choose vision or detail to fit the task.",
  },
  Decide: {
    positive: ["Check evidence before choosing.", "Build evidence and counsel into every major choice."],
    negative: ["Ask how the choice affects people.", "Invite affected people before final decisions."],
    balanced: "Use conviction and evidence; set a decision time.",
  },
  Do: {
    positive: ["Use a check-in when work gets complex.", "Schedule partner check-ins and a finish line."],
    negative: ["Name your own next action.", "Assign individual ownership before work begins."],
    balanced: "Choose an owner and useful collaboration points.",
  },
} as const;

export function designPdAxis(
  designPdSnapshot: MapsAssessmentSnapshot,
  axis: (typeof designPdAxes)[number],
) {
  const axisTendencies = scoreObject(designPdSnapshot, "axisTendencies");
  const value = axisTendencies[axis.axisKey] ?? axisTendencies[axis.label];
  const object = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  const score = compactValue(object.score) ||
    firstSnapshotValue(designPdSnapshot, axis.scoreKeys) ||
    compactValue(scoreObject(designPdSnapshot, "axisScores")[axis.axisKey]);
  const rawTendency = compactValue(object.tendency) || compactValue(value) ||
    firstSnapshotValue(designPdSnapshot, axis.tendencyKeys);
  const tendency = titleize(rawTendency || "Not available");
  const normalized = tendency.toLowerCase();
  const numeric = score === "" ? NaN : Number(score.replace(/%$/, ""));
  // Stored axis scores are unsigned percentage-point magnitudes; side comes from tendency.
  const side = /balanced/.test(normalized) ? "balanced" :
    /dreamer|feel it|solo/.test(normalized) ? "positive" :
    /doer|think it|together/.test(normalized) ? "negative" : null;
  const intensity = Number.isFinite(numeric) ?
    Math.abs(numeric) <= 5 ? "Balanced" : Math.abs(numeric) >= 16 ? "Strong" : "Moderate" :
    /strong/.test(normalized) ? "Strong" : /moderate/.test(normalized) ? "Moderate" : "Balanced";
  const effectiveSide = side === null ? null : intensity === "Balanced" ? "balanced" : side;
  const copy = effectiveSide ? movementCopy[axis.label as keyof typeof movementCopy][effectiveSide] :
    ["Your movement pattern is not available.", "Review your DesignPD result before choosing support.", "Do not assume an opposite-side need."];
  return {
    label: axis.label,
    tendency,
    score,
    sidebar: effectiveSide === null ? "Review your DesignPD result before choosing support." : effectiveSide === "balanced" ? movementSidebar[axis.label as keyof typeof movementSidebar].balanced : movementSidebar[axis.label as keyof typeof movementSidebar][effectiveSide][intensity === "Strong" ? 1 : 0],
    side: effectiveSide,
    intensity,
    strength: `${copy[0]}${intensity === "Strong" && effectiveSide && effectiveSide !== "balanced" ? " A strong default; pause to check fit." : intensity === "Moderate" && effectiveSide ? " A preference you can flex." : ""}`,
    need: `${intensity === "Strong" && effectiveSide && effectiveSide !== "balanced" ? "Support: " : ""}${copy[1]}${intensity === "Strong" && effectiveSide && effectiveSide !== "balanced" ? " Build this into the workflow." : intensity === "Moderate" && effectiveSide ? " Use a brief check when needed." : ""}`,
    gap: `${copy[2]}${intensity === "Strong" && effectiveSide && effectiveSide !== "balanced" ? " Check at each milestone." : intensity === "Moderate" && effectiveSide ? " Watch when pressure rises." : ""}`,
  };
}

function designPdProfile(designPdSnapshot: MapsAssessmentSnapshot) {
  return designPdAxes.map((axis) => designPdAxis(designPdSnapshot, axis));
}

function subcategoryLane(subcategory: string) {
  if (["Purpose", "Culture", "Motivation", "Assessment"].includes(subcategory)) return "Plan";
  if (["Insight", "Development", "Proof", "Organization"].includes(subcategory)) return "Decide";
  return "Do";
}

// Page-specific contributions: Architect, Artisan, Shepherd, Steward. Shared teaching stays untouched.
export const mapsReflectionTasks: Record<string, Record<Reflection, string>> = {
  Purpose: { Architect: "clarify direction", Artisan: "express the calling", Shepherd: "connect the why to people", Steward: "define signs of fruit" },
  Culture: { Architect: "frame shared values", Artisan: "shape an inviting atmosphere", Shepherd: "build belonging and trust", Steward: "protect agreed practices" },
  Motivation: { Architect: "connect energy to direction", Artisan: "renew meaningful expression", Shepherd: "notice care and growth", Steward: "pace sustainable commitments" },
  Assessment: { Architect: "frame the real question", Artisan: "discern and clarify what is true", Shepherd: "hear lived experience", Steward: "check the facts" },
  Insight: { Architect: "connect patterns to direction", Artisan: "shape and refine meaning", Shepherd: "test how meaning lands", Steward: "check practical fit" },
  Development: { Architect: "choose a path through constraints", Artisan: "refine the next version", Shepherd: "support people through change", Steward: "test risk and resources" },
  Proof: { Architect: "define what evidence matters", Artisan: "make evidence understandable", Shepherd: "hear the people affected", Steward: "verify observable results" },
  Organization: { Architect: "align roles with direction", Artisan: "make handoffs clear", Shepherd: "agree responsibilities together", Steward: "assign ownership and accountability" },
  Reliability: { Architect: "keep commitments aligned", Artisan: "adjust an unworkable routine", Shepherd: "notice strain and ask for help", Steward: "sustain dependable follow-through" },
  Energy: { Architect: "initiate the next faithful step", Artisan: "make the starting point tangible", Shepherd: "invite willing participation", Steward: "prepare time and resources" },
  Momentum: { Architect: "advance and multiply traction", Artisan: "adapt what is gaining traction", Shepherd: "keep people engaged", Steward: "maintain a repeatable rhythm" },
  Outcomes: { Architect: "connect completion to intended fruit", Artisan: "refine the final delivery", Shepherd: "confirm people were served", Steward: "deliver and close the loop" },
};

export const mapsMovementTasks: Record<string, [string, string, string]> = {
  Purpose: ["name the why", "check the next direction against intended fruit", "activity replacing calling"],
  Culture: ["agree a shared tone", "ask who does not yet feel safe to contribute", "agreement without trust"],
  Motivation: ["name what gives life", "check energy before adding commitments", "enthusiasm hiding depletion"],
  Assessment: ["frame an honest question", "test one assumption with an observation", "a preferred explanation replacing facts"],
  Insight: ["shape a useful interpretation", "test the meaning with someone affected", "refinement without clarity"],
  Development: ["choose one improvement", "trial the change against a real constraint", "improvement without a workable path"],
  Proof: ["name visible evidence", "agree one verifiable measure", "confidence without evidence"],
  Organization: ["name an accountable owner", "confirm each handoff and decision right", "busy roles without ownership"],
  Reliability: ["set a repeatable commitment", "check load and recovery before promising", "a promise without a sustainable rhythm"],
  Energy: ["start one concrete action", "confirm time and resources for the first step", "activation without a finish line"],
  Momentum: ["advance what is working", "review traction before expanding", "more activity without progress"],
  Outcomes: ["deliver the intended fruit", "agree acceptance and closure with the recipient", "motion without completion"],
};

export const mapsIndicatorReflections: Record<string, Reflection[]> = {
  Purpose: ["Shepherd", "Architect"],
  Development: ["Artisan", "Architect"],
  Outcomes: ["Architect", "Steward"],
};

function indicatorReflections(subcategory: MapsSubcategory) {
  return mapsIndicatorReflections[subcategory.name] ?? [subcategory.primaryReflection];
}

export function mapsIndicatorScore(subcategory: MapsSubcategory, snapshot: MapsAssessmentSnapshot) {
  const profile = reflectionProfile(snapshot);
  const identities = indicatorReflections(subcategory);
  return identities.reduce((sum, label) => sum + profile.find(p => p.label === label)!.score, 0) / identities.length;
}

export function mapsReflectionLens(subcategory: MapsSubcategory, designIdSnapshot: MapsAssessmentSnapshot) {
  const profile = reflectionProfile(designIdSnapshot);
  const tasks = mapsReflectionTasks[subcategory.name];
  const identities = indicatorReflections(subcategory);
  const score = mapsIndicatorScore(subcategory, designIdSnapshot);
  const describe = (item: typeof profile[number]) => {
    const action = tasks[item.label];
    if (!item.available) return `${item.label}: capacity to ${action} not available`;
    if (item.band === "Abundant") return `${item.label} (${item.band}): lead to ${action}`;
    if (item.band === "Steady") return `${item.label} (${item.band}): scoped capacity to ${action}`;
    if (item.band === "Limited") return `${item.label} (${item.band}): small steps to ${action}`;
    return `${item.label} (${item.band}): shared help to ${action}`;
  };
  const required = profile.filter(item => identities.includes(item.label));
  const support = required.map(item => {
    const action = tasks[item.label];
    if (!item.available) return `${item.label}: review missing capacity before assigning support`;
    if (item.band === "Abundant") return `${item.label}: lead to ${action}; invite shared ownership`;
    if (item.band === "Steady") return `${item.label}: ${action} within clear scope`;
    if (item.band === "Limited") return `${item.label}: partner on a small trial to ${action}`;
    return `${item.label}: share ownership to ${action}; use a tool`;
  }).join("; ") + ".";
  return {
    interpretation: required.some(item => !item.available) ? "MAPS indicator unavailable: one or more required reflection scores are missing." : `${identities.join(" + ")}: ${score} (${capacityBand(score)}${identities.length > 1 ? "; average" : ""}). ${identities.length > 1 ? "Blended indicator, not an independent measurement. Read both capacities." : "A capacity indicator, not a measurement of performance."}`,
    strength: profile.slice(0, 2).map(describe).join("; ") + ".",
    gap: profile.slice(2).map(item => item.available && item.score >= 25 ? `${item.label} (${item.band}): capacity available to ${tasks[item.label]}; pace it` : describe(item)).join("; ") + ".",
    support,
    lane: subcategoryLane(subcategory.name),
  };
}

const subcategoryRead = mapsReflectionLens;

export const mapsShortFormDefinition = {
  version: mapsShortFormVersion,
  sections: mapsPhases,
  layout: {
    focusPages: 12,
    documentPages: 18,
    reflectionSpace: false,
    repeatedAbcMovement: false,
    abcBodyPixels: 12,
    abcLineHeight: 1.35,
    focusSpacingPixels: { top: 16, bottom: 12, definitionVertical: 10, scoreRowVertical: 4, termMarginTop: 12 },
    preserveVisuals: ["cover circle", "phase colors", "0–60 chart scale"],
    preserveTeaching: ["definition", "biblical", "capacity", "scripture", "scriptureSummary"],
  },
  personalization: {
    reflectionBands: { Abundant: ">=40", Steady: ">=25", Limited: ">=10", Drained: "<10" },
    reflectionContribution,
    reflectionTasks: mapsReflectionTasks,
    movementTasks: mapsMovementTasks,
    indicatorReflections: mapsIndicatorReflections,
    indicatorPolicy: "0–60 scale. Purpose = mean Shepherd + Architect; Development = mean Artisan + Architect; Outcomes = mean Architect + Steward. Other nine retain their single reflection. Blended MAPS indicators, not independent measurements. Read individual capacities alongside averages.",
    movementCopy,
    movementSidebar,
    scorePolicy: "Read each participant's latest DesignID and DesignPD; never rewrite scores. Rank all four reflections; respect ties and all bands. PD side comes from stored tendency; unsigned magnitude <=5 balanced, 6-15 moderate, >=16 strong. Missing tendencies never imply an opposite-side need.",
    teachingPolicy: "ABC definitions, Biblical lenses, design capacities and scripture remain shared authored teaching, not score-dependent rewrites.",
  },
};


function renderTermCards(subcategory: MapsSubcategory) {
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
          </dl>
        </div>
      </article>`,
    )
    .join("");
}

function renderMapsWheel({
  designIdSnapshot,
  designPdSnapshot,
  focusSlug,
  includeCenterProfile = true,
  includeOverlay = true,
  name,
  wheelId = "maps-wheel",
}: {
  designIdSnapshot: MapsAssessmentSnapshot;
  designPdSnapshot: MapsAssessmentSnapshot;
  focusSlug?: string;
  includeCenterProfile?: boolean;
  includeOverlay?: boolean;
  name: string;
  wheelId?: string;
}) {
  const cx = 250;
  const cy = 250;
  const profile = reflectionProfile(designIdSnapshot);
  const pdProfile = designPdProfile(designPdSnapshot);
  const allSubcategories = mapsPhases.flatMap((phase) =>
    phase.subcategories.map((subcategory) => ({
      phase,
      subcategory,
    })),
  );
  const overlayPoints = allSubcategories.map((item, index) => {
    const score = mapsIndicatorScore(item.subcategory, designIdSnapshot);
    return polarPoint(cx, cy, scoreRadius(score), index * 30 + 15);
  });
  const overlayPolygon = overlayPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const centerName = name.split(/\s+/).filter(Boolean)[0] ?? "Profile";
  const phaseLabelArcs = [
    { arc: arcPath(cx, cy, 218, 12, 78, 1), name: "MISSION", slug: "mission" },
    { arc: arcPath(cx, cy, 218, 102, 168, 1), name: "APPROACH", slug: "approach" },
    { arc: arcPath(cx, cy, 218, 192, 258, 1), name: "PROCESS", slug: "process" },
    { arc: arcPath(cx, cy, 218, 282, 348, 1), name: "SEND", slug: "send" },
  ];

  return `<svg class="maps-wheel" viewBox="0 0 500 500" role="img" aria-label="MAPS process wheel">
    <defs>
      ${phaseLabelArcs
        .map(
          (arc) =>
            `<path id="${wheelId}-${arc.slug}-arc" d="${arc.arc}" fill="none" />`,
        )
        .join("")}
    </defs>
    <circle class="maps-wheel-paper" cx="${cx}" cy="${cy}" r="238" />
    ${mapsPhases
      .map((phase, phaseIndex) => {
        const phaseIsFocused = !focusSlug || phase.slug === focusSlug;
        const phaseClass = phaseIsFocused ? "is-focused" : "is-muted";
        return `<g class="maps-wheel-phase ${phaseClass}">
          <path d="${ringSegmentPath(cx, cy, 238, 196, phaseIndex * 90, phaseIndex * 90 + 90)}" fill="${phase.color}" />
          <text class="maps-wheel-phase-label"><textPath href="#${wheelId}-${phase.slug}-arc" startOffset="50%">${escapeHtml(phase.name.toUpperCase())}</textPath></text>
        </g>`;
      })
      .join("")}
    ${allSubcategories
      .map((item, index) => {
        const start = index * 30;
        const end = start + 30;
        const mid = start + 15;
        const isFocused = !focusSlug || item.phase.slug === focusSlug;
        const point = polarPoint(cx, cy, 135, mid);
        const rotation = mid;
        const termRows = item.subcategory.terms
          .map(
            (term, termIndex) =>
              `<tspan x="${point.x.toFixed(1)}" dy="${termIndex === 0 ? 15 : 10}">${escapeHtml(term.name)}</tspan>`,
          )
          .join("");
        return `<g class="maps-wheel-slice ${isFocused ? "is-focused" : "is-muted"}">
          <path d="${ringSegmentPath(cx, cy, 191, 75, start, end)}" fill="${item.phase.color}" />
          <text class="maps-wheel-subcategory" x="${point.x.toFixed(1)}" y="${(point.y - 17).toFixed(1)}" transform="rotate(${rotation.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)})">${escapeHtml(item.subcategory.name)}</text>
          <text class="maps-wheel-terms" x="${point.x.toFixed(1)}" y="${(point.y - 7).toFixed(1)}" transform="rotate(${rotation.toFixed(1)} ${point.x.toFixed(1)} ${point.y.toFixed(1)})">${termRows}</text>
        </g>`;
      })
      .join("")}
    ${
      includeOverlay
        ? `<polygon class="maps-wheel-overlay" points="${overlayPolygon}" />
    <polyline class="maps-wheel-overlay-line" points="${overlayPolygon} ${overlayPoints[0]?.x.toFixed(1)},${overlayPoints[0]?.y.toFixed(1)}" />
    ${overlayPoints
      .map((point, index) => {
        const item = allSubcategories[index];
        const isFocused = !focusSlug || item.phase.slug === focusSlug;
        return `<circle class="maps-wheel-dot ${isFocused ? "is-focused" : "is-muted"}" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5.6" />`;
      })
      .join("")}`
        : ""
    }
    <circle class="maps-wheel-center" cx="${cx}" cy="${cy}" r="69" />
    ${
      includeCenterProfile
        ? `<text class="maps-wheel-name" x="${cx}" y="222">${escapeHtml(centerName)}</text>
    <text class="maps-wheel-center-line" x="${cx}" y="244">${escapeHtml(profile.slice(0, 2).map((item) => `${item.label} ${item.score}`).join(" / "))}</text>
    <text class="maps-wheel-center-line" x="${cx}" y="263">${escapeHtml(profile.slice(2).map((item) => `${item.label} ${item.score}`).join(" / "))}</text>
    <text class="maps-wheel-center-line is-small" x="${cx}" y="285">${escapeHtml(pdProfile.map((axis) => `${axis.label} ${axis.score || axis.tendency}`).join("  |  "))}</text>`
        : `<circle class="maps-wheel-center-dot" cx="${cx}" cy="${cy}" r="9" />`
    }
  </svg>`;
}

function renderSubcategoryPage(
  subcategory: MapsSubcategory,
  designIdSnapshot: MapsAssessmentSnapshot,
  designPdSnapshot: MapsAssessmentSnapshot,
  phaseColor: string,
) {
  const read = subcategoryRead(subcategory, designIdSnapshot);
  const pdProfile = designPdProfile(designPdSnapshot);
  const movement = pdProfile.find(axis => axis.label === read.lane)!;
  const context = mapsMovementTasks[subcategory.name];
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
        <small>${escapeHtml(axis.sidebar)}</small>
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
        <p>${escapeHtml(subcategory.name)} starts in <strong>${escapeHtml(read.lane)}</strong> — ${escapeHtml(movement.tendency)}${movement.score ? ` (${escapeHtml(movement.score)})` : ""}.</p>
        <div class="maps-mini-grid">
          <div><h4>Strength</h4><p>${escapeHtml(movement.strength)} ${escapeHtml(movement.side ? `Use it to ${context[0]}.` : `For this page, first ${context[0]}; choose support after reviewing your result.`)}</p></div>
          <div><h4>Need</h4><p>${escapeHtml(movement.need)} Then ${escapeHtml(context[1])}.</p></div>
          <div><h4>Gap</h4><p>${escapeHtml(movement.gap)} Watch for ${escapeHtml(context[2])}.</p></div>
        </div>
      </article>
    </div>
    <div class="maps-data-grid">
      <article class="maps-data-card">
        <h3>Your Reflection Capacities</h3>
        ${capacityRows}
      </article>
      <article class="maps-data-card">
        <h3>Your Plan / Decide / Do</h3>
        ${pdRows}
      </article>
    </div>
    <div class="maps-term-grid">
      ${renderTermCards(subcategory)}
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
  const coverWheel = renderMapsWheel({
    designIdSnapshot,
    designPdSnapshot,
    includeCenterProfile: false,
    includeOverlay: false,
    name,
    wheelId: "maps-cover-wheel",
  });
  const phasePages = mapsPhases
    .map(
      (phase) => `<section class="maps-phase-divider" style="--phase-color:${phase.color}">
        <div class="maps-phase-divider-content">
          <div class="maps-phase-copy">
            <p>MAPS Section</p>
            <h2>${escapeHtml(phase.name)}</h2>
            <span>${escapeHtml(phase.intro)}</span>
            <div class="maps-phase-subcategory-strip">
              ${phase.subcategories.map((subcategory) => `<strong>${escapeHtml(subcategory.name)} <em>(${escapeHtml(indicatorReflections(subcategory).join(" + "))})</em></strong>`).join("")}
            </div>
            <small class="maps-indicator-note">Paired reflections use their average. These are blended MAPS indicators, not independent measurements; the chart stays on a 0–60 scale.</small>
          </div>
          <div class="maps-phase-wheel">
            ${renderMapsWheel({
              designIdSnapshot,
              designPdSnapshot,
              focusSlug: phase.slug,
              name,
              wheelId: `maps-${phase.slug}-wheel`,
            })}
          </div>
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
    .maps-cover { background:#f8faf4; color:var(--ink); display:grid; gap:16px; grid-template-columns:1fr; min-height:690px; page-break-after:always; padding:24px 34px 18px; }
    .maps-cover-copy { min-width:0; }
    .maps-cover-logo { display:block; filter:brightness(0) invert(1); height:42px; margin-bottom:22px; max-width:220px; object-fit:contain; width:auto; }
    .maps-cover .eyebrow, .maps-phase-divider p, .maps-page-heading p { color:#e4d2a7; font-size:12px; font-weight:900; letter-spacing:.12em; margin:0 0 10px; text-transform:uppercase; }
    .maps-cover-panel { background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; display:grid; gap:22px; grid-template-columns:minmax(0,1fr) minmax(235px,.52fr); padding:25px 28px; }
    .maps-cover h1 { color:#fffaf0; }
    .maps-cover h2 { color:#f9edc9; font-size:24px; margin-top:8px; }
    .maps-cover-meta { display:grid; gap:10px; grid-template-columns:1fr; margin-top:0; }
    .maps-cover-meta div { background:rgba(255,250,240,.1); border:1px solid rgba(255,250,240,.22); padding:14px; }
    .maps-cover-meta small { color:#e4d2a7; display:block; font-size:10px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .maps-cover-meta strong { color:#fffaf0; display:block; font-size:15px; margin-top:5px; }
    .maps-cover-note { background:rgba(255,250,240,.94); border-left:6px solid var(--gold); margin-top:16px; max-width:610px; padding:13px 15px; }
    .maps-cover-note h3 { color:var(--dark); font-size:15px; letter-spacing:.06em; margin:0 0 6px; text-transform:uppercase; }
    .maps-cover-note p { color:var(--ink); font-size:10.8px; font-weight:650; line-height:1.32; }
    .maps-cover-visual { align-self:start; background:#fffdf8; border:1px solid var(--line); box-shadow:0 18px 42px rgba(70,58,35,.13); justify-self:center; max-width:560px; padding:8px; width:100%; }
    .maps-cover-visual .maps-wheel { display:block; height:auto; margin:0 auto; width:100%; }
    .maps-wheel-paper { fill:#fbfaf4; stroke:#e4dccb; stroke-width:3; }
    .maps-wheel-phase path { stroke:#fbfaf4; stroke-width:3; }
    .maps-wheel-phase.is-muted path, .maps-wheel-slice.is-muted path { fill:#d7ded2; }
    .maps-wheel-phase.is-muted text, .maps-wheel-slice.is-muted text, .maps-wheel-dot.is-muted { opacity:.34; }
    .maps-wheel-slice path { opacity:.78; stroke:#fbfaf4; stroke-width:2; }
    .maps-wheel-phase-label { fill:#fffaf0; font-size:18px; font-weight:950; letter-spacing:.08em; text-anchor:middle; }
    .maps-wheel-subcategory { dominant-baseline:middle; fill:#fffaf0; font-size:11px; font-weight:950; text-anchor:middle; }
    .maps-wheel-terms { dominant-baseline:middle; fill:#fffaf0; font-size:6.4px; font-weight:850; text-anchor:middle; }
    .maps-wheel-overlay { fill:rgba(201,245,215,.18); stroke:#2f7f4f; stroke-linejoin:round; stroke-width:3; }
    .maps-wheel-overlay-line { fill:none; stroke:rgba(255,255,255,.76); stroke-linejoin:round; stroke-width:1.25; }
    .maps-wheel-dot { fill:#f8fff7; stroke:#2f7f4f; stroke-width:2.2; }
    .maps-wheel-center { fill:rgba(255,255,255,.95); stroke:#dfe7d9; stroke-width:2; }
    .maps-wheel-center-dot { fill:#243f27; stroke:#fffaf0; stroke-width:3; }
    .maps-wheel-name { fill:#243f27; font-size:15px; font-weight:950; text-anchor:middle; }
    .maps-wheel-center-line { fill:#40503e; font-size:8.6px; font-weight:900; text-anchor:middle; }
    .maps-wheel-center-line.is-small { font-size:5.8px; }
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
    .maps-phase-divider { background:#f8faf4; color:var(--ink); min-height:690px; padding:26px 34px; page-break-after:always; }
    .maps-phase-divider-content { border-top:12px solid var(--phase-color); display:grid; gap:16px; grid-template-columns:1fr; min-height:640px; padding:18px 0 6px; }
    .maps-phase-copy { display:grid; gap:8px; grid-template-columns:minmax(0,1fr) minmax(235px,.72fr); }
    .maps-phase-divider p { color:var(--phase-color); }
    .maps-phase-divider h2 { color:var(--phase-color); font-size:42px; line-height:1; margin:0 0 8px; }
    .maps-phase-divider span { color:var(--ink); display:block; font-size:13px; font-weight:650; line-height:1.36; max-width:520px; }
    .maps-phase-subcategory-strip { align-self:end; display:grid; gap:7px; grid-template-columns:1fr; margin-top:0; }
    .maps-phase-subcategory-strip strong { background:rgba(255,255,255,.74); border:1px solid var(--line); border-left:6px solid var(--phase-color); color:var(--dark); display:block; font-size:13px; padding:10px 9px; }
    .maps-phase-wheel { align-self:center; background:white; border:1px solid var(--line); box-shadow:0 18px 46px rgba(70,58,35,.11); justify-self:center; max-width:560px; padding:10px; width:100%; }
    .maps-phase-wheel .maps-wheel { display:block; width:100%; }
    .maps-subcategory-page { min-height:690px; padding:18px 22px 56px; page-break-after:always; position:relative; }
    .maps-page-heading { align-items:end; border-bottom:4px solid var(--phase-color); display:grid; gap:18px; grid-template-columns:minmax(0,1fr) auto; margin-bottom:11px; padding-bottom:9px; }
    .maps-page-heading p { color:var(--phase-color); margin-bottom:5px; }
    .maps-page-heading h2 { font-size:26px; }
    .maps-page-heading small { color:var(--muted); display:block; font-size:11px; font-weight:800; margin-top:6px; }
    .maps-page-heading span { background:var(--phase-color); color:white; font-size:11px; font-weight:950; letter-spacing:.08em; padding:8px 12px; text-transform:uppercase; }
    .maps-definition-block { background:var(--paper); border:1px solid var(--line); border-left:5px solid var(--phase-color); display:grid; gap:10px; grid-template-columns:minmax(0,.9fr) minmax(0,1.35fr); padding:9px 12px; }
    .maps-definition-block p { color:var(--ink); font-size:10.6px; line-height:1.24; }
    .maps-definition-block dl { display:grid; gap:7px; grid-template-columns:repeat(3,minmax(0,1fr)); }
    .maps-definition-block dt, .maps-term-card dt { color:var(--dark); font-size:9px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }
    .maps-definition-block dd { margin:3px 0 0; }
    .maps-lens-grid { display:grid; gap:7px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:7px; }
    .maps-lens-card, .maps-data-card { border:1px solid var(--line); padding:8px 9px; }
    .maps-lens-card > p { margin-bottom:6px; }
    .maps-mini-grid { display:grid; gap:6px; grid-template-columns:repeat(3,minmax(0,1fr)); }
    .maps-mini-grid div { background:#f7f9f5; border:1px solid rgba(36,63,39,.1); padding:5px; }
    .maps-mini-grid p { font-size:7.8px; line-height:1.12; }
    .maps-data-grid { display:grid; gap:7px; grid-template-columns:1fr 1fr; margin-top:7px; }
    .maps-capacity-row, .maps-pd-row { border-top:1px solid var(--line); display:grid; gap:3px; grid-template-columns:1fr auto auto; padding:3px 0; }
    .maps-capacity-row:first-of-type, .maps-pd-row:first-of-type { border-top:0; }
    .maps-capacity-row span, .maps-pd-row span { align-items:center; color:var(--dark); display:flex; font-size:11px; font-weight:900; gap:8px; }
    .maps-capacity-row i { border-radius:999px; display:inline-block; height:9px; width:9px; }
    .maps-capacity-row strong, .maps-pd-row strong { color:var(--dark); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:10.8px; }
    .maps-capacity-row em { color:var(--phase-color); font-size:10px; font-style:normal; font-weight:900; }
    .maps-capacity-row small, .maps-pd-row small { color:var(--muted); font-size:7.8px; grid-column:1 / -1; line-height:1.12; }
    .maps-term-grid { display:grid; gap:7px; grid-template-columns:repeat(3,minmax(0,1fr)); margin-top:7px; }
    .maps-term-card { border:1px solid var(--line); border-top:4px solid var(--phase-color); display:grid; gap:5px; grid-template-columns:auto 1fr; padding:6px; }
    .maps-term-index { align-items:center; background:var(--phase-color); color:white; display:flex; font-size:12px; font-weight:950; height:21px; justify-content:center; width:21px; }
    .maps-term-card h4 { color:var(--dark); font-size:12px; letter-spacing:0; margin:0 0 4px; text-transform:none; }
    .maps-term-card dl { display:grid; gap:3px; }
    .maps-term-card dd { font-size:6.55px; line-height:1.02; margin:1px 0 0; }
    .maps-resource-section { border-top:1px solid var(--line); padding:28px 34px; }
    .maps-resource-section h2 { margin-bottom:10px; }
    .maps-resource-cta { align-items:center; background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; display:grid; gap:18px; grid-template-columns:minmax(0,1fr) 118px; margin-top:14px; padding:18px; }
    .maps-resource-cta p, .maps-resource-cta h3 { color:#fffaf0; }
    .maps-resource-cta a { color:#fffaf0; font-weight:950; }
    .maps-resource-cta img { background:#fff; display:block; height:118px; padding:7px; width:118px; }
    .maps-subcategory-page { padding-top:16px; padding-bottom:12px; }
    .maps-subcategory-page .maps-definition-block { padding:10px 12px; }
    .maps-subcategory-page .maps-definition-block p, .maps-subcategory-page .maps-definition-block dd {font-size:11px;line-height:1.35;}
    .maps-subcategory-page .maps-lens-card {padding:10px;}
    .maps-subcategory-page .maps-lens-card > p {font-size:11px;line-height:1.35;margin-bottom:7px;}
    .maps-subcategory-page .maps-mini-grid {gap:6px;}
    .maps-subcategory-page .maps-mini-grid div {padding:7px;}
    .maps-subcategory-page .maps-mini-grid p {font-size:10px;line-height:1.32;}
    .maps-subcategory-page .maps-data-card {padding:10px;}
    .maps-subcategory-page .maps-capacity-row, .maps-subcategory-page .maps-pd-row {padding:4px 0;}
    .maps-subcategory-page .maps-capacity-row small, .maps-subcategory-page .maps-pd-row small {font-size:10px;line-height:1.3;}
    .maps-subcategory-page .maps-term-grid {gap:10px;margin-top:12px;}
    .maps-subcategory-page .maps-term-card {padding:10px;gap:8px;grid-template-columns:1fr;align-content:start;}
    .maps-subcategory-page .maps-term-index {height:24px;width:24px;font-size:14px;}
    .maps-subcategory-page .maps-term-card h4 {font-size:16px;margin:0 0 10px;}
    .maps-subcategory-page .maps-term-card dl {gap:10px;}
    .maps-subcategory-page .maps-term-card dt {font-size:10px;line-height:1.2;}
    .maps-subcategory-page .maps-term-card dd {font-size:12px;line-height:1.35;margin:3px 0 0;}

    .maps-phase-subcategory-strip em {font-style:normal;font-weight:400;}
    .maps-phase-copy .maps-indicator-note {grid-column:1 / -1;color:var(--muted);font-size:10px;line-height:1.35;max-width:660px;}
    .maps-definition-block {gap:0;grid-template-columns:minmax(0,1fr) minmax(0,3fr);}
    .maps-definition-block > div {padding-right:12px;}
    .maps-definition-block dl {gap:0;}
    .maps-definition-block dl > div {border-left:1px solid color-mix(in srgb,var(--phase-color) 16%,transparent);padding:0 12px;}
    .maps-definition-block h3 {font-size:10px;letter-spacing:.06em;text-transform:uppercase;}
    .maps-resource-section {padding:34px;min-height:550px;}
    .maps-next-step {margin:24px 0;border-top:1px solid var(--line);padding-top:18px;}
    .maps-next-step h3 {font-size:15px;}
    .maps-next-step p {font-size:12px;line-height:1.5;max-width:620px;}
    .maps-resource-section > p {font-size:12px;line-height:1.5;}
    .maps-resource-section a {color:var(--green);}
    .maps-subcategory-page .maps-mini-grid {grid-template-columns:1fr;gap:3px;}
    .maps-subcategory-page .maps-mini-grid > div {display:grid;grid-template-columns:48px minmax(0,1fr);gap:5px;padding:5px 6px;align-items:start;}
    .maps-subcategory-page .maps-mini-grid h4 {font-size:9px;line-height:1.3;margin:0;}
    .maps-subcategory-page .maps-mini-grid p {font-size:10px;line-height:1.25;}
    .maps-subcategory-page .maps-term-card {position:relative;}
    .maps-subcategory-page .maps-term-index {position:absolute;top:10px;right:10px;}
    .maps-subcategory-page .maps-term-card h4 {padding-right:28px;}
    .maps-subcategory-page .maps-lens-card h3, .maps-subcategory-page .maps-data-card h3 {font-size:14px;margin-bottom:6px;}
    .maps-subcategory-page .maps-term-card dl {gap:8px;}
    .maps-subcategory-page .maps-term-card h4 {margin-bottom:8px;}
    @page { size: Letter; margin: 0.24in; }
    @media print {
      body { background:white; padding:0; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
      main { border:0; box-shadow:none; max-width:none; }
      .maps-cover { break-after:page; }
      .maps-subcategory-page, .maps-phase-divider { break-after:page; }
      .maps-lens-card, .maps-data-card, .maps-term-card { break-inside:avoid; }
    }
    @media (max-width:760px) { body { padding:12px; } .maps-cover, .maps-cover-meta, .maps-profile-grid, .maps-definition-block, .maps-lens-grid, .maps-data-grid, .maps-term-grid, .maps-resource-cta { grid-template-columns:1fr; } .maps-cover-logo { justify-self:start; } }
  </style>
</head>
<body>
  <main>
    <section class="maps-cover">
      <div class="maps-cover-panel">
        <div class="maps-cover-copy">
          <img class="maps-cover-logo" src="${assetUrl(brandLogoPath)}" alt="Discover Your Divine Design" />
          <p class="eyebrow">Discover Your Divine Design</p>
          <h1>MAPS Personal Roadmap</h1>
          <h2>${escapeHtml(name)}</h2>
          <div class="maps-cover-note">
            <h3>From Purpose to Movement</h3>
            <p>MAPS anchors the why, clarifies what is true, makes the work sustainable, and moves it into completion. Use this as a coaching and class roadmap: personal enough to reflect, structured enough to act.</p>
          </div>
        </div>
        <div class="maps-cover-meta">
          <div><small>DesignID</small><strong>${escapeHtml([primary, secondary].filter(Boolean).join(" / "))}</strong></div>
          <div><small>Integrated Reflection</small><strong>${escapeHtml(integrative)}</strong></div>
          <div><small>Generated</small><strong>${escapeHtml(today)}</strong></div>
        </div>
      </div>
      <div class="maps-cover-visual">${coverWheel}</div>
    </section>
    ${phasePages}
    <section class="maps-resource-section">
      <h2>Your Next Faithful Step</h2>
      <p>Choose one part of your current project. Use the capacity indicators as a conversation starter, not a verdict about your ability.</p>
      <div class="maps-next-step"><h3>1. Name the work</h3><p>Which MAPS word needs attention now? Use its project demand question to name one concrete outcome.</p></div>
      <div class="maps-next-step"><h3>2. Match the support</h3><p>Use your Reflection Capacity and Plan / Decide / Do lenses to choose a partner, tool, or boundary that makes this step sustainable.</p></div>
      <div class="maps-next-step"><h3>3. Make one commitment</h3><p>Name the next action, who owns it, and when you will review the result. Return to the roadmap as the work changes.</p></div>
      <p>Continue with DYDD resources: <a href="${resourcesUrl}">${resourcesUrl}</a></p>
    </section>
  </main>
</body>
</html>`;
}

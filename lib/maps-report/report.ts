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
export const mapsShortFormVersion = "2026-10-23-contextual-v4";

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
  return {
    label: axis.label,
    tendency,
    score,
    side: effectiveSide,
    intensity,
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

// Only the approved mapped capacities interpret this page. Rank never determines a gap.
// Each task names the three authored terms and a usable, page-specific support.
export const mapsCapacityContexts: Record<string, Record<string, [string, string]>> = {
  Purpose: {
    Shepherd: ["connect Calling to people served, agree Direction and name Kingdom Impact", "ask one person served to help state the Calling and intended Kingdom Impact"],
    Architect: ["turn Calling into Direction toward Kingdom Impact", "write a one-sentence Calling, one next Direction and one sign of Kingdom Impact"],
  },
  Culture: { Shepherd: ["invite Belonging, build Trust and seek Unity", "invite a quieter voice, keep one trust-building promise and agree one shared practice for Unity"] },
  Motivation: { Shepherd: ["offer Care, encourage Growth and keep the work Life-giving", "name one act of Care, one Growth step and one Life-giving boundary"] },
  Assessment: { Artisan: ["Discern what is true, Understand its meaning and Clarify the question", "record one observation, test its meaning with someone affected and write the question plainly"] },
  Insight: { Artisan: ["Shape the idea, Refine its meaning and Adjust what does not fit", "sketch the idea, review it with one person and adjust one unclear part"] },
  Development: {
    Artisan: ["Improve the work, Strengthen what is weak and Elevate its usefulness", "make a small prototype, test whether it improves usefulness and revise its weak point after feedback"],
    Architect: ["choose a direction to Improve, Strengthen and Elevate the work", "choose one improvement, name its constraint and set a review point before expanding it"],
  },
  Proof: { Steward: ["make results Observable, Measurable and Verified", "capture one visible result, choose its measure and ask a second person to verify the evidence"] },
  Organization: { Steward: ["define Clear Roles, agree Ownership and clarify Responsibility", "use a one-page role map with ordered handoffs, named owners and a check-in date"] },
  Reliability: { Steward: ["keep commitments Consistent, Dependable and Sustainable", "use a recurring checklist, agree a sustainable promise and arrange a dependable backup"] },
  Energy: { Architect: ["take Initiative, Activate a first step and Move Forward", "choose one first action, name the risk and book a short starting block"] },
  Momentum: { Architect: ["Build on what works, Advance one step and Multiply useful results", "track one sign of progress, remove one obstacle and repeat a step that works before expanding"] },
  Outcomes: {
    Architect: ["define what to Complete, what to Deliver and what marks Closure", "define done, name the recipient and agree what counts as closure"],
    Steward: ["Complete the final tasks, Deliver the work and confirm Closure", "use a closeout checklist, confirm receipt and hand over any continuing responsibility"],
  },
};

export function mapsReflectionLens(subcategory: MapsSubcategory, designIdSnapshot: MapsAssessmentSnapshot) {
  const profile = reflectionProfile(designIdSnapshot);
  const identities = indicatorReflections(subcategory);
  // Mapping order, not score order, also keeps exact ties together without arbitrary winners.
  const required = identities.map(label => profile.find(item => item.label === label)!);
  const context = mapsCapacityContexts[subcategory.name];
  const score = mapsIndicatorScore(subcategory, designIdSnapshot);
  const available = required.filter(item => item.available && item.score >= 25);
  const low = required.filter(item => item.available && item.score < 25);
  const missing = required.filter(item => !item.available);
  const strength = available.length ? available.map(item => `${item.label} (${item.band}): ${item.band === "Abundant" ? "ample capacity" : "capacity available"} to ${context[item.label][0]}`).join("; ") + "." :
    "No mapped capacity is currently confirmed Steady or Abundant. Start with supported participation; this does not establish poor performance.";
  const gap = [
    ...low.map(item => `${item.label} (${item.band}): ${item.band === "Limited" ? "less reserve" : "little reserve"} to ${context[item.label][0]}; ${item.band === "Limited" ? "keep the attempt small and supported" : "share responsibility rather than carrying it alone"}`),
    ...missing.map(item => `${item.label}: capacity unavailable; review the result before inferring a gap`),
  ].join("; ") || "No lower-capacity flag in the mapped reflections. A lower rank than another reflection is not a deficit; confirm actual results in practice";
  const support = required.map(item => {
    if (!item.available) return `${item.label}: review the missing score before assigning support`;
    const lead = item.band === "Abundant" ? "Lead and invite others: " : item.band === "Steady" ? "For a manageable next step, " : item.band === "Limited" ? "With a partner, " : "With a co-owner, ";
    return `${item.label}: ${lead}${context[item.label][1]}`;
  }).join("; ") + ".";
  return {
    interpretation: required.some(item => !item.available) ? "MAPS indicator unavailable: one or more required reflection scores are missing." : `${identities.join(" + ")}: ${score} (${capacityBand(score)}${identities.length > 1 ? "; average" : ""}). ${identities.length > 1 ? "Read both capacities separately; this average is not an independent measurement." : "A capacity indicator, not a measurement of performance."}`,
    strength,
    gap: gap + ".",
    support,
    lane: subcategoryLane(subcategory.name),
  };
}

// Three task-specific reads per page. These are preference-aware work suggestions,
// not additional assessment findings. The relevant PD axis supplies side and intensity.
export const mapsMovementContexts: Record<string, Record<"positive" | "negative" | "balanced", [string, string, string]>> = {
  Purpose: {
    positive: ["Picture how the Calling could serve people and create Kingdom Impact.", "Choose one Direction and ask a person served whether it fits the Calling.", "A compelling future can hide an unclear next Direction."],
    negative: ["Turn the Calling into a practical next Direction.", "Consider the wider Kingdom Impact before settling on the easiest step.", "An efficient next step may not serve the original Calling."],
    balanced: ["Connect the Calling's larger purpose with its next Direction.", "Name the intended Kingdom Impact and one step toward it.", "Reopening the why can delay a Direction ready to test."],
  },
  Culture: {
    positive: ["Imagine a shared culture of Belonging, Trust and Unity.", "Ask a quieter person what would make participation safer; agree one shared practice.", "A warm vision of Unity can conceal a broken promise or an excluded voice."],
    negative: ["Make Belonging tangible through invitations and trust-building routines.", "Ask whose experience the current routine misses before making it the group norm.", "Efficient group habits can look like Unity while people do not feel they belong."],
    balanced: ["Link the desired atmosphere with habits that build Belonging and Trust.", "Invite each voice and agree one practice that supports Unity.", "Agreement on a practice is not proof that Trust has grown."],
  },
  Motivation: {
    positive: ["Imagine Growth that gives Care a meaningful expression.", "Ask what care is sustainable this week and which contribution brings life-giving purpose.", "An inspiring growth possibility can mask depleted care capacity."],
    negative: ["Translate Care into one helpful act and one Growth step.", "Ask why the contribution matters before adding it to the routine.", "A full care schedule can crowd out personal Growth and life-giving purpose."],
    balanced: ["Connect meaningful care with a realistic Growth step.", "Choose a sustainable act of Care and name its life-giving purpose.", "Trying to meet every need can drain the energy needed for Growth."],
  },
  Assessment: {
    positive: ["Discern possible explanations and imagine how context changes what you Understand.", "Test one explanation against an observation, then Clarify the question in one sentence.", "An interesting explanation can be mistaken for an observed fact."],
    negative: ["Discern what a concrete observation shows and Understand its practical context.", "Consider a second interpretation, then Clarify what the observation can actually establish.", "A quick practical diagnosis can cut discernment short."],
    balanced: ["Discern what you notice and Understand it before choosing an explanation.", "Separate observation from inference, then Clarify the question you will test.", "Collecting more observations can postpone a question clear enough to test."],
  },
  Insight: {
    positive: ["Shape an idea around what matters to the people affected.", "Refine the idea against evidence with a reviewer, then Adjust the part that does not fit.", "A meaningful impression still needs refinement before an adjustment is justified."],
    negative: ["Refine an idea by checking its assumptions and the reasons behind it.", "Ask how the idea lands with someone affected, then Adjust its shape before applying it.", "A tidy explanation can still need adjustment to serve its audience."],
    balanced: ["Shape an idea with both evidence and lived meaning.", "Refine the explanation with a reviewer and Adjust one unclear part.", "Endless refinement can delay a useful adjustment."],
  },
  Development: {
    positive: ["Notice what would Improve the work and Elevate its usefulness for people.", "Test one improvement against a real constraint and Strengthen the weak point it reveals.", "Enthusiasm for a creative idea can conceal an unworkable change."],
    negative: ["Compare options and constraints to choose what to Improve and Strengthen.", "Let a user try the change and describe whether it Elevates their experience.", "Analysis can delay a small improvement that would strengthen the work."],
    balanced: ["Combine possibility with evidence to Improve and Strengthen the work.", "Trial one improvement and use feedback to Elevate its usefulness.", "Weighing every improvement can delay a useful small experiment."],
  },
  Proof: {
    positive: ["Notice which Observable result would matter to the people served.", "Choose a Measurable indicator and have its evidence independently Verified.", "Confidence in a meaningful result is not verification."],
    negative: ["Define Observable evidence and a Measurable test before drawing a conclusion.", "Ask the people affected whether the Verified result reflects what matters to them.", "An accurate measure can still miss the human result it was meant to represent."],
    balanced: ["Connect meaningful results with Observable and Measurable evidence.", "Agree a measure and a second-person check so the claim is Verified.", "Debating the perfect measure can delay collecting usable evidence."],
  },
  Organization: {
    positive: ["Notice which Clear Roles fit people's commitments and strengths.", "Confirm Ownership of each handoff and the Responsibility each person accepts.", "A felt agreement can leave a handoff without an accountable owner."],
    negative: ["Define Clear Roles and Ownership through explicit task and handoff criteria.", "Ask whether each owner can carry the Responsibility and workload before finalizing the role.", "A tidy role map can ignore the people expected to carry it."],
    balanced: ["Bring people's commitments and Clear Roles into the same role map.", "Name Ownership of each handoff, the agreed Responsibility and review date.", "Negotiating every detail can delay assigning a needed owner."],
  },
  Reliability: {
    positive: ["Own a Consistent routine that makes your promise Dependable.", "Check load and recovery with a partner and arrange a backup to keep the promise Sustainable.", "Quietly carrying the routine alone can hide a missed handoff."],
    negative: ["Build a Consistent, Dependable rhythm through shared effort.", "Name your own promise and check load and recovery so it remains Sustainable.", "Shared responsibility can blur who must act when a commitment is missed."],
    balanced: ["Combine personal ownership and shared support for a Consistent, Dependable routine.", "Name the owner, due date and backup, then check that the workload is Sustainable.", "Switching between solo and shared work can leave a routine unowned."],
  },
  Energy: {
    positive: ["Use Initiative to Activate one independent step and Move Forward.", "Tell a check-in partner what you will start, when and what help you may need.", "Starting alone can outrun available time or leave a risk unseen."],
    negative: ["Use shared Initiative to Activate a first step and Move Forward together.", "Name the first action you can own without waiting for the whole group.", "Waiting for everyone can consume the energy needed to start."],
    balanced: ["Use personal Initiative and useful collaboration to Activate a step and Move Forward.", "Choose a first action, its owner and one useful collaboration point.", "Unclear ownership can stall a start even when enthusiasm is high."],
  },
  Momentum: {
    positive: ["Build on a working step and Advance it through personal follow-through.", "Review traction with a partner and Multiply only what is producing useful results.", "Working faster alone can multiply an approach that is not producing progress."],
    negative: ["Build on a working step and Advance it through shared encouragement.", "Own one repeatable next step and show its result before the group chooses to Multiply it.", "Group activity can grow while individual next steps remain unclear."],
    balanced: ["Build on what works and Advance it through independent effort and shared learning.", "Name the owner, repeat a step that works and review its results before you Multiply it.", "Frequent changes of ownership can interrupt a rhythm that is working."],
  },
  Outcomes: {
    positive: ["Take ownership of the final tasks and Deliver the work you committed to Complete.", "Ask the recipient to confirm delivery and agree the final handoff needed for Closure.", "Calling work finished alone can leave acceptance or continuing ownership unresolved."],
    negative: ["Bring people together to Complete the last tasks and confirm what you will Deliver.", "Own a final delivery task and confirm acceptance so Closure does not wait on the group.", "Waiting for shared approval can leave the last task unfinished."],
    balanced: ["Connect what you personally Complete with shared confirmation of what you Deliver.", "Agree acceptance, close the last task and confirm the handoff that marks Closure.", "A handoff between solo and shared work can leave closure incomplete."],
  },
};

export function mapsMovementLens(subcategory: MapsSubcategory, designPdSnapshot: MapsAssessmentSnapshot) {
  const lane = subcategoryLane(subcategory.name);
  const axis = designPdProfile(designPdSnapshot).find(item => item.label === lane)!;
  if (!axis.side) return { ...axis, strength: "Your movement pattern is not available.", need: "Review your DesignPD result before choosing support.", gap: "Do not infer a preference or an opposite-side need from missing data." };
  const [strength, need, gap] = mapsMovementContexts[subcategory.name][axis.side as "positive" | "negative" | "balanced"];
  const frequency = axis.side === "balanced" ? "" : axis.intensity === "Strong" ? " Make this a scheduled check for this task." : " Use a brief check when this task becomes difficult.";
  return { ...axis, strength, need: need + frequency, gap };
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
    capacityContexts: mapsCapacityContexts,
    movementContexts: mapsMovementContexts,
    reflectionPolicy: "Interpret only this page\'s mapped reflection(s), each at its actual band. Steady/Abundant are available capacity; Limited/Drained call for support, not a performance diagnosis. No global rank-based Strength/Gap. Preserve both blend partners and ties. Support names a concrete page/term task.",
    movementPolicy: "Use the relevant Plan/Decide/Do axis in task-specific prose once at the top. Strong preferences receive scheduled checks; moderate preferences brief checks as needed; balanced and missing results do not invent polarity. Bottom panels show scores/bands/tendencies only, without duplicate guidance.",
    indicatorReflections: mapsIndicatorReflections,
    indicatorPolicy: "0–60 scale. Purpose = mean Shepherd + Architect; Development = mean Artisan + Architect; Outcomes = mean Architect + Steward. Other nine retain their single reflection. Blended MAPS indicators, not independent measurements. Read individual capacities alongside averages.",
    scorePolicy: "Read each participant's latest DesignID and DesignPD; never rewrite scores. Use approved page mappings, never global rank to label strength or gap; respect ties and actual bands. PD side comes from stored tendency; unsigned magnitude <=5 balanced, 6-15 moderate, >=16 strong. Missing tendencies never imply an opposite-side need.",
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
  const movement = mapsMovementLens(subcategory, designPdSnapshot);
  const capacityRows = reflectionProfile(designIdSnapshot)
    .map(
      (item) => `<div class="maps-capacity-row">
        <span><i style="background:${item.color}"></i>${escapeHtml(item.label)}</span>
        <strong>${item.score}</strong>
        <em>${escapeHtml(item.band)}</em>
      </div>`,
    )
    .join("");
  const pdRows = pdProfile
    .map(
      (axis) => `<div class="maps-pd-row">
        <span>${escapeHtml(axis.label)}</span>
        <strong>${escapeHtml(axis.tendency)}${axis.score ? ` (${escapeHtml(axis.score)})` : ""}</strong>
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
          <div><h4>Strength</h4><p>${escapeHtml(movement.strength)}</p></div>
          <div><h4>Need</h4><p>${escapeHtml(movement.need)}</p></div>
          <div><h4>Gap</h4><p>${escapeHtml(movement.gap)}</p></div>
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
    .maps-subcategory-page .maps-mini-grid > div {display:grid;grid-template-columns:56px minmax(0,1fr);gap:5px;padding:5px 6px;align-items:start;}
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
  </main>
</body>
</html>`;
}

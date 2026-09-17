import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import type { DesignPdResult } from "./engine";

const axisCopy = {
  decide: {
    Balanced: {
      core: "You can move between structured reasoning and relational awareness without needing one mode to dominate every decision.",
      descriptor: "Balanced decision-making",
      modulator: "Pause long enough to name both the logic and the people impact before you act.",
      overview: "Your Decide pattern shows a blend of structure and sensitivity.",
    },
    Moderate_Feel_It: {
      core: "You tend to notice people impact, emotional tone, and relational consequences early in the decision process.",
      descriptor: "Relationally aware",
      modulator: "Let empathy inform the decision, then ask what criteria need to be made explicit.",
      overview: "Your Decide pattern leans toward Feel It.",
    },
    Moderate_Think_It: {
      core: "You tend to look for clarity, criteria, tradeoffs, and a decision structure you can trust.",
      descriptor: "Structurally clear",
      modulator: "Let logic serve love by naming who will be affected and what they may need.",
      overview: "Your Decide pattern leans toward Think It.",
    },
    Strong_Feel_It: {
      core: "People impact is often your first read. You may sense tone, hesitation, or relational strain before the facts are fully arranged.",
      descriptor: "Strong relational discernment",
      modulator: "Before acting, slow down enough to separate compassion from assumption.",
      overview: "Your Decide pattern strongly favors Feel It.",
    },
    Strong_Think_It: {
      core: "Clarity, consistency, and sound reasoning are often your first anchors when a decision matters.",
      descriptor: "Strong structured discernment",
      modulator: "Before acting, slow down enough to include the emotional and relational realities around the decision.",
      overview: "Your Decide pattern strongly favors Think It.",
    },
  },
  do: {
    Balanced: {
      core: "You can move between personal ownership and shared effort depending on what the assignment requires.",
      descriptor: "Flexible execution",
      modulator: "Clarify what belongs to you and what should be carried with others.",
      overview: "Your Do pattern shows a blend of independent and shared action.",
    },
    Moderate_Solo: {
      core: "You tend to move with personal ownership once direction is clear.",
      descriptor: "Personally responsible",
      modulator: "Invite the right people early enough that ownership does not become isolation.",
      overview: "Your Do pattern leans toward Solo.",
    },
    Moderate_Together: {
      core: "You tend to gain momentum when action is shared with trusted people.",
      descriptor: "Collaborative momentum",
      modulator: "Define your own next step so collaboration does not become waiting.",
      overview: "Your Do pattern leans toward Together.",
    },
    Strong_Solo: {
      core: "You are likely to carry responsibility directly and keep moving even without much outside input.",
      descriptor: "Strong independent ownership",
      modulator: "Do not confuse speed or responsibility with carrying the whole assignment alone.",
      overview: "Your Do pattern strongly favors Solo.",
    },
    Strong_Together: {
      core: "You are likely to move best when people are aligned, involved, and sharing the work.",
      descriptor: "Strong shared-action rhythm",
      modulator: "Do not wait for perfect group momentum before taking the next faithful step.",
      overview: "Your Do pattern strongly favors Together.",
    },
  },
  plan: {
    Balanced: {
      core: "You can hold future possibility and practical next steps together.",
      descriptor: "Balanced planning",
      modulator: "Name the vision, then choose the next faithful action.",
      overview: "Your Plan pattern shows a blend of Dreamer and Doer.",
    },
    Moderate_Doer: {
      core: "You tend to trust plans once they become practical, grounded, and doable.",
      descriptor: "Action-grounded planning",
      modulator: "Make room for imagination before narrowing too quickly to execution.",
      overview: "Your Plan pattern leans toward Doer.",
    },
    Moderate_Dreamer: {
      core: "You tend to see possibility and future direction before every practical step is clear.",
      descriptor: "Possibility-oriented planning",
      modulator: "Choose one concrete step so possibility begins to take shape.",
      overview: "Your Plan pattern leans toward Dreamer.",
    },
    Strong_Doer: {
      core: "You are likely to look for concrete movement, workable order, and practical traction quickly.",
      descriptor: "Strong practical planner",
      modulator: "Do not let urgency for action squeeze out prayerful imagination.",
      overview: "Your Plan pattern strongly favors Doer.",
    },
    Strong_Dreamer: {
      core: "You are likely to see opportunities, patterns, and future potential quickly.",
      descriptor: "Strong future-oriented planner",
      modulator: "Do not let expanding possibility delay a grounded next step.",
      overview: "Your Plan pattern strongly favors Dreamer.",
    },
  },
} as const;

const contextRows = {
  collaboration: {
    growth: "Practice naming what support, clarity, and pace would help the work stay healthy.",
    strength: "You can bring your pattern into shared work as a gift when it stays submitted to love.",
    watch: "Watch for assuming others process planning, decisions, or action the same way you do.",
  },
  conflict: {
    growth: "When pressure rises, ask what is true, what is loving, and what next step is actually yours.",
    strength: "Your pattern can help slow conflict into clearer discernment when you do not overuse it.",
    watch: "Under stress, your strongest mode can become louder than wisdom.",
  },
  leadership: {
    growth: "Lead by making your process visible so others know how to join you.",
    strength: "Your DesignPD pattern gives language for how you guide movement from intention to action.",
    watch: "Leadership gets strained when your preferred pace or pathway becomes the only acceptable one.",
  },
  pressure: {
    growth: "Use pressure as a signal to return to prayer, wise counsel, and one faithful next move.",
    strength: "Your pattern can remain useful under pressure when it is held with humility.",
    watch: "Pressure may exaggerate your strongest tendency and flatten your access to the other side.",
  },
  sustainability: {
    growth: "Build rhythms that let your design serve over time without burning out or becoming rigid.",
    strength: "Sustainable action grows when your planning, deciding, and doing are connected to grace.",
    watch: "Long-term fruit suffers when output becomes disconnected from rest, reflection, and community.",
  },
} as const;

function copyFor(axis: keyof typeof axisCopy, tendency: string) {
  return axisCopy[axis][tendency as keyof typeof axisCopy[typeof axis]] ?? axisCopy[axis].Balanced;
}

function easternDateTime() {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date());
}

function assessmentScore(scores: Record<string, unknown>, key: string) {
  const value = scores[key];
  return typeof value === "number" || typeof value === "string" ? value : "";
}

export function buildDesignPdReportPayload({
  designIdSnapshot,
  participantEmail,
  participantName,
  result,
}: {
  designIdSnapshot: AssessmentSnapshotSummary;
  participantEmail: string;
  participantName: string;
  result: DesignPdResult;
}) {
  const plan = copyFor("plan", result.axisTendencies.plan);
  const decide = copyFor("decide", result.axisTendencies.decide);
  const doCopy = copyFor("do", result.axisTendencies.do);
  const designIdScores =
    result.designId.rawScores.scores && typeof result.designId.rawScores.scores === "object"
      ? result.designId.rawScores.scores as Record<string, unknown>
      : result.designId.rawScores;
  const primary = result.designId.primary || "DesignID";
  const secondary = result.designId.secondary || "Secondary";
  const integrative = result.designId.integrativeReflection || `${primary} + ${secondary}`;
  const shadow = result.designId.reflectionShadow || "Overusing a good strength under pressure";

  return {
    name: participantName,
    email: participantEmail,
    primary,
    secondary,
    integrative_reflection: integrative,
    reflection_shadow: shadow,
    shadow_reflection: shadow,
    band_architect: result.designId.bands.Architect,
    band_artisan: result.designId.bands.Artisan,
    band_shepherd: result.designId.bands.Shepherd,
    band_steward: result.designId.bands.Steward,
    plan_tendency: result.axisTendencies.plan,
    decide_tendency: result.axisTendencies.decide,
    do_tendency: result.axisTendencies.do,
    plan_score: result.axisScores.plan,
    decide_score: result.axisScores.decide,
    do_score: result.axisScores.do,
    move_dreamer_minus_doer: result.axisScores.plan,
    move_feel_it_minus_think_it: result.axisScores.decide,
    move_solo_minus_together: result.axisScores.do,
    plan_descriptor: plan.descriptor,
    decide_descriptor: decide.descriptor,
    do_descriptor: doCopy.descriptor,
    plan_overview: plan.overview,
    decide_overview: decide.overview,
    do_overview: doCopy.overview,
    plan_core: plan.core,
    decide_core: decide.core,
    do_core: doCopy.core,
    plan_overlay: `Your ${primary} reflection shapes the way your planning rhythm is expressed.`,
    decide_overlay: `Your ${primary} reflection shapes the way your decision rhythm is expressed.`,
    do_overlay: `Your ${primary} reflection shapes the way your action rhythm is expressed.`,
    plan_modulator: plan.modulator,
    decide_modulator: decide.modulator,
    do_modulator: doCopy.modulator,
    plan_integrative_lens: `${integrative} gives your planning a distinct blend of ${primary} and ${secondary}.`,
    decide_integrative_lens: `${integrative} gives your decisions a distinct blend of ${primary} and ${secondary}.`,
    do_integrative_lens: `${integrative} gives your action a distinct blend of ${primary} and ${secondary}.`,
    plan_shadow_watch: `Watch for ${shadow.toLowerCase()} showing up in the way you plan.`,
    decide_shadow_watch: `Watch for ${shadow.toLowerCase()} showing up in the way you decide.`,
    do_shadow_watch: `Watch for ${shadow.toLowerCase()} showing up in the way you move into action.`,
    plan_amplifier: `${primary} can amplify your Plan pattern when strength becomes pressure.`,
    decide_amplifier: `${primary} can amplify your Decide pattern when strength becomes pressure.`,
    do_amplifier: `${primary} can amplify your Do pattern when strength becomes pressure.`,
    plan_architect_amplifier: "Architect energy can push planning toward vision, direction, and initiation.",
    plan_artisan_amplifier: "Artisan energy can push planning toward form, excellence, and meaningful experience.",
    plan_shepherd_amplifier: "Shepherd energy can push planning toward people, care, and restoration.",
    plan_steward_amplifier: "Steward energy can push planning toward order, responsibility, and endurance.",
    decide_architect_amplifier: "Architect energy can push decisions toward movement and strategic clarity.",
    decide_artisan_amplifier: "Artisan energy can push decisions toward nuance, beauty, and expression.",
    decide_shepherd_amplifier: "Shepherd energy can push decisions toward relational awareness and care.",
    decide_steward_amplifier: "Steward energy can push decisions toward faithfulness, structure, and trust.",
    do_architect_amplifier: "Architect energy can push action toward starting, building, and leading forward.",
    do_artisan_amplifier: "Artisan energy can push action toward shaping, refining, and improving.",
    do_shepherd_amplifier: "Shepherd energy can push action toward supporting, gathering, and restoring.",
    do_steward_amplifier: "Steward energy can push action toward sustaining, protecting, and completing.",
    ...Object.fromEntries(
      Object.entries(contextRows).flatMap(([context, values]) => [
        [`${context}_plan_strength`, values.strength],
        [`${context}_plan_watch`, values.watch],
        [`${context}_plan_growth`, values.growth],
        [`${context}_decide_strength`, values.strength],
        [`${context}_decide_watch`, values.watch],
        [`${context}_decide_growth`, values.growth],
        [`${context}_do_strength`, values.strength],
        [`${context}_do_watch`, values.watch],
        [`${context}_do_growth`, values.growth],
      ]),
    ),
    designid_snapshot_id: designIdSnapshot.id,
    designid_completed_at: designIdSnapshot.source_submitted_at ?? designIdSnapshot.created_at,
    architect_pts: assessmentScore(designIdScores, "Architect_Pts"),
    artisan_pts: assessmentScore(designIdScores, "Artisan_Pts"),
    shepherd_pts: assessmentScore(designIdScores, "Shepherd_Pts"),
    steward_pts: assessmentScore(designIdScores, "Steward_Pts"),
    report_date: easternDateTime(),
  };
}

export function designPdSnapshotSections(result: DesignPdResult) {
  const plan = copyFor("plan", result.axisTendencies.plan);
  const decide = copyFor("decide", result.axisTendencies.decide);
  const doCopy = copyFor("do", result.axisTendencies.do);

  return {
    profileLanguage: {
      Decide_Core: decide.core,
      Do_Core: doCopy.core,
      Plan_Core: plan.core,
      Shadow_Watch: result.designId.reflectionShadow,
    },
    summary: {
      Decide_Tendency: result.axisTendencies.decide,
      Do_Tendency: result.axisTendencies.do,
      Integrative_Reflection: result.designId.integrativeReflection,
      Plan_Tendency: result.axisTendencies.plan,
      Primary: result.designId.primary,
      ReportReady: "OK",
      Secondary: result.designId.secondary,
    },
  };
}

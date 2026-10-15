import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import type { DesignPdAxis } from "./intake";

export type DesignPdRatings = Record<string, number>;

export type DesignPdResult = {
  axisScores: Record<DesignPdAxis, number>;
  movement: Record<DesignPdAxis, number>;
  axisTendencies: Record<DesignPdAxis, string>;
  designId: {
    bands: Record<string, string>;
    integrativeReflection: string;
    primary: string;
    rawScores: Record<string, unknown>;
    reflectionShadow: string;
    secondary: string;
  };
  ratings: DesignPdRatings;
};

const axisLabels = {
  decide: ["Think_It", "Feel_It"],
  do: ["Together", "Solo"],
  plan: ["Doer", "Dreamer"],
} as const;

function tendency(axis: DesignPdAxis, score: number) {
  const [negative, positive] = axisLabels[axis];
  const abs = Math.abs(score);
  if (abs <= 0.05) return "Balanced";
  const label = score > 0 ? positive : negative;
  return `${abs >= 0.16 ? "Strong" : "Moderate"}_${label}`;
}

export const designPdScoringVersion = "designpd-derived-workbook-v1";

export function scoreDesignPd(designIdSnapshot: AssessmentSnapshotSummary): DesignPdResult {
  const root = designIdSnapshot.scores;
  const summary = root.summary && typeof root.summary === "object" ? root.summary as Record<string, unknown> : {};
  const scores = root.scores && typeof root.scores === "object" ? root.scores as Record<string, unknown> : root;
  const nestedScores = scores.scores && typeof scores.scores === "object" && !Array.isArray(scores.scores)
    ? scores.scores as Record<string, unknown> : scores;
  const rawPoints = ["Architect", "Artisan", "Shepherd", "Steward"].map((key) => nestedScores[`${key}_Pts`]);
  const points = rawPoints.map((value) => value === null || value === "" || value === undefined ? NaN : Number(value));
  if (points.some((value) => !Number.isInteger(value) || value < 0 || value > 60) || points.reduce((sum, value) => sum + value, 0) !== 100 || Number(nestedScores.Total_Pts) !== 100) {
    throw new Error("DesignPD needs a valid 100-point DesignID result. Please complete the corrected DesignID assessment first.");
  }
  const [architect, artisan, shepherd, steward] = points;
  // Scored!W:Y / DesignPD_Helper: paired percentage averages, then differences.
  const movement = {
    plan: (shepherd + artisan - architect - steward) / 200,
    decide: (architect + shepherd - artisan - steward) / 200,
    do: (architect + artisan - shepherd - steward) / 200,
  };
  return {
    movement,
    axisScores: {
      plan: Math.round(Math.abs(movement.plan) * 100),
      decide: Math.round(Math.abs(movement.decide) * 100),
      do: Math.round(Math.abs(movement.do) * 100),
    },
    axisTendencies: {
      plan: tendency("plan", movement.plan),
      decide: tendency("decide", movement.decide),
      do: tendency("do", movement.do),
    },
    designId: {
      bands: Object.fromEntries(["Architect", "Artisan", "Shepherd", "Steward"].map((key) => [key, String(nestedScores[`Band_${key}`] ?? "")])),
      integrativeReflection: String(summary.Integrative_Reflection ?? ""),
      primary: String(summary.Primary ?? ""),
      rawScores: nestedScores,
      reflectionShadow: String(summary.Potential_Shadow ?? summary.Reflection_Shadow ?? ""),
      secondary: String(summary.Secondary ?? ""),
    },
    ratings: {},
  };
}

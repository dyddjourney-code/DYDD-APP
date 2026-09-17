import { snapshotSection, type AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import { designPdQuestionBank, type DesignPdAxis } from "./intake";

export type DesignPdRatings = Record<string, number>;

export type DesignPdResult = {
  axisScores: Record<DesignPdAxis, number>;
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
  if (abs <= 2) return "Balanced";
  const label = score > 0 ? positive : negative;
  return `${abs >= 7 ? "Strong" : "Moderate"}_${label}`;
}

export function parseDesignPdRatings(formData: FormData) {
  const ratings: DesignPdRatings = {};

  for (const question of designPdQuestionBank) {
    const value = Number(formData.get(`designpd_rating_${question.code}`));
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error("Please answer every DesignPD statement before submitting.");
    }
    ratings[question.code] = value;
  }

  return ratings;
}

export function scoreDesignPd(
  ratings: DesignPdRatings,
  designIdSnapshot: AssessmentSnapshotSummary,
): DesignPdResult {
  const axisScores: Record<DesignPdAxis, number> = {
    decide: 0,
    do: 0,
    plan: 0,
  };

  for (const question of designPdQuestionBank) {
    const raw = ratings[question.code] ?? 3;
    axisScores[question.axis] += raw - 3;
  }

  const summary = snapshotSection(designIdSnapshot, "summary");
  const scores = snapshotSection(designIdSnapshot, "scores");
  const nestedScores =
    scores.scores && typeof scores.scores === "object" && !Array.isArray(scores.scores)
      ? (scores.scores as Record<string, unknown>)
      : scores;

  return {
    axisScores,
    axisTendencies: {
      decide: tendency("decide", axisScores.decide),
      do: tendency("do", axisScores.do),
      plan: tendency("plan", axisScores.plan),
    },
    designId: {
      bands: {
        Architect: String(nestedScores.Band_Architect ?? ""),
        Artisan: String(nestedScores.Band_Artisan ?? ""),
        Shepherd: String(nestedScores.Band_Shepherd ?? ""),
        Steward: String(nestedScores.Band_Steward ?? ""),
      },
      integrativeReflection: String(summary.Integrative_Reflection ?? ""),
      primary: String(summary.Primary ?? ""),
      rawScores: nestedScores,
      reflectionShadow: String(summary.Potential_Shadow ?? summary.Reflection_Shadow ?? ""),
      secondary: String(summary.Secondary ?? ""),
    },
    ratings,
  };
}

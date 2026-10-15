import {
  designIdQuestionBank,
  designIdQuestionBlocks,
  designIdReflections,
  type DesignIdReflection,
} from "./intake";

import type { MapsConfirmationResult } from "./maps-confirmation";

export type DesignIdAllocationAnswers = Record<string, number>;

export type DesignIdResult = {
  answers: DesignIdAllocationAnswers;
  mapsConfirmation?: MapsConfirmationResult;
  bandByReflection: Record<DesignIdReflection, string>;
  movement: {
    Doer: number;
    Dreamer: number;
    Feel_It: number;
    Move_DreamerMinusDoer: number;
    Move_Feel_ItMinusThink_It: number;
    Move_SoloMinusTogether: number;
    Solo: number;
    Think_It: number;
    Together: number;
  };
  pairKey: string;
  primary: DesignIdReflection;
  rankOrder: DesignIdReflection[];
  secondary: DesignIdReflection;
  scores: Record<DesignIdReflection, number>;
  tieSummary: {
    exactTieAtTop: boolean;
    exactTies: string[];
    nearTies: string[];
    note: string;
    scoreGap: number;
  };
  totalPoints: number;
};

export const designIdScoringVersion = "designid-allocation-5x20-v1";

const reflectionTieOrder: DesignIdReflection[] = ["Architect", "Artisan", "Shepherd", "Steward"];

function bandForScore(score: number) {
  if (score >= 40) return "Abundant";
  if (score >= 25) return "Steady";
  if (score >= 10) return "Limited";
  return "Drained";
}

function percent(score: number) {
  // Workbook percentages are fractions of the full 100-point allocation.
  return score / 100;
}

export function parseDesignIdAllocationAnswers(formData: FormData) {
  const answers: DesignIdAllocationAnswers = {};

  for (const statement of designIdQuestionBank) {
    const raw = formData.getAll(`designid_points_${statement.code}`);
    const value = raw.length === 1 && typeof raw[0] === "string" && /^[0-3]$/.test(raw[0]) ? Number(raw[0]) : NaN;
    if (!Number.isInteger(value) || value < 0 || value > 3) {
      throw new Error("Choose 0, 1, 2, or 3 points for every DesignID statement.");
    }
    answers[statement.code] = value;
  }

  for (const block of designIdQuestionBlocks) {
    const values = block.statements.map((statement) => answers[statement.code]);
    if (values.reduce((sum, value) => sum + value, 0) !== 5) {
      throw new Error(`Question set ${block.block} must total exactly 5 points.`);
    }
  }

  return answers;
}

export function scoreDesignId(answers: DesignIdAllocationAnswers): DesignIdResult {
  for (const block of designIdQuestionBlocks) {
    const values = block.statements.map((statement) => answers[statement.code]);
    if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 3) || values.reduce((sum, value) => sum + value, 0) !== 5) {
      throw new Error(`Question set ${block.block} must have four 0–3 point choices totaling exactly 5.`);
    }
  }
  const scores = Object.fromEntries(designIdReflections.map((key) => [key, 0])) as Record<
    DesignIdReflection,
    number
  >;

  for (const statement of designIdQuestionBank) {
    scores[statement.reflection] += answers[statement.code] ?? 0;
  }

  const rankOrder = [...designIdReflections].sort((a, b) => {
    const scoreGap = scores[b] - scores[a];
    if (scoreGap !== 0) return scoreGap;
    return reflectionTieOrder.indexOf(a) - reflectionTieOrder.indexOf(b);
  });
  const primary = rankOrder[0];
  const secondary = rankOrder[1];
  const scoreGap = scores[primary] - scores[secondary];
  const exactTieGroups = new Map<number, DesignIdReflection[]>();

  for (const reflection of designIdReflections) {
    const bucket = exactTieGroups.get(scores[reflection]) ?? [];
    bucket.push(reflection);
    exactTieGroups.set(scores[reflection], bucket);
  }

  const exactTies = Array.from(exactTieGroups.values())
    .filter((group) => group.length > 1)
    .map((group) => group.join(" / "));
  const nearTies = designIdReflections
    .filter((reflection) => reflection !== primary && Math.abs(scores[primary] - scores[reflection]) <= 3)
    .map((reflection) => `${primary} / ${reflection}`);
  const tieSummary = {
    exactTieAtTop: scoreGap === 0,
    exactTies,
    nearTies,
    note:
      scoreGap === 0
        ? "Your top reflections are tied. Read the first two as a shared pattern, not a hard ranking."
        : scoreGap <= 3
          ? "Your top reflections are very close. The order gives a starting point, but both deserve attention."
          : "Your reflection order is clear enough to use as a starting point.",
    scoreGap,
  };
  const bandByReflection = Object.fromEntries(
    designIdReflections.map((reflection) => [reflection, bandForScore(scores[reflection])]),
  ) as Record<DesignIdReflection, string>;
  // Exact Scored!Q:V pairings: averages of total-score fractions, not raw sums.
  const dreamer = (scores.Shepherd + scores.Artisan) / 200;
  const doer = (scores.Architect + scores.Steward) / 200;
  const feelIt = (scores.Architect + scores.Shepherd) / 200;
  const thinkIt = (scores.Artisan + scores.Steward) / 200;
  const solo = (scores.Architect + scores.Artisan) / 200;
  const together = (scores.Shepherd + scores.Steward) / 200;

  return {
    answers,
    bandByReflection,
    movement: {
      Doer: doer,
      Dreamer: dreamer,
      Feel_It: feelIt,
      Move_DreamerMinusDoer: Number((dreamer - doer).toFixed(10)),
      Move_Feel_ItMinusThink_It: Number((feelIt - thinkIt).toFixed(10)),
      Move_SoloMinusTogether: Number((solo - together).toFixed(10)),
      Solo: solo,
      Think_It: thinkIt,
      Together: together,
    },
    pairKey: `${primary}|${secondary}`,
    primary,
    rankOrder,
    secondary,
    scores,
    tieSummary,
    totalPoints: Object.values(scores).reduce((sum, value) => sum + value, 0),
  };
}

export function designIdScorePayload(result: DesignIdResult) {
  return {
    Architect_Pts: result.scores.Architect,
    Artisan_Pts: result.scores.Artisan,
    Shepherd_Pts: result.scores.Shepherd,
    Steward_Pts: result.scores.Steward,
    Total_Pts: result.totalPoints,
    Architect_Pct: percent(result.scores.Architect),
    Artisan_Pct: percent(result.scores.Artisan),
    Shepherd_Pct: percent(result.scores.Shepherd),
    Steward_Pct: percent(result.scores.Steward),
    Band_Architect: result.bandByReflection.Architect,
    Band_Artisan: result.bandByReflection.Artisan,
    Band_Shepherd: result.bandByReflection.Shepherd,
    Band_Steward: result.bandByReflection.Steward,
    ...result.movement,
  };
}

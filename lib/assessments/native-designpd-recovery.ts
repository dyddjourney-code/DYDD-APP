import type { AssessmentSnapshotSummary } from "./student-context";
import { object } from "./report-recovery";
import { scoreDesignPd } from "@/lib/designpd/engine";
import { buildDesignPdReportPayload } from "@/lib/designpd/report";

/** Recover an early native report only when every saved numeric/tendency field
 * agrees with its exact retained DesignID source. Never mutate or rescore a run. */
export function nativeDesignPdRecoveryPayload(
  snapshot: AssessmentSnapshotSummary,
  source: AssessmentSnapshotSummary,
) {
  const saved = snapshot.scores;
  if (snapshot.assessment_type !== "designpd" || saved.channel !== "native_app" ||
      source.assessment_type !== "designid" || saved.designIdSnapshotId !== source.id)
    return null;
  try {
    const verified = scoreDesignPd(source);
    for (const axis of ["plan", "decide", "do"] as const) {
      if (object(saved.axisScores)[axis] !== verified.axisScores[axis] ||
          object(saved.axisTendencies)[axis] !== verified.axisTendencies[axis] ||
          typeof object(saved.movement)[axis] !== "number" ||
          !Number.isFinite(object(saved.movement)[axis]) ||
          Math.abs(object(saved.movement)[axis] - verified.movement[axis]) > 1e-9)
        return null;
    }
    return buildDesignPdReportPayload({
      designIdSnapshot: source,
      participantEmail: "",
      participantName: "",
      result: {
        ...verified,
        axisScores: saved.axisScores as typeof verified.axisScores,
        axisTendencies: saved.axisTendencies as typeof verified.axisTendencies,
        movement: saved.movement as typeof verified.movement,
      },
    });
  } catch {
    return null;
  }
}

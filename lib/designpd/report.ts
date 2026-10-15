import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
import type { DesignPdResult } from "./engine";
import source from "./source/libraries.json";

export const designPdContentVersion = source.contentVersion;
export const designPdTemplateId = process.env.DESIGNPD_PDFMONKEY_TEMPLATE_ID ?? "3f9db53e-6b35-40ba-ba77-5673d6bb727c";
const reflections = ["Architect", "Artisan", "Shepherd", "Steward"] as const;
const axes = ["Plan", "Decide", "Do"] as const;
const libraries = source.libraries as Record<string, Record<string, string[]>>;
const pairs: Record<string, string> = {
  "Architect|Artisan": "Visionary", "Architect|Shepherd": "Innovator",
  "Architect|Steward": "Overseer", "Artisan|Shepherd": "Interpreter",
  "Artisan|Steward": "Craftsman", "Shepherd|Steward": "Guardian",
};

/** Exact source lookup. Missing content is a migration error, never generic prose. */
function lookup(library: string, key: string, column: number) {
  const text = libraries[library]?.[key]?.[column - 1];
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(`DesignPD source content missing: ${library} / ${key}`);
  }
  return text;
}

/** Make reads formatted Sheets percentages; PDFMonkey uses these as CSS lengths. */
export function designPdMovementLength(movement: number) {
  if (!Number.isFinite(movement) || Math.abs(movement) > 0.5) throw new Error("Invalid DesignPD movement.");
  return `${(movement * 100).toFixed(1)}%`;
}

export function buildDesignPdReportPayload({
  designIdSnapshot, participantEmail, participantName, result,
}: {
  designIdSnapshot: AssessmentSnapshotSummary;
  participantEmail: string;
  participantName: string;
  result: DesignPdResult;
}): Record<string, string | number> {
  const { primary, secondary, bands } = result.designId;
  if (!reflections.includes(primary as typeof reflections[number]) || !reflections.includes(secondary as typeof reflections[number]) || primary === secondary) {
    throw new Error("DesignPD needs valid primary and secondary DesignID reflections.");
  }
  const pairKey = [primary, secondary].sort((a, b) => reflections.indexOf(a as typeof reflections[number]) - reflections.indexOf(b as typeof reflections[number])).join("|");
  const integrative = pairs[pairKey];
  if (!integrative) throw new Error("DesignPD integrative reflection not mapped.");
  // Scored!BA uses the primary reflection's Shadow row, NOT Potential_Shadow
  // (the longer integrative-pair warning stored in some native DesignID summaries).
  const reflectionShadow = source.reflectionShadows[primary as keyof typeof source.reflectionShadows];
  const payload: Record<string, string | number> = {
    name: participantName, email: participantEmail, primary, secondary,
    integrative_reflection: integrative,
    reflection_shadow: reflectionShadow, shadow_reflection: primary,
    report_date: new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" })
      .format(new Date(designIdSnapshot.source_submitted_at ?? designIdSnapshot.created_at)),
    designid_snapshot_id: designIdSnapshot.id,
    designid_completed_at: designIdSnapshot.source_submitted_at ?? designIdSnapshot.created_at,
  };
  for (const reflection of reflections) payload[`band_${reflection.toLowerCase()}`] = bands[reflection];
  for (const axis of axes) {
    const key = axis.toLowerCase() as keyof DesignPdResult["axisTendencies"];
    const tendencyKey = `${axis}|${result.axisTendencies[key]}`;
    payload[`${key}_tendency`] = result.axisTendencies[key];
    payload[`${key}_score`] = result.axisScores[key];
    payload[`${key}_descriptor`] = lookup("Tendency_Snapshot_Descriptors", tendencyKey, 3);
    payload[`${key}_overview`] = lookup("Tendency_Overview_Sentences", tendencyKey, 3);
    payload[`${key}_core`] = lookup("Core_Tendency_Blocks", tendencyKey, 3);
    payload[`${key}_overlay`] = lookup("Primary_Reflection_Overlays", `${axis}|${primary}`, 3);
    payload[`${key}_modulator`] = lookup("Secondary_Reflection_Modulators", `${axis}|${secondary}`, 3);
    payload[`${key}_amplifier`] = lookup("Bandwidth_Amplifiers", `${axis}|${primary}|${bands[primary]}`, 4);
    for (const reflection of reflections) {
      payload[`${key}_${reflection.toLowerCase()}_amplifier`] = lookup("Bandwidth_Amplifiers", `${axis}|${reflection}|${bands[reflection]}`, 4);
    }
    payload[`${key}_integrative_lens`] = lookup("Integrative_Shadow_Library", `Integrative_Lens|${axis}|${integrative}`, 4);
    payload[`${key}_shadow_watch`] = lookup("Integrative_Shadow_Library", `Shadow_Watch|${axis}|${reflectionShadow}`, 4)
      .replaceAll("{{reflection_shadow}}", reflectionShadow).replaceAll("{{shadow_reflection}}", primary);
    for (const [area, areaKey] of [["Conflict", "conflict"], ["Collaboration", "collaboration"], ["Leadership", "leadership"], ["Decision Pressure", "pressure"], ["Sustainability", "sustainability"]]) {
      const applicationKey = `${area}|${tendencyKey}`;
      for (const [index, suffix] of ["strength", "watch", "growth"].entries()) {
        payload[`${areaKey}_${key}_${suffix}`] = lookup("Practical_Applications_Library", applicationKey, index + 4);
      }
    }
  }
  payload.move_dreamer_minus_doer = designPdMovementLength(result.movement.plan);
  payload.move_feel_it_minus_think_it = designPdMovementLength(result.movement.decide);
  payload.move_solo_minus_together = designPdMovementLength(result.movement.do);
  return payload;
}

export function designPdSnapshotSections(result: DesignPdResult, payload: Record<string, string | number>) {
  return {
    profileLanguage: {
      ...payload,
      Plan_Core: payload.plan_core, Decide_Core: payload.decide_core,
      Do_Core: payload.do_core, Shadow_Watch: payload.reflection_shadow,
    },
    summary: {
      Decide_Tendency: result.axisTendencies.decide, Do_Tendency: result.axisTendencies.do,
      Integrative_Reflection: payload.integrative_reflection, Plan_Tendency: result.axisTendencies.plan,
      Primary: result.designId.primary, ReportReady: "OK", Secondary: result.designId.secondary,
    },
  };
}

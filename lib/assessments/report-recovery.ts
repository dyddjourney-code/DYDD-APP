import { spiritualGifts } from "@/lib/spiritual-gifts/intake";
import type { AssessmentSnapshotSummary } from "./student-context";
import { buildDesignIdReportPayload } from "@/lib/designid/report";
import type { DesignIdResult } from "@/lib/designid/engine";
import { buildSpiritualGiftsPdfMonkeyPayload } from "@/lib/spiritual-gifts/pdfmonkey-payload";
import pdSource from "@/lib/designpd/source/libraries.json";
const templates: Record<string, string> = {
  designid:
    process.env.DESIGNID_PDFMONKEY_TEMPLATE_ID ??
    "346a0595-80fa-48c3-a9e2-29f0c0312e6e",
  designpd:
    process.env.DESIGNPD_PDFMONKEY_TEMPLATE_ID ??
    "3f9db53e-6b35-40ba-ba77-5673d6bb727c",
  spiritual_gifts:
    process.env.SPIRITUAL_GIFTS_PDFMONKEY_TEMPLATE_ID ??
    "1c56c723-1210-4690-968f-a1aa5e5faeb5",
  fruit_360:
    process.env.FRUITLIFE_PDFMONKEY_TEMPLATE_ID ??
    "84de6c4d-e279-42e5-a5cc-28248d1149dd",
};
export function object(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}
export function sourceShadow(snapshot: AssessmentSnapshotSummary) {
  // Potential_Shadow is an integrative warning, NOT the primary Reflection_Shadow.
  const root = snapshot.scores;
  return String(
    object(root.summary).Reflection_Shadow ??
      object(root.reportPayload).Reflection_Shadow ??
      "",
  );
}
/** Fill only missing gift-reference paragraphs from the approved gift catalog.
 * Preserve the recorded gift names, order, scores, and all retained source prose. */
function completeGiftPayload(row: Record<string, any>) {
  const topGifts = [1, 2, 3, 4, 5].map((rank) => {
    const name = String(row[`Top${rank}_Name`] ?? "");
    const gift = spiritualGifts.find(
      (g) => g.label.toLowerCase() === name.toLowerCase(),
    );
    return gift
      ? { ...gift, score: Number(row[`Top${rank}_Score`] ?? 0) }
      : null;
  });
  if (topGifts.some((g) => !g)) return { ...row };
  const reference = buildSpiritualGiftsPdfMonkeyPayload({
    participantName: String(row.Full_Name ?? ""),
    participantEmail: String(row.Email_Address ?? ""),
    topGifts: topGifts as NonNullable<(typeof topGifts)[number]>[],
    deepDiveGifts: topGifts.slice(0, 3) as NonNullable<
      (typeof topGifts)[number]
    >[],
    tieSummary: {},
  });
  const payload = { ...row };
  for (const [key, value] of Object.entries(reference))
    if (
      payload[key] === undefined ||
      payload[key] === null ||
      payload[key] === ""
    )
      payload[key] = value;
  return payload;
}
/** Map an exact retained workbook row to the original official template contract. */
export function workbookReportPayload(type: string, row: Record<string, any>) {
  if (type === "designid")
    return {
      ...row,
      qc_donut: row.Chart_Image ?? row.qc_donut ?? "",
      safe_date: row.Timestamp ?? "",
      t: row.Timestamp ?? "",
    };
  if (type === "spiritual_gifts") return completeGiftPayload(row);
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row))
    payload[key.toLowerCase().replaceAll("-", "_")] = value;
  if (type === "designpd") {
    payload.report_date = row.Report_Date_Display;
    for (const axis of ["Plan", "Decide", "Do"]) {
      const low = axis.toLowerCase();
      for (const [suffix, field] of Object.entries({
        core: "Core_Block",
        overlay: "Primary_Overlay",
        modulator: "Secondary_Modulator",
        amplifier: "Bandwidth_Amplifier",
        overview: "Overview_Sentence",
      }))
        payload[`${low}_${suffix}`] = row[`${axis}_${field}`] ?? "";
      for (const [source, dest] of [
        ["Conflict", "conflict"],
        ["Collaboration", "collaboration"],
        ["Leadership", "leadership"],
        ["DecisionPressure", "pressure"],
        ["Sustainability", "sustainability"],
      ]) {
        for (const [suffix, field] of Object.entries({
          strength: "Strength",
          watch: "Watch_For",
          growth: "Growth_Practice",
        }))
          payload[`${dest}_${low}_${suffix}`] =
            row[`${source}_${axis}_${field}`] ?? "";
      }
    }
    for (const key of [
      "Move_DreamerMinusDoer",
      "Move_Feel_ItMinusThink_It",
      "Move_SoloMinusTogether",
    ]) {
      const val = row[key];
      const dest = {
        Move_DreamerMinusDoer: "move_dreamer_minus_doer",
        Move_Feel_ItMinusThink_It: "move_feel_it_minus_think_it",
        Move_SoloMinusTogether: "move_solo_minus_together",
      }[key]!;
      payload[dest] = String(val ?? "").includes("%")
        ? val
        : `${Number(val) * 100}%`;
    }
  }
  if (type === "fruit_360") {
    payload.participant_name = row.Participant_Name ?? row.Name;
    payload.participant_email = row.Participant_Email ?? row.Email;
  }
  return payload;
}
export function recoveryReport(snapshot: AssessmentSnapshotSummary): {
  templateId: string;
  payload: Record<string, any>;
} | null {
  const root = snapshot.scores,
    saved = object(root.reportPayload),
    type = snapshot.assessment_type;
  const templateId = templates[type];
  if (!templateId) return null;
  if (Object.keys(saved).length)
    return {
      templateId,
      payload:
        type === "spiritual_gifts"
          ? completeGiftPayload(saved)
          : root.reportPayloadFormat === "template-v1" ||
              (type === "designpd" && Boolean(saved.plan_core))
            ? { ...saved }
            : workbookReportPayload(type, saved),
    };
  const summary = object(root.summary),
    scores = object(root.scores),
    profile = object(root.profileLanguage);
  if (
    type === "designpd" &&
    profile.plan_core &&
    profile.decide_core &&
    profile.do_core
  )
    return { templateId, payload: profile };
  // Legacy native runs did not retain their template payload. Recreate from their
  // saved vector and presentation order, never rescore or reinterpret answers.
  if (type === "designid" && root.channel === "native_app") {
    const reflections = [
      "Architect",
      "Artisan",
      "Shepherd",
      "Steward",
    ] as const;
    const points = Object.fromEntries(
      reflections.map((r) => [r, Number(scores[`${r}_Pts`])]),
    ) as DesignIdResult["scores"];
    if (
      Object.values(points).some((v) => !Number.isInteger(v)) ||
      Object.values(points).reduce((a, b) => a + b, 0) !== 100
    )
      return null;
    if (
      !reflections.includes(summary.Primary) ||
      !reflections.includes(summary.Secondary)
    )
      return null;
    const result = {
      answers: object(root.answers),
      scores: points,
      totalPoints: 100,
      primary: summary.Primary,
      secondary: summary.Secondary,
      pairKey: summary.PairKey ?? `${summary.Primary}|${summary.Secondary}`,
      rankOrder: root.rankOrder ?? [],
      mapsConfirmation: root.mapsConfirmation,
      bandByReflection: Object.fromEntries(
        reflections.map((r) => [r, scores[`Band_${r}`]]),
      ),
      movement: Object.fromEntries(
        [
          "Doer",
          "Dreamer",
          "Feel_It",
          "Think_It",
          "Solo",
          "Together",
          "Move_DreamerMinusDoer",
          "Move_Feel_ItMinusThink_It",
          "Move_SoloMinusTogether",
        ].map((k) => [k, scores[k]]),
      ),
      tieSummary: root.tieSummary ?? {
        note: "",
        exactTies: [],
        nearTies: [],
        exactTieAtTop: false,
        scoreGap: 0,
      },
    } as DesignIdResult;
    const payload = {
      ...buildDesignIdReportPayload({
        participantName: "",
        participantEmail: "",
        result,
      }),
      ...profile,
      ...summary,
      ...scores,
    };
    for (const r of reflections) payload[`${r}_Pct`] = `${points[r]}%`;
    payload.Reflection_Shadow =
      pdSource.reflectionShadows[
        summary.Primary as keyof typeof pdSource.reflectionShadows
      ];
    payload.Timestamp = snapshot.source_submitted_at ?? snapshot.created_at;
    return { templateId, payload };
  }
  if (
    type === "spiritual_gifts" &&
    Array.isArray(root.topGifts) &&
    root.topGifts.length
  ) {
    return {
      templateId,
      payload: completeGiftPayload({
        ...buildSpiritualGiftsPdfMonkeyPayload({
          participantName: "", participantEmail: "", topGifts: root.topGifts,
          deepDiveGifts: root.topGifts.slice(0, 3), tieSummary: object(root.tieSummary),
        } as Parameters<typeof buildSpiritualGiftsPdfMonkeyPayload>[0]),
        ...Object.fromEntries(root.topGifts.slice(0,5).flatMap((g: Record<string,any>,i:number) => [[`Top${i+1}_Name`,g.label],[`Top${i+1}_Score`,g.score]])),
      }),
    };
  }
  return null;
}

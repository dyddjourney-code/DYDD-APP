const reflections = ["Architect", "Artisan", "Shepherd", "Steward"] as const;
function numeric(value: unknown) {
  if (value === undefined || value === null || value === "") return NaN;
  return Number(value);
}
/** PDF-only units; never mutate saved scores, totals, ranking, or source prose.
 * Historical _Pct field names are retained for template compatibility only.
 * Display actual whole-number points, never percent signs or decimal fractions.
 * Prefer saved points, including older instruments with non-100 totals.
 */
export function designIdPdfDisplayPayload(payload: Record<string, unknown>) {
  const out = { ...payload };
  const points = reflections.map((r) => numeric(payload[`${r}_Pts`]));
  const completePoints = points.every((v) => Number.isFinite(v) && v >= 0);
  const raw = reflections.map((r) => payload[`${r}_Pct`]);
  // Whole-number numeric vectors can include 1; don't mistake that for 100%.
  const wholeUnits = raw.some((v) => {
    if (typeof v === "string" && v.trim().endsWith("%")) return false;
    return numeric(v) > 1;
  });
  reflections.forEach((r, i) => {
    const value = raw[i];
    if (completePoints) {
      out[`${r}_Pct`] = `${Math.round(points[i])}`;
    } else if (value !== undefined && value !== null && value !== "") {
      const explicit = typeof value === "string" && value.trim().endsWith("%");
      const n = numeric(explicit ? (value as string).trim().slice(0, -1) : value);
      const pct = n * (explicit || wholeUnits ? 1 : 100);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100)
        throw new Error("DesignID PDF contains an invalid saved percentage.");
      out[`${r}_Pct`] = `${Math.round(pct)}`;
    }
  });
  return out;
}
/** Last-mile safeguard for native, workbook-recovery, and worker calls. */
export function pdfScoreDisplayPayload(templateId: string, payload: Record<string, unknown>) {
  return templateId === (process.env.DESIGNID_PDFMONKEY_TEMPLATE_ID ?? "346a0595-80fa-48c3-a9e2-29f0c0312e6e")
    ? designIdPdfDisplayPayload(payload)
    : { ...payload };
}

const reflections = ["Architect", "Artisan", "Shepherd", "Steward"] as const;
function numeric(value: unknown) {
  if (value === undefined || value === null || value === "") return NaN;
  return Number(value);
}
/** PDF-only units; never mutate saved scores, totals, ranking, or source prose.
 * _Pct is printed verbatim and stripped of '%' for BOTH official donut charts.
 * Prefer a complete 100-point vector. Older instruments may have other totals:
 * preserve those points and format their retained proportional percentages.
 */
export function designIdPdfDisplayPayload(payload: Record<string, unknown>) {
  const out = { ...payload };
  const points = reflections.map((r) => numeric(payload[`${r}_Pts`]));
  const completePoints = points.every((v) => Number.isFinite(v) && v >= 0);
  const total = points.reduce((a, b) => a + b, 0);
  const canonical = completePoints && Math.abs(total - 100) < 0.000001;
  const raw = reflections.map((r) => payload[`${r}_Pct`]);
  // Whole-number numeric vectors can include 1; don't mistake that for 100%.
  const wholeUnits = raw.some((v) => {
    if (typeof v === "string" && v.trim().endsWith("%")) return false;
    return numeric(v) > 1;
  });
  reflections.forEach((r, i) => {
    const value = raw[i];
    if (canonical) {
      out[`${r}_Pct`] = `${Math.round(points[i])}%`;
    } else if (value !== undefined && value !== null && value !== "") {
      const explicit = typeof value === "string" && value.trim().endsWith("%");
      const n = numeric(explicit ? (value as string).trim().slice(0, -1) : value);
      const pct = n * (explicit || wholeUnits ? 1 : 100);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100)
        throw new Error("DesignID PDF contains an invalid saved percentage.");
      out[`${r}_Pct`] = `${Math.round(pct)}%`;
    } else if (completePoints && total > 0) {
      out[`${r}_Pct`] = `${Math.round(points[i] / total * 100)}%`;
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

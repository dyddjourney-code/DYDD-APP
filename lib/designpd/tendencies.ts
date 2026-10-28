/** Read saved source words only. Never recalculate tendencies from scores or
 * substitute the source workbook's example person when a learner field is absent. */
export function savedDesignPdTendencies(snapshot?: { scores: Record<string, unknown> }) {
  const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const root = snapshot?.scores ?? {};
  const sections = [object(root.summary), object(root.profileLanguage), object(root.scores), root, object(root.reportPayload)];
  return (["Plan", "Decide", "Do"] as const).flatMap(label => {
    for (const section of sections) {
      const value = section[`${label}_Tendency`] ?? section[`${label.toLowerCase()}_tendency`];
      if (typeof value === "string" && value.trim()) return [{label, value: value.trim()}];
    }
    const value = object(root.axisTendencies)[label.toLowerCase()];
    return typeof value === "string" && value.trim() ? [{label, value: value.trim()}] : [];
  });
}

import source from "@/content/designid-shadow-canonical.json";
/** Exact read-only Shadow sheet lookup by saved Primary; never a scoring operation. */
type CanonicalShadow = Omit<typeof source.reflections.Architect, "sourceRange"> & Record<string, string>;
export function canonicalDesignIdShadow(primary: string): CanonicalShadow | null {
  if (!Object.prototype.hasOwnProperty.call(source.reflections, primary)) return null;
  const { sourceRange: _sourceRange, ...fields } = source.reflections[primary as keyof typeof source.reflections];
  return fields;
}

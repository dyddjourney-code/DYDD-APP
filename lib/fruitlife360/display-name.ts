/** Known catalog/copied labels only; never apply to user answers, IDs or routes. */
export function fruitfulLifeDisplayLabel(value: string): string {
  return value.replace(/\bFruit\s*Life(?:\s*360)?\b/g, "Fruitful Life 360");
}

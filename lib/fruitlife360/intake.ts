export const fruitLifeFruits = [
  { key: "love", label: "Love" },
  { key: "joy", label: "Joy" },
  { key: "peace", label: "Peace" },
  { key: "patience", label: "Patience" },
  { key: "kindness", label: "Kindness" },
  { key: "goodness", label: "Goodness" },
  { key: "faithfulness", label: "Faithfulness" },
  { key: "gentleness", label: "Gentleness" },
  { key: "self_control", label: "Self-Control" },
] as const;

export const fruitLifeRatingPrompts = [
  {
    key: "visible",
    label: "Visible in ordinary life",
    selfText: "How visible is this fruit in your ordinary life right now?",
    observerText: "How visible is this fruit in this person right now?",
  },
  {
    key: "consistent",
    label: "Steady and consistent",
    selfText: "How steady does this fruit remain across different situations?",
    observerText: "How steady does this fruit remain across different situations?",
  },
  {
    key: "pressure",
    label: "Steady under pressure",
    selfText: "How steady does this fruit remain when you are under pressure?",
    observerText: "How steady does this fruit remain when this person is under pressure?",
  },
] as const;

export const fruitLifeRatingOptions = [
  { label: "Low", value: "1" },
  { label: "Developing", value: "2" },
  { label: "Sometimes visible", value: "3" },
  { label: "Often visible", value: "4" },
  { label: "Strongly visible", value: "5" },
] as const;

export type FruitLifeResponseType = "self" | "observer";

export function fruitRatingField(fruitKey: string, promptKey: string) {
  return `${fruitKey}_${promptKey}`;
}

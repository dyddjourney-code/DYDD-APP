export type GuideArticle = { title: string; paragraphs: string[] };
export type GuideStep = {
  id: string; title: string; subtitle: string; essentials: GuideArticle[];
  action: string; readings: GuideArticle[];
};
export type GuideQuestion = { question: string; followup: string; help: string };
export type GuideResource = { id: string; title: string; description: string; blocks: GuideArticle[]; readings: GuideArticle[] };
export type FieldGuideContent = {
  steps: GuideStep[]; questions: GuideQuestion[]; help: GuideArticle[];
  flow: { title: string; minutes: number; detail: string }[];
  resources: GuideResource[];
  sessionOne: { prepare: GuideArticle[]; readings: GuideArticle[]; followThrough: GuideArticle[] };
};

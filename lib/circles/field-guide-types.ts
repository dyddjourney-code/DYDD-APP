export type GuideArticle = { title: string; paragraphs: string[] };
export type GuideStep = {
  id: string; title: string; subtitle: string; essentials: GuideArticle[];
  action: string; readings: GuideArticle[];
};
export type GuideQuestion = { question: string; followup: string; help: string };
export type GuideResource = { id: string; title: string; description: string; blocks: GuideArticle[]; readings: GuideArticle[] };
export type FullSessionGuide = {
  anchor: GuideArticle; prepare: GuideArticle[]; readings: GuideArticle[];
  questions: GuideQuestion[]; help: GuideArticle[];
  flow: { title: string; minutes: number; detail: string }[];
  followThrough: GuideArticle[]; followThroughTitle: string; followThroughHint: string;
};
export type FieldGuideContent = {
  steps: GuideStep[]; questions: GuideQuestion[]; help: GuideArticle[];
  flow: { title: string; minutes: number; detail: string }[];
  resources: GuideResource[];
  sessionTwo: FullSessionGuide;
  sessions: Record<"expertise" | "story" | "desire" | "spiritual-gifts" | "niche-preparation" | "declarations-commissioning", FullSessionGuide>;
  sessionOne: { prepare: GuideArticle[]; readings: GuideArticle[]; followThrough: GuideArticle[] };
};

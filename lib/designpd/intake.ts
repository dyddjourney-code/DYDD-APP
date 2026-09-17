export type DesignPdAxis = "plan" | "decide" | "do";

export type DesignPdQuestion = {
  axis: DesignPdAxis;
  code: string;
  leftLabel: string;
  rightLabel: string;
  text: string;
};

export const designPdRatingField = (code: string) => `designpd_rating_${code}`;

export const designPdQuestionBank: DesignPdQuestion[] = [
  { axis: "plan", code: "PD01", leftLabel: "Practical next step", rightLabel: "Future possibility", text: "When I begin planning, I naturally notice what could become possible." },
  { axis: "plan", code: "PD02", leftLabel: "Future possibility", rightLabel: "Practical next step", text: "When plans get serious, I quickly look for the concrete next action." },
  { axis: "plan", code: "PD03", leftLabel: "Practical next step", rightLabel: "Future possibility", text: "I am energized by exploring several possible directions before choosing one." },
  { axis: "plan", code: "PD04", leftLabel: "Future possibility", rightLabel: "Practical next step", text: "I feel settled when a plan becomes specific, doable, and grounded." },
  { axis: "plan", code: "PD05", leftLabel: "Practical next step", rightLabel: "Future possibility", text: "I often see opportunities before the full path is clear." },
  { axis: "plan", code: "PD06", leftLabel: "Future possibility", rightLabel: "Practical next step", text: "I trust planning most when it turns into ordered steps." },
  { axis: "decide", code: "PD07", leftLabel: "Structured reasoning", rightLabel: "Relational awareness", text: "When making decisions, I quickly sense how people may be affected." },
  { axis: "decide", code: "PD08", leftLabel: "Relational awareness", rightLabel: "Structured reasoning", text: "When decisions are complex, I look for clear criteria and tradeoffs." },
  { axis: "decide", code: "PD09", leftLabel: "Structured reasoning", rightLabel: "Relational awareness", text: "I notice emotional tone before all the facts are organized." },
  { axis: "decide", code: "PD10", leftLabel: "Relational awareness", rightLabel: "Structured reasoning", text: "I prefer to test a decision against objective structure." },
  { axis: "decide", code: "PD11", leftLabel: "Structured reasoning", rightLabel: "Relational awareness", text: "A decision feels incomplete if the people impact is ignored." },
  { axis: "decide", code: "PD12", leftLabel: "Relational awareness", rightLabel: "Structured reasoning", text: "I feel confident when the logic of a decision holds together." },
  { axis: "do", code: "PD13", leftLabel: "Shared effort", rightLabel: "Independent ownership", text: "When it is time to act, I naturally take personal ownership." },
  { axis: "do", code: "PD14", leftLabel: "Independent ownership", rightLabel: "Shared effort", text: "I do better when action is shared with the right people." },
  { axis: "do", code: "PD15", leftLabel: "Shared effort", rightLabel: "Independent ownership", text: "I can move forward without much outside input once direction is clear." },
  { axis: "do", code: "PD16", leftLabel: "Independent ownership", rightLabel: "Shared effort", text: "Momentum grows for me when others are moving with me." },
  { axis: "do", code: "PD17", leftLabel: "Shared effort", rightLabel: "Independent ownership", text: "I tend to carry responsibility directly when something needs to get done." },
  { axis: "do", code: "PD18", leftLabel: "Independent ownership", rightLabel: "Shared effort", text: "I pause to involve others when the outcome will affect the group." },
];

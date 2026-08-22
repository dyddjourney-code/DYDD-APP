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

export const fruitLifeRatingOptions = [
  { label: "Rarely visible", value: "1" },
  { label: "Occasionally visible", value: "2" },
  { label: "Sometimes visible", value: "3" },
  { label: "Often visible", value: "4" },
  { label: "Consistently visible", value: "5" },
] as const;

export const fruitLifeQuestionBank = [
  {
    code: "LOVE_01",
    definition: "Sacrificial care that moves toward others for their good.",
    fruitKey: "love",
    observerText:
      "This person moves toward others with genuine care, even when it costs time, comfort, or convenience.",
    selfText:
      "I move toward others with genuine care, even when it costs me time, comfort, or convenience.",
  },
  {
    code: "LOVE_02",
    definition: "Sacrificial care that moves toward others for their good.",
    fruitKey: "love",
    observerText:
      "This person shows concern for people as whole persons, not just for what they can accomplish or provide.",
    selfText:
      "I show concern for people as whole persons, not just for what they can accomplish or provide.",
  },
  {
    code: "LOVE_03",
    definition: "Sacrificial care that moves toward others for their good.",
    fruitKey: "love",
    observerText:
      "This person chooses patience, service, and compassion when others are difficult, inconvenient, or different from them.",
    selfText:
      "I choose patience, service, and compassion when others are difficult, inconvenient, or different from me.",
  },
  {
    code: "JOY_01",
    definition: "Deep gladness rooted in God that can remain present beyond circumstances.",
    fruitKey: "joy",
    observerText:
      "This person carries a steady gladness that is not dependent only on circumstances going their way.",
    selfText:
      "I am able to carry a steady gladness that is not dependent only on circumstances going my way.",
  },
  {
    code: "JOY_02",
    definition: "Deep gladness rooted in God that can remain present beyond circumstances.",
    fruitKey: "joy",
    observerText:
      "This person helps create hope, gratitude, and life-giving perspective in the people around them.",
    selfText: "I help create hope, gratitude, and life-giving perspective in the people around me.",
  },
  {
    code: "JOY_03",
    definition: "Deep gladness rooted in God that can remain present beyond circumstances.",
    fruitKey: "joy",
    observerText:
      "This person can celebrate what God is doing in others without comparison, resentment, or competition.",
    selfText:
      "I can celebrate what God is doing in others without comparison, resentment, or competition.",
  },
  {
    code: "PEACE_01",
    definition: "Settled trust in God that brings steadiness, reconciliation, and calm.",
    fruitKey: "peace",
    observerText:
      "This person remains grounded and steady when circumstances, people, or outcomes feel uncertain.",
    selfText: "I remain grounded and steady when circumstances, people, or outcomes feel uncertain.",
  },
  {
    code: "PEACE_02",
    definition: "Settled trust in God that brings steadiness, reconciliation, and calm.",
    fruitKey: "peace",
    observerText: "This person helps reduce anxiety, conflict, or confusion rather than adding to it.",
    selfText: "I help reduce anxiety, conflict, or confusion rather than adding to it.",
  },
  {
    code: "PEACE_03",
    definition: "Settled trust in God that brings steadiness, reconciliation, and calm.",
    fruitKey: "peace",
    observerText: "This person pursues reconciliation and wholeness when relationships become strained.",
    selfText: "I pursue reconciliation and wholeness when relationships become strained.",
  },
  {
    code: "PATIENCE_01",
    definition: "Steadfast endurance with people, process, weakness, and delay.",
    fruitKey: "patience",
    observerText:
      "This person stays faithful and composed when progress is slow or outcomes take longer than expected.",
    selfText:
      "I can stay faithful and composed when progress is slow or outcomes take longer than expected.",
  },
  {
    code: "PATIENCE_02",
    definition: "Steadfast endurance with people, process, weakness, and delay.",
    fruitKey: "patience",
    observerText:
      "This person gives people room to grow without rushing, shaming, or giving up on them too quickly.",
    selfText: "I give people room to grow without rushing, shaming, or giving up on them too quickly.",
  },
  {
    code: "PATIENCE_03",
    definition: "Steadfast endurance with people, process, weakness, and delay.",
    fruitKey: "patience",
    observerText: "This person responds to irritation, delay, or inconvenience with restraint and perspective.",
    selfText: "I respond to irritation, delay, or inconvenience with restraint and perspective.",
  },
  {
    code: "KINDNESS_01",
    definition: "Tender, practical goodness expressed through words, presence, and action.",
    fruitKey: "kindness",
    observerText: "This person notices practical ways to encourage, help, or bless people around them.",
    selfText: "I notice practical ways to encourage, help, or bless people around me.",
  },
  {
    code: "KINDNESS_02",
    definition: "Tender, practical goodness expressed through words, presence, and action.",
    fruitKey: "kindness",
    observerText: "This person's words tend to bring dignity, encouragement, and gentleness to others.",
    selfText: "My words tend to bring dignity, encouragement, and gentleness to others.",
  },
  {
    code: "KINDNESS_03",
    definition: "Tender, practical goodness expressed through words, presence, and action.",
    fruitKey: "kindness",
    observerText:
      "This person is approachable and safe for people who are hurting, discouraged, or uncertain.",
    selfText: "I am approachable and safe for people who are hurting, discouraged, or uncertain.",
  },
  {
    code: "GOODNESS_01",
    definition: "Moral integrity and active commitment to what is right, true, and life-giving.",
    fruitKey: "goodness",
    observerText:
      "This person chooses what is right and life-giving even when it is inconvenient or unseen.",
    selfText: "I choose what is right and life-giving even when it is inconvenient or unseen.",
  },
  {
    code: "GOODNESS_02",
    definition: "Moral integrity and active commitment to what is right, true, and life-giving.",
    fruitKey: "goodness",
    observerText: "This person's actions are generally aligned with their stated values and convictions.",
    selfText: "My actions are generally aligned with my stated values and convictions.",
  },
  {
    code: "GOODNESS_03",
    definition: "Moral integrity and active commitment to what is right, true, and life-giving.",
    fruitKey: "goodness",
    observerText:
      "This person uses influence to protect, serve, and build up others rather than simply benefit themselves.",
    selfText:
      "I use my influence to protect, serve, and build up others rather than simply benefit myself.",
  },
  {
    code: "FAITHFULNESS_01",
    definition: "Reliability, loyalty, and steady trustworthiness over time.",
    fruitKey: "faithfulness",
    observerText: "This person follows through on commitments and can be counted on over time.",
    selfText: "I follow through on commitments and can be counted on over time.",
  },
  {
    code: "FAITHFULNESS_02",
    definition: "Reliability, loyalty, and steady trustworthiness over time.",
    fruitKey: "faithfulness",
    observerText: "This person remains loyal and steady in relationships, responsibilities, and convictions.",
    selfText: "I remain loyal and steady in relationships, responsibilities, and convictions.",
  },
  {
    code: "FAITHFULNESS_03",
    definition: "Reliability, loyalty, and steady trustworthiness over time.",
    fruitKey: "faithfulness",
    observerText:
      "This person stays faithful to what God has entrusted to them, even when recognition is limited.",
    selfText: "I stay faithful to what God has entrusted to me, even when recognition is limited.",
  },
  {
    code: "GENTLENESS_01",
    definition: "Strength under control, expressed with humility, tenderness, and care.",
    fruitKey: "gentleness",
    observerText: "This person can bring truth, correction, or strength without harshness or intimidation.",
    selfText: "I can bring truth, correction, or strength without harshness or intimidation.",
  },
  {
    code: "GENTLENESS_02",
    definition: "Strength under control, expressed with humility, tenderness, and care.",
    fruitKey: "gentleness",
    observerText:
      "This person makes it easier for others to be honest, vulnerable, or imperfect around them.",
    selfText: "I make it easier for others to be honest, vulnerable, or imperfect around me.",
  },
  {
    code: "GENTLENESS_03",
    definition: "Strength under control, expressed with humility, tenderness, and care.",
    fruitKey: "gentleness",
    observerText:
      "This person uses influence with humility and care rather than pressure, control, or force.",
    selfText: "I use influence with humility and care rather than pressure, control, or force.",
  },
  {
    code: "SELFCONTROL_01",
    definition: "Spirit-formed discipline that governs desires, reactions, words, and choices.",
    fruitKey: "self_control",
    observerText:
      "This person responds thoughtfully rather than being ruled by impulse, emotion, or pressure.",
    selfText: "I respond thoughtfully rather than being ruled by impulse, emotion, or pressure.",
  },
  {
    code: "SELFCONTROL_02",
    definition: "Spirit-formed discipline that governs desires, reactions, words, and choices.",
    fruitKey: "self_control",
    observerText: "This person demonstrates discipline in speech, habits, decisions, and use of time.",
    selfText: "I demonstrate discipline in my speech, habits, decisions, and use of time.",
  },
  {
    code: "SELFCONTROL_03",
    definition: "Spirit-formed discipline that governs desires, reactions, words, and choices.",
    fruitKey: "self_control",
    observerText:
      "This person can delay immediate desires for what is wiser, healthier, or more faithful.",
    selfText: "I can delay immediate desires for what is wiser, healthier, or more faithful.",
  },
] as const;

export type FruitLifeResponseType = "self" | "observer";

export function fruitRatingField(questionCode: string) {
  return `rating_${questionCode.toLowerCase()}`;
}

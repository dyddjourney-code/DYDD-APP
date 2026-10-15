export const fruitLifeFruits = [
  {
    colorClass: "love",
    definition: "Christlike regard that seeks another person's good with patience, truth, and sacrifice.",
    key: "love",
    label: "Love",
    pressureCode: "Love_Pressure",
  },
  {
    colorClass: "joy",
    definition: "Resilient gladness rooted in God's presence, goodness, and promises.",
    key: "joy",
    label: "Joy",
    pressureCode: "Joy_Pressure",
  },
  {
    colorClass: "peace",
    definition: "Spirit-formed steadiness that rests in God and makes room for wholeness with others.",
    key: "peace",
    label: "Peace",
    pressureCode: "Peace_Pressure",
  },
  {
    colorClass: "patience",
    definition: "Long obedience and gracious endurance when people, process, or timing are slow.",
    key: "patience",
    label: "Patience",
    pressureCode: "Patience_Pressure",
  },
  {
    colorClass: "kindness",
    definition: "Tender strength that treats people with dignity, mercy, and practical care.",
    key: "kindness",
    label: "Kindness",
    pressureCode: "Kindness_Pressure",
  },
  {
    colorClass: "goodness",
    definition: "Moral clarity and active commitment to what reflects God's character.",
    key: "goodness",
    label: "Goodness",
    pressureCode: "Goodness_Pressure",
  },
  {
    colorClass: "faithfulness",
    definition: "Reliable devotion to God, people, and entrusted responsibilities over time.",
    key: "faithfulness",
    label: "Faithfulness",
    pressureCode: "Faithfulness_Pressure",
  },
  {
    colorClass: "gentleness",
    definition: "Humble strength that protects dignity while still telling the truth.",
    key: "gentleness",
    label: "Gentleness",
    pressureCode: "Gentleness_Pressure",
  },
  {
    colorClass: "self_control",
    definition: "Spirit-led stewardship of desires, habits, attention, and responses.",
    key: "self_control",
    label: "Self-Control",
    pressureCode: "SelfControl_Pressure",
  },
] as const;

export const fruitLifeRatingOptions = [
  { label: "Rarely visible", value: "1" },
  { label: "Occasionally visible", value: "2" },
  { label: "Somewhat visible", value: "3" },
  { label: "Often visible", value: "4" },
  { label: "Consistently visible", value: "5" },
] as const;

export const fruitLifeQuestionBank = [
  {
    code: "LOVE_01",
    fruitKey: "love",
    observerText:
      "This person moves toward others with genuine care, even when it costs time, comfort, or convenience.",
    selfText:
      "I move toward others with genuine care, even when it costs me time, comfort, or convenience.",
  },
  {
    code: "LOVE_02",
    fruitKey: "love",
    observerText: "This person shows concern for people as whole persons, not just for what they can accomplish or provide.",
    selfText: "I show concern for people as whole persons, not just for what they can accomplish or provide.",
  },
  {
    code: "LOVE_03",
    fruitKey: "love",
    observerText: "This person chooses patience, service, and compassion when others are difficult, inconvenient, or different from them.",
    selfText: "I choose patience, service, and compassion when others are difficult, inconvenient, or different from me.",
  },
  {
    code: "JOY_01",
    fruitKey: "joy",
    observerText:
      "This person carries a steady gladness that is not dependent only on circumstances going their way.",
    selfText: "I am able to carry a steady gladness that is not dependent only on circumstances going my way.",
  },
  {
    code: "JOY_02",
    fruitKey: "joy",
    observerText: "This person helps create hope, gratitude, and life-giving perspective in the people around them.",
    selfText: "I help create hope, gratitude, and life-giving perspective in the people around me.",
  },
  {
    code: "JOY_03",
    fruitKey: "joy",
    observerText: "This person can celebrate what God is doing in others without comparison, resentment, or competition.",
    selfText: "I can celebrate what God is doing in others without comparison, resentment, or competition.",
  },
  {
    code: "PEACE_01",
    fruitKey: "peace",
    observerText: "This person remains grounded and steady when circumstances, people, or outcomes feel uncertain.",
    selfText: "I remain grounded and steady when circumstances, people, or outcomes feel uncertain.",
  },
  {
    code: "PEACE_02",
    fruitKey: "peace",
    observerText: "This person helps reduce anxiety, conflict, or confusion rather than adding to it.",
    selfText: "I help reduce anxiety, conflict, or confusion rather than adding to it.",
  },
  {
    code: "PEACE_03",
    fruitKey: "peace",
    observerText:
      "This person pursues reconciliation and wholeness when relationships become strained.",
    selfText: "I pursue reconciliation and wholeness when relationships become strained.",
  },
  {
    code: "PATIENCE_01",
    fruitKey: "patience",
    observerText: "This person stays faithful and composed when progress is slow or outcomes take longer than expected.",
    selfText: "I can stay faithful and composed when progress is slow or outcomes take longer than expected.",
  },
  {
    code: "PATIENCE_02",
    fruitKey: "patience",
    observerText: "This person gives people room to grow without rushing, shaming, or giving up on them too quickly.",
    selfText: "I give people room to grow without rushing, shaming, or giving up on them too quickly.",
  },
  {
    code: "PATIENCE_03",
    fruitKey: "patience",
    observerText: "This person responds to irritation, delay, or inconvenience with restraint and perspective.",
    selfText: "I respond to irritation, delay, or inconvenience with restraint and perspective.",
  },
  {
    code: "KINDNESS_01",
    fruitKey: "kindness",
    observerText: "This person notices practical ways to encourage, help, or bless people around them.",
    selfText: "I notice practical ways to encourage, help, or bless people around me.",
  },
  {
    code: "KINDNESS_02",
    fruitKey: "kindness",
    observerText: "This person's words tend to bring dignity, encouragement, and gentleness to others.",
    selfText: "My words tend to bring dignity, encouragement, and gentleness to others.",
  },
  {
    code: "KINDNESS_03",
    fruitKey: "kindness",
    observerText: "This person is approachable and safe for people who are hurting, discouraged, or uncertain.",
    selfText: "I am approachable and safe for people who are hurting, discouraged, or uncertain.",
  },
  {
    code: "GOODNESS_01",
    fruitKey: "goodness",
    observerText: "This person chooses what is right and life-giving even when it is inconvenient or unseen.",
    selfText: "I choose what is right and life-giving even when it is inconvenient or unseen.",
  },
  {
    code: "GOODNESS_02",
    fruitKey: "goodness",
    observerText: "This person's actions are generally aligned with their stated values and convictions.",
    selfText: "My actions are generally aligned with my stated values and convictions.",
  },
  {
    code: "GOODNESS_03",
    fruitKey: "goodness",
    observerText: "This person uses influence to protect, serve, and build up others rather than simply benefit themselves.",
    selfText: "I use my influence to protect, serve, and build up others rather than simply benefit myself.",
  },
  {
    code: "FAITHFULNESS_01",
    fruitKey: "faithfulness",
    observerText: "This person follows through on commitments and can be counted on over time.",
    selfText: "I follow through on commitments and can be counted on over time.",
  },
  {
    code: "FAITHFULNESS_02",
    fruitKey: "faithfulness",
    observerText: "This person remains loyal and steady in relationships, responsibilities, and convictions.",
    selfText: "I remain loyal and steady in relationships, responsibilities, and convictions.",
  },
  {
    code: "FAITHFULNESS_03",
    fruitKey: "faithfulness",
    observerText: "This person stays faithful to what God has entrusted to them, even when recognition is limited.",
    selfText: "I stay faithful to what God has entrusted to me, even when recognition is limited.",
  },
  {
    code: "GENTLENESS_01",
    fruitKey: "gentleness",
    observerText: "This person can bring truth, correction, or strength without harshness or intimidation.",
    selfText: "I can bring truth, correction, or strength without harshness or intimidation.",
  },
  {
    code: "GENTLENESS_02",
    fruitKey: "gentleness",
    observerText: "This person makes it easier for others to be honest, vulnerable, or imperfect around them.",
    selfText: "I make it easier for others to be honest, vulnerable, or imperfect around me.",
  },
  {
    code: "GENTLENESS_03",
    fruitKey: "gentleness",
    observerText:
      "This person uses influence with humility and care rather than pressure, control, or force.",
    selfText: "I use influence with humility and care rather than pressure, control, or force.",
  },
  {
    code: "SELFCONTROL_01",
    fruitKey: "self_control",
    observerText: "This person responds thoughtfully rather than being ruled by impulse, emotion, or pressure.",
    selfText: "I respond thoughtfully rather than being ruled by impulse, emotion, or pressure.",
  },
  {
    code: "SELFCONTROL_02",
    fruitKey: "self_control",
    observerText: "This person demonstrates discipline in speech, habits, decisions, and use of time.",
    selfText: "I demonstrate discipline in my speech, habits, decisions, and use of time.",
  },
  {
    code: "SELFCONTROL_03",
    fruitKey: "self_control",
    observerText:
      "This person can delay immediate desires for what is wiser, healthier, or more faithful.",
    selfText: "I can delay immediate desires for what is wiser, healthier, or more faithful.",
  },
] as const;

export const fruitLifePressureQuestions = [
  {
    code: "Love_Pressure",
    fruitKey: "love",
    observerText: "When someone is difficult to love, this person still moves toward their good.",
    selfText: "When someone is difficult to love, I still move toward their good.",
  },
  {
    code: "Joy_Pressure",
    fruitKey: "joy",
    observerText: "When life is disappointing or heavy, joy remains visible in this person.",
    selfText: "When life is disappointing or heavy, joy remains visible in me.",
  },
  {
    code: "Peace_Pressure",
    fruitKey: "peace",
    observerText: "When outcomes are uncertain, this person remains settled and responsive to God.",
    selfText: "When outcomes are uncertain, I can remain settled and responsive to God.",
  },
  {
    code: "Patience_Pressure",
    fruitKey: "patience",
    observerText: "When people or processes are slow, this person gives them room to grow without forcing control.",
    selfText: "When people or processes are slow, I give them room to grow without forcing control.",
  },
  {
    code: "Kindness_Pressure",
    fruitKey: "kindness",
    observerText: "When this person is busy or inconvenienced, they still notice practical ways to care and act on them.",
    selfText: "When I am busy or inconvenienced, I still notice practical ways to care and act on them.",
  },
  {
    code: "Goodness_Pressure",
    fruitKey: "goodness",
    observerText: "When doing what is right is costly, this person still chooses what is honorable and life-giving.",
    selfText: "When doing what is right is costly, I still choose what is honorable and life-giving.",
  },
  {
    code: "Faithfulness_Pressure",
    fruitKey: "faithfulness",
    observerText: "When commitments become demanding, people can still count on this person to follow through.",
    selfText: "When commitments become demanding, people can still count on me to follow through.",
  },
  {
    code: "Gentleness_Pressure",
    fruitKey: "gentleness",
    observerText:
      "When tension or correction is needed, this person can bring strength without harshness.",
    selfText: "When tension or correction is needed, I can bring strength without harshness.",
  },
  {
    code: "SelfControl_Pressure",
    fruitKey: "self_control",
    observerText:
      "When this person is tired, tempted, or emotionally stirred, their desires and reactions do not rule their decisions.",
    selfText: "When I am tired, tempted, or emotionally stirred, my desires and reactions do not rule my decisions.",
  },
] as const;

export type FruitLifeResponseType = "self" | "observer";

export function fruitRatingField(questionCode: string) {
  return `rating_${questionCode.toLowerCase()}`;
}

export const fruitLifeInstrumentVersion = "fruitlife-source-36items-2026-10-15";

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
      "I move toward others with genuine care, even when it costs time, comfort, or convenience.",
  },
  {
    code: "LOVE_02",
    fruitKey: "love",
    observerText: "This person seeks the good of others with both truth and compassion.",
    selfText: "I seek the good of others with both truth and compassion.",
  },
  {
    code: "LOVE_03",
    fruitKey: "love",
    observerText: "People close to this person experience them as caring and present.",
    selfText: "People close to me experience me as caring and present.",
  },
  {
    code: "JOY_01",
    fruitKey: "joy",
    observerText:
      "This person's life shows resilient gladness rooted in God, not only in circumstances.",
    selfText: "My life shows resilient gladness rooted in God, not only in circumstances.",
  },
  {
    code: "JOY_02",
    fruitKey: "joy",
    observerText: "This person can notice grace and goodness even in difficult seasons.",
    selfText: "I can notice grace and goodness even in difficult seasons.",
  },
  {
    code: "JOY_03",
    fruitKey: "joy",
    observerText: "Others experience hope and life through this person's presence.",
    selfText: "Others experience hope and life through my presence.",
  },
  {
    code: "PEACE_01",
    fruitKey: "peace",
    observerText: "This person remains settled and prayerful when outcomes are uncertain.",
    selfText: "I remain settled and prayerful when outcomes are uncertain.",
  },
  {
    code: "PEACE_02",
    fruitKey: "peace",
    observerText: "This person helps lower anxiety and make room for healthy conversation.",
    selfText: "I help lower anxiety and make room for healthy conversation.",
  },
  {
    code: "PEACE_03",
    fruitKey: "peace",
    observerText:
      "This person pursues wholeness and reconciliation rather than unnecessary conflict.",
    selfText: "I pursue wholeness and reconciliation rather than unnecessary conflict.",
  },
  {
    code: "PATIENCE_01",
    fruitKey: "patience",
    observerText: "This person gives people and processes room to grow without forcing control.",
    selfText: "I give people and processes room to grow without forcing control.",
  },
  {
    code: "PATIENCE_02",
    fruitKey: "patience",
    observerText: "This person can wait, listen, and respond without rushing to frustration.",
    selfText: "I can wait, listen, and respond without rushing to frustration.",
  },
  {
    code: "PATIENCE_03",
    fruitKey: "patience",
    observerText: "Others experience steadiness from this person when timing is slow.",
    selfText: "Others experience steadiness from me when timing is slow.",
  },
  {
    code: "KINDNESS_01",
    fruitKey: "kindness",
    observerText: "This person notices practical ways to care for people and acts on them.",
    selfText: "I notice practical ways to care for people and act on them.",
  },
  {
    code: "KINDNESS_02",
    fruitKey: "kindness",
    observerText: "This person's words and actions communicate dignity, mercy, and warmth.",
    selfText: "My words and actions communicate dignity, mercy, and warmth.",
  },
  {
    code: "KINDNESS_03",
    fruitKey: "kindness",
    observerText: "Others experience this person as approachable and considerate.",
    selfText: "Others experience me as approachable and considerate.",
  },
  {
    code: "GOODNESS_01",
    fruitKey: "goodness",
    observerText: "This person chooses what is right even when it costs them.",
    selfText: "I choose what is right even when it costs me.",
  },
  {
    code: "GOODNESS_02",
    fruitKey: "goodness",
    observerText: "This person acts with integrity when no one is watching.",
    selfText: "I act with integrity when no one is watching.",
  },
  {
    code: "GOODNESS_03",
    fruitKey: "goodness",
    observerText: "Others experience this person's decisions as honorable and life-giving.",
    selfText: "Others experience my decisions as honorable and life-giving.",
  },
  {
    code: "FAITHFULNESS_01",
    fruitKey: "faithfulness",
    observerText: "People can count on this person to follow through over time.",
    selfText: "People can count on me to follow through over time.",
  },
  {
    code: "FAITHFULNESS_02",
    fruitKey: "faithfulness",
    observerText: "This person remains steady with commitments God has entrusted to them.",
    selfText: "I remain steady with commitments God has entrusted to me.",
  },
  {
    code: "FAITHFULNESS_03",
    fruitKey: "faithfulness",
    observerText: "Others experience this person as reliable and trustworthy.",
    selfText: "Others experience me as reliable and trustworthy.",
  },
  {
    code: "GENTLENESS_01",
    fruitKey: "gentleness",
    observerText: "This person brings strength without harshness.",
    selfText: "I bring strength without harshness.",
  },
  {
    code: "GENTLENESS_02",
    fruitKey: "gentleness",
    observerText: "This person can tell the truth while protecting another person's dignity.",
    selfText: "I can tell the truth while protecting another person's dignity.",
  },
  {
    code: "GENTLENESS_03",
    fruitKey: "gentleness",
    observerText:
      "Others experience this person's correction, leadership, or feedback as humble and restorative.",
    selfText: "Others experience my correction, leadership, or feedback as humble and restorative.",
  },
  {
    code: "SELFCONTROL_01",
    fruitKey: "self_control",
    observerText: "This person's desires and reactions do not regularly rule their decisions.",
    selfText: "My desires and reactions do not regularly rule my decisions.",
  },
  {
    code: "SELFCONTROL_02",
    fruitKey: "self_control",
    observerText: "This person can pause, choose wisely, and respond with restraint.",
    selfText: "I can pause, choose wisely, and respond with restraint.",
  },
  {
    code: "SELFCONTROL_03",
    fruitKey: "self_control",
    observerText:
      "Others experience this person as disciplined and measured under normal circumstances.",
    selfText: "Others experience me as disciplined and measured under normal circumstances.",
  },
] as const;

export const fruitLifePressureQuestions = [
  {
    code: "Love_Pressure",
    fruitKey: "love",
    observerText: "When someone is difficult to love, love remains visible in this person.",
    selfText: "When someone is difficult to love, love remains visible in me.",
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
    observerText: "When outcomes are uncertain, peace remains visible in this person.",
    selfText: "When outcomes are uncertain, peace remains visible in me.",
  },
  {
    code: "Patience_Pressure",
    fruitKey: "patience",
    observerText: "When people or processes are slow, patience remains visible in this person.",
    selfText: "When people or processes are slow, patience remains visible in me.",
  },
  {
    code: "Kindness_Pressure",
    fruitKey: "kindness",
    observerText: "When this person is busy or inconvenienced, kindness remains visible in this person.",
    selfText: "When I am busy or inconvenienced, kindness remains visible in me.",
  },
  {
    code: "Goodness_Pressure",
    fruitKey: "goodness",
    observerText: "When doing right is costly, goodness remains visible in this person.",
    selfText: "When doing right is costly, goodness remains visible in me.",
  },
  {
    code: "Faithfulness_Pressure",
    fruitKey: "faithfulness",
    observerText: "When commitments become demanding, faithfulness remains visible in this person.",
    selfText: "When commitments become demanding, faithfulness remains visible in me.",
  },
  {
    code: "Gentleness_Pressure",
    fruitKey: "gentleness",
    observerText:
      "When tension or correction is needed, gentleness remains visible in this person.",
    selfText: "When tension or correction is needed, gentleness remains visible in me.",
  },
  {
    code: "SelfControl_Pressure",
    fruitKey: "self_control",
    observerText:
      "When this person is tired, tempted, or emotionally stirred, self-control remains visible in this person.",
    selfText: "When I am tired, tempted, or emotionally stirred, self-control remains visible in me.",
  },
] as const;

export type FruitLifeResponseType = "self" | "observer";

export function fruitRatingField(questionCode: string) {
  return `rating_${questionCode.toLowerCase()}`;
}

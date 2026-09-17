import type { DesignIdResult } from "./engine";
import type { DesignIdReflection } from "./intake";

const reflectionContent: Record<
  DesignIdReflection,
  {
    core: string;
    scripture: string;
    summary: string;
    text: string;
  }
> = {
  Architect: {
    core: "Vision, initiation, direction, and movement.",
    scripture: "Genesis 1:1; Nehemiah 2:17-18",
    summary:
      "Architects see what could be built, repaired, or moved forward. They often bring courage, direction, and catalytic energy when something needs to begin.",
    text:
      "The Architect reflects the creative and initiating nature of God. Architects often see possibility before there is structure, respond when direction is needed, and help people move from idea to action.",
  },
  Artisan: {
    core: "Form, craft, pattern, beauty, and refinement.",
    scripture: "Exodus 31:1-5; Psalm 139:14",
    summary:
      "Artisans refine what is forming. They notice patterns, improve expression, and bring clarity, beauty, and usefulness to ideas and work.",
    text:
      "The Artisan reflects the God who forms with wisdom and beauty. Artisans often notice what is unclear, unfinished, or poorly shaped and help bring it into meaningful form.",
  },
  Shepherd: {
    core: "Care, presence, protection, encouragement, and restoration.",
    scripture: "Psalm 23; John 10:11",
    summary:
      "Shepherds notice people. They sense needs, create belonging, offer encouragement, and help restore courage where people feel unseen or strained.",
    text:
      "The Shepherd reflects the compassionate and restoring heart of God. Shepherds often notice emotional and relational realities quickly and respond with care, presence, and faithful attention.",
  },
  Steward: {
    core: "Faithfulness, order, responsibility, trust, and endurance.",
    scripture: "1 Peter 4:10; Matthew 25:21",
    summary:
      "Stewards protect what matters. They bring steadiness, reliability, structure, and follow-through so good things can endure.",
    text:
      "The Steward reflects the faithfulness and sustaining nature of God. Stewards often create order, guard trust, carry responsibility, and help people and systems remain steady over time.",
  },
};

const pairContent: Record<
  string,
  {
    growth: string;
    name: string;
    reflectionOfGod: string;
    shadow: string;
    shadowOverview: string;
    strength: string;
    summary: string;
  }
> = {
  "Architect|Artisan": {
    growth: "Anchor possibility in patient craft so vision becomes excellent, useful, and sustainable.",
    name: "Visionary",
    reflectionOfGod: "Creator + Designer",
    shadow: "Perfectionism or restless discontent",
    shadowOverview:
      "The Visionary shadow can appear when possibility turns into dissatisfaction, or when refinement delays faithful action.",
    strength: "Creative faith that sees and shapes what is not yet visible.",
    summary:
      "The Visionary brings future imagination together with form and design. This pattern can help people see what could be and then shape it into something meaningful.",
  },
  "Artisan|Architect": {
    growth: "Let beauty and clarity serve movement, not delay it.",
    name: "Visionary",
    reflectionOfGod: "Creator + Designer",
    shadow: "Perfectionism or restless discontent",
    shadowOverview:
      "The Visionary shadow can appear when refinement becomes endless or when the next better idea keeps present obedience from taking form.",
    strength: "Creative faith expressed through formed clarity.",
    summary:
      "The Visionary brings design and possibility together. This pattern often sees both what could exist and how it might be shaped with excellence.",
  },
  "Architect|Shepherd": {
    growth: "Lead with compassion while resisting the pressure to rescue every need personally.",
    name: "Innovator",
    reflectionOfGod: "Creator + Comforter",
    shadow: "Emotional exhaustion or rescuing instead of leading",
    shadowOverview:
      "The Innovator shadow can appear when strong initiative combines with deep concern and begins carrying what belongs to God or to others.",
    strength: "Empathetic initiative.",
    summary:
      "The Innovator brings movement and compassion together. This pattern often sees what needs to change and cares deeply about how that change affects people.",
  },
  "Shepherd|Architect": {
    growth: "Let care become courageous movement without turning every burden into your assignment.",
    name: "Innovator",
    reflectionOfGod: "Creator + Comforter",
    shadow: "Emotional exhaustion or rescuing instead of leading",
    shadowOverview:
      "The Innovator shadow can appear when compassion begins to carry too much, or when urgency replaces discernment.",
    strength: "Empathy that moves toward meaningful change.",
    summary:
      "The Innovator brings compassion and initiative together. This pattern often senses what people need and moves toward action when restoration requires change.",
  },
  "Architect|Steward": {
    growth: "Let conviction stay submitted to trust, patience, and shared ownership.",
    name: "Overseer",
    reflectionOfGod: "Sustainer + Creator",
    shadow: "Control or fear of failure",
    shadowOverview:
      "The Overseer shadow can appear when responsibility and vision turn into overcontrol, impatience, or fear of what might fall apart.",
    strength: "Accountability and conviction.",
    summary:
      "The Overseer brings direction and responsibility together. This pattern often sees what must be built and feels the weight of stewarding it well.",
  },
  "Steward|Architect": {
    growth: "Let faithfulness make room for Spirit-led initiative and timely movement.",
    name: "Overseer",
    reflectionOfGod: "Sustainer + Creator",
    shadow: "Control or fear of failure",
    shadowOverview:
      "The Overseer shadow can appear when keeping things safe becomes more important than obeying the next faithful step.",
    strength: "Faithful conviction that protects what is being built.",
    summary:
      "The Overseer brings responsibility and direction together. This pattern often protects what matters while helping good work move forward with clarity.",
  },
  "Artisan|Shepherd": {
    growth: "Let empathy inform expression without causing you to lose your voice.",
    name: "Interpreter",
    reflectionOfGod: "Designer + Healer",
    shadow: "Overidentifying with others' feelings or losing creative voice in caretaking",
    shadowOverview:
      "The Interpreter shadow can appear when sensitivity absorbs too much or when care makes it hard to speak clear truth.",
    strength: "Wisdom tempered by empathy.",
    summary:
      "The Interpreter brings clarity and care together. This pattern often translates complexity into language, beauty, or expression that helps people feel understood.",
  },
  "Shepherd|Artisan": {
    growth: "Let compassion stay clear enough to speak truth gently and faithfully.",
    name: "Interpreter",
    reflectionOfGod: "Designer + Healer",
    shadow: "Overidentifying with others' feelings or losing creative voice in caretaking",
    shadowOverview:
      "The Interpreter shadow can appear when the desire to comfort others blurs the truth that needs to be formed and spoken.",
    strength: "Empathy expressed with wisdom and clarity.",
    summary:
      "The Interpreter brings care and clarity together. This pattern often senses what is happening beneath the surface and helps people understand it with gentleness.",
  },
  "Artisan|Steward": {
    growth: "Let excellence serve love rather than becoming pressure or proof.",
    name: "Craftsman",
    reflectionOfGod: "Designer + Sustainer",
    shadow: "Legalism or overcontrol",
    shadowOverview:
      "The Craftsman shadow can appear when quality becomes demand, or when careful work starts measuring worth.",
    strength: "Excellence with endurance.",
    summary:
      "The Craftsman brings refinement and faithfulness together. This pattern often forms excellent work that can be trusted over time.",
  },
  "Steward|Artisan": {
    growth: "Let dependability preserve beauty without turning standards into strain.",
    name: "Craftsman",
    reflectionOfGod: "Designer + Sustainer",
    shadow: "Legalism or overcontrol",
    shadowOverview:
      "The Craftsman shadow can appear when stewardship becomes rigid or when excellence leaves little room for grace.",
    strength: "Faithful excellence.",
    summary:
      "The Craftsman brings faithfulness and refinement together. This pattern often protects quality and brings careful form to what has been entrusted.",
  },
  "Shepherd|Steward": {
    growth: "Let love remain faithful without carrying more than grace has assigned.",
    name: "Guardian",
    reflectionOfGod: "Healer + Sustainer",
    shadow: "Over-responsibility or exhaustion from carrying others' burdens too long",
    shadowOverview:
      "The Guardian shadow can appear when dependable care becomes exhaustion, resentment, or quiet over-responsibility.",
    strength: "Reliability rooted in love.",
    summary:
      "The Guardian brings care and steadiness together. This pattern often protects people and helps them feel safe through faithful presence.",
  },
  "Steward|Shepherd": {
    growth: "Let responsibility be carried with tenderness, boundaries, and trust.",
    name: "Guardian",
    reflectionOfGod: "Healer + Sustainer",
    shadow: "Over-responsibility or exhaustion from carrying others' burdens too long",
    shadowOverview:
      "The Guardian shadow can appear when steadiness becomes burden-bearing without rest, help, or boundaries.",
    strength: "Steady love that protects and restores.",
    summary:
      "The Guardian brings steadiness and care together. This pattern often builds trust through faithful presence, protection, and patient support.",
  },
};

const defaultPair = pairContent["Architect|Artisan"];

export function buildDesignIdReportPayload({
  participantEmail,
  participantName,
  result,
}: {
  participantEmail: string;
  participantName: string;
  result: DesignIdResult;
}) {
  const pair = pairContent[result.pairKey] ?? defaultPair;
  const primary = reflectionContent[result.primary];
  const secondary = reflectionContent[result.secondary];
  const safeDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/New_York",
  }).format(new Date());
  const scorePayload = {
    Architect_Pts: result.scores.Architect,
    Artisan_Pts: result.scores.Artisan,
    Shepherd_Pts: result.scores.Shepherd,
    Steward_Pts: result.scores.Steward,
    Total_Pts: result.totalPoints,
    Architect_Pct: Math.round((result.scores.Architect / 60) * 100),
    Artisan_Pct: Math.round((result.scores.Artisan / 60) * 100),
    Shepherd_Pct: Math.round((result.scores.Shepherd / 60) * 100),
    Steward_Pct: Math.round((result.scores.Steward / 60) * 100),
    Band_Architect: result.bandByReflection.Architect,
    Band_Artisan: result.bandByReflection.Artisan,
    Band_Shepherd: result.bandByReflection.Shepherd,
    Band_Steward: result.bandByReflection.Steward,
  };

  return {
    ...scorePayload,
    Approach_to_Learning:
      "Your DesignID pattern can help you notice how you tend to receive, organize, and apply learning. Use the report as a starting point for reflection, not a fixed label.",
    Contribution_Scripture: "1 Corinthians 12:4-7",
    Contribution_To_Body:
      "Your reflections are meant to become love in action. Notice where your design strengthens people, clarifies work, brings care, creates movement, or protects what matters.",
    Email: participantEmail,
    Integrative_Expression: pair.summary,
    Integrative_Growth: pair.growth,
    Integrative_Reflection: pair.name,
    Integrative_Scripture: "Ephesians 2:10",
    Integrative_Summary: `${pair.summary} ${result.tieSummary.note}`,
    Learning_Scripture: "Proverbs 4:7",
    Name: participantName,
    PairKey: result.pairKey,
    Potential_Shadow: pair.shadow,
    Primary: result.primary,
    Primary_Core: primary.core,
    Primary_Reflection: result.primary,
    Primary_Scripture: primary.scripture,
    Primary_Summary: primary.summary,
    Primary_Text: primary.text,
    Reflection_Of_God: pair.reflectionOfGod,
    Reflection_Shadow: pair.shadow,
    Secondary: result.secondary,
    Secondary_Core: secondary.core,
    Secondary_Reflection: result.secondary,
    Secondary_Scripture: secondary.scripture,
    Secondary_Summary: secondary.summary,
    Secondary_Text: secondary.text,
    Shadow_Overview: pair.shadowOverview,
    Shadow_Redemption:
      "Shadow is not a sentence. It is an invitation to return your design to love, humility, dependence on God, and wise community.",
    Shadow_Risk_A: "Overusing a strength under pressure.",
    Shadow_Risk_B: "Confusing design with identity.",
    Shadow_Risk_C: "Carrying more than grace has assigned.",
    Shadow_Risk_D: "Letting fear narrow faithful action.",
    Shadow_Root_A: "Fear of failure",
    Shadow_Root_B: "Desire for control",
    Shadow_Root_C: "Need for affirmation",
    Shadow_Root_D: "Unprocessed pressure",
    Shadow_Red_A: "Practice surrender.",
    Shadow_Red_B: "Invite trusted feedback.",
    Shadow_Red_C: "Choose one faithful next step.",
    Shadow_Red_D: "Let love govern strength.",
    Shadow_Scripture: "2 Corinthians 12:9",
    Spiritual_Strength: pair.strength,
    Timestamp: new Date().toISOString(),
    qc_donut: "",
    qc_donut_summary: result.tieSummary.note,
    safe_date: safeDate,
    t: new Date().toISOString(),
  };
}

export function designIdSnapshotSections(result: DesignIdResult) {
  const payload = buildDesignIdReportPayload({
    participantEmail: "",
    participantName: "",
    result,
  });

  return {
    profileLanguage: {
      Approach_to_Learning: payload.Approach_to_Learning,
      Contribution_To_Body: payload.Contribution_To_Body,
      Integrative_Summary: payload.Integrative_Summary,
      Primary_Summary: payload.Primary_Summary,
      Primary_Text: payload.Primary_Text,
      Secondary_Summary: payload.Secondary_Summary,
      Secondary_Text: payload.Secondary_Text,
      Shadow_Overview: payload.Shadow_Overview,
      Shadow_Redemption: payload.Shadow_Redemption,
    },
    summary: {
      Integrative_Reflection: payload.Integrative_Reflection,
      PairKey: result.pairKey,
      Potential_Shadow: payload.Potential_Shadow,
      Primary: result.primary,
      Reflection_Of_God: payload.Reflection_Of_God,
      ReportReady: "OK",
      Secondary: result.secondary,
      Spiritual_Strength: payload.Spiritual_Strength,
      Tie_Note: result.tieSummary.note,
    },
  };
}

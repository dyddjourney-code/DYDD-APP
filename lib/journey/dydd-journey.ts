export type JourneyPrompt = {
  id: string;
  careStep?: "connect" | "act" | "reflect" | "explore";
  helper?: string;
  label: string;
  responseType: "short_text" | "long_text" | "list" | "declaration";
};

export type JourneyStage = {
  slug: string;
  title: string;
  sourcePages: string;
  classWeek: string;
  summary: string;
  videoIntro: string;
  contentMoves: string[];
  databaseRecord: string;
  dydiContext: string;
  prompts: JourneyPrompt[];
};

type DyddJourney = {
  slug: string;
  sourceMaterials: string[];
  stages: JourneyStage[];
  tagline: string;
  title: string;
};

export const dyddJourney: DyddJourney = {
  slug: "discover-your-divine-design",
  title: "Discover Your Divine Design Journey",
  tagline: "On Purpose, For Purpose",
  sourceMaterials: [
    "DYDD Class 2-26.pptx",
    "Discover Your Divine Design Edit 3-26-26.docx",
    "Discover Your Divine Design Workbook Edit 5-6-26.pdf",
    "Leaders Playbook.docx",
  ],
  stages: [
    {
      slug: "welcome",
      title: "Welcome and Orientation",
      sourcePages: "Workbook introduction, pages 1-5; class deck week one",
      classWeek: "Week 1",
      summary:
        "Open the journey with Ephesians 2:8-10, the DESIGN framework, and the purpose of moving from information to personal discovery.",
      videoIntro:
        "John welcomes the learner, frames the app as a guided workbook, and explains how videos, reflection, assessments, and Dydi work together.",
      contentMoves: [
        "Introduce On Purpose, For Purpose.",
        "Explain C.A.R.E. as the repeated rhythm: Connect, Act, Reflect, Explore.",
        "Let the learner record starting hopes, questions, and current assessment status.",
      ],
      databaseRecord:
        "Create a journey enrollment, first session event, and an orientation snapshot for Dydi.",
      dydiContext:
        "Dydi should know why the learner started, which assessments are already complete, and what kind of support they want.",
      prompts: [
        {
          id: "starting-why",
          careStep: "connect",
          label: "What drew you to begin the DYDD journey right now?",
          responseType: "long_text",
        },
        {
          id: "current-question",
          careStep: "explore",
          label: "What question do you most hope God brings clarity to through this journey?",
          responseType: "long_text",
        },
      ],
    },
    {
      slug: "identity",
      title: "Identity",
      sourcePages: "Workbook chapter one, pages 6-32; class deck week two",
      classWeek: "Week 2",
      summary:
        "Ground the learner in whose they are before asking what they do, peeling back false labels and receiving identity in Christ.",
      videoIntro:
        "John teaches identity as received before achieved, then invites the learner to notice old names, labels, and grace patterns.",
      contentMoves: [
        "Teach identity in Christ as the foundation for design.",
        "Connect DesignID reflections to image-bearing without turning them into labels.",
        "Begin the Niche Declaration with identity language.",
      ],
      databaseRecord:
        "Store identity reflections, named false labels, truth statements, DesignID connections, and the identity line of the niche declaration.",
      dydiContext:
        "Dydi should reference the learner's DesignID snapshot and help them separate identity from performance, comparison, and shame.",
      prompts: [
        {
          id: "child-of-god-response",
          careStep: "connect",
          label:
            "When you hear 'You are a child of God,' how does your heart respond?",
          responseType: "long_text",
        },
        {
          id: "old-label-truth",
          careStep: "act",
          label:
            "Write one lie or label you have believed about yourself, then write the truth God says about you.",
          responseType: "long_text",
        },
        {
          id: "whose-before-who",
          careStep: "reflect",
          label:
            "Is your identity shaped more by who you think you are or by whose you are?",
          responseType: "long_text",
        },
        {
          id: "identity-declaration",
          label: "My identity in Christ declaration",
          responseType: "declaration",
        },
      ],
    },
    {
      slug: "expertise",
      title: "Expertise",
      sourcePages: "Workbook chapter two, pages 33-48; class deck week three",
      classWeek: "Week 3",
      summary:
        "Help the learner name talents, competencies, developed skills, and areas where God has shaped wisdom through practice.",
      videoIntro:
        "John reframes expertise as faithful development over time, not self-promotion or instant mastery.",
      contentMoves: [
        "Distinguish talent, competency, and expertise.",
        "Trace where skill came from practice, pain, opportunity, and service.",
        "Add expertise language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store talent inventory, competency evidence, expertise themes, and the expertise line of the niche declaration.",
      dydiContext:
        "Dydi should connect assessment strengths to lived experience and help the learner name evidence without exaggeration.",
      prompts: [
        {
          id: "growth-signs",
          careStep: "connect",
          label: "Where do you see signs of God's steady growth in your life?",
          responseType: "long_text",
        },
        {
          id: "skill-inventory",
          careStep: "explore",
          label: "What can you do now that once required effort, practice, or mentoring?",
          responseType: "list",
        },
        {
          id: "expertise-declaration",
          label: "My expertise declaration",
          responseType: "declaration",
        },
      ],
    },
    {
      slug: "story",
      title: "Story",
      sourcePages: "Workbook chapter three, pages 49-64; class deck week four",
      classWeek: "Week 4",
      summary:
        "Guide the learner through testimony, family, culture, work, and church story so pain, formation, and redemption become visible.",
      videoIntro:
        "John introduces story as redeemed material, helping the learner name where God has been forming compassion and calling.",
      contentMoves: [
        "Capture key testimony moments.",
        "Name family, culture, work, and church story influences.",
        "Add story language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store story snapshots, formative people and places, redemption themes, and the story line of the niche declaration.",
      dydiContext:
        "Dydi should handle story carefully, inviting reflection without forcing trauma disclosure or premature conclusions.",
      prompts: [
        {
          id: "testimony-hope",
          careStep: "connect",
          label: "What part of your faith story could give someone else hope?",
          responseType: "long_text",
        },
        {
          id: "story-influences",
          careStep: "reflect",
          label: "What family, culture, work, or church experiences have shaped you most?",
          responseType: "long_text",
        },
        {
          id: "story-declaration",
          label: "My story declaration",
          responseType: "declaration",
        },
      ],
    },
    {
      slug: "desire",
      title: "Desire",
      sourcePages: "Workbook chapter four, pages 65-75; class deck week five",
      classWeek: "Week 5",
      summary:
        "Name holy desire as the inner fire God shapes and aligns, connecting passion to purpose without confusing it with selfish ambition.",
      videoIntro:
        "John helps the learner notice what moves them, burdens them, and keeps showing up as a Spirit-shaped concern.",
      contentMoves: [
        "Discern desire, passion, burden, and motivation.",
        "Connect desire back to identity, expertise, and story.",
        "Add desire language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store heart motivations, burden statements, desire themes, and the desire line of the niche declaration.",
      dydiContext:
        "Dydi should help test desires against Scripture, fruit, service, and peace rather than treating every want as a calling.",
      prompts: [
        {
          id: "heart-fire",
          careStep: "connect",
          label:
            "What lights your fire, and what are you willing to pay a price for?",
          responseType: "long_text",
        },
        {
          id: "desire-alignment",
          careStep: "reflect",
          label:
            "Where do your desires feel aligned with God's truth, and where do they need surrender?",
          responseType: "long_text",
        },
        {
          id: "desire-declaration",
          label: "My desire declaration",
          responseType: "declaration",
        },
      ],
    },
    {
      slug: "gifts",
      title: "Gifts",
      sourcePages: "Workbook chapter five, pages 76-89; class deck week five/six",
      classWeek: "Week 6",
      summary:
        "Bring Spiritual Gifts results into the larger DESIGN path so gifts are seen as grace for service, not badges of importance.",
      videoIntro:
        "John teaches gifts as Spirit-given empowerment and guides the learner to compare assessment results with lived fruit.",
      contentMoves: [
        "Import or invite Spiritual Gifts assessment results.",
        "Connect gifts to identity, expertise, story, and desire.",
        "Add gifts language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store gift results, observed confirmation, service examples, and the gifts line of the niche declaration.",
      dydiContext:
        "Dydi should use the learner's Spiritual Gifts snapshot when available and invite confirmation through community and service.",
      prompts: [
        {
          id: "gift-patterns",
          careStep: "reflect",
          label:
            "What patterns or connections do you see between your spiritual gifts and the other parts of your design?",
          responseType: "long_text",
        },
        {
          id: "gift-service",
          careStep: "act",
          label: "What is one way you can use a gift to build someone up this week?",
          responseType: "long_text",
        },
        {
          id: "gifts-declaration",
          label: "My gifts declaration",
          responseType: "declaration",
        },
      ],
    },
    {
      slug: "niche",
      title: "Niche and Declarations",
      sourcePages: "Workbook chapter six, pages 90-95; class deck week seven",
      classWeek: "Week 7",
      summary:
        "Synthesize Identity, Expertise, Story, Desire, and Gifts into a working niche statement, prayer needs, and declaration.",
      videoIntro:
        "John leads the learner through the convergence point: not doing everything, but naming the right thing to faithfully offer.",
      contentMoves: [
        "Review every previous declaration line.",
        "Draft and refine a Niche Declaration.",
        "Name support, courage, clarity, provision, protection, and fruitfulness needs.",
      ],
      databaseRecord:
        "Store final niche statement, declaration versions, support needs, and next faithful experiments.",
      dydiContext:
        "Dydi should synthesize the whole record and help the learner revise a clear, humble, actionable niche declaration.",
      prompts: [
        {
          id: "design-convergence",
          careStep: "explore",
          label:
            "Where do Identity, Expertise, Story, Desire, and Gifts seem to converge?",
          responseType: "long_text",
        },
        {
          id: "niche-declaration",
          label: "My Niche Declaration",
          responseType: "declaration",
        },
        {
          id: "next-experiment",
          careStep: "act",
          label: "What small faithful experiment will you take next?",
          responseType: "long_text",
        },
      ],
    },
  ],
};

export type DyddJourneyStage = JourneyStage;

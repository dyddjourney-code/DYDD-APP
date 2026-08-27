export type CareStep = "connect" | "act" | "reflect" | "explore";

export type JourneyPrompt = {
  id: string;
  careStep?: CareStep;
  helper?: string;
  label: string;
  responseType: "short_text" | "long_text" | "list" | "declaration";
};

export type JourneyCarePerspective = {
  act?: string;
  connect?: string;
  explore?: string;
  reflect?: string;
};

export type JourneyAssessmentCallout = {
  assessment: "DesignID" | "Spiritual Gifts" | "DesignPD" | "FruitLife 360";
  body: string;
  title: string;
};

export type JourneyLessonBlock = {
  anchorVerse?: {
    reference: string;
    text: string;
  };
  eyebrow: string;
  title: string;
  summary: string;
  duration: string;
  image?: string;
  mediaLabel?: string;
  mediaType?: "image" | "video";
  focus: string[];
  teachingSections: {
    body: string[];
    label: string;
    title: string;
  }[];
  practice: {
    prompt: string;
    title: string;
  };
  nextStep: string;
};

export type JourneySection = {
  slug: string;
  title: string;
  sourceRef: string;
  purpose: string;
  care: JourneyCarePerspective;
  prompts: JourneyPrompt[];
};

export type JourneyPathfinder = {
  title: string;
  body: string;
  prompts: JourneyPrompt[];
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
  assessmentCallouts?: JourneyAssessmentCallout[];
  sampleLessons?: JourneyLessonBlock[];
  pathfinder?: JourneyPathfinder;
  prompts: JourneyPrompt[];
  sections: JourneySection[];
};

type DyddJourney = {
  slug: string;
  sourceMaterials: string[];
  stages: JourneyStage[];
  tagline: string;
  title: string;
};

const careOverview = [
  "Connect: engage with God, yourself, and others.",
  "Act: take the next small, faithful step.",
  "Reflect: pause, notice, and discern what God is refining.",
  "Explore: stay curious and consider what God may be inviting next.",
];

export const dyddJourney: DyddJourney = {
  slug: "discover-your-divine-design",
  title: "Discover Your Divine Design Journey",
  tagline: "On Purpose, For Purpose",
  sourceMaterials: [
    "DYDD Class 2-26.pptx",
    "Discover Your Divine Design Edit 3-26-26.docx",
    "Discover Your Divine Design Workbook Edit 5-6-26.pdf",
    "Leaders Playbook.docx",
    "Extracted workbook clean text: generated/dydd-journey-content/workbook-clean.txt",
  ],
  stages: [
    {
      slug: "welcome",
      title: "Welcome and Orientation",
      sourcePages: "Workbook introduction, pages 1-5; book introduction; class deck week one",
      classWeek: "Trailhead",
      summary:
        "Open the journey with Ephesians 2:8-10, the DESIGN framework, and a clear expectation that this is a lived path, not only a class to consume.",
      videoIntro:
        "John welcomes the learner, frames the app as a guided workbook, and explains how videos, reflection, assessments, and Dydi work together.",
      contentMoves: [
        "Introduce On Purpose, For Purpose.",
        ...careOverview,
        "Let the learner record starting hopes, questions, assessment status, and support preferences.",
      ],
      databaseRecord:
        "Create a journey enrollment, first session event, assessment readiness checklist, and orientation snapshot for Dydi.",
      dydiContext:
        "Dydi should know why the learner started, which assessments are already complete, and what kind of support they want.",
      assessmentCallouts: [
        {
          assessment: "DesignID",
          title: "Optional but powerful early mirror",
          body:
            "DesignID is introduced before chapter one as a way to make Identity more personal. The app should invite it early without making the book dependent on it.",
        },
      ],
      sampleLessons: [
        {
          eyebrow: "Session 1 opening",
          title: "Welcome to the Trail",
          summary:
            "A warm first lesson that helps the learner understand the larger DYDD path before they begin answering workbook questions.",
          duration: "8-10 minutes",
          image: "/brand/dydd-journey-road-waymarkers.png",
          mediaLabel: "Journey overview image",
          mediaType: "image",
          focus: [
            "Settle into the language of On Purpose, For Purpose.",
            "See how the book, workbook, assessments, and companion guidance belong together.",
            "Choose a simple pace for walking the journey without rushing the work.",
          ],
          anchorVerse: {
            reference: "Ephesians 2:10",
            text:
              "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
          },
          teachingSections: [
            {
              label: "Big idea",
              title: "This is a journey, not a content library.",
              body: [
                "Discover Your Divine Design is meant to help you walk with God through identity, story, gifts, desire, and purpose. The lessons give language, but the real work happens as you notice what God has already been shaping in your life.",
                "The app holds the trail in order: teaching first, workbook reflection next, CARE practice after that, and Pathfinder language as you begin naming faithful next steps.",
              ],
            },
            {
              label: "What to notice",
              title: "Start with openness before answers.",
              body: [
                "You do not need to understand every assessment, label, or destination on day one. Begin by paying attention to what feels alive, what feels resistant, and what questions keep returning.",
                "Those signals become useful later when the journey begins connecting your DesignID, Spiritual Gifts, DesignPD, and FruitLife formation patterns.",
              ],
            },
          ],
          practice: {
            title: "Starting practice",
            prompt:
              "Write one sentence that begins, 'I am starting this journey because...' Keep it honest, simple, and current.",
          },
          nextStep:
            "Name the reason you are beginning and the one question you want to carry into the first chapter.",
        },
        {
          eyebrow: "Session 1 teaching",
          title: "How This Journey Works",
          summary:
            "A video-led orientation lesson that gives John a clean space to explain the rhythm of each chapter before the learner reaches CARE prompts.",
          duration: "6-8 minutes",
          image: "/brand/john-author-cartoon-dydd-style.png",
          mediaLabel: "Video teaching space with John",
          mediaType: "video",
          focus: [
            "Introduce the recurring chapter flow: teaching, reflection, CARE, and Pathfinder.",
            "Explain that assessments are mirrors that help personalize the journey.",
            "Clarify what stays private and what can later be shared in a Camp Circle.",
          ],
          teachingSections: [
            {
              label: "Lesson rhythm",
              title: "Each chapter has a repeatable path.",
              body: [
                "Every chapter should feel familiar without becoming flat. You will begin with a short teaching section, then move into reflection, then practice the CARE rhythm: Connect, Act, Reflect, and Explore.",
                "The goal is not to finish a checklist. The goal is to slow down enough to recognize what God is revealing and then take the next faithful step with it.",
              ],
            },
            {
              label: "Personalization",
              title: "Assessments become mirrors, not boxes.",
              body: [
                "DesignID, Spiritual Gifts, DesignPD, and FruitLife 360 can eventually sit beside the lesson and speak directly into the learner's path. A Shepherd should not experience Identity the same way an Architect does, and a person leading a group should not see the same controls as someone walking alone.",
                "The course still needs one clear path for everyone, but the app can place personal insight beside that path when the learner is signed in and their records are connected.",
              ],
            },
            {
              label: "Privacy",
              title: "Some work is private before it becomes shared.",
              body: [
                "Journal entries, CARE reflections, and assessment records should belong first to the learner. Camp Circle tools can invite shared progress, reminders, and discussion, but private workbook answers should not be exposed casually.",
              ],
            },
          ],
          practice: {
            title: "Pace decision",
            prompt:
              "Choose whether you are walking this weekly, in a short intensive, with a partner, or inside a group. That pace will shape reminders and chapter expectations later.",
          },
          nextStep:
            "Confirm your preferred pace and prepare to move from orientation into Identity.",
        },
      ],
      sections: [
        {
          slug: "journey-intention",
          title: "Set Your Journey Intention",
          sourceRef: "Workbook intro: How this workbook fits into your DYDD journey",
          purpose:
            "Help the learner name why they are here, what they hope God clarifies, and how they want to move through the book/workbook path.",
          care: {
            connect:
              "Notice what drew you to begin now and where you sense God already stirring questions, hopes, or resistance.",
            act:
              "Choose a simple rhythm for this journey: reading pace, reflection time, and where notes will live.",
            reflect:
              "Consider what would make this more than information gathering for you.",
            explore:
              "Name what could become possible if the journey gives you clearer language for your design.",
          },
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
            {
              id: "journey-rhythm",
              careStep: "act",
              label: "What weekly rhythm will help you stay with the journey?",
              responseType: "short_text",
            },
          ],
        },
        {
          slug: "assessment-readiness",
          title: "Assessment Readiness",
          sourceRef: "Workbook intro: Introducing DesignID",
          purpose:
            "Give the learner a place to record whether DesignID, Spiritual Gifts, DesignPD, Design Pathways, or FruitLife 360 are complete or still ahead.",
          care: {
            connect:
              "Connect the tools to the larger journey so assessments become mirrors, not labels.",
            act:
              "Mark which tools are complete and which one should be next.",
            reflect:
              "Notice where you are tempted to let a report define you instead of letting it help you listen.",
            explore:
              "Imagine how the journey might become more personal once these mirrors are connected.",
          },
          prompts: [
            {
              id: "completed-tools",
              careStep: "act",
              label: "Which DYDD tools have you already completed?",
              responseType: "list",
            },
            {
              id: "assessment-hopes",
              careStep: "reflect",
              label: "What do you hope the assessment mirrors help you see more clearly?",
              responseType: "long_text",
            },
          ],
        },
      ],
      pathfinder: {
        title: "Pathfinder Setup",
        body:
          "Before Identity begins, Pathfinder starts as a simple trail marker: where are you now, what are you seeking, and what next step would count as faithful movement?",
        prompts: [
          {
            id: "orientation-pathfinder-next-step",
            careStep: "act",
            label: "What is the next faithful step that would move you from intention into the journey?",
            responseType: "long_text",
          },
        ],
      },
      prompts: [],
    },
    {
      slug: "identity",
      title: "Identity",
      sourcePages: "Workbook chapter one, pages 6-32; book chapter one; class deck week two",
      classWeek: "Chapter 1",
      summary:
        "Ground the learner in whose they are before asking what they do, peeling back false labels and receiving identity in Christ.",
      videoIntro:
        "John teaches identity as received before achieved, then invites the learner to notice old names, labels, and grace patterns.",
      contentMoves: [
        "Teach identity in Christ as the foundation for design.",
        "Use DesignID reflections as a lens for image-bearing without turning them into labels.",
        "Move from personal identity into identity among believers and one-another love.",
        "Begin the Niche Declaration with identity language.",
      ],
      databaseRecord:
        "Store identity reflections, false labels, truth statements, DesignID unpacking, loving/one-another responses, and the identity line of the niche declaration.",
      dydiContext:
        "Dydi should reference the learner's DesignID snapshot when available and help them separate identity from performance, comparison, and shame.",
      assessmentCallouts: [
        {
          assessment: "DesignID",
          title: "DesignID belongs early in Identity",
          body:
            "Chapter one includes the DesignID wheel, primary/secondary reflection, integrative reflection, capacity, learning approach, contribution, shadow, and overall summary. If results exist, prefill the reflection language here.",
        },
      ],
      sampleLessons: [
        {
          eyebrow: "Before the workbook",
          title: "Before Who You Are, Remember Whose You Are",
          summary:
            "A short bridge lesson placed above the workbook section so the learner is spiritually and emotionally oriented before entering the first CARE sequence.",
          duration: "7-9 minutes",
          image: "/brand/badges/identity-badge.png",
          mediaLabel: "Identity trail badge",
          mediaType: "image",
          focus: [
            "Separate identity from role, achievement, failure, and comparison.",
            "Anchor the first chapter in belonging to God before naming personal design.",
            "Prepare the learner to answer the workbook honestly and prayerfully.",
          ],
          anchorVerse: {
            reference: "1 John 3:1",
            text:
              "See what great love the Father has lavished on us, that we should be called children of God.",
          },
          teachingSections: [
            {
              label: "Foundation",
              title: "Whose you are comes before what you do.",
              body: [
                "The first chapter cannot begin with talent, productivity, calling, or personality. Those things matter, but they are not strong enough to carry identity. Christian identity begins with belonging to God through grace.",
                "Before the learner names their gifts or purpose, this lesson creates space to receive the deeper truth: you are not earning your way into design. You are discovering what God has already been forming in you.",
              ],
            },
            {
              label: "False names",
              title: "Old labels can sound true without being true.",
              body: [
                "Many people enter this work carrying names given by performance, disappointment, comparison, family systems, ministry wounds, or failure. Those labels often feel familiar, but familiarity is not the same as truth.",
                "This section prepares the learner to place old names beside God's truth before answering the workbook prompts. The workbook becomes more honest when the heart is not trying to defend itself.",
              ],
            },
            {
              label: "Design lens",
              title: "DesignID helps language what identity can express.",
              body: [
                "DesignID can help a learner notice patterns of reflection: how they create, care, steward, or express what God placed in them. But the report is not the source of identity. It is a mirror that can support the identity work already rooted in Christ.",
              ],
            },
          ],
          practice: {
            title: "Before the workbook",
            prompt:
              "Name one label you have carried, then write one truth about whose you are before God.",
          },
          nextStep:
            "Read the first workbook section and answer the Who Are You and Whose Are You prompts.",
        },
      ],
      sections: [
        {
          slug: "who-and-whose",
          title: "Who Are You and Whose Are You?",
          sourceRef: "Workbook p. 7-8",
          purpose:
            "Move the learner from old labels into received identity as a beloved child of God.",
          care: {
            connect:
              "When you hear that you are a child of God, notice whether it feels true or whether old labels rise up.",
            act:
              "Name one lie or label and place it beside a Scripture-rooted truth.",
            reflect:
              "Ask whether your identity is shaped more by who you think you are or by whose you are.",
            explore:
              "Imagine how tomorrow changes when you focus on whose you are.",
          },
          prompts: [
            {
              id: "child-of-god-response",
              careStep: "connect",
              label: "When you hear 'You are a child of God,' how does your heart respond?",
              responseType: "long_text",
            },
            {
              id: "old-label-truth",
              careStep: "act",
              label: "Write one lie or label you have believed, then write the truth God says about you.",
              responseType: "long_text",
            },
            {
              id: "whose-before-who",
              careStep: "reflect",
              label: "Is your identity shaped more by who you think you are or by whose you are?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "unpack-designid-reflections",
          title: "Unpack Your DesignID Reflections",
          sourceRef: "Workbook p. 9-18",
          purpose:
            "Capture the learner's DesignID profile as an Identity lens: primary, secondary, integrative reflection, capacity, learning approach, contribution, and shadow.",
          care: {
            connect:
              "See DesignID as a mirror for how grace may naturally move through your identity.",
            act:
              "Record your primary, secondary, integrative reflection, and capacity notes.",
            reflect:
              "Notice which parts feel life-giving, stretched, limited, or in need of surrender.",
            explore:
              "Ask how your reflection language can help you love God and others more faithfully.",
          },
          prompts: [
            {
              id: "designid-profile-summary",
              careStep: "act",
              label: "Summarize your primary, secondary, integrative reflection, and capacity notes.",
              responseType: "long_text",
            },
            {
              id: "reflection-shadow-redemption",
              careStep: "reflect",
              label: "What shadow tendency needs grace and realignment?",
              responseType: "long_text",
            },
            {
              id: "designid-overall-summary",
              careStep: "explore",
              label: "What is your overall summary of your DesignID reflection?",
              responseType: "declaration",
            },
          ],
        },
        {
          slug: "identity-among-believers",
          title: "Your Identity Among Believers",
          sourceRef: "Workbook p. 19-24",
          purpose:
            "Connect identity to the Body of Christ and to loving God with heart, soul, mind, and strength.",
          care: {
            connect:
              "Notice where God has placed you among other believers and how His love is moving through you.",
            act:
              "Take one intentional step to love another believer with no transaction attached.",
            reflect:
              "Evaluate heart, soul, mind, and strength as ways of loving God.",
            explore:
              "Consider how your identity fits into the larger story of the Body of Christ.",
          },
          prompts: [
            {
              id: "believer-community-placement",
              careStep: "connect",
              label: "Where has God placed you among other believers?",
              responseType: "long_text",
            },
            {
              id: "love-god-four-ways",
              careStep: "reflect",
              label: "How are heart, soul, mind, and strength showing up in the way you love God?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "loving-yourself-others",
          title: "Loving Yourself, Loving Others",
          sourceRef: "Workbook p. 25-30",
          purpose:
            "Help the learner receive God's love and practice one-another love through every reflection, including the reflections that feel less natural.",
          care: {
            connect:
              "Notice where it is harder to receive God's love for yourself or pour love into others.",
            act:
              "Practice a one-another action from each reflection this week.",
            reflect:
              "Ask where you naturally serve others and where you have held back.",
            explore:
              "Explore one way God may be stretching you to love differently.",
          },
          prompts: [
            {
              id: "receive-love-barrier",
              careStep: "connect",
              label: "Where do you struggle most: receiving God's love for yourself or pouring love into others?",
              responseType: "long_text",
            },
            {
              id: "one-another-action",
              careStep: "act",
              label: "Choose one one-another action from each reflection to practice this week.",
              responseType: "list",
            },
          ],
        },
      ],
      pathfinder: {
        title: "Pathfinder: Identity Line",
        body:
          "At the end of Identity, Pathfinder captures the first line of the eventual Niche Declaration: I believe God created me...",
        prompts: [
          {
            id: "identity-declaration",
            label: "I believe God created me...",
            responseType: "declaration",
          },
          {
            id: "identity-service-reflections",
            careStep: "explore",
            label: "What have you learned about your divine reflections that you might use for serving God?",
            responseType: "long_text",
          },
        ],
      },
      prompts: [],
    },
    {
      slug: "expertise",
      title: "Expertise",
      sourcePages: "Workbook chapter two, pages 33-48; book chapter two; class deck week three",
      classWeek: "Chapter 2",
      summary:
        "Help the learner name talents, competencies, developed skills, and areas where God has shaped wisdom through practice.",
      videoIntro:
        "John reframes expertise as faithful development over time, not self-promotion or instant mastery.",
      contentMoves: [
        "Distinguish talent, competency, and expertise.",
        "Trace where skill came from practice, pain, opportunity, and service.",
        "Connect being before doing.",
        "Add expertise language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store talent inventory, competency evidence, expertise themes, being-before-doing reflection, and the expertise line of the niche declaration.",
      dydiContext:
        "Dydi should connect assessment strengths to lived experience and help the learner name evidence without exaggeration.",
      sections: [
        {
          slug: "slow-faithful-expertise",
          title: "The Slow and Faithful Journey to Expertise",
          sourceRef: "Workbook p. 34-36",
          purpose:
            "Frame expertise as patient formation, like the rings of an oak tree, shaped through seasons of growth and endurance.",
          care: {
            connect:
              "Look for signs of God's steady growth even when the process has been slow.",
            act:
              "Choose consistency over speed and practice one craft or responsibility as worship.",
            reflect:
              "Look back at successes and struggles as raw material God has used to strengthen you.",
            explore:
              "Ask where God may be inviting you to grow next in skill, wisdom, or influence.",
          },
          prompts: [
            {
              id: "growth-signs",
              careStep: "connect",
              label: "Where do you see signs of God's steady growth in your life?",
              responseType: "long_text",
            },
            {
              id: "success-struggle-formation",
              careStep: "reflect",
              label: "How has God used both successes and struggles to strengthen your expertise?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "talents-and-competency",
          title: "Talents and Competency",
          sourceRef: "Workbook p. 37-39",
          purpose:
            "Identify natural talents, cultivated skills, and places where the learner has moved from raw ability into competency.",
          care: {
            connect:
              "Notice activities that come naturally, receive compliments, or make time disappear.",
            act:
              "Name where you are practicing or showing up consistently.",
            reflect:
              "Ask whether you are stewarding your talents or burying them out of fear, comfort, or complacency.",
            explore:
              "Identify one area in work, home, church, or personal life where God wants growth this season.",
          },
          prompts: [
            {
              id: "talent-inventory",
              careStep: "connect",
              label: "What comes naturally to you or often draws encouragement from others?",
              responseType: "list",
            },
            {
              id: "competency-growth",
              careStep: "explore",
              label: "Where have you moved beyond raw talent into actual skill?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "what-is-expertise",
          title: "What Is Expertise?",
          sourceRef: "Workbook p. 40-41",
          purpose:
            "Differentiate easy knowledge from wisdom formed through faithful repetition, mentorship, practice, and maturity.",
          care: {
            connect:
              "Thank God for people and seasons that shaped your real-world insight.",
            act:
              "Choose one deliberate, learnable practice and schedule the reps.",
            reflect:
              "Name where you are competent and where God may be inviting you toward expertise.",
            explore:
              "Plan a next learning stretch: book, course, mentor, shadowing, or teaching someone newer.",
          },
          prompts: [
            {
              id: "competent-to-expert",
              careStep: "reflect",
              label: "Where are you competent, and where may God be inviting you toward expertise?",
              responseType: "long_text",
            },
            {
              id: "next-learning-stretch",
              careStep: "explore",
              label: "What next learning stretch would mature your expertise?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "being-before-doing",
          title: "Being Before Doing",
          sourceRef: "Workbook p. 42-44",
          purpose:
            "Anchor expertise in presence with Jesus so doing flows from identity rather than striving.",
          care: {
            connect:
              "Notice what areas have allowed busy to take the stage.",
            act:
              "Begin a task by praying, 'Lord, help me do this with You, not for You.'",
            reflect:
              "Ask where your value has become tied to performance.",
            explore:
              "Choose one daily rhythm that helps your doing flow from being with Jesus.",
          },
          prompts: [
            {
              id: "busy-taking-stage",
              careStep: "connect",
              label: "What areas have you let busy take the stage?",
              responseType: "long_text",
            },
            {
              id: "being-rhythm",
              careStep: "explore",
              label: "What daily rhythm will help you remain present with Jesus?",
              responseType: "short_text",
            },
          ],
        },
      ],
      pathfinder: {
        title: "Pathfinder: Expertise Line",
        body:
          "At the end of Expertise, Pathfinder captures the talents, skills, competencies, and matured wisdom that may support the eventual niche.",
        prompts: [
          {
            id: "expertise-talents-skills",
            label: "Talents and skills: what comes easily or what have you developed?",
            responseType: "long_text",
          },
          {
            id: "expertise-declaration",
            label: "Competency and expertise: what have you mastered through experience?",
            responseType: "declaration",
          },
        ],
      },
      prompts: [],
    },
    {
      slug: "story",
      title: "Story",
      sourcePages: "Workbook chapter three, pages 49-64; book chapter three; class deck week four",
      classWeek: "Chapter 3",
      summary:
        "Guide the learner through testimony, family, culture, work, and church story so pain, formation, and redemption become visible.",
      videoIntro:
        "John introduces story as redeemed material, helping the learner name where God has been forming compassion and calling.",
      contentMoves: [
        "Capture key shaping moments.",
        "Write or outline faith story.",
        "Name family, culture, work, and church story influences.",
        "Notice how DesignID reflections have appeared across the story.",
        "Add story language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store story snapshots, formative people and places, redemption themes, reflection-pattern story evidence, and the story line of the niche declaration.",
      dydiContext:
        "Dydi should handle story carefully, inviting reflection without forcing trauma disclosure or premature conclusions.",
      sections: [
        {
          slug: "moments-that-shape-us",
          title: "The Moments That Shape Us",
          sourceRef: "Workbook p. 50",
          purpose:
            "Begin the story chapter by listing major moments that shaped the learner before interpreting them too quickly.",
          care: {
            connect:
              "Name triumph, tragedy, joy, pain, and the moments that left a mark.",
            act:
              "List major moments without forcing full meaning yet.",
            reflect:
              "Notice which moments still carry emotion, gratitude, grief, courage, or questions.",
            explore:
              "Ask where God may have been present even in places you could not see Him clearly then.",
          },
          prompts: [
            {
              id: "shaping-moments",
              careStep: "connect",
              label: "List the biggest moments in your life that have shaped who you are.",
              responseType: "list",
            },
          ],
        },
        {
          slug: "faith-story",
          title: "Sharing Your Faith Story",
          sourceRef: "Workbook p. 51-52",
          purpose:
            "Help the learner outline testimony through life before Jesus, coming to know Jesus, life after, and current obedience.",
          care: {
            connect:
              "Write your faith story and name whether it includes a turning point or gradual surrender.",
            act:
              "Tell your faith story to someone you trust.",
            reflect:
              "Ask what part of your story could encourage someone else.",
            explore:
              "Ask one or two people to share their faith stories and listen for encouragement.",
          },
          prompts: [
            {
              id: "faith-story-outline",
              careStep: "connect",
              label: "Write or outline your faith story.",
              responseType: "long_text",
            },
            {
              id: "story-encouragement",
              careStep: "reflect",
              label: "What part of your story might encourage someone else?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "family-culture-story",
          title: "Family and Culture Story",
          sourceRef: "Workbook p. 53-55",
          purpose:
            "Discern family and culture as both gift and wound, inheritance and stewardship, with Christ as the defining center.",
          care: {
            connect:
              "Name one gift and one wound you have inherited from family or culture.",
            act:
              "Create a carry-forward / lay-down list and take one concrete step this week.",
            reflect:
              "Ask which inherited belief should be kept and which should be surrendered.",
            explore:
              "Share a meaningful conversation with a believer from a different background.",
          },
          prompts: [
            {
              id: "family-culture-gifts-wounds",
              careStep: "connect",
              label: "Name one gift and one wound you have inherited from your family or culture.",
              responseType: "long_text",
            },
            {
              id: "inheritance-keep-surrender",
              careStep: "reflect",
              label: "What inherited belief or pattern should be kept, and what should be surrendered?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "work-and-church-story",
          title: "Work Story and Church Story",
          sourceRef: "Workbook p. 56-60",
          purpose:
            "Bring ordinary work, service, church experience, and Body of Christ belonging into the story of design.",
          care: {
            connect:
              "Ask what you can do, what you have, and where God has placed you.",
            act:
              "Notice one faithful act available in your current role.",
            reflect:
              "Ask whether you define value by what you do more than who you are in Christ.",
            explore:
              "Consider where God may be shifting you from attending church to belonging to His Body.",
          },
          prompts: [
            {
              id: "called-where-you-are",
              careStep: "connect",
              label: "What can you do, what do you have, and where are you right now that God might want to use?",
              responseType: "long_text",
            },
            {
              id: "church-body-shift",
              careStep: "reflect",
              label: "Where might God be inviting you to shift from simply attending church to actively belonging to His Body?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "reflections-in-story",
          title: "How Your Reflections Fit Within Your Story",
          sourceRef: "Workbook p. 61-62",
          purpose:
            "Use Architect, Artisan, Shepherd, and Steward as a lens for seeing design evidence across the learner's life story.",
          care: {
            connect:
              "Look for moments where vision, clarity, compassion, or faithfulness appeared in your story.",
            act:
              "Answer the prompts for your primary reflection.",
            reflect:
              "Notice who modeled these reflections for you.",
            explore:
              "Ask how God has used your reflection pattern to serve or strengthen others.",
          },
          prompts: [
            {
              id: "primary-reflection-story-evidence",
              careStep: "reflect",
              label: "Where has your primary reflection appeared in your story?",
              responseType: "long_text",
            },
          ],
        },
      ],
      pathfinder: {
        title: "Pathfinder: Story Line",
        body:
          "At the end of Story, Pathfinder captures the Coming from... line of the eventual Niche Declaration.",
        prompts: [
          {
            id: "story-declaration",
            label: "Coming from...",
            responseType: "declaration",
          },
        ],
      },
      prompts: [],
    },
    {
      slug: "desire",
      title: "Desire",
      sourcePages: "Workbook chapter four, pages 65-75; book chapter four; class deck week five",
      classWeek: "Chapter 4",
      summary:
        "Name holy desire as the inner fire God shapes and aligns, connecting passion to purpose without confusing it with selfish ambition.",
      videoIntro:
        "John helps the learner notice what moves them, burdens them, and keeps showing up as a Spirit-shaped concern.",
      contentMoves: [
        "Discern desire, passion, burden, and motivation.",
        "Use DesignID reflections to notice how the heart expresses desire.",
        "Connect desire back to identity, expertise, and story.",
        "Add desire language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store heart motivations, burden statements, reflection desire notes, integration table, and the desire line of the niche declaration.",
      dydiContext:
        "Dydi should help test desires against Scripture, fruit, service, and peace rather than treating every want as a calling.",
      sections: [
        {
          slug: "reflections-and-heart-desires",
          title: "The Reflections and the Desires of the Heart",
          sourceRef: "Workbook p. 66-69",
          purpose:
            "Use the reflections to see why the learner says, thinks, lives, and loves the way they do.",
          care: {
            connect:
              "Notice how words, thoughts, actions, and affection flow from the desires of the heart.",
            act:
              "Personalize how your top reflections speak, think, live, and love.",
            reflect:
              "Ask what these patterns reveal about holy desire and shadow desire.",
            explore:
              "Consider how desire can be renewed by the Spirit instead of driven by fear or ego.",
          },
          prompts: [
            {
              id: "desire-say-think-live-love",
              careStep: "act",
              label: "For your primary reflection, how do you tend to say, think, live, and love?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "desire-aligned-with-design",
          title: "Desire Aligned with God's Design",
          sourceRef: "Workbook p. 70-72",
          purpose:
            "Bring desire before God so longing becomes surrender, obedience, peace, and kingdom contribution.",
          care: {
            connect:
              "Ask God to show one desire that draws you nearer and one that needs refining.",
            act:
              "Take one small prompting of obedience and trust that God guides as you walk.",
            reflect:
              "Release one desire that brings anxiety rather than peace.",
            explore:
              "Explore one area where natural desire could be turned toward kingdom good.",
          },
          prompts: [
            {
              id: "desire-near-refined",
              careStep: "connect",
              label: "Name one desire that draws you nearer to God and one that needs refining.",
              responseType: "long_text",
            },
            {
              id: "desire-obedience-step",
              careStep: "act",
              label: "What small prompting of obedience will you act on this week?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "pulling-identity-expertise-story-desire",
          title: "Pulling It All Together",
          sourceRef: "Workbook p. 72-74",
          purpose:
            "Step back and see how Identity, Expertise, Story, and Desire begin to point toward calling.",
          care: {
            connect:
              "Name the two strongest truths or insights God has shown so far.",
            act:
              "Complete a summary table for Identity, Expertise, Story, and Desire.",
            reflect:
              "Look for patterns and themes beginning to converge.",
            explore:
              "Ask how God has been shaping these pieces for the good works He prepared.",
          },
          prompts: [
            {
              id: "strongest-insights-so-far",
              careStep: "connect",
              label: "What are the two strongest truths or insights God has shown you so far?",
              responseType: "list",
            },
            {
              id: "design-patterns-emerging",
              careStep: "reflect",
              label: "How do Identity, Expertise, Story, and Desire begin to connect into a clear picture?",
              responseType: "long_text",
            },
          ],
        },
      ],
      pathfinder: {
        title: "Pathfinder: Desire Line",
        body:
          "At the end of Desire, Pathfinder captures the Impassioned by... line of the eventual Niche Declaration.",
        prompts: [
          {
            id: "desire-declaration",
            label: "Impassioned by...",
            responseType: "declaration",
          },
        ],
      },
      prompts: [],
    },
    {
      slug: "gifts",
      title: "Gifts",
      sourcePages: "Workbook chapter five, pages 76-89; book chapter five; class deck week five/six",
      classWeek: "Chapter 5",
      summary:
        "Bring Spiritual Gifts results into the larger DESIGN path so gifts are seen as grace for service, not badges of importance.",
      videoIntro:
        "John teaches gifts as Spirit-given empowerment and guides the learner to compare assessment results with lived fruit.",
      contentMoves: [
        "Invite or import Spiritual Gifts assessment results.",
        "Unpack the top gifts in the learner's own words.",
        "Connect gifts to DesignID reflections, identity, expertise, story, and desire.",
        "Add gifts language to the Niche Declaration.",
      ],
      databaseRecord:
        "Store gift results, gift definitions in the learner's words, observed confirmation, service examples, integration notes, and the gifts line of the niche declaration.",
      dydiContext:
        "Dydi should use the learner's Spiritual Gifts snapshot when available and invite confirmation through community and service.",
      assessmentCallouts: [
        {
          assessment: "Spiritual Gifts",
          title: "This is the chapter where Spiritual Gifts must surface clearly",
          body:
            "If a Spiritual Gifts snapshot exists, this chapter should show top gifts, definitions, Scriptures, surprises, current use, family/body service, and confirmation prompts.",
        },
        {
          assessment: "DesignID",
          title: "Compare gifts with reflections",
          body:
            "The workbook asks the learner to compare top gifts with DesignID reflections so the app should place these two mirrors side by side here.",
        },
      ],
      sections: [
        {
          slug: "spiritual-gifts-design-to-power",
          title: "Spiritual Gifts: From Design to Power",
          sourceRef: "Workbook p. 77-79",
          purpose:
            "Move from preparation to Spirit-given empowerment for service and the building up of others.",
          care: {
            connect:
              "Thank God for giving you a place in His kingdom and ask where He is already working through your life.",
            act:
              "Serve one tangible need and ask the Spirit to empower the act.",
            reflect:
              "Ask how your story, skills, and desires interact with your gifts for unity and growth.",
            explore:
              "Try one service opportunity that stretches your comfort zone and notice joy, peace, or fruitfulness.",
          },
          prompts: [
            {
              id: "gift-service-opportunity",
              careStep: "act",
              label: "What tangible need could you serve this week?",
              responseType: "long_text",
            },
            {
              id: "gift-fit-body",
              careStep: "reflect",
              label: "How could your gifts bring strength or encouragement to the Body of Christ?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "unpack-spiritual-gifts",
          title: "Unpack Your Spiritual Gifts",
          sourceRef: "Workbook p. 80-81",
          purpose:
            "Record top gifts, definitions in the learner's words, resonant Scriptures, surprises, and current/future service.",
          care: {
            connect:
              "Bring your Spiritual Gifts assessment results into the journey.",
            act:
              "Rewrite your top gifts in your own words and record Scriptures that resonate.",
            reflect:
              "Notice what surprised you and how you are currently using your gifts.",
            explore:
              "Name one way gifts can benefit the Body of Christ and one way they can benefit family.",
          },
          prompts: [
            {
              id: "top-three-gifts",
              careStep: "act",
              label: "List your top three spiritual gifts and rewrite each definition in your own words.",
              responseType: "long_text",
            },
            {
              id: "gift-surprises",
              careStep: "reflect",
              label: "Was there anything surprising to you about your gifts?",
              responseType: "long_text",
            },
            {
              id: "gift-family-body-service",
              careStep: "explore",
              label: "How can your gifts benefit the Body of Christ and your family?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "gifts-and-divine-reflection",
          title: "Spiritual Gifts and Your Divine Reflection",
          sourceRef: "Workbook p. 82-84",
          purpose:
            "Compare Spiritual Gifts with DesignID reflection language to see how what God empowers and how a person naturally moves can work together.",
          care: {
            connect:
              "Ask where God's design and divine purpose meet through gifts and reflections.",
            act:
              "Choose one gift aligned with your reflection and use it intentionally this week.",
            reflect:
              "Name which gifts feel most aligned and which stretch you.",
            explore:
              "Put DesignID and Spiritual Gifts side by side and note overlaps, differences, and new service possibilities.",
          },
          prompts: [
            {
              id: "gift-reflection-overlap",
              careStep: "reflect",
              label: "Which gifts feel most aligned with your reflection, and which invite you to stretch?",
              responseType: "long_text",
            },
            {
              id: "gift-reflection-service",
              careStep: "explore",
              label: "What new way to serve emerges when you compare gifts and DesignID reflections?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "path-forward-and-integration",
          title: "Considering Your Path Forward",
          sourceRef: "Workbook p. 85-88",
          purpose:
            "Hold every tool lightly, compare gifts with Story, Identity, Expertise, and Desire, and notice how patterns point toward service.",
          care: {
            connect:
              "Thank God for every insight and hold assessments as invitations, not conclusions.",
            act:
              "Offer one area of expertise or weakness to God in prayer.",
            reflect:
              "Ask what to hold lightly and what to hold with intention.",
            explore:
              "Use one gift or skill in service and notice peace, fruitfulness, or joy.",
          },
          prompts: [
            {
              id: "hold-lightly-intentionally",
              careStep: "reflect",
              label: "What insight should you hold lightly, and what should you hold with intention?",
              responseType: "long_text",
            },
            {
              id: "gifts-pulling-together",
              careStep: "reflect",
              label: "What patterns do you see between your Spiritual Gifts, Story, Identity, Expertise, and Desire?",
              responseType: "long_text",
            },
          ],
        },
      ],
      pathfinder: {
        title: "Pathfinder: Gifts Line",
        body:
          "At the end of Gifts, Pathfinder captures the Supported by... line of the eventual Niche Declaration.",
        prompts: [
          {
            id: "gifts-declaration",
            label: "Supported by...",
            responseType: "declaration",
          },
        ],
      },
      prompts: [],
    },
    {
      slug: "niche",
      title: "Niche and Declaration",
      sourcePages: "Workbook chapter six, pages 90-95; book chapter six; class deck week seven",
      classWeek: "Chapter 6",
      summary:
        "Synthesize Identity, Expertise, Story, Desire, and Gifts into a working niche statement, prayer needs, and declaration.",
      videoIntro:
        "John leads the learner through the convergence point: not doing everything, but naming the right thing to faithfully offer.",
      contentMoves: [
        "Review every previous Pathfinder line.",
        "Draft and refine the full Niche Declaration.",
        "Name support team, prayer needs, and next faithful experiments.",
      ],
      databaseRecord:
        "Store final niche statement, declaration versions, support needs, encouragement network, and next faithful experiments.",
      dydiContext:
        "Dydi should synthesize the whole record and help the learner revise a clear, humble, actionable niche declaration.",
      sections: [
        {
          slug: "before-you-write",
          title: "Before You Write Your Niche Declaration",
          sourceRef: "Workbook p. 90-93",
          purpose:
            "Remove pressure from the declaration by framing it as voice, not a contract; response, not perfection.",
          care: {
            connect:
              "Review the five gathered lines: created me, coming from, which enables me, impassioned by, supported by.",
            act:
              "Bring the lines into one working draft.",
            reflect:
              "Ask what feels clear, what feels tentative, and what needs more prayer.",
            explore:
              "Consider what specific service, dedication, development, or ministry could become the next faithful step.",
          },
          prompts: [
            {
              id: "design-convergence",
              careStep: "explore",
              label: "Where do Identity, Expertise, Story, Desire, and Gifts seem to converge?",
              responseType: "long_text",
            },
            {
              id: "specific-service-direction",
              careStep: "act",
              label: "Resulting in my service, dedication to, development of, or ministry of...",
              responseType: "declaration",
            },
          ],
        },
        {
          slug: "encouraged-by",
          title: "Encouraged By",
          sourceRef: "Workbook p. 93",
          purpose:
            "Name the people, prayer needs, and encouragement structures that will help the learner walk in the niche.",
          care: {
            connect:
              "Name family, mentors, friends, pastors, or peers who can encourage the next step.",
            act:
              "Ask for prayer in specific places: courage, clarity, provision, protection, fruitfulness.",
            reflect:
              "Notice what support you are tempted to avoid because of pride, fear, or isolation.",
            explore:
              "Imagine a support rhythm that keeps the niche practical and accountable.",
          },
          prompts: [
            {
              id: "support-team",
              careStep: "connect",
              label: "Who can encourage, pray, or hold you accountable as you walk this out?",
              responseType: "list",
            },
            {
              id: "prayer-needs",
              careStep: "act",
              label: "What prayer needs should they know?",
              responseType: "long_text",
            },
          ],
        },
        {
          slug: "final-declaration",
          title: "My Niche Declaration",
          sourceRef: "Workbook p. 94",
          purpose:
            "Give the learner one focused place to draft the full declaration in honest, hopeful, bold language.",
          care: {
            connect:
              "Pray over the declaration before trying to perfect it.",
            act:
              "Write a complete draft using the chapter lines.",
            reflect:
              "Read it back and ask whether it sounds faithful, humble, and actionable.",
            explore:
              "Name one small faithful experiment that tests the declaration in real life.",
          },
          prompts: [
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
      pathfinder: {
        title: "Pathfinder: Send-Off",
        body:
          "The final Pathfinder step turns the declaration into a route: support, prayer, next experiment, and the first place to practice living on purpose, for purpose.",
        prompts: [
          {
            id: "pathfinder-final-route",
            careStep: "explore",
            label: "What route should Pathfinder help you walk next after this declaration?",
            responseType: "long_text",
          },
        ],
      },
      prompts: [],
    },
  ],
};

export type DyddJourneyStage = JourneyStage;

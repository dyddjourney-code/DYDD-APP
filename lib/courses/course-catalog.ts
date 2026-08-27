import { designIdCourse } from "./designid-foundations";

export type CourseLesson = {
  body: readonly string[];
  focus: readonly string[];
  reflectionPrompt: string;
  slug: string;
  summary: string;
  title: string;
};

export type CourseModule = {
  lessons: readonly CourseLesson[];
  slug: string;
  title: string;
};

export type CourseDefinition = {
  accent: string;
  assessmentType: string | null;
  companionNote: string;
  description: string;
  logo: string;
  modules: readonly CourseModule[];
  price: string;
  slug: string;
  sourceNote: string;
  tagline: string;
  title: string;
};

export const learningCourses = [
  {
    accent: "green",
    assessmentType: "designpd",
    companionNote:
      "Dydi should help the learner turn Plan, Decide, and Do language into weekly rhythms, decisions, and collaboration agreements.",
    description:
      "A practical class for noticing how a person plans, decides, and moves into action so their design becomes more usable in real life.",
    logo: "/brand/tools/designpd-logo.jpg",
    modules: [
      {
        slug: "orientation",
        title: "Module 1: Your Movement Pattern",
        lessons: [
          {
            body: [
              "DesignPD is the practical movement layer of the DYDD ecosystem. DesignID names reflection language; DesignPD notices how that design tends to move through planning, deciding, and doing.",
              "The goal is not to force a learner into a productivity type. The goal is stewardship. A person can notice where they naturally expand, evaluate, involve others, take ownership, or need support so they can choose a healthier next faithful step.",
              "For Heather's sample record, the course can already read a Moderate Dreamer planning pattern, a Feel It decision tendency, and a Together action tendency from her latest mirrored DesignPD snapshot.",
            ],
            focus: [
              "Plan names how direction becomes clear.",
              "Decide names how a person weighs conviction, logic, people, and timing.",
              "Do names how action is carried: independently, together, or flexibly.",
            ],
            reflectionPrompt:
              "Where does your current pace need more vision, more structure, or more shared clarity?",
            slug: "welcome-to-designpd",
            summary:
              "Introduces DesignPD as the practical movement class that helps assessment language become repeatable action.",
            title: "Welcome to DesignPD",
          },
          {
            body: [
              "Planning is not just making a list. It is the way a person starts turning possibility into direction. Some people begin with a broad future picture; others find clarity by narrowing toward the next concrete action.",
              "A Dreamer pattern can bring hope, imagination, and future-oriented direction. The growth edge is anchoring possibility in structure so the idea can survive ordinary constraints.",
              "In Heather's sample, the Plan snapshot points toward vision and future direction. That means the class should help her protect the gift of possibility while building checkpoints that keep the work from floating away.",
            ],
            focus: [
              "Dreamer energy sees what could be.",
              "Doer energy clarifies what can be done now.",
              "Balanced planning adapts the lens to the need of the moment.",
            ],
            reflectionPrompt:
              "Name one possibility you see clearly, then write the first structured checkpoint that would help it become real.",
            slug: "planning-with-purpose",
            summary:
              "Turns the Plan tendency into a practical rhythm for vision, structure, and follow-through.",
            title: "Planning with Purpose",
          },
        ],
      },
      {
        slug: "action",
        title: "Module 2: Decisions and Follow-Through",
        lessons: [
          {
            body: [
              "Deciding is where direction meets discernment. Some decisions begin with internal conviction and relational awareness; others need structured reasoning, criteria, and comparison.",
              "A Feel It pattern does not mean emotional guessing. At its healthiest, it notices people, atmosphere, conviction, and the hidden cost of a choice. It becomes stronger when paired with reflection and wise structure.",
              "The course should help learners make room for prayer, counsel, and clarity before a decision becomes a commitment.",
            ],
            focus: [
              "Notice the people and atmosphere affected by a choice.",
              "Add structure before committing to direction.",
              "Separate Spirit-led conviction from pressure, fear, or avoidance.",
            ],
            reflectionPrompt:
              "What decision in front of you needs both relational awareness and a clearer decision frame?",
            slug: "deciding-with-discernment",
            summary:
              "Explores how the Decide tendency can become wiser through conviction, structure, and prayerful reflection.",
            title: "Deciding with Discernment",
          },
          {
            body: [
              "Doing is where design becomes visible. Some people move best when they can carry ownership alone. Others become clearer and more faithful when they move with people beside them.",
              "A Together action pattern does not mean dependence. It means shared energy, conversation, accountability, and co-labor may be part of how the person is designed to carry work well.",
              "The course should help the learner choose an action rhythm that is honest about capacity: what they can carry, what needs partnership, and what should wait.",
            ],
            focus: [
              "Action needs a rhythm that matches the person's real wiring.",
              "Together does not mean weak; it may mean relationally sustained.",
              "Follow-through improves when the next step is small, named, and supported.",
            ],
            reflectionPrompt:
              "What next step would become healthier if you invited the right person into it?",
            slug: "doing-with-support",
            summary:
              "Connects the Do tendency to ownership, partnership, and realistic follow-through.",
            title: "Doing With Support",
          },
        ],
      },
      {
        slug: "integration",
        title: "Module 3: Sustainable Alignment",
        lessons: [
          {
            body: [
              "Plan, Decide, and Do are most useful when they are read together. A person may dream broadly, decide relationally, and act best with support. Another person may plan concretely, decide analytically, and act independently.",
              "The point is not to admire the pattern. The point is to build a repeatable alignment rhythm that helps a learner steward work, relationships, ministry, and decisions without violating how they are made.",
              "The app can eventually turn this module into a weekly alignment tool: current decision, needed structure, needed people, next step, and review date.",
            ],
            focus: [
              "Read Plan, Decide, and Do as one movement pattern.",
              "Name what the pattern needs to stay healthy.",
              "Turn the pattern into a weekly alignment rhythm.",
            ],
            reflectionPrompt:
              "Write one sentence that names how you plan, decide, and do when you are healthy.",
            slug: "integrating-plan-decide-do",
            summary:
              "Pulls the three DesignPD movements into one practical alignment rhythm.",
            title: "Integrating Plan, Decide, and Do",
          },
          {
            body: [
              "A design pattern becomes sustainable when it has guardrails. Guardrails may include calendar blocks, decision criteria, prayer checkpoints, shared agreements, rest rhythms, or a simple review question.",
              "The learner should leave DesignPD with a small operating agreement they can use in work, marriage, ministry, or leadership.",
              "This lesson can eventually connect to Design Pathways by turning the agreement into one short experiment with a start date, support person, and review moment.",
            ],
            focus: [
              "Sustainability needs guardrails, not just motivation.",
              "A personal operating agreement makes the pattern usable.",
              "Healthy follow-through should be reviewed, adjusted, and practiced.",
            ],
            reflectionPrompt:
              "What guardrail would protect your best way of moving for the next two weeks?",
            slug: "building-a-sustainable-rhythm",
            summary:
              "Helps the learner draft a simple operating agreement for healthier movement.",
            title: "Building a Sustainable Rhythm",
          },
        ],
      },
    ],
    price: "Included with DesignPD",
    slug: "designpd-alignment",
    sourceNote:
      "Built from the DesignPD mirrored report fields: Plan, Decide, Do tendencies, descriptors, core blocks, and growth practices.",
    tagline: "Plan. Decide. Do.",
    title: "DesignPD Alignment",
  },
  {
    accent: "gold",
    assessmentType: "spiritual_gifts",
    companionNote:
      "Dydi should connect gift language to humble service, maturity, Scripture, community confirmation, and the broader Gifts chapter of the DYDD journey.",
    description:
      "A companion class for reading Spiritual Gifts results as grace for service rather than badges of importance.",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    modules: [
      {
        slug: "orientation",
        title: "Module 1: Gifts as Grace",
        lessons: [
          {
            body: [
              "Spiritual gifts are not trophies. They are grace given for the building up of the Body of Christ. The class should keep the learner close to humility, love, maturity, and service.",
              "The assessment can name likely patterns, but the result should be confirmed over time through Scripture, community, fruit, and faithful use.",
              "Heather's sample Spiritual Gifts snapshot can show the page how to surface top gifts, scores, blurbs, growth areas, and next steps from the real mirrored data.",
            ],
            focus: [
              "Gifts are given by the Spirit for service.",
              "Results should invite confirmation, not self-importance.",
              "Maturity matters as much as naming the gift.",
            ],
            reflectionPrompt:
              "Where have others already experienced grace through the way God works through you?",
            slug: "welcome-to-spiritual-gifts",
            summary:
              "Frames the Spiritual Gifts class around service, maturity, and humble confirmation.",
            title: "Welcome to Spiritual Gifts",
          },
          {
            body: [
              "A top gift is a starting point for stewardship. The learner should ask how the gift expresses love, where it needs maturity, and what kind of serving environment helps it bless others.",
              "The class should make the result actionable: one gift, one maturity invitation, one place to serve, and one trusted person who can confirm what they see.",
              "When Heather's sample is active, the lesson can pull the top gift names and supporting language directly from her latest Spiritual Gifts result.",
            ],
            focus: [
              "Read the top gifts as service invitations.",
              "Pair each gift with maturity practices.",
              "Ask for confirmation from people who see your life closely.",
            ],
            reflectionPrompt:
              "Choose one top gift and write one humble way to use it to build someone up this week.",
            slug: "reading-your-top-gifts",
            summary:
              "Shows how to turn top Spiritual Gifts results into a service-oriented next step.",
            title: "Reading Your Top Gifts",
          },
        ],
      },
      {
        slug: "formation",
        title: "Module 2: Maturity and Service",
        lessons: [
          {
            body: [
              "Every gift has a mature expression and an immature distortion. The class should help learners receive encouragement without skipping formation.",
              "Growth areas are not accusations. They are places to invite the Spirit, Scripture, accountability, and practice.",
              "A strong gift becomes safer and more fruitful when it is governed by love.",
            ],
            focus: [
              "Name mature and immature expressions.",
              "Use growth areas as formation prompts.",
              "Let love govern how gifts are practiced.",
            ],
            reflectionPrompt:
              "What is one maturity practice that would make your strongest gift safer for others?",
            slug: "maturity-matters",
            summary:
              "Connects gift strength to maturity, humility, and the fruit of the Spirit.",
            title: "Maturity Matters",
          },
          {
            body: [
              "Gifts become trustworthy when they are practiced inside the Body of Christ. A private result becomes more mature when people who know the learner can recognize fruit, safety, love, and service.",
              "Confirmation should be gentle and practical. The learner does not need a dramatic title. They need a place to serve, people to listen to, and feedback that helps the gift grow in love.",
              "This lesson should help churches use the assessment without turning it into a label system.",
            ],
            focus: [
              "Community confirmation keeps gifts grounded.",
              "A gift should build others up in love.",
              "A serving experiment is often better than a permanent assignment.",
            ],
            reflectionPrompt:
              "Who could help you confirm where your gifts are already serving others well?",
            slug: "confirmed-in-community",
            summary:
              "Moves the learner from private gift results into community confirmation and humble service.",
            title: "Confirmed in Community",
          },
        ],
      },
      {
        slug: "practice",
        title: "Module 3: Gifts in Motion",
        lessons: [
          {
            body: [
              "A spiritual gift becomes clearer as it is practiced. The learner should choose one small serving experiment, use the gift with humility, and notice what fruit appears.",
              "This is not about proving a gift. It is about serving faithfully and watching what God confirms through people, peace, fruit, and wise counsel.",
              "The course can eventually let the learner connect a top gift to a ministry area, a next step, and a follow-up conversation.",
            ],
            focus: [
              "Choose one serving experiment instead of trying to solve everything.",
              "Look for fruit, peace, confirmation, and humility.",
              "Let the experiment clarify the next faithful step.",
            ],
            reflectionPrompt:
              "What small serving experiment could help you practice one gift this week?",
            slug: "choose-a-serving-experiment",
            summary:
              "Turns gift language into a simple, humble serving experiment.",
            title: "Choose a Serving Experiment",
          },
          {
            body: [
              "Spiritual Gifts should eventually sit beside DesignID inside the DYDD journey. DesignID can describe how a person naturally reflects God's image; gifts can help name how the Spirit may empower them to build others up.",
              "The learner should notice where the two agree, where they feel different, and what new serving possibilities emerge when both are read with prayer.",
              "This lesson can later feed directly into the Gifts chapter of the main DYDD course.",
            ],
            focus: [
              "DesignID and Spiritual Gifts are different mirrors.",
              "Overlap can reveal a strong service lane.",
              "Difference can reveal growth, stretching, or partnership needs.",
            ],
            reflectionPrompt:
              "Where do your gifts and design seem to agree, and where do they stretch each other?",
            slug: "gifts-and-designid-together",
            summary:
              "Places Spiritual Gifts beside DesignID so the learner can see both design and empowerment.",
            title: "Gifts and DesignID Together",
          },
        ],
      },
    ],
    price: "Free assessment",
    slug: "spiritual-gifts-service",
    sourceNote:
      "Built from the Spiritual Gifts mirrored result fields: top gift names, scores, blurbs, maturity descriptions, growth areas, signs of immaturity, and steps to grow.",
    tagline: "Gifts for service",
    title: "Spiritual Gifts in Service",
  },
  {
    accent: "sage",
    assessmentType: "design_pathways",
    companionNote:
      "Dydi should help the learner turn assessment insight into a simple pathway: direction, experiment, support, review, and adjustment.",
    description:
      "A discernment class for choosing a faithful next path, testing it through small experiments, and learning without getting stuck.",
    logo: "/brand/tools/design-pathways-logo.jpg",
    modules: [
      {
        slug: "orientation",
        title: "Module 1: Find the Path",
        lessons: [
          {
            body: [
              "Design Pathways is the bridge between insight and movement. It helps the learner ask what direction is emerging, what doors are open, what experiments are wise, and what support is needed.",
              "The goal is not to predict the whole future. The goal is to discern the next faithful path and move with enough clarity to learn.",
              "This course framework should eventually connect DesignID, Spiritual Gifts, DesignPD, and FruitLife 360 into practical pathway decisions.",
            ],
            focus: [
              "A pathway is a direction to test, not a permanent label.",
              "Discernment can move through small experiments.",
              "The learner should look for convergence across desire, design, gifts, and fruit.",
            ],
            reflectionPrompt:
              "What path seems to be opening in front of you right now?",
            slug: "welcome-to-design-pathways",
            summary:
              "Introduces Design Pathways as the discernment bridge between assessment insight and faithful movement.",
            title: "Welcome to Design Pathways",
          },
          {
            body: [
              "A pathway should be named clearly enough to test. Vague language like 'help people' can become more useful when it names who, how, where, and why.",
              "The learner can begin by gathering signals: repeated burdens, encouragement from others, visible fruit, skill, opportunity, and holy desire.",
              "This lesson will eventually help the learner select one possible path from several options without feeling locked into it forever.",
            ],
            focus: [
              "Name the path in plain language.",
              "Gather evidence from design, gifts, fruit, desire, story, and opportunity.",
              "Choose one path to test first.",
            ],
            reflectionPrompt:
              "Write one possible pathway sentence using who, how, where, and why.",
            slug: "name-a-possible-path",
            summary:
              "Helps the learner turn broad purpose language into a testable pathway sentence.",
            title: "Name a Possible Path",
          },
        ],
      },
      {
        slug: "experiment",
        title: "Module 2: Test the Path",
        lessons: [
          {
            body: [
              "A faithful experiment is small enough to finish and meaningful enough to teach the learner something. It could be a conversation, a service opportunity, a workshop outline, a volunteer role, a prototype, or a one-week rhythm.",
              "Experiments reduce pressure. The learner does not need to know whether this is the final answer. They need to notice what happens when they act faithfully with wisdom.",
              "The course should make experiment design practical: action, date, people involved, support needed, and what evidence will be reviewed.",
            ],
            focus: [
              "Make the experiment small, specific, and time-bound.",
              "Decide what evidence will matter before starting.",
              "Invite support where the path needs partnership.",
            ],
            reflectionPrompt:
              "What is one two-week experiment that could test your possible pathway?",
            slug: "build-a-small-experiment",
            summary:
              "Turns a possible pathway into a small experiment with support and review criteria.",
            title: "Build a Small Experiment",
          },
          {
            body: [
              "Experiments should be reviewed gently. The question is not merely whether the learner succeeded. The better question is what became clearer.",
              "A good review notices energy, fruit, resistance, skill, confirmation, open doors, closed doors, and what still needs maturity.",
              "This lesson should later connect to a pathway review tool that helps the learner continue, adjust, pause, or choose a different experiment.",
            ],
            focus: [
              "Review for clarity, not just success.",
              "Notice fruit, confirmation, resistance, and capacity.",
              "Choose whether to continue, adjust, pause, or test another path.",
            ],
            reflectionPrompt:
              "What did your experiment reveal that you did not know before?",
            slug: "review-what-you-learned",
            summary:
              "Gives the learner a simple review rhythm for learning from pathway experiments.",
            title: "Review What You Learned",
          },
        ],
      },
      {
        slug: "direction",
        title: "Module 3: Choose the Next Faithful Step",
        lessons: [
          {
            body: [
              "After a learner tests a pathway, the next step should become clearer. Sometimes the step is to continue. Sometimes it is to shrink the idea, invite help, get training, or stop forcing a door that is not open.",
              "Design Pathways should help the learner move with peace and responsibility rather than pressure.",
              "This can become one of the most practical companion courses because it turns reflection into experiments, review, and next steps.",
            ],
            focus: [
              "Discernment includes continuing, adjusting, pausing, or stopping.",
              "The next faithful step should fit the learner's current season.",
              "Pathway language can feed the final niche declaration later.",
            ],
            reflectionPrompt:
              "What is the next faithful step that fits your current season?",
            slug: "choose-the-next-step",
            summary:
              "Helps the learner choose a realistic next step after reviewing a pathway experiment.",
            title: "Choose the Next Faithful Step",
          },
        ],
      },
    ],
    price: "Free assessment",
    slug: "design-pathways-discernment",
    sourceNote:
      "Built as a first app-native framework for Design Pathways: direction, experiments, review, support, and next-step discernment.",
    tagline: "Discern. Test. Adjust.",
    title: "Design Pathways Discernment",
  },
  {
    accent: "blue",
    assessmentType: "fruit_360",
    companionNote:
      "Dydi should treat FruitLife as formation feedback: encouragement, pressure awareness, and next practices, never shame or fixed identity.",
    description:
      "A formation class for reading visible fruit, pressure patterns, and growth invitations with prayer, humility, and practice.",
    logo: "/brand/tools/fruitful-life-360-logo.jpg",
    modules: [
      {
        slug: "orientation",
        title: "Module 1: Reading Fruit Faithfully",
        lessons: [
          {
            body: [
              "FruitLife 360 is different from a design assessment. It is not primarily naming wiring; it is helping a learner notice visible fruit and formation invitations in a particular season.",
              "The report should be read with gratitude first. Visible fruit is encouragement. Growth invitations are not condemnation. Pressure vulnerabilities are places to prepare before stress rises.",
              "Heather's sample FruitLife 360 snapshot is already mirrored. It shows a self-only report with Goodness, Faithfulness, and Kindness as most visible fruit.",
            ],
            focus: [
              "Read visible fruit as encouragement.",
              "Read growth invitations as places for grace and practice.",
              "Read pressure patterns before the next stressful moment arrives.",
            ],
            reflectionPrompt:
              "Where can you thank God for visible fruit before trying to improve anything?",
            slug: "welcome-to-fruitlife-360",
            summary:
              "Introduces FruitLife 360 as a formation mirror for visible fruit and pressure-aware growth.",
            title: "Welcome to FruitLife 360",
          },
          {
            body: [
              "The most visible fruit list should become worship before it becomes analysis. If Goodness, Faithfulness, and Kindness are visible, the first response is gratitude for the work of the Spirit.",
              "The learner can then ask how those fruits become more steady, more humble, and more useful in ordinary relationships.",
              "The lesson page should show Heather's current fruit lists, practices, and pressure notes so the visual review tomorrow can correct both content and layout quickly.",
            ],
            focus: [
              "Start with gratitude for what is already visible.",
              "Notice where visible fruit blesses real people.",
              "Choose one small practice that strengthens steadiness.",
            ],
            reflectionPrompt:
              "Choose one visible fruit and write the ordinary situation where you want it to become more steady.",
            slug: "visible-fruit",
            summary:
              "Turns most-visible fruit into gratitude, steadiness, and a small practice for the week.",
            title: "Visible Fruit and Gratitude",
          },
        ],
      },
      {
        slug: "growth",
        title: "Module 2: Pressure and Growth",
        lessons: [
          {
            body: [
              "Pressure does not create a new person; it often reveals where formation still needs support. FruitLife pressure notes help the learner prepare with prayer, boundaries, conversations, and practices.",
              "A pressure vulnerability should be handled gently. The goal is not to stare at weakness. The goal is to build a faithful response before the next pressure moment.",
              "For Heather's sample, Self-control, Gentleness, and Patience appear in pressure change notes, giving the page a useful visual stress-test for formation prompts.",
            ],
            focus: [
              "Pressure notes are preparation, not accusation.",
              "Growth invitations need prayer and a concrete practice.",
              "Trusted conversation can help fruit remain steady under strain.",
            ],
            reflectionPrompt:
              "What pressure moment should you prepare for before it arrives again?",
            slug: "pressure-patterns",
            summary:
              "Helps the learner turn pressure vulnerability into preparation and Spirit-led practice.",
            title: "Pressure Patterns",
          },
          {
            body: [
              "A growth invitation should be received as an invitation, not a verdict. The learner can choose one fruit, one ordinary situation, and one practice that makes obedience more concrete.",
              "FruitLife becomes more powerful when it is reviewed over time. A single report gives a snapshot; repeated reviews can show formation, pressure patterns, and encouragement.",
              "This lesson can later connect directly to the native FruitLife report process already being built in the app.",
            ],
            focus: [
              "Choose one growth invitation instead of trying to improve everything.",
              "Attach the practice to an ordinary relationship or pressure point.",
              "Let repeated review show formation over time.",
            ],
            reflectionPrompt:
              "Which one fruit invitation should become your next small formation practice?",
            slug: "choose-one-growth-practice",
            summary:
              "Turns FruitLife growth invitations into one concrete practice for ordinary life.",
            title: "Choose One Growth Practice",
          },
        ],
      },
      {
        slug: "conversation",
        title: "Module 3: Feedback and Formation Conversations",
        lessons: [
          {
            body: [
              "FruitLife 360 can include observer feedback, which means the learner needs a healthy way to receive outside perspective. Feedback should be handled with humility, boundaries, and prayer.",
              "The learner should look for themes rather than reacting to every sentence. What do trusted people consistently see? What surprises the learner? What encourages them?",
              "This module can later help the user invite observers, review the report, and prepare one healthy follow-up conversation.",
            ],
            focus: [
              "Receive feedback as formation input, not personal attack.",
              "Look for themes and repeated language.",
              "Prepare one healthy conversation after reviewing the report.",
            ],
            reflectionPrompt:
              "What feedback theme deserves prayer, gratitude, or a follow-up conversation?",
            slug: "receiving-360-feedback",
            summary:
              "Prepares the learner to receive observer feedback with humility and clarity.",
            title: "Receiving 360 Feedback",
          },
          {
            body: [
              "A formation plan should be light enough to practice and clear enough to review. The learner can choose a fruit, a pressure pattern, a practice, a support person, and a date to look again.",
              "FruitLife should not end at a report. It should lead to a small, prayerful practice and a rhythm of noticing the Spirit's work over time.",
              "This lesson can become the course bridge into the next FruitLife 360 assessment cycle.",
            ],
            focus: [
              "Choose one fruit, one practice, and one review rhythm.",
              "Invite support without overexposing private feedback.",
              "Treat growth as formation over time.",
            ],
            reflectionPrompt:
              "What simple formation plan do you want to carry for the next 30 days?",
            slug: "build-a-formation-plan",
            summary:
              "Closes the FruitLife course by turning the report into a small formation plan.",
            title: "Build a Formation Plan",
          },
        ],
      },
    ],
    price: "Free assessment",
    slug: "fruitlife-360-formation",
    sourceNote:
      "Built from the FruitLife 360 report export: most visible fruit, steady forming fruit, growth invitations, pressure vulnerabilities, fruit summaries, and practices.",
    tagline: "Formation over time",
    title: "FruitLife 360 Formation",
  },
  {
    accent: "clay",
    assessmentType: null,
    companionNote:
      "Dydi should synthesize assessment records with workbook responses across Identity, Expertise, Story, Desire, Gifts, and Niche.",
    description:
      "The main DYDD journey class that gathers the book, workbook, assessment tools, and niche declaration into a guided formation path.",
    logo: "/brand/dydd-logo.webp",
    modules: [
      {
        slug: "orientation",
        title: "Module 1: The Journey Door",
        lessons: [
          {
            body: [
              "The Discover Your Divine Design journey is the larger path that holds the individual tools together. DesignID, DesignPD, Spiritual Gifts, and FruitLife 360 become supporting mirrors inside a deeper discipleship and purpose process.",
              "The class rhythm should be simple and repeatable: Connect, Act, Reflect, Explore. Each stage helps the learner move from content into a faithful next step.",
              "The digital journey is already mapped into stages for Identity, Expertise, Story, Desire, Gifts, and Niche. This course view gives that map a class-style doorway for tomorrow's visual review.",
            ],
            focus: [
              "The assessments support the journey; they do not replace it.",
              "The DESIGN framework moves toward a niche declaration.",
              "Each lesson needs reflection, action, and companion context.",
            ],
            reflectionPrompt:
              "What part of the journey feels most alive right now: Identity, Expertise, Story, Desire, Gifts, or Niche?",
            slug: "welcome-to-the-dydd-journey",
            summary:
              "Places the full DYDD journey above the tools and frames the path toward niche, calling, and faithful action.",
            title: "Welcome to the DYDD Journey",
          },
          {
            body: [
              "A learner can collect reports and still miss the deeper invitation. The journey class should help them listen for what God is forming, what has been entrusted, and what next faithful experiment is becoming clear.",
              "The app can already show assessment artifacts, course trailheads, and the journey map. The next stage is tying those into a single guided flow that feels like a path rather than a dashboard.",
              "Heather's sample lets the visual system show a real blend: Shepherd and Steward DesignID language, DesignPD movement patterns, Spiritual Gifts, and FruitLife formation feedback.",
            ],
            focus: [
              "Gather the assessment mirrors in one place.",
              "Translate insight into a declaration and a next faithful experiment.",
              "Keep the journey relational, biblical, and practical.",
            ],
            reflectionPrompt:
              "What insight from one assessment needs to become a sentence in your niche declaration?",
            slug: "from-assessments-to-niche",
            summary:
              "Shows how the individual assessment tools feed the main journey and niche declaration.",
            title: "From Assessments to Niche",
          },
        ],
      },
    ],
    price: "Paid access",
    slug: "discover-your-divine-design",
    sourceNote:
      "Built from the DYDD class deck, book, workbook, leaders playbook, and the existing app journey map.",
    tagline: "On Purpose, For Purpose",
    title: "Discover Your Divine Design",
  },
] as const satisfies CourseDefinition[];

export const allCourseSummaries = [
  {
    assessmentType: "designid",
    description: designIdCourse.description,
    hrefBase: "/courses/designid-foundations",
    logo: "/brand/tools/designid-logo.webp",
    moduleCount: designIdCourse.modules.length,
    price: "Included with DesignID",
    slug: designIdCourse.slug,
    title: designIdCourse.title,
  },
  ...learningCourses.map((course) => ({
    assessmentType: course.assessmentType,
    description: course.description,
    hrefBase: `/courses/${course.slug}`,
    logo: course.logo,
    moduleCount: course.modules.length,
    price: course.price,
    slug: course.slug,
    title: course.title,
  })),
];

export function getLearningCourse(slug: string) {
  return learningCourses.find((course) => course.slug === slug);
}

export function getLearningLessons(course: CourseDefinition) {
  return course.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
    })),
  );
}

export function getLearningLesson(courseSlug: string, lessonSlug: string) {
  const course = getLearningCourse(courseSlug);

  if (!course) {
    return null;
  }

  const lessons = getLearningLessons(course);
  const lesson = lessons.find((item) => item.slug === lessonSlug);

  return lesson ? { course, lesson, lessons } : null;
}

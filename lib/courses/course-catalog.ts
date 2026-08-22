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

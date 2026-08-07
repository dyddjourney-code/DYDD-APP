export type DesignIdLesson = {
  slug: string;
  title: string;
  sourceTitle: string;
  summary: string;
  focus: string[];
};

export type DesignIdModule = {
  slug: string;
  title: string;
  lessons: DesignIdLesson[];
};

export const designIdCourse = {
  slug: "designid-foundations",
  title: "DesignID Foundations",
  source:
    "DesignIDCourseCode---40bef919-638d-4f9b-8a2a-0fb09597b63a.txt",
  description:
    "A first app-native pass of the GHL DesignID course, organized for the DYDD school journey.",
  modules: [
    {
      slug: "welcome",
      title: "Module 1: Welcome",
      lessons: [
        {
          slug: "welcome-to-designid",
          title: "Welcome to DesignID",
          sourceTitle: "Welcome to DesignID",
          summary:
            "Orients the learner to DesignID as a meaningful first step in the broader Discover Your Divine Design journey.",
          focus: [
            "DesignID is language for how God has shaped a person.",
            "The class helps the learner understand results and begin applying them.",
            "The journey starts with receiving the assessment as an invitation.",
          ],
        },
        {
          slug: "biblical-foundation",
          title: "The Biblical Foundation of Your DesignID",
          sourceTitle: "The Bibilcal Foundation of Your DesignID",
          summary:
            "Frames DesignID in the image of God, the language of reflection, and the call to let God's light shine through a person's life.",
          focus: [
            "Identity begins in the image of God, not in an assessment label.",
            "The four reflections illuminate rather than limit God's design.",
            "Reflection becomes visible through love, communication, and action.",
          ],
        },
        {
          slug: "saved-by-grace",
          title: "Saved By Grace",
          sourceTitle: "Saved By Grace",
          summary:
            "Connects divine design to grace as both unmerited favor and holy enablement for the good works God prepared.",
          focus: [
            "Grace is received before design is applied.",
            "Grace activates, empowers, sustains, and restores.",
            "Whose you are anchors the value of who you are.",
          ],
        },
        {
          slug: "on-purpose-for-purpose",
          title: "On Purpose - For Purpose",
          sourceTitle: "On Purpose - for Purpose",
          summary:
            "Builds from Ephesians 2:10 into the purpose language of DYDD: created intentionally and invited into meaningful good work.",
          focus: [
            "People are God's handiwork, not self-made projects.",
            "Purpose grows from identity, grace, and faithful action.",
            "DesignID helps name patterns of creation, clarity, compassion, and faithfulness.",
          ],
        },
      ],
    },
    {
      slug: "understanding-results",
      title: "Module 2: Understanding Your DesignID Report Results",
      lessons: [
        {
          slug: "what-is-in-the-report",
          title: "What Is in the Report",
          sourceTitle: "What is in teh report",
          summary:
            "Introduces the parts of the DesignID report and helps learners read results as a guided map rather than a fixed label.",
          focus: [
            "The report is a starting point for reflection.",
            "Scores, summaries, and language work together.",
            "The learner should look for clarity, conviction, and invitation.",
          ],
        },
        {
          slug: "your-design-profile",
          title: "Your Design Profile",
          sourceTitle: "Your Design Profile",
          summary:
            "Explains primary, secondary, and blended reflections so the learner can understand their personal design pattern.",
          focus: [
            "Primary and secondary reflections describe recurring grace patterns.",
            "The profile gives language for how a person naturally contributes.",
            "The goal is stewardship, not comparison.",
          ],
        },
        {
          slug: "reflection-capacity",
          title: "Reflection Capacity",
          sourceTitle: "Reflection Capacity",
          summary:
            "Helps the learner notice where capacity is abundant, stretched, limited, or in need of partnership and rest.",
          focus: [
            "Capacity affects how reflections show up in real life.",
            "Low capacity is information, not failure.",
            "Healthy rhythms include boundaries, rest, and collaboration.",
          ],
        },
        {
          slug: "integrative-reflections",
          title: "Integrative Reflections",
          sourceTitle: "Integrative REflections",
          summary:
            "Shows how the reflections blend into a more complete picture of how a person learns, contributes, and responds.",
          focus: [
            "Integration is often where the report becomes personal.",
            "Reflection blends can explain tensions and strengths.",
            "The learner can use this language in work, family, and ministry.",
          ],
        },
        {
          slug: "learning-and-contribution",
          title: "Learning and Contribution",
          sourceTitle: "Learning and Contribution",
          summary:
            "Connects report insights to the learner's preferred learning patterns and practical contribution to the body of Christ.",
          focus: [
            "Design shapes how a person receives, processes, and contributes.",
            "Learning patterns can become practical growth strategies.",
            "Contribution becomes healthier when design and grace work together.",
          ],
        },
        {
          slug: "shadow-reflections",
          title: "Shadow Reflections",
          sourceTitle: "Shadow Reflections",
          summary:
            "Names the shadow side of each reflection as an area for awareness, redemption, and Spirit-led growth.",
          focus: [
            "Shadow language should produce awareness, not shame.",
            "Strengths can distort under pressure or disconnection.",
            "Redemption turns shadow patterns into places of formation.",
          ],
        },
      ],
    },
    {
      slug: "next-steps",
      title: "Module 3: What's Next?",
      lessons: [
        {
          slug: "beautiful-journey",
          title: "You've Begun a Beautiful Journey",
          sourceTitle: "You've Begun a Beautiful Journey",
          summary:
            "Encourages the learner to keep walking forward with curiosity, prayer, and practical application.",
          focus: [
            "The assessment is a doorway, not the destination.",
            "The next step is faithful application in ordinary life.",
            "Design becomes clearer as it is practiced.",
          ],
        },
        {
          slug: "exploring-the-dydd-ecosystem",
          title: "Exploring the DYDD Ecosystem",
          sourceTitle: "Exploring the DYDD Ecosystem",
          summary:
            "Places DesignID inside the full DYDD ecosystem of identity, expertise, story, desire, gifts, and niche.",
          focus: [
            "DesignID supports the larger Discover Your Divine Design pathway.",
            "The learner can branch into classes, workbooks, and companion-guided reflection.",
            "The HQ should eventually become the launching point for the full journey.",
          ],
        },
        {
          slug: "call-to-arms",
          title: "Call To Arms",
          sourceTitle: "Call To Arms",
          summary:
            "A closing invitation to live DesignID with courage, humility, service, and purpose.",
          focus: [
            "The learner is invited to respond, not merely understand.",
            "Design is meant to serve God and others.",
            "The course closes by sending the learner forward with purpose.",
          ],
        },
      ],
    },
  ],
} as const;

export const designIdLessons = designIdCourse.modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title })),
);

export function getDesignIdLesson(slug: string) {
  return designIdLessons.find((lesson) => lesson.slug === slug);
}

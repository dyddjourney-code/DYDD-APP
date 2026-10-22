import type { CompanionMoment } from "@/lib/courses/companion-moments";
import { dyddJourneyCompanionMoments } from "@/lib/courses/course-companion-moment-data";

export type DyddCourseUnitType =
  | "orientation"
  | "normal"
  | "assessment-link"
  | "designid-reflection"
  | "workbook-checkpoint"
  | "pathfinder"
  | "completion";
export type JourneyLessonBlock =
  | { type: "paragraph" | "heading"; text: string }
  | { type: "table"; headers: string[]; rows: string[][]; label: string }
  | { type: "list"; items: string[] }
  | { type: "scripture"; text: string; reference: string }
  | { type: "image"; src: string; alt: string }
  | { type: "link"; href: string; text: string };

export type DyddCourseUnit = {
  row: number;
  slug: string;
  type: DyddCourseUnitType;
  typeLabel: string;
  section: string;
  title: string;
  duration: string;
  bookPages?: string;
  workbookSection?: string;
  workbookPages?: string;
  notes?: string;
  lessonMainIdea: string;
  anchorScripture?: string;
  focus?: string[];
  media?: {
    image?: string;
    label: string;
    type: "image" | "video";
    additionalImages?: { image: string; label: string }[];
  };
  companionMoment?: CompanionMoment;
  companionMomentPosition?: "before-teaching" | "after-teaching";
  closingScripture?: { text: string; reference: string };
  practice?: {
    prompt: string;
    title: string;
  };
  lessonBody?: JourneyLessonBlock[];
  contentStatus?: "draft";
  assessmentTarget?: "designid";
  teachingBlocks: string[];
};
export type DyddCourseModule = {
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  units: DyddCourseUnit[];
};
export const dyddMainCourseOutline: DyddCourseModule[] = [
  {
    slug: "welcome-and-orientation",
    title: "Welcome & Orientation",
    kicker: "1: Welcome & Orientation",
    summary: "Begin your journey with room to reflect and discover your God-given design.",
    units: [
      {
        row: 2,
        slug: "welcome-and-orientation-welcome-to-discover-your-divine-design-2",
        type: "orientation",
        section: "Welcome & Orientation",
        title: "Welcome to Discover Your Divine Design",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "You are On Purpose and you are For Purpose.",
        focus: [
          "Welcome",
          "A Journey - not a destination"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/1b3445f5-4111-4eea-b140-ef3e50b11c10/photo_2026-07-24_10-52-05+23.jpg?format=2500w",
          "label": "Welcome to your Discover Your Divine Design journey",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "We are pleased to welcome to the Discover Your Divine Design Journey! This course is the heart of the DYDD ecosystem and the best place to start. Our prayer for your journey is that you are able to fully grasp that you are On Purpose and that you are For Purpose."
          },
          {
            "type": "scripture",
            "text": "For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
            "reference": "Ephesians 2:10"
          },
          {
            "type": "paragraph",
            "text": "You are extremely valuable. In Ephesians 2:10, God calls you His handiwork. Think of this as a materpiece, a work of art, or His poetry. You are no accident, you are On Purpose. The second half of the verse says that God has planned good works for us to do. We are not intended to sit on the sidelines. Our relational journey with Jesus is intended to be action oriented. You are For Purpose. Jesus wants to be part of the Good Work Force, carrying out His mission through love and service."
          },
          {
            "type": "paragraph",
            "text": "This is a journey. If you dig, you will find your divine design. This is a process and not a destination. The intent is to help you discover new perspective and utilize your highly valuable and unique contribution to enage."
          }
        ],
        teachingBlocks: [
          "We are pleased to welcome to the Discover Your Divine Design Journey! This course is the heart of the DYDD ecosystem and the best place to start. Our prayer for your journey is that you are able to fully grasp that you are On Purpose and that you are For Purpose.",
          "You are extremely valuable. In Ephesians 2:10, God calls you His handiwork. Think of this as a materpiece, a work of art, or His poetry. You are no accident, you are On Purpose. The second half of the verse says that God has planned good works for us to do. We are not intended to sit on the sidelines. Our relational journey with Jesus is intended to be action oriented. You are For Purpose. Jesus wants to be part of the Good Work Force, carrying out His mission through love and service.",
          "This is a journey. If you dig, you will find your divine design. This is a process and not a destination. The intent is to help you discover new perspective and utilize your highly valuable and unique contribution to enage."
        ],
        companionMoment: dyddJourneyCompanionMoments.welcome,
      },
      {
        row: 3,
        slug: "welcome-and-orientation-course-outline-and-objectives-3",
        type: "orientation",
        section: "Welcome & Orientation",
        title: "Course Outline & Objectives",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "God created you on purpose—with a design worth discovering.",
        focus: [
          "Outline",
          "Objectives"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/f006dfd8-a675-4d08-bf97-46a3eaa0eb96/ChatGPT+Image+Jul+18%2C+2025%2C+09_10_53+AM.png?format=2500w",
          "label": "The six areas of Discover Your Divine Design",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "God created you on purpose—with a design worth discovering. This journey will help you recognize the threads He has woven into your life and consider how to put them into practice."
          },
          {
            "type": "paragraph",
            "text": "Together, we’ll explore six areas:"
          },
          {
            "type": "list",
            "items": [
              "Identity — How you are uniquely designed.",
              "Expertise — The abilities and experience you have developed.",
              "Story — The experiences that have shaped you.",
              "Desire — The interests and burdens that move your heart.",
              "Gifts — How God has equipped you to serve others.",
              "Niche — Where these discoveries come together in meaningful contribution."
            ]
          },
          {
            "type": "paragraph",
            "text": "By the end, you’ll have a clearer understanding of your design, words to express it, and practical next steps for living it out."
          },
          {
            "type": "paragraph",
            "text": "You don’t need to have your purpose figured out before you begin. That’s what this journey is for."
          }
        ],
        teachingBlocks: [
          "God created you on purpose—with a design worth discovering. This journey will help you recognize the threads He has woven into your life and consider how to put them into practice.",
          "Together, we’ll explore six areas:",
          "By the end, you’ll have a clearer understanding of your design, words to express it, and practical next steps for living it out.",
          "You don’t need to have your purpose figured out before you begin. That’s what this journey is for."
        ],
      },
      {
        row: 4,
        slug: "welcome-and-orientation-how-this-journey-works-4",
        type: "orientation",
        section: "Welcome & Orientation",
        title: "How This Journey Works",
        typeLabel: "Orientation",
        duration: "4–6 min",
        lessonMainIdea: "Move through the lessons in order, at a pace that gives you room to reflect.",
        focus: [
          "Journey"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/62e375ae-3e4a-48a5-b1bf-16933b5510c8/back-side-of-young-traveler-see-the-map-in-the-dee-2024-10-18-09-26-30-utc.jpg?format=2500w",
          "label": "A traveler exploring the map",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Move through the lessons in order, at a pace that gives you room to reflect. Read or watch the teaching, consider the questions, and write honestly about what you’re discovering. This isn’t about finding impressive answers. It’s about paying attention to what God is revealing through your design and your life."
          },
          {
            "type": "paragraph",
            "text": "When it’s time to take an assessment or complete a related learning experience, the lesson will guide you. There’s no need to jump ahead or figure it all out now."
          },
          {
            "type": "paragraph",
            "text": "Your written reflections save automatically as you work and are gathered in your Field Kit—your personal place to revisit what you’re discovering. We’ll introduce the reflection tools when you reach them."
          },
          {
            "type": "paragraph",
            "text": "If you’re walking through this with a group, follow your facilitator’s schedule and come ready to share what you feel comfortable discussing."
          },
          {
            "type": "paragraph",
            "text": "Take your time. You’re not just finishing a course—you’re learning to recognize and live out your God-given design."
          }
        ],
        teachingBlocks: [
          "Move through the lessons in order, at a pace that gives you room to reflect. Read or watch the teaching, consider the questions, and write honestly about what you’re discovering. This isn’t about finding impressive answers. It’s about paying attention to what God is revealing through your design and your life.",
          "When it’s time to take an assessment or complete a related learning experience, the lesson will guide you. There’s no need to jump ahead or figure it all out now.",
          "Your written reflections save automatically as you work and are gathered in your Field Kit—your personal place to revisit what you’re discovering. We’ll introduce the reflection tools when you reach them.",
          "If you’re walking through this with a group, follow your facilitator’s schedule and come ready to share what you feel comfortable discussing.",
          "Take your time. You’re not just finishing a course—you’re learning to recognize and live out your God-given design."
        ],
      },
      {
        row: 5,
        slug: "welcome-and-orientation-course-resources-5",
        type: "orientation",
        section: "Welcome & Orientation",
        title: "Course Resources",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "You have everything you need to begin this journey.",
        focus: [
          "Resources"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/cc5ca5fa-c867-4dcd-acda-aba7873fd315/image-gen+%2823%292.png?format=2500w",
          "label": "Resources for your DYDD journey",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "You have everything you need to begin this journey. These resources will help you go deeper and put what you discover into practice."
          },
          {
            "type": "heading",
            "text": "The Book: Go Deeper"
          },
          {
            "type": "paragraph",
            "text": "The Discover Your Divine Design book is a valuable companion to this course. It provides fuller explanations and additional insight into the ideas we explore, giving you more room to understand and reflect on your God-given design. Keep it alongside you as you work through the lessons, or return to it whenever you want to explore a topic more deeply."
          },
          {
            "type": "image",
            "src": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/21f43bde-f412-4698-8329-e0ca5f779a46/Book+front+cover+on+purpose+for+purpose+Final_Updated.png?format=2500w",
            "alt": "Discover Your Divine Design book cover"
          },
          {
            "type": "heading",
            "text": "Your Workbook: Included in This Journey"
          },
          {
            "type": "paragraph",
            "text": "The Discover Your Divine Design workbook is included digitally in this journey. You’ll work through its reflection questions and activities within the course, with your responses saved in your personal Field Kit. Prefer writing by hand? A paper copy of the workbook is available to purchase, too."
          },
          {
            "type": "link",
            "href": "/gear#books",
            "text": "Get the book or a paper workbook → Visit our Gear page."
          },
          {
            "type": "heading",
            "text": "Page References Along the Way"
          },
          {
            "type": "paragraph",
            "text": "Where appropriate, each lesson will indicate the corresponding book and workbook page numbers, making it easy to follow along, read more, or complete your reflections on paper."
          },
          {
            "type": "heading",
            "text": "Other Resources"
          },
          {
            "type": "paragraph",
            "text": "Assessment instructions and any additional resources will be introduced when you need them. Keep your Bible nearby for the Scriptures we explore, and use your Field Kit to revisit your saved reflections and personal discussion reminders."
          }
        ],
        teachingBlocks: [
          "You have everything you need to begin this journey. These resources will help you go deeper and put what you discover into practice.",
          "The Discover Your Divine Design book is a valuable companion to this course. It provides fuller explanations and additional insight into the ideas we explore, giving you more room to understand and reflect on your God-given design. Keep it alongside you as you work through the lessons, or return to it whenever you want to explore a topic more deeply.",
          "The Discover Your Divine Design workbook is included digitally in this journey. You’ll work through its reflection questions and activities within the course, with your responses saved in your personal Field Kit. Prefer writing by hand? A paper copy of the workbook is available to purchase, too.",
          "Where appropriate, each lesson will indicate the corresponding book and workbook page numbers, making it easy to follow along, read more, or complete your reflections on paper.",
          "Assessment instructions and any additional resources will be introduced when you need them. Keep your Bible nearby for the Scriptures we explore, and use your Field Kit to revisit your saved reflections and personal discussion reminders."
        ],
      },
    ],
  },
  {
    slug: "what-is-dydd",
    title: "What is DYDD?",
    kicker: "2: What is DYDD?",
    summary: "Saved by grace, designed on purpose, and invited to walk in the good works God prepared for us.",
    units: [
      {
        row: 6,
        slug: "what-is-dydd-what-is-dydd-6",
        type: "orientation",
        section: "What is DYDD?",
        title: "What is DYDD?",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "Recognize how God has uniquely shaped you and where your life can contribute to His work.",
        focus: [
          "What is DYDD?"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/c003db7b-6e82-4d02-9090-8326f74f9235/DYDD-logo.jpg?format=2500w",
          "label": "Discover Your Divine Design",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Discover Your Divine Design exists to help believers recognize how God has uniquely shaped them and where their lives can contribute to His work. When a church walks through this journey together, participants begin to see themselves and one another through a new lens. Rather than simply asking where help is needed, people begin to understand how their God given design can serve the body of Christ and the world around them."
          },
          {
            "type": "paragraph",
            "text": "The goal of DYDD is not simply to complete a study or identify a label. The goal is to help believers recognize how God has designed them and to begin living more intentionally within the good works He has prepared for them. They become part of the Good Work force! As participants move forward in faith, the church often sees people serving with renewed joy, deeper purpose, and a clearer understanding of their role within the body of Christ."
          }
        ],
        teachingBlocks: [
          "Discover Your Divine Design exists to help believers recognize how God has uniquely shaped them and where their lives can contribute to His work. When a church walks through this journey together, participants begin to see themselves and one another through a new lens. Rather than simply asking where help is needed, people begin to understand how their God given design can serve the body of Christ and the world around them.",
          "The goal of DYDD is not simply to complete a study or identify a label. The goal is to help believers recognize how God has designed them and to begin living more intentionally within the good works He has prepared for them. They become part of the Good Work force! As participants move forward in faith, the church often sees people serving with renewed joy, deeper purpose, and a clearer understanding of their role within the body of Christ."
        ],
      },
      {
        row: 7,
        slug: "what-is-dydd-grace-7",
        type: "orientation",
        section: "What is DYDD?",
        title: "Grace",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "We are saved by grace, designed on purpose, and invited to walk in the good works God prepared for us.",
        focus: [
          "Saved by Grace",
          "For Good Works"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/30918f86-aa02-4167-8145-ce39e25a28f1/metal-2025-03-09-00-03-37-utc.jpg?format=500w",
          "label": "Saved by grace, designed on purpose",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "heading",
            "text": "Saved by Grace – Designed on Purpose - Walking in the Good Works Prepared for Us"
          },
          {
            "type": "scripture",
            "text": "For it is by grace you have been saved, through faith and this is not from yourselves, it is the gift of God, not by works, so that no one can boast. For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
            "reference": "Ephesians 2:8–10"
          },
          {
            "type": "paragraph",
            "text": "Discover Your Divine Design begins with the truth of this passage. Ephesians 2:8–10 reveals the full story of the Christian life. It shows how salvation begins, how God forms His people, and how He intends them to live. These verses remind us that our relationship with God begins with grace, continues through His intentional design, and unfolds through the good works He prepared for us long before we ever recognized them."
          },
          {
            "type": "paragraph",
            "text": "DYDD is built around this movement. We are saved by grace, designed on purpose, and invited to walk in the good works God prepared for us."
          },
          {
            "type": "heading",
            "text": "Saved by Grace"
          },
          {
            "type": "paragraph",
            "text": "The foundation of everything begins with grace. Salvation is not something we achieve through effort, talent, or accomplishment. It is a gift from God. We are brought into relationship with Him through faith, not through our own performance or ability."
          },
          {
            "type": "paragraph",
            "text": "This truth protects the entire journey of discovering our design. Purpose is not about earning God's approval or proving our value. Instead, it grows from the security of knowing we already belong to Him. When people understand they are saved by grace, they are free to explore how God created them without pressure, comparison, or striving."
          },
          {
            "type": "heading",
            "text": "Designed on Purpose"
          },
          {
            "type": "paragraph",
            "text": "Ephesians continues by reminding us that we are God's handiwork. The word used in this passage points to something carefully crafted, something formed with intention and care."
          },
          {
            "type": "paragraph",
            "text": "Every believer has been uniquely shaped by God. Our story, identity, experiences, abilities, desires, and spiritual gifts all reflect aspects of how He formed us. Discover Your Divine Design helps people recognize this intentional design. Rather than seeing their life as random or disconnected, participants begin to see how God has been shaping them for meaningful contribution."
          },
          {
            "type": "heading",
            "text": "Walking in Good Works Prepared for Us"
          },
          {
            "type": "paragraph",
            "text": "The passage ends with a powerful reminder. God not only saves and shapes us, He prepares a path for us to walk."
          },
          {
            "type": "paragraph",
            "text": "Good works are not something we invent for ourselves. Scripture tells us that God prepared them in advance. Our role is to recognize where He is leading and step into those opportunities with faith and obedience."
          },
          {
            "type": "paragraph",
            "text": "This is the heart of the DYDD journey. As people understand their design, they begin to see where their life can serve others, strengthen the church, and reflect the work God is already doing around them. Discovering our design is not the final goal. The goal is to live faithfully in the good works God has prepared for us."
          }
        ],
        teachingBlocks: [
          "Discover Your Divine Design begins with the truth of this passage. Ephesians 2:8–10 reveals the full story of the Christian life. It shows how salvation begins, how God forms His people, and how He intends them to live. These verses remind us that our relationship with God begins with grace, continues through His intentional design, and unfolds through the good works He prepared for us long before we ever recognized them.",
          "DYDD is built around this movement. We are saved by grace, designed on purpose, and invited to walk in the good works God prepared for us.",
          "The foundation of everything begins with grace. Salvation is not something we achieve through effort, talent, or accomplishment. It is a gift from God. We are brought into relationship with Him through faith, not through our own performance or ability.",
          "This truth protects the entire journey of discovering our design. Purpose is not about earning God's approval or proving our value. Instead, it grows from the security of knowing we already belong to Him. When people understand they are saved by grace, they are free to explore how God created them without pressure, comparison, or striving.",
          "Ephesians continues by reminding us that we are God's handiwork. The word used in this passage points to something carefully crafted, something formed with intention and care.",
          "Every believer has been uniquely shaped by God. Our story, identity, experiences, abilities, desires, and spiritual gifts all reflect aspects of how He formed us. Discover Your Divine Design helps people recognize this intentional design. Rather than seeing their life as random or disconnected, participants begin to see how God has been shaping them for meaningful contribution.",
          "The passage ends with a powerful reminder. God not only saves and shapes us, He prepares a path for us to walk.",
          "Good works are not something we invent for ourselves. Scripture tells us that God prepared them in advance. Our role is to recognize where He is leading and step into those opportunities with faith and obedience.",
          "This is the heart of the DYDD journey. As people understand their design, they begin to see where their life can serve others, strengthen the church, and reflect the work God is already doing around them. Discovering our design is not the final goal. The goal is to live faithfully in the good works God has prepared for us."
        ],
      },
      {
        row: 8,
        slug: "what-is-dydd-on-purpose-for-purpose-8",
        type: "orientation",
        section: "What is DYDD?",
        title: "On Purpose For Purpose",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "Discover who you are in Christ and participate in the work God has prepared for you.",
        focus: [
          "Mision",
          "Vision"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/5e055743-b070-4064-a966-a8e099763c66/2026-10-13_16-27-45.jpg?format=2500w",
          "label": "On purpose, for purpose",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "heading",
            "text": "The Mission & Vision Behind DYDD"
          },
          {
            "type": "heading",
            "text": "Mission: On Purpose"
          },
          {
            "type": "paragraph",
            "text": "Discover Your Divine Design exists to help people rediscover who they are in Christ. Scripture tells us that we are God’s workmanship, His masterpiece, created intentionally and uniquely by Him."
          },
          {
            "type": "paragraph",
            "text": "Through biblical teaching, reflection, and practical tools, DYDD helps people gain clarity about their identity, story, gifts, and design so they can live with confidence in who God created them to be."
          },
          {
            "type": "scripture",
            "text": "For we are God’s handiwork, created in Christ Jesus…",
            "reference": "Ephesians 2:10"
          },
          {
            "type": "heading",
            "text": "Vision: For Purpose"
          },
          {
            "type": "paragraph",
            "text": "We envision a Church where believers understand their design and joyfully participate in the work God has prepared for them."
          },
          {
            "type": "paragraph",
            "text": "When people discover their identity and embrace their unique contribution, they find belonging, meaningful service, and a deeper sense of calling within the Body of Christ."
          },
          {
            "type": "scripture",
            "text": "…to do good works, which God prepared in advance for us to do.",
            "reference": "Ephesians 2:10"
          },
          {
            "type": "paragraph",
            "text": "Discover Your Divine Design helps believers understand how God uniquely created them so they can live and serve with clarity and purpose."
          }
        ],
        teachingBlocks: [
          "Discover Your Divine Design exists to help people rediscover who they are in Christ. Scripture tells us that we are God’s workmanship, His masterpiece, created intentionally and uniquely by Him.",
          "Through biblical teaching, reflection, and practical tools, DYDD helps people gain clarity about their identity, story, gifts, and design so they can live with confidence in who God created them to be.",
          "We envision a Church where believers understand their design and joyfully participate in the work God has prepared for them.",
          "When people discover their identity and embrace their unique contribution, they find belonging, meaningful service, and a deeper sense of calling within the Body of Christ.",
          "Discover Your Divine Design helps believers understand how God uniquely created them so they can live and serve with clarity and purpose."
        ],
      },
      {
        row: 9,
        slug: "what-is-dydd-d-e-s-i-g-n-9",
        type: "orientation",
        section: "What is DYDD?",
        title: "D.E.S.I.G.N",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "Explore six key areas that together reveal how God has uniquely shaped you.",
        focus: [
          "Identity",
          "Expertise",
          "Story",
          "Desire",
          "Gifts",
          "Niche"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/a41a6cf7-fbee-4855-97d2-323bfe455241/envato-labs-image-edit+%2861%29.png?format=2500w",
          "label": "The elements of your divine design",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Design is used as an acronym to represent the process taken for Discovery. It is not completed in the order of the acronym, on purpose. The process was carefully developed to help participants build from section to section, constantly gaining ground in their understanding."
          },
          {
            "type": "paragraph",
            "text": "The DYDD journey helps participants explore six key areas of their life that together reveal how God has uniquely shaped them. Each element offers a different perspective on how God forms a person through identity, experiences, passions, and spiritual empowerment. As participants reflect on these areas, they often begin to see patterns that reveal how their design may connect with the good works God has prepared for them."
          },
          {
            "type": "heading",
            "text": "Identity"
          },
          {
            "type": "paragraph",
            "text": "It all begins with knowing whose you are. Before we can understand what we are called to do, we must first understand who we are in Christ. Identity provides the foundation for the entire journey because our sense of purpose flows from our relationship with God and the truth of what He says about us."
          },
          {
            "type": "paragraph",
            "text": "Participants often find themselves reflecting on questions such as:"
          },
          {
            "type": "list",
            "items": [
              "Have I been carrying labels that do not reflect God’s truth about me?",
              "What does Scripture reveal about my identity in Christ?",
              "How might seeing myself through God’s perspective change the way I live and serve?"
            ]
          },
          {
            "type": "heading",
            "text": "Expertise"
          },
          {
            "type": "paragraph",
            "text": "It all builds with what you have learned. Over time, each person develops knowledge, skills, and practical experience through work, education, relationships, and daily responsibilities. These abilities may feel ordinary to the person who possesses them, yet they often represent important ways God has been preparing them to contribute to others."
          },
          {
            "type": "paragraph",
            "text": "Participants begin recognizing that:"
          },
          {
            "type": "list",
            "items": [
              "Skills they once considered routine may actually hold meaningful value",
              "Strengths developed over time can become tools for serving others",
              "God often prepares people for purpose through everyday experiences"
            ]
          },
          {
            "type": "heading",
            "text": "Story"
          },
          {
            "type": "paragraph",
            "text": "It all comes together through your story. Every person carries a unique set of life experiences that shape perspective, compassion, and understanding. As participants reflect on their story, they often begin to see how God has been present and active throughout different seasons of their life."
          },
          {
            "type": "paragraph",
            "text": "This reflection may reveal:"
          },
          {
            "type": "list",
            "items": [
              "Experiences that shaped their perspective or strengthened their faith",
              "Difficult seasons that now provide empathy and understanding for others",
              "Moments where God’s guidance becomes clearer in hindsight"
            ]
          },
          {
            "type": "heading",
            "text": "Desire"
          },
          {
            "type": "paragraph",
            "text": "It all deepens with what stirs your heart. God often places interests, passions, and concerns within us that draw our attention toward particular needs or opportunities. These desires can provide important clues about where our design may naturally find expression."
          },
          {
            "type": "paragraph",
            "text": "Participants may begin noticing:"
          },
          {
            "type": "list",
            "items": [
              "Interests or passions that consistently capture their attention",
              "Problems or needs that move them toward action",
              "Opportunities that feel both meaningful and energizing"
            ]
          },
          {
            "type": "heading",
            "text": "Spiritual Gifts"
          },
          {
            "type": "paragraph",
            "text": "It all strengthens when God equips you. Spiritual gifts represent the ways the Holy Spirit empowers believers to serve and build up the Body of Christ. These gifts extend beyond natural talents and reflect God’s grace working through His people."
          },
          {
            "type": "paragraph",
            "text": "As participants explore this area, they may begin discovering:"
          },
          {
            "type": "list",
            "items": [
              "Ways God has already been working through them to encourage or strengthen others",
              "Spiritual strengths that become evident through service and community",
              "Opportunities to use these gifts more intentionally within the life of the church"
            ]
          },
          {
            "type": "heading",
            "text": "Niche"
          },
          {
            "type": "paragraph",
            "text": "It all leads to where your design meets God’s purpose. Niche represents the intersection where identity, expertise, story, desire, and spiritual gifts begin to align with real opportunities to serve others. Rather than defining a permanent role, niche reflects a growing awareness of how a person’s design can make a meaningful contribution."
          },
          {
            "type": "paragraph",
            "text": "Participants often begin asking:"
          },
          {
            "type": "list",
            "items": [
              "Where do the different elements of my design naturally come together?",
              "Who might God be inviting me to serve?",
              "What opportunities around me could become expressions of purpose?"
            ]
          }
        ],
        teachingBlocks: [
          "Design is used as an acronym to represent the process taken for Discovery. It is not completed in the order of the acronym, on purpose. The process was carefully developed to help participants build from section to section, constantly gaining ground in their understanding.",
          "The DYDD journey helps participants explore six key areas of their life that together reveal how God has uniquely shaped them. Each element offers a different perspective on how God forms a person through identity, experiences, passions, and spiritual empowerment. As participants reflect on these areas, they often begin to see patterns that reveal how their design may connect with the good works God has prepared for them.",
          "It all begins with knowing whose you are. Before we can understand what we are called to do, we must first understand who we are in Christ. Identity provides the foundation for the entire journey because our sense of purpose flows from our relationship with God and the truth of what He says about us.",
          "Participants often find themselves reflecting on questions such as:",
          "It all builds with what you have learned. Over time, each person develops knowledge, skills, and practical experience through work, education, relationships, and daily responsibilities. These abilities may feel ordinary to the person who possesses them, yet they often represent important ways God has been preparing them to contribute to others.",
          "Participants begin recognizing that:",
          "It all comes together through your story. Every person carries a unique set of life experiences that shape perspective, compassion, and understanding. As participants reflect on their story, they often begin to see how God has been present and active throughout different seasons of their life.",
          "This reflection may reveal:",
          "It all deepens with what stirs your heart. God often places interests, passions, and concerns within us that draw our attention toward particular needs or opportunities. These desires can provide important clues about where our design may naturally find expression.",
          "Participants may begin noticing:",
          "It all strengthens when God equips you. Spiritual gifts represent the ways the Holy Spirit empowers believers to serve and build up the Body of Christ. These gifts extend beyond natural talents and reflect God’s grace working through His people.",
          "As participants explore this area, they may begin discovering:",
          "It all leads to where your design meets God’s purpose. Niche represents the intersection where identity, expertise, story, desire, and spiritual gifts begin to align with real opportunities to serve others. Rather than defining a permanent role, niche reflects a growing awareness of how a person’s design can make a meaningful contribution.",
          "Participants often begin asking:"
        ],
      },
      {
        row: 10,
        slug: "what-is-dydd-how-to-c-a-r-e-10",
        type: "normal",
        section: "What is DYDD?",
        title: "How to C.A.R.E",
        bookPages: "p8 - p9",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Connect, Act, Reflect, and Explore.",
        focus: [
          "Connect",
          "Act",
          "Reflect",
          "Explore"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/af154b59-5141-44a7-9893-0c1c67dd7b4d/ChatGPT+Image+Jul+18%2C+2025%2C+10_44_58+AM.png?format=2500w",
          "label": "Connect, Act, Reflect, Explore",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "As you move through Discover Your Divine Design, you’ll notice that this isn’t just a book to read, it’s a journey to live. To help you engage deeply with the material, we invite you to use the C.A.R.E. process, structured for the DYDD workbook. C.A.R.E. stands for Connect, Act, Reflect, and Explore, four simple but powerful approaches that will help you pause, notice, evaluate, and apply what God is showing you."
          },
          {
            "type": "list",
            "items": [
              "Connect: Engage with God, yourself, and others. Pause to notice where His hand has been shaping your story and stirring your heart (engage relationally, align with God’s movement in your life).",
              "Act: Take the next small, faithful step. Don’t wait for perfection; move forward trusting that God meets you in motion (take faithful steps, apply insights with courage).",
              "Reflect: Pause and notice what’s happening in and around you. Evaluate what you’re learning, where God is leading, and what’s being refined in your heart (pause, notice, and discern).",
              "Explore: Stay curious. Ask questions, imagine new possibilities, and consider how God might be inviting you to grow beyond what you’ve seen before (stay curious, imagine, and grow)."
            ]
          },
          {
            "type": "paragraph",
            "text": "Think of C.A.R.E. as both a compass and a rhythm: It helps you keep oriented on your journey, ensuring you’re not just gathering information but experiencing transformation. Whether you’re reading a chapter, answering workbook prompts, or journaling your thoughts, use C.A.R.E. to slow down, engage meaningfully, and allow God’s design in you to unfold with purpose."
          }
        ],
        teachingBlocks: [
          "As you move through Discover Your Divine Design, you’ll notice that this isn’t just a book to read, it’s a journey to live. To help you engage deeply with the material, we invite you to use the C.A.R.E. process, structured for the DYDD workbook. C.A.R.E. stands for Connect, Act, Reflect, and Explore, four simple but powerful approaches that will help you pause, notice, evaluate, and apply what God is showing you.",
          "Think of C.A.R.E. as both a compass and a rhythm: It helps you keep oriented on your journey, ensuring you’re not just gathering information but experiencing transformation. Whether you’re reading a chapter, answering workbook prompts, or journaling your thoughts, use C.A.R.E. to slow down, engage meaningfully, and allow God’s design in you to unfold with purpose."
        ],
        companionMoment: dyddJourneyCompanionMoments.care,
      },
      {
        row: 11,
        slug: "what-is-dydd-dydd-assessments-11",
        type: "assessment-link",
        section: "What is DYDD?",
        title: "DYDD Assessments",
        typeLabel: "Assessment step",
        duration: "8-12 min",
        lessonMainIdea: "DesignID and Spiritual Gifts support reflection, discussion, and discovery.",
        focus: [
          "DesignID",
          "Spiritual Gifts"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/3b11fc20-87d4-432b-ac33-3d670854d0f5/ID-logo-hrz-color.jpg?format=2500w",
          "label": "DesignID assessment",
          "type": "image",
          "additionalImages": [
            {
              "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/3dd783ab-7840-4865-94b5-1487517efa6e/dydd-gifts-logo.jpg?format=2500w",
              "label": "Spiritual Gifts assessment"
            }
          ]
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "The DYDD Journey includes the use of two assessments, the DesignID Assessment used for identity, and the Spiritual Gifts Assessment used for understanding gifts. DesignId is a unique and custom assessment built specifically for DYDD. Both assessments will be presented as needed within the course content."
          },
          {
            "type": "paragraph",
            "text": "The DesignID assessment is an important part of the DYDD journey. While the class itself focuses on reflection, discussion, and discovery, DesignID provides participants with structured insight into how their design often expresses itself in real life. The assessment helps individuals recognize patterns in how they perceive situations, approach challenges, and contribute within community and ministry."
          },
          {
            "type": "paragraph",
            "text": "The Spiritual Gifts Assessment is designed to be a simple and reflective part of the DYDD journey. While DesignID focuses on how a person’s design tends to operate in relationships and contribution, the Spiritual Gifts Assessment helps participants consider how the Holy Spirit may be empowering them to serve within the body of Christ."
          }
        ],
        teachingBlocks: [
          "The DYDD Journey includes the use of two assessments, the DesignID Assessment used for identity, and the Spiritual Gifts Assessment used for understanding gifts. DesignId is a unique and custom assessment built specifically for DYDD. Both assessments will be presented as needed within the course content.",
          "The DesignID assessment is an important part of the DYDD journey. While the class itself focuses on reflection, discussion, and discovery, DesignID provides participants with structured insight into how their design often expresses itself in real life. The assessment helps individuals recognize patterns in how they perceive situations, approach challenges, and contribute within community and ministry.",
          "The Spiritual Gifts Assessment is designed to be a simple and reflective part of the DYDD journey. While DesignID focuses on how a person’s design tends to operate in relationships and contribution, the Spiritual Gifts Assessment helps participants consider how the Holy Spirit may be empowering them to serve within the body of Christ."
        ],
      },
      {
        row: 12,
        slug: "what-is-dydd-pathfinder-niche-12",
        type: "orientation",
        section: "What is DYDD?",
        title: "Pathfinder (Niche)",
        typeLabel: "Orientation",
        duration: "4-6 min",
        lessonMainIdea: "A niche is the place where identity, expertise, story, desire, and spiritual gifts begin to intersect.",
        focus: [
          "What is a Niche? Pathfinder"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/c5196bb6-f968-4aab-8b29-698d6cb71a8e/aerial-view-of-campuhan-ridge-walk-scenic-green-2024-09-20-23-45-29-utc.jpg?format=500w",
          "label": "Discover your niche",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "The goal of the DYDD journey is not simply self-understanding. It is participation in the work God is already doing. The concept of Niche helps bring the different parts of a person’s design together so they can begin to see where their life most naturally serves others."
          },
          {
            "type": "paragraph",
            "text": "A niche is the place where identity, expertise, story, desire, and spiritual gifts begin to intersect. It is not a title or a position. It is the environment where a person’s design aligns with opportunities to serve and make an impact."
          },
          {
            "type": "paragraph",
            "text": "Many believers want to live with greater purpose but are unsure how their life fits into the larger work of God’s Kingdom. Exploring a niche helps move the conversation from general calling to practical expression. It helps people recognize where their design may be most effective and where their contribution can be most meaningful."
          },
          {
            "type": "paragraph",
            "text": "Understanding a niche does not mean every question about the future is answered. Instead, it provides direction. It gives individuals a clearer starting point for stepping forward in faith and exploring how God may use their life in the good works He has prepared."
          },
          {
            "type": "heading",
            "text": "Pathfinder"
          },
          {
            "type": "paragraph",
            "text": "As part of your journey, you will engage in active Niche building at the end of each major section. These are specifically designed CARE reflections which support your discovery process. The Pathfinder activities are an important part of completing your journey."
          }
        ],
        teachingBlocks: [
          "The goal of the DYDD journey is not simply self-understanding. It is participation in the work God is already doing. The concept of Niche helps bring the different parts of a person’s design together so they can begin to see where their life most naturally serves others.",
          "A niche is the place where identity, expertise, story, desire, and spiritual gifts begin to intersect. It is not a title or a position. It is the environment where a person’s design aligns with opportunities to serve and make an impact.",
          "Many believers want to live with greater purpose but are unsure how their life fits into the larger work of God’s Kingdom. Exploring a niche helps move the conversation from general calling to practical expression. It helps people recognize where their design may be most effective and where their contribution can be most meaningful.",
          "Understanding a niche does not mean every question about the future is answered. Instead, it provides direction. It gives individuals a clearer starting point for stepping forward in faith and exploring how God may use their life in the good works He has prepared.",
          "As part of your journey, you will engage in active Niche building at the end of each major section. These are specifically designed CARE reflections which support your discovery process. The Pathfinder activities are an important part of completing your journey."
        ],
      },
    ],
  },
  {
    slug: "identity",
    title: "Identity",
    kicker: "Chapter 1: Identity",
    summary: "Begin with whose you are before what you do, then use DesignID as a helpful mirror.",
    units: [
      {
        row: 13,
        slug: "identity-purpose-14",
        type: "normal",
        section: "Identity Overview",
        title: "On Purpose",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Your identity is based on who God says you are.",
        focus: [
          "God Says",
          "Formed",
          "Pursued",
          "New",
          "Shaped"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/c5564d73-f4d1-4243-9e30-a38ce5712668/close-up-2024-10-15-04-58-09-utc.jpg?format=2500w",
          "label": "Intentionally formed and shaped by God",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Your Identity is so much more than your name, your job, or how others see you. Our identity is where everything begins. Throughout Scripture, we see that God shapes identity in powerful, personal ways. He calls people by name, He redefines them beyond their failures, and He reminds them that who they are is rooted in His plans, not their past. Your identity is not based on your mistakes, your achievements, or the labels others have given you. It’s based on who God says you are."
          },
          {
            "type": "heading",
            "text": "God says:"
          },
          {
            "type": "paragraph",
            "text": "You are valuable and purposefully and wonderfully made and that was no mistake. He declares you delivered, forgiven, and healed from sin. You are redeemed, safe, and no longer separated or condemned. You are victorious and a born-again new creation. You are a child of God and member of His family who is qualified to share in His inheritance. You are part of His royal priesthood with a secure place in His kingdom. You are loved. See Psalm 139, Romans 8:1–2, Romans 8:35–37, Ephesians 1, 2 Corinthians 5:17, 1 Peter 2:9, and 1 Peter 2:24."
          },
          {
            "type": "paragraph",
            "text": "You were formed, pursued, made new, and shaped on purpose."
          },
          {
            "type": "list",
            "items": [
              "Formed: God’s intention was present before you could prove, perform, or produce anything. Psalm 139:13-16, Jeremiah 1:5",
              "Pursued: Salvation is not random. God moved toward you with love, mercy, and rescue. John 3:16, Romans 5:8, Titus 3:4-5",
              "New: In Christ, your life is not just improved. It is made new. 2 Corinthians 5:17",
              "Shaped: God is still forming you. Your story, growth, wiring, healing, and next steps are part of His work in you. Phil 1:6, Rom 12:2, 2 Cor. 3:18"
            ]
          },
          {
            "type": "paragraph",
            "text": "You are not accidental. You are intentionally formed, rescued, renewed, and still being shaped by God."
          }
        ],
        teachingBlocks: [
          "Your Identity is so much more than your name, your job, or how others see you. Our identity is where everything begins. Throughout Scripture, we see that God shapes identity in powerful, personal ways. He calls people by name, He redefines them beyond their failures, and He reminds them that who they are is rooted in His plans, not their past. Your identity is not based on your mistakes, your achievements, or the labels others have given you. It’s based on who God says you are.",
          "You are valuable and purposefully and wonderfully made and that was no mistake. He declares you delivered, forgiven, and healed from sin. You are redeemed, safe, and no longer separated or condemned. You are victorious and a born-again new creation. You are a child of God and member of His family who is qualified to share in His inheritance. You are part of His royal priesthood with a secure place in His kingdom. You are loved. See Psalm 139, Romans 8:1–2, Romans 8:35–37, Ephesians 1, 2 Corinthians 5:17, 1 Peter 2:9, and 1 Peter 2:24.",
          "You were formed, pursued, made new, and shaped on purpose.",
          "You are not accidental. You are intentionally formed, rescued, renewed, and still being shaped by God."
        ],
      },
      {
        row: 14,
        slug: "identity-handiwork-15",
        type: "normal",
        section: "Identity Overview",
        title: "Handiwork",
        typeLabel: "Teaching lesson",
        duration: "3–5 min",
        lessonMainIdea: "Who you are in Christ comes before what you do for Him.",
        focus: [
          "Treasure beyond Measure"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/47ff95a7-b7ae-4aef-b6e5-55b83079f7e8/milky-way-with-silhouette-of-a-standing-happy-gir-2026-01-06-09-08-16-utc.jpg?format=500w",
          "label": "A silhouette beneath the Milky Way",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Who you are in Christ comes before what you do for Him. Before your life ever had any titles, it was beautiful to Him. Identity is not discovered by looking inward, it is received by looking upward. When He calls you His Handiwork, He is referring to you as a work of art, a treasure beyond measure, something of which He is very fond."
          },
          {
            "type": "paragraph",
            "text": "Take a moment of silence and listen to what Dydi has to share about your identity. Press play, close your eyes, and really take in what you hear."
          }
        ],
        teachingBlocks: [
          "Who you are in Christ comes before what you do for Him. Before your life ever had any titles, it was beautiful to Him. Identity is not discovered by looking inward, it is received by looking upward. When He calls you His Handiwork, He is referring to you as a work of art, a treasure beyond measure, something of which He is very fond.",
          "Take a moment of silence and listen to what Dydi has to share about your identity. Press play, close your eyes, and really take in what you hear."
        ],
        anchorScripture: "Psalm 139:13–14",
        companionMomentPosition: "after-teaching",
        companionMoment: {
          audioSrc: "/audio/companions/course-moments/dydd-journey-handiwork-dydi.wav",
          duration: "1 min 26 sec",
          kicker: "Listen and receive",
          title: "Treasure beyond Measure",
          speakers: [{
            image: "/brand/characters/full-body/dydi-full-body.png",
            imageAlt: "Dydi, your DYDD guide",
            name: "Dydi",
            role: "DYDD guide",
          }],
          transcript: [
            {
                        "text": "You are not worthless, you are valuable."
            },
            {
                        "text": "You are not accidental, you are purposely made."
            },
            {
                        "text": "You are not a mistake, you are intended."
            },
            {
                        "text": "You are not a captive, you are delivered."
            },
            {
                        "text": "You are not condemned, you are forgiven."
            },
            {
                        "text": "You are not broken, you are healed."
            },
            {
                        "text": "You are not lost, you are found."
            },
            {
                        "text": "You are not vulnerable, you are safe."
            },
            {
                        "text": "You are not isolated, you are family."
            },
            {
                        "text": "You are not separated, you are together whole."
            },
            {
                        "text": "You are not defeated, you are victorious."
            },
            {
                        "text": "You are not dead, you are born again."
            },
            {
                        "text": "You are not your old self, you are a new creation."
            },
            {
                        "text": "You are not an orphan, you are a child of God."
            },
            {
                        "text": "You are not a stranger, you are a cherished family member."
            },
            {
                        "text": "You are not disqualified, you are inheritance worthy."
            },
            {
                        "text": "You are not an outsider, you are a member of the royal priesthood."
            },
            {
                        "text": "You are not excluded, you have a place in the kingdom."
            },
            {
                        "text": "You are not unloved, you are loved."
            }
],
        },
        closingScripture: {
          text: "For you created my inmost being; you knit me together in my mother’s womb. I praise you because I am fearfully and wonderfully made; your works are wonderful, I know that full well.",
          reference: "Psalm 139:13–14",
        },
      },
      {
        row: 15,
        slug: "identity-who-vs-whose-16",
        type: "normal",
        section: "Identity Overview",
        title: "Who Vs. Whose",
        bookPages: "p12 - p17",
        workbookSection: "Who are you and whose are you?",
        workbookPages: "p7 - p8",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Who you are may describe you. Whose you are defines you.",
        anchorScripture: "Ephesians 2:10",
        companionMoment: dyddJourneyCompanionMoments.identity,
        focus: ["Who", "Whose"],
        media: {"image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/61335d73-5a9f-42ed-b64a-b334c4463126/elderly-hand-resting-on-bible-indoors-2026-01-09-10-57-28-utc.jpg?format=300w", "label": "A hand resting on an open Bible", "type": "image"},
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Design starts with identity. Before we explore your gifts, personality, or purpose, we need to begin with something more foundational: who you belong to."
          },
          {
            "type": "paragraph",
            "text": "“Who am I?” is an important question. But in discovering your divine design, it finds its deepest meaning when grounded in another question: “Whose am I?”"
          },
          {
            "type": "heading",
            "text": "Who Are You?"
          },
          {
            "type": "paragraph",
            "text": "When you describe yourself, you might talk about:"
          },
          {
            "type": "list",
            "items": [
              "Your personality",
              "Your experiences",
              "Your talents",
              "Your story",
              "How others describe you"
            ]
          },
          {
            "type": "paragraph",
            "text": "These things matter. They help you recognize what makes you unique and how you engage with the world. Your experiences have shaped your perspective. Your talents influence what comes naturally. Your personality affects how you connect, contribute, and respond."
          },
          {
            "type": "paragraph",
            "text": "But none of these can carry the full weight of your identity. Your abilities can change. Your roles can shift. Other people’s opinions can be mistaken. Even your own understanding of yourself can be shaped by disappointment, comparison, or past mistakes. If these become the foundation of your identity, your sense of worth can rise and fall with how well life is going."
          },
          {
            "type": "heading",
            "text": "Whose You Are?"
          },
          {
            "type": "paragraph",
            "text": "For those who belong to Jesus, there is a deeper foundation:"
          },
          {
            "type": "list",
            "items": [
              "You are a child of God.",
              "You are fully known.",
              "You are deeply loved.",
              "You are secure in Christ.",
              "You belong to the One who created you."
            ]
          },
          {
            "type": "paragraph",
            "text": "“Whose you are” is about belonging before achievement. You do not have to discover your gifts, prove your usefulness, or figure out your purpose to become worthy of God’s love."
          },
          {
            "type": "scripture",
            "text": "See what great love the Father has lavished on us, that we should be called children of God! And that is what we are!",
            "reference": "1 John 3:1 (NIV)"
          },
          {
            "type": "paragraph",
            "text": "Your relationship with God is not another item on the list of things that describe you. It is the foundation from which you begin to understand everything else."
          },
          {
            "type": "heading",
            "text": "Why This Matters for Your Design"
          },
          {
            "type": "paragraph",
            "text": "When you start with “who,” discovering your design can become a search for proof that you matter. You may compare your gifts with someone else’s, wish you had a different personality, or feel that your story disqualifies you. When you start with “whose,” you can approach discovery from a place of belonging. You are not trying to earn your place in God’s family. You are learning how to live as someone who already belongs to Him."
          },
          {
            "type": "paragraph",
            "text": "Who you are may describe you. Whose you are defines you."
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 16,
        slug: "identity-good-works-17",
        type: "normal",
        section: "Identity Overview",
        title: "Good Works",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Purposeful, not passive. Devoted, not driven.",
        anchorScripture: "Ephesians 2:10",
        focus: ["Good Works Force"],
        media: {"image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/75649fd9-ec07-44c3-bb09-dd7525a017a2/young-plant-2026-01-06-10-42-38-utc.jpg?format=500w", "label": "A young plant growing in soil", "type": "image"},
        lessonBody: [
          {
            "type": "heading",
            "text": "Good Works: Joining the Good Works Force"
          },
          {
            "type": "paragraph",
            "text": "Purposeful, not passive."
          },
          {
            "type": "paragraph",
            "text": "Devoted, not driven."
          },
          {
            "type": "scripture",
            "text": "For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
            "reference": "Ephesians 2:10"
          },
          {
            "type": "paragraph",
            "text": "Your identity in Christ is not something you earn through good works. It is the foundation from which you do them. You don’t work to become His, you serve because you already belong to Him."
          },
          {
            "type": "paragraph",
            "text": "God invites you into what we’re calling the Good Works Force: His people putting their God-given design into action to love others, meet needs, and make His goodness visible. This isn’t a workforce competing for recognition or earning God’s approval. It’s a people serving together, with different designs and a shared Kingdom purpose."
          },
          {
            "type": "paragraph",
            "text": "Your part will often take shape through:"
          },
          {
            "type": "list",
            "items": [
              "Expertise — what you’ve developed",
              "Story — what you’ve experienced",
              "Desire — what you’re drawn toward",
              "Gifts — what God empowers"
            ]
          },
          {
            "type": "paragraph",
            "text": "God can work through your skills, redeem your experiences, direct your desires, and empower your gifts. Your contribution may look different from someone else’s, and that is part of the beauty of His design."
          },
          {
            "type": "paragraph",
            "text": "The question is not, “How do I do more?” It is, “What good is God inviting me to do with the life and design He has given me?” You don’t have to do everyone’s work. You are invited to faithfully take your part in the Good Works Force."
          },
          {
            "type": "paragraph",
            "text": "Purpose is not performance. It is faithful expression."
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 17,
        slug: "identity-niche-18",
        type: "normal",
        section: "Identity Overview",
        title: "Niche",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Not doing more. Doing what fits.",
        anchorScripture: "Ephesians 2:10",
        focus: ["Doing What fits"],
        media: {"image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/fffc22e1-ffe8-48b5-9642-b68bc7bcbfd0/closeup-image-of-two-people-playing-and-building-r-2024-12-05-18-40-10-utc.jpg?format=500w", "label": "Two people fitting puzzle pieces together", "type": "image"},
        lessonBody: [
          {
            "type": "heading",
            "text": "NICHE"
          },
          {
            "type": "paragraph",
            "text": "Not doing more. Doing what fits."
          },
          {
            "type": "paragraph",
            "text": "Think of your God-given design as a puzzle piece. Its shape is not a flaw to correct or something to squeeze into someone else’s space. Your particular mix of skills, story, passions, and gifts shapes how you can contribute to the bigger picture of what God is doing. Your niche is where that design meets an opportunity to love, serve, and bring good to others. It is your particular contribution within the Good Works Force."
          },
          {
            "type": "paragraph",
            "text": "Jesus draws our attention to people who are hungry, overlooked, sick, or forgotten. Discovering your niche isn’t simply finding what makes you feel fulfilled. It is recognizing where what God has formed in you can become a meaningful gift to someone else."
          },
          {
            "type": "paragraph",
            "text": "That fit doesn’t mean everything will be easy or comfortable. God may stretch you as you grow into it. And you don’t need to find one perfect role before you begin. Your design can find expression in different relationships, places, and seasons."
          },
          {
            "type": "paragraph",
            "text": "So instead of asking, “Where can I do more?” begin asking, “Where do I see a need that connects with how God has shaped me?” You can explore that connection one faithful step at a time."
          },
          {
            "type": "paragraph",
            "text": "Not an identity you chase."
          },
          {
            "type": "paragraph",
            "text": "Not a fit you force."
          },
          {
            "type": "paragraph",
            "text": "A contribution you grow into"
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 18,
        slug: "identity-assessment-time-designid",
        type: "assessment-link",
        typeLabel: "Assessment step",
        section: "Identity Assessment",
        title: "Assessment Time: DesignID",
        duration: "15 min assessment + course",
        lessonMainIdea: "Recognize God’s design through a tool for discovery, reflection, and faithful contribution.",
        assessmentTarget: "designid",
        focus: ["DesignID"],
        media: {"image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/a3412b55-fabf-4ec5-9721-7348edea38dd/DYDD_piegraph+final.png?format=2500w", "label": "DesignID wheel: divine and integrated reflections", "type": "image"},
        lessonBody: [
          {
            "type": "paragraph",
            "text": "God’s design is already reflected in the way you create, relate, think, and serve. An assessment can help you recognize those patterns and give you language to explore them."
          },
          {
            "type": "paragraph",
            "text": "An assessment is a tool for discovery—not a label that defines your identity or limits what God can do through you. Your identity is rooted in Christ. Your results provide a starting point for reflection, growth, and faithful contribution."
          },
          {
            "type": "scripture",
            "text": "For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
            "reference": "Ephesians 2:10"
          },
          {
            "type": "heading",
            "text": "A lens for identity, grace, and contribution"
          },
          {
            "type": "paragraph",
            "text": "DesignID™ is a faith-integrated assessment that helps you explore how God’s design is expressed through your life. More than describing personality, it offers a lens for understanding how you naturally contribute within the Body of Christ."
          },
          {
            "type": "paragraph",
            "text": "DesignID begins with a biblical conviction: every person is made in the image of God. We each have opportunities to reflect His character through the ways we live, love, work, and serve."
          },
          {
            "type": "paragraph",
            "text": "Consider the DesignID wheel. At its center is God Himself—Father, Son, and Holy Spirit. Flowing outward are four divine reflections: Architect, Artisan, Shepherd, and Steward. These provide language for exploring different patterns of contribution."
          },
          {
            "type": "paragraph",
            "text": "Around the outside of the wheel are the Integrated Reflections. Each combines two reflections, helping you explore how they work together in the way you lead, build, relate, and contribute."
          },
          {
            "type": "paragraph",
            "text": "DesignID does not replace biblical truth, spiritual formation, or dependence on the Holy Spirit. It supports your discovery by helping you recognize your design and steward it more faithfully."
          },
          {
            "type": "heading",
            "text": "Your next step: discover your DesignID"
          },
          {
            "type": "paragraph",
            "text": "We will refer to your DesignID results throughout the rest of the DYDD Journey, especially in the next unit. Take time to complete this step before moving forward."
          },
          {
            "type": "heading",
            "text": "1. Take the assessment."
          },
          {
            "type": "paragraph",
            "text": "Select Open Connected Trail below to find DesignID and take your assessment. You can also find DesignID in Trailheads."
          },
          {
            "type": "paragraph",
            "text": "Allow about 15 minutes. Answer according to how you naturally respond—not how you think you should respond or who you wish you were. Your results are available immediately after completion."
          },
          {
            "type": "paragraph",
            "text": "Already completed DesignID? Use your saved results; you do not need to retake it just to continue this Journey."
          },
          {
            "type": "heading",
            "text": "2. Complete the DesignID course."
          },
          {
            "type": "paragraph",
            "text": "Walk through the DesignID course to understand your results, explore the reflections, and consider how your design shows up in everyday life. Give yourself time to reflect rather than simply reading your scores."
          },
          {
            "type": "heading",
            "text": "3. Return to this lesson."
          },
          {
            "type": "paragraph",
            "text": "Bring what you have discovered back into the Journey. Your saved results will provide a reference point for the lessons ahead."
          },
          {
            "type": "paragraph",
            "text": "Before continuing, consider:"
          },
          {
            "type": "list",
            "items": [
              "What feels familiar in your results?",
              "What surprised you or needs further reflection?",
              "Where do you recognize opportunities to serve others through your design?"
            ]
          },
          {
            "type": "paragraph",
            "text": "Complete your DesignID assessment before continuing to the next lesson."
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 19,
        slug: "identity-the-designid-lens-what-is-in-the-report-19",
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/74f7b500-1ecc-4b6c-a597-567f00de5aae/image-gen+%2810%29.jpg?format=300w",
          "label": "The DesignID Lens",
          "type": "image"
        },
        type: "designid-reflection",
        section: "Identity Assessment",
        title: "The DesignID Lens: What is in the report?",
        bookPages: "p18 - p20",
        workbookSection: "Unpack your reflections",
        workbookPages: "p9 - p18",
        notes: "Refer them to D-ID course access for deeper dive",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Identity, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Ephesians 2:10",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Identity, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 20,
        slug: "identity-identity-among-believers-20",
        type: "normal",
        section: "Identity Assessment",
        title: "Identity among believers",
        bookPages: "p21 - p27",
        workbookSection: "Your Identity Among Believers",
        workbookPages: "p19 - p21",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Identity doesn’t exist in isolation. God didn’t just design you for personal discovery; He designed you for connection, belonging, and purpose within the Body of Christ.",
        focus: ["Heart, Mind, Soul, Strength"],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/b539874a-d535-451b-a72b-5cd5730534cf/diverse-group-of-people-community-togetherness-con-2023-11-27-05-29-24-utc.webp?format=500w",
          "label": "Identity among believers",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Identity doesn’t exist in isolation. God didn’t just design you for personal discovery; He designed you for connection, belonging, and purpose within the Body of Christ."
          },
          {
            "type": "paragraph",
            "text": "Jesus, referring to the commandment from Deuteronomy 6, tells us that we are to love God with our hearts, our souls, our minds, and our strengths. If God, who is perfect and without sin, has decided to love you, even before you repented, why do we struggle so much to love what He created? I am referring to you, of course."
          },
          {
            "type": "scripture",
            "text": "One of the teachers of the law came and heard them debating. Noticing that Jesus had given them a good answer, he asked him, “Of all the commandments, which is the most important?” “The most important one,” answered Jesus, “is this: ‘Hear, O Israel: The Lord our God, the Lord is one.  Love the Lord your God with all your heart and with all your soul and with all your mind and with all your strength.’ The second is this: ‘Love your neighbor as yourself.’ There is no commandment greater than these.”",
            "reference": "Mark 12:28–31"
          },
          {
            "type": "paragraph",
            "text": "When Jesus was pointing out what the greatest two commands were, He did not say admire, like, be fond of, or adore. He said love. Every other way fails in comparison. The Greek word for love in these verses is agape. Agape means to love someone by choice as an act of your will. It is intentional and actionable. Agape is unconditional, not looking for reciprocation."
          },
          {
            "type": "paragraph",
            "text": "We are commanded to love, period. There is no “so that” with agape love. Often, we love so that …"
          },
          {
            "type": "list",
            "items": [
              "Others change.",
              "Someone repents.",
              "A person or group gets saved."
            ]
          },
          {
            "type": "paragraph",
            "text": "First Peter 4:8 says, “Above all, love each other deeply, because love covers over a multitude of sins.” We are not intended to love so that something happens, but simply to love with all our heart, mind, soul, and strength."
          },
          {
            "type": "heading",
            "text": "Heart"
          },
          {
            "type": "paragraph",
            "text": "Your “heart” is your passions and desires. “For where your treasure is, there your heart will be also” (Matthew 6:21). Loving God with your heart also means loving Him with and through your emotions. We don’t love only within fair weather but also in the tempest."
          },
          {
            "type": "heading",
            "text": "Soul"
          },
          {
            "type": "paragraph",
            "text": "Your soul is what Jesus purchased on the cross. Our soul is of the highest value, and nothing can be measured against it. Matthew 16:26 says, “What good will it be for someone to gain the whole world, yet forfeit their soul? Or what can anyone give in exchange for their soul?” Your soul is the eternal part of you that will go on forever. Another way to think about your soul is as your will. The good news is that God gave us free will so when we love with our soul, we are choosing to love or deciding to love with our whole being."
          },
          {
            "type": "heading",
            "text": "Mind"
          },
          {
            "type": "paragraph",
            "text": "Your mind is your intellect, your cunning, and even your daydreaming. We use our minds to make choices or weigh decisions. It is from our minds that we reason out our need for God and choose to surrender. Your mind is a cognitive and practical approach to loving God. This does not mean that it is not highly creative and intuitive as well. It is with your mind that you build knowledge of God through study and experiences."
          },
          {
            "type": "heading",
            "text": "Strength"
          },
          {
            "type": "paragraph",
            "text": "Loving God with your strength is letting Him have your time, your sweat, your abilities, and your possessions. When we surrender our strengths, we no longer must count on ourselves. Our strength is finite but His is infinite. Philippians 4:13 says, “I can do all this through him who gives me strength.” God’s infinite strength is available to us when we need it. “That is why, for Christ’s sake, I delight in weaknesses, in insults, in hardships, in persecutions, in difficulties. For when I am weak, then I am strong” (2 Corinthians 12:10)."
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 21,
        slug: "identity-the-design-reflections-and-love-21",
        type: "designid-reflection",
        section: "Identity Assessment",
        title: "The Design Reflections and Love",
        workbookSection: "The Design Reflections and Love",
        workbookPages: "p22 - p24",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Consider what you just learned from Deuteronomy and Mark regarding how to love the Lord with your heart, mind, soul, and strength. Each of us approaches these areas in a unique way. As we will learn later in the chapter on Story, our experiences have a great impact on our capacity and ability to love. Within the chapter on Expertise, we will explore how different talents and skills were developed. Some of them were shaped through the hard knocks of life, while others emerged from deep-seated passion.",
        focus: [
          "Designed To Love"
        ],
        media: {
          "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/d9c32b17-5849-4ddb-a3f0-039b4eddf3e4/hands-reaching-for-a-heart-on-a-wooden-table-2026-01-05-06-26-34-utc.jpg?format=300w",
          "label": "Hands reaching toward a heart on a wooden table",
          "type": "image"
        },
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Consider what you just learned from Deuteronomy and Mark regarding how to love the Lord with your heart, mind, soul, and strength. Each of us approaches these areas in a unique way. As we will learn later in the chapter on Story, our experiences have a great impact on our capacity and ability to love. Within the chapter on Expertise, we will explore how different talents and skills were developed. Some of them were shaped through the hard knocks of life, while others emerged from deep-seated passion."
          },
          {
            "type": "paragraph",
            "text": "Let’s take a few moments and consider the reflections lens as it relates to this greatest command, to love the Lord your God with all your heart, soul, mind, and strength."
          },
          {
            "type": "paragraph",
            "text": "As a lens, DesignID helps us understand our capacities and what fulfills us. This includes how we choose to spend our time, the efforts we make in different parts of our life, and how we mentally and emotionally approach situations and people. There is a strong correlation between the four reflections of DesignID and the way we live out the greatest commandment."
          },
          {
            "type": "table",
            "headers": [
              "Reflection",
              "Heart",
              "Soul",
              "Strength",
              "Mind"
            ],
            "rows": [
              [
                "Architect ",
                "Leads with courage and conviction; pursues purpose that honors God.",
                "Obeys from a place of trust and devotion, surrendering outcomes to God.",
                "Brings energy and action, serving with boldness and perseverance.",
                "Thinks strategically and acts with vision guided by faith."
              ],
              [
                "Artisan",
                "Expresses love through beauty, order, and understanding.",
                "Aligns actions and intentions with truth and wisdom.",
                "Creates and refines with excellence, honoring God through design and detail.",
                "Reflects deeply, seeing patterns of grace and communicating truth clearly."
              ],
              [
                "Shepherd",
                "Loves through presence, empathy, and relational care.",
                "Chooses surrender and humility, nurturing others from a heart of service.",
                "Serves with endurance and gentleness, offering consistent support.",
                "Thinks relationally, seeking unity and emotional understanding."
              ],
              [
                "Steward",
                "Loves by protecting, providing, and remaining steadfast.",
                "Devotes self to integrity and responsibility as acts of worship.",
                "Works diligently, ensuring faithfulness in action and stewardship of resources.",
                "Considers carefully what is right and just, maintaining peace through structure."
              ]
            ],
            "label": "Design reflections and loving God"
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 22,
        slug: "identity-love-your-neighbor-as-yourself-22",
        type: "normal",
        section: "Identity Assessment",
        title: "Love your neighbor as yourself",
        bookPages: "p28 - p37",
        workbookSection: "Love Yourself, Love Others",
        workbookPages: "p25 - p26",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "",
        focus: ["You Are Worth Loving"],
        media: {"image":"https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/05b25f49-a299-4ab4-9476-838b7bae1473/smiling-woman-enjoying-nature-and-forest-sunshine-2026-09-25-08-46-31-utc.jpg?format=2500w","label":"Receiving God’s love and loving yourself","type":"image"},
        lessonBody: [
          {
            "type": "paragraph",
            "text": "Jesus tells us to “love your neighbor as yourself,” it’s not just about being kind to others; it’s a reminder that you can’t pour out what you haven’t first received. Loving yourself isn’t selfish; it’s survival, and it’s the only way to truly love your neighbor."
          },
          {
            "type": "paragraph",
            "text": "Do you love yourself? Can you say it? “I love myself.” Are you able to tell others that you love yourself? If you ever want to find a way to break the ice in a conversation in a strange way, walk up to someone new next time you are out or at church and just tell them, “I really love me some me.” As funny as that sounds, based on Mark 12, you are letting them know that you are capable of loving them."
          },
          {
            "type": "paragraph",
            "text": "This is incredibly powerful. Loving yourself means seeing God’s perspective. How often do we put consequences, obstacles, or false perceptions above the knowledge that God loves us?"
          },
          {
            "type": "paragraph",
            "text": "God loves you. There is no denying it. He loved you before you ever loved Him back. This includes all your blemishes, wrinkles, and scars. If you can know, truly know, that God loves you and you can surrender to being His purposeful creation, the blemishes, wrinkles, and scars, fade away. Loving yourself, the uniquely created person God designed, frees you to love others with untethered and reckless abandon. It is this type of love that will actually change your neighbors, and it is sorely missed in the fellowship of believers today."
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 23,
        slug: "identity-reflections-and-one-anothering-23",
        type: "designid-reflection",
        section: "Identity Assessment",
        title: "Reflections and One Anothering",
        workbookSection: "Reflections and One Anothering",
        workbookPages: "p27 - p30",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "",
        focus: ["Love One Another"],
        media: {"image":"https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/c1f8f611-a5f0-438a-a31e-1f72fe74d2a7/relaxed-family-sitting-grass-mountain-slope-at-sum-2026-01-05-23-35-52-utc.jpg?format=500w","label":"A family together in creation","type":"image"},
        lessonBody: [
          {
            "type": "heading",
            "text": "Called to “One Another”"
          },
          {
            "type": "paragraph",
            "text": "As Christians, we are family. When we pursue harmony, mutual respect, and peace with each other, we reflect God’s character and His love. The fact that God created us all uniquely means that this unity will take work. We are called to work, love, and serve with those who are different and unfamiliar. This can create anxiety, and a multitude of miscommunications. It can lead to hurts and disagreements, or even outright conflict. All of this is not just okay but part of God’s design."
          },
          {
            "type": "paragraph",
            "text": "He knew that we would start our campaign as an eternal citizen in heaven, here on earth. He knew that we would grow and be refined simply because others were not like us. It is His design that we are to love in unity, being one body with many parts. Let’s face it, some of those we work with are as different as the night is from the day. Isn’t that wonderful! What an opportunity to love."
          },
          {
            "type": "paragraph",
            "text": "The world is watching to see if we will accept each other and love despite our differences and hang-ups, because they want to know that we will love them in the same way. What a shame it is that the Body of Christ, His bride, is so fragmented today. We have to learn to obey His commands associated with the phrase “one another.”"
          },
          {
            "type": "paragraph",
            "text": "In the New Testament, Jesus and the apostles tell us to feel, say, or do something to one another numerous times."
          },
          {
            "type": "paragraph",
            "text": "Consider what it means to “one another” through your reflection. In what ways has God uniquely designed you to support and strengthen other believers?"
          },
          {
            "type": "paragraph",
            "text": "It is important that you can “one another” for all four of your reflections. Even in the areas where you have less energy or natural capacity, the call remains the same. Every believer is invited to live out the “one another” commands of Scripture. You may simply need to lean on God’s strength more deeply in those areas, for in your weakness, He is strong."
          }
        ],
        teachingBlocks: [],
      },
      {
        row: 24,
        slug: "identity-niche-preparation-identity-24",
        type: "pathfinder",
        section: "Identity Pathfinder: Niche",
        title: "Niche Preparation: Identity",
        bookPages: "p38 - p40",
        workbookSection: "I believe God created me...",
        workbookPages: "p31 - p32",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Identity chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Ephesians 2:10",
        teachingBlocks: [
          "This Pathfinder moment turns the Identity chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
    ],
  },
  {
    slug: "expertise",
    title: "Expertise",
    kicker: "Chapter Two: Expertise",
    summary: "Name talents, competencies, and hard-won wisdom as faithful stewardship.",
    units: [
      {
        row: 26,
        slug: "expertise-the-journey-to-expertise-26",
        type: "normal",
        section: "Expertise Journey",
        title: "The Journey to Expertise",
        bookPages: "p41 - p46",
        workbookSection: "The slow and faithful journey to Expertise",
        workbookPages: "p34 - p36",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach The Journey to Expertise with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Colossians 3:23",
        companionMoment: dyddJourneyCompanionMoments.expertise,
        teachingBlocks: [
          "This lesson introduces The Journey to Expertise as part of the Expertise movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 27,
        slug: "expertise-talent-27",
        type: "normal",
        section: "Expertise Journey",
        title: "Talent",
        bookPages: "p46 - p47",
        workbookSection: "What are your talents?",
        workbookPages: "p37",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Talent with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "This lesson introduces Talent as part of the Expertise movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 28,
        slug: "expertise-competence-28",
        type: "normal",
        section: "Expertise Journey",
        title: "Competence",
        bookPages: "p48 - p50",
        workbookSection: "Where are you growing in Competency?",
        workbookPages: "p38 - p39",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Competence with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "This lesson introduces Competence as part of the Expertise movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 29,
        slug: "expertise-expertise-29",
        type: "normal",
        section: "Expertise Journey",
        title: "Expertise",
        bookPages: "p51 - p60",
        workbookSection: "What is expertise?",
        workbookPages: "p40 - p41",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Expertise with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "This lesson introduces Expertise as part of the Expertise movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 30,
        slug: "expertise-being-vs-doing-30",
        type: "normal",
        section: "Deep Efforts produce deep results",
        title: "Being Vs. Doing",
        bookPages: "p61 - p66",
        workbookSection: "Being Before Doing",
        workbookPages: "p42 - p44",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Being Vs. Doing with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "This lesson introduces Being Vs. Doing as part of the Expertise movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 31,
        slug: "expertise-applied-capacity-31",
        type: "normal",
        section: "Deep Efforts produce deep results",
        title: "Applied Capacity",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Applied Capacity with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "This lesson introduces Applied Capacity as part of the Expertise movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 32,
        slug: "expertise-connecting-identity-and-expertise-32",
        type: "designid-reflection",
        section: "Deep Efforts produce deep results",
        title: "Connecting Identity & Expertise",
        bookPages: "p67",
        workbookSection: "The Reflections: Talent - Competency - Expertise",
        workbookPages: "p45 - p46",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Expertise, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Expertise, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 33,
        slug: "expertise-niche-preparation-expertise-33",
        type: "pathfinder",
        section: "Expertise Pathfinder: Niche",
        title: "Niche Preparation: Expertise",
        bookPages: "p68 - p69",
        workbookSection: "Which will enable me to use my...",
        workbookPages: "p47 - p48",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Expertise chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Colossians 3:23",
        teachingBlocks: [
          "This Pathfinder moment turns the Expertise chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
    ],
  },
  {
    slug: "story",
    title: "Story",
    kicker: "Chapter 3: Story",
    summary: "Gather formative stories with care so pain, testimony, culture, work, and church become part of discernment.",
    units: [
      {
        row: 35,
        slug: "story-why-story-matters-35",
        type: "normal",
        section: "Your Story Matters",
        title: "Why story matters",
        bookPages: "p70 - p73",
        workbookSection: "The moments that shape us",
        workbookPages: "p50",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Why story matters with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        companionMoment: dyddJourneyCompanionMoments.story,
        teachingBlocks: [
          "This lesson introduces Why story matters as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 36,
        slug: "story-god-never-wastes-a-hurt-36",
        type: "normal",
        section: "Your Story Matters",
        title: "God never wastes a hurt",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach God never wastes a hurt with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This lesson introduces God never wastes a hurt as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 37,
        slug: "story-what-is-a-testimony-37",
        type: "normal",
        section: "Testimony",
        title: "What is a testimony?",
        bookPages: "p74 - p76",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach What is a testimony? with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This lesson introduces What is a testimony? as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 38,
        slug: "story-pauls-testimony-38",
        type: "normal",
        section: "Testimony",
        title: "Paul's Testimony",
        bookPages: "p76 - p81",
        workbookSection: "Sharing your faith story",
        workbookPages: "p51 - p52",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Paul's Testimony with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This lesson introduces Paul's Testimony as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 39,
        slug: "story-family-and-culture-39",
        type: "normal",
        section: "Your Stories",
        title: "Family & Culture",
        bookPages: "p82 - p88",
        workbookSection: "Your Family & Culture story",
        workbookPages: "p53 - p55",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Family & Culture with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This lesson introduces Family & Culture as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 40,
        slug: "story-your-work-matters-40",
        type: "normal",
        section: "Your Stories",
        title: "Your Work Matters!",
        bookPages: "p89 - p92",
        workbookSection: "Called where you are",
        workbookPages: "p56 - p58",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Your Work Matters! with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This lesson introduces Your Work Matters! as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 41,
        slug: "story-your-church-story-41",
        type: "normal",
        section: "Your Stories",
        title: "Your Church Story",
        bookPages: "p94 - p94",
        workbookSection: "Church Vs. The Body of Christ",
        workbookPages: "p58 - p60",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Your Church Story with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This lesson introduces Your Church Story as part of the Story movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 42,
        slug: "story-divine-reflections-within-your-stories-42",
        type: "designid-reflection",
        section: "Your Stories",
        title: "Divine reflections within your stories",
        workbookSection: "Divine reflections within your stories",
        workbookPages: "p61 - p62",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Story, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Story, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 43,
        slug: "story-what-is-learned-helplessness-43",
        type: "designid-reflection",
        section: "Learned Helplessness",
        title: "What is Learned Helplessness?",
        notes: "This will need a \"new workbook\" like experience created\"",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Story, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Story, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 44,
        slug: "story-shadows-anxiety-and-fear-44",
        type: "designid-reflection",
        section: "Learned Helplessness",
        title: "Shadows: Anxiety & Fear",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Story, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Story, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 45,
        slug: "story-from-fear-to-alignment-45",
        type: "designid-reflection",
        section: "Learned Helplessness",
        title: "From fear to alignment",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Story, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Story, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 46,
        slug: "story-niche-preparation-story-46",
        type: "pathfinder",
        section: "Story Pathfinder: Niche",
        title: "Niche Preparation: Story",
        bookPages: "p95 - p96",
        workbookSection: "Coming From...",
        workbookPages: "p63 - p64",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Story chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Romans 8:28",
        teachingBlocks: [
          "This Pathfinder moment turns the Story chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
    ],
  },
  {
    slug: "desire",
    title: "Desire",
    kicker: "Chapter 4: Desire",
    summary: "Discern the desires of the heart and test them against identity, expertise, and story.",
    units: [
      {
        row: 48,
        slug: "desire-desire-why-you-say-think-live-and-love-the-way-you-do-48",
        type: "designid-reflection",
        section: "What lights your fire?",
        title: "Desire: Why you say, think, live, & love the way you do.",
        bookPages: "p97 - p105",
        workbookSection: "The reflections and the desires of the heart",
        workbookPages: "p65 - p69",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Desire, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "Psalm 37:4",
        companionMoment: dyddJourneyCompanionMoments.desire,
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Desire, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 49,
        slug: "desire-aligning-desire-with-purpose-49",
        type: "normal",
        section: "What lights your fire?",
        title: "Aligning Desire with Purpose",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Aligning Desire with Purpose with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This lesson introduces Aligning Desire with Purpose as part of the Desire movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 50,
        slug: "desire-will-vs-ways-50",
        type: "normal",
        section: "What lights your fire?",
        title: "Will Vs. Ways",
        bookPages: "p106 - p108",
        workbookSection: "Desire aligned with God's Design",
        workbookPages: "p70 - p71",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Will Vs. Ways with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This lesson introduces Will Vs. Ways as part of the Desire movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 51,
        slug: "desire-identity-and-desire-51",
        type: "normal",
        section: "Pulling it all together",
        title: "Identity & Desire",
        bookPages: "p109",
        workbookSection: "Pulling it all together",
        workbookPages: "p72 - p74",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Identity & Desire with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This lesson introduces Identity & Desire as part of the Desire movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 52,
        slug: "desire-expertise-and-desire-52",
        type: "normal",
        section: "Pulling it all together",
        title: "Expertise & Desire",
        bookPages: "p110 - p112",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Expertise & Desire with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This lesson introduces Expertise & Desire as part of the Desire movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 53,
        slug: "desire-story-and-desire-53",
        type: "normal",
        section: "Pulling it all together",
        title: "Story & Desire",
        bookPages: "p112 - p116",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Story & Desire with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This lesson introduces Story & Desire as part of the Desire movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 54,
        slug: "desire-precious-vs-worthless-54",
        type: "normal",
        section: "Pulling it all together",
        title: "Precious vs. Worthless",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Precious vs. Worthless with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This lesson introduces Precious vs. Worthless as part of the Desire movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 55,
        slug: "desire-niche-preparation-desire-55",
        type: "pathfinder",
        section: "Desire Pathfinder: Niche",
        title: "Niche Preparation: Desire",
        bookPages: "p117",
        workbookSection: "Impassioned by...",
        workbookPages: "p75",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Desire chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Psalm 37:4",
        teachingBlocks: [
          "This Pathfinder moment turns the Desire chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
    ],
  },
  {
    slug: "gifts",
    title: "Gifts",
    kicker: "Chapter 5: Gifts",
    summary: "Place spiritual gifts inside the whole design, moving from preparation to Spirit-empowered service.",
    units: [
      {
        row: 57,
        slug: "gifts-the-spiritual-gifts-assessment-with-dydd-57",
        type: "normal",
        section: "From Preparation to Power",
        title: "The spiritual Gifts Assessment with DYDD",
        notes: "Link to assessment and course upon completion",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach The spiritual Gifts Assessment with DYDD with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "1 Peter 4:10",
        companionMoment: dyddJourneyCompanionMoments.gifts,
        teachingBlocks: [
          "This lesson introduces The spiritual Gifts Assessment with DYDD as part of the Gifts movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 58,
        slug: "gifts-what-are-and-are-not-the-spiritual-gifts-58",
        type: "normal",
        section: "From Preparation to Power",
        title: "What are and are not the Spiritual Gifts?",
        bookPages: "p119 - p128",
        workbookSection: "From Design to Power",
        workbookPages: "p76 - p79",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach What are and are not the Spiritual Gifts? with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "1 Peter 4:10",
        teachingBlocks: [
          "This lesson introduces What are and are not the Spiritual Gifts? as part of the Gifts movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 59,
        slug: "gifts-unpack-your-spiritual-gifts-59",
        type: "workbook-checkpoint",
        section: "From Preparation to Power",
        title: "Unpack Your Spiritual Gifts",
        workbookSection: "Unpack Your Spiritual Gifts",
        workbookPages: "p80 - p81",
        typeLabel: "Workbook checkpoint",
        duration: "8-12 min",
        lessonMainIdea: "Slow down and complete the workbook reflection: Unpack Your Spiritual Gifts.",
        anchorScripture: "1 Peter 4:10",
        teachingBlocks: [
          "This checkpoint should feel like guided reflection, not a plain form. It gives the learner space to answer the workbook and save the entry as part of the personal record.",
          "Later, these saved responses can shape progress tracking, companion prompts, and Camp Circle visibility without exposing private content.",
        ],
      },
      {
        row: 60,
        slug: "gifts-spiritual-gifts-and-identity-60",
        type: "designid-reflection",
        section: "Gifts in Design",
        title: "Spiritual Gifts & Identity",
        bookPages: "p129",
        workbookSection: "Spiritual Gifts and your divine reflection",
        workbookPages: "p82 - p84",
        typeLabel: "DesignID reflection",
        duration: "10-15 min",
        lessonMainIdea: "Use DesignID as a mirror inside Gifts, helping the learner connect assessment language to faithful love and service.",
        anchorScripture: "1 Peter 4:10",
        teachingBlocks: [
          "DesignID should function here as a mirror, not a box. The learner can notice how their reflection pattern shapes love, learning, contribution, capacity, and pressure responses.",
          "Placed inside Gifts, this reflection keeps the assessment connected to the Journey instead of sending the learner into a disconnected side course.",
        ],
      },
      {
        row: 61,
        slug: "gifts-spiritual-gifts-and-expertise-61",
        type: "normal",
        section: "Gifts in Design",
        title: "Spiritual Gifts & Expertise",
        bookPages: "p130 - p131",
        workbookSection: "Considering your path forward",
        workbookPages: "p85 - p86",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Spiritual Gifts & Expertise with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "1 Peter 4:10",
        teachingBlocks: [
          "This lesson introduces Spiritual Gifts & Expertise as part of the Gifts movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 62,
        slug: "gifts-spiritual-gifts-and-story-desire-62",
        type: "normal",
        section: "Gifts in Design",
        title: "Spiritual gifts & Story/Desire",
        bookPages: "p132 - 135",
        workbookSection: "Spiritual Gifts: Pulling it all together",
        workbookPages: "p87 - p88",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Spiritual gifts & Story/Desire with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "1 Peter 4:10",
        teachingBlocks: [
          "This lesson introduces Spiritual gifts & Story/Desire as part of the Gifts movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 63,
        slug: "gifts-niche-preparation-gifts-63",
        type: "pathfinder",
        section: "Gifts Pathfinder: Niche",
        title: "Niche Preparation: Gifts",
        bookPages: "p136",
        workbookSection: "Supported by...",
        workbookPages: "p89",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Gifts chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "1 Peter 4:10",
        teachingBlocks: [
          "This Pathfinder moment turns the Gifts chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
    ],
  },
  {
    slug: "niche",
    title: "Niche",
    kicker: "Chapter 6: Niche",
    summary: "Bring the whole journey together into a clear, faithful niche declaration.",
    units: [
      {
        row: 65,
        slug: "niche-who-do-you-see-65",
        type: "normal",
        section: "Called to Purpose",
        title: "Who do you see?",
        notes: "Matt 5: 3-10. blessed for...",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Who do you see? with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This lesson introduces Who do you see? as part of the Niche movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 66,
        slug: "niche-who-is-calling-66",
        type: "normal",
        section: "Called to Purpose",
        title: "Who is calling?",
        notes: "General vs. specific, what if you don't know. Purpose - Action - Fruition",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach Who is calling? with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This lesson introduces Who is calling? as part of the Niche movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 67,
        slug: "niche-the-promised-land-journey-67",
        type: "normal",
        section: "Called to Purpose",
        title: "The Promised Land Journey",
        typeLabel: "Teaching lesson",
        duration: "6-9 min",
        lessonMainIdea: "Teach The Promised Land Journey with enough clarity and warmth that the learner is ready to answer the attached workbook section.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This lesson introduces The Promised Land Journey as part of the Niche movement of Discover Your Divine Design. It should give enough teaching to make the next reflection meaningful without overwhelming the learner.",
          "The rhythm is steady: teach the idea, name what to notice, invite a small act of reflection, then attach the relevant workbook section at the bottom so progress is captured in one place.",
        ],
      },
      {
        row: 68,
        slug: "niche-pathfinder-preparing-your-niche-declaration-68",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Pathfinder: Preparing your niche declaration",
        bookPages: "p137 - p143",
        workbookSection: "I believe God created me...",
        workbookPages: "p90 - p94",
        notes: "Full Pathfinder Niche builder here. Able to pull from their assessments, all entries, and collaboate with Dydi (Agent)",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        companionMoment: dyddJourneyCompanionMoments.nicheConversation,
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 69,
        slug: "niche-coming-from-69",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Coming from...",
        workbookSection: "Coming from...",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 70,
        slug: "niche-which-will-enable-me-to-use-my-70",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Which will enable me to use my...",
        workbookSection: "Which will enable me to use my...",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 71,
        slug: "niche-impassioned-by-71",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Impassioned by...",
        workbookSection: "Impassioned by...",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 72,
        slug: "niche-supported-by-72",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Supported by...",
        workbookSection: "Supported by...",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 73,
        slug: "niche-resulting-in-my-73",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Resulting in my...",
        workbookSection: "Resulting in my...",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 74,
        slug: "niche-encouraged-by-74",
        type: "pathfinder",
        section: "Step in to your purpose",
        title: "Encouraged by...",
        workbookSection: "Encouraged by...",
        typeLabel: "Pathfinder / niche",
        duration: "12-20 min",
        lessonMainIdea: "Shape the Niche chapter into one useful line for the learner's developing niche declaration.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "This Pathfinder moment turns the Niche chapter into language the learner can carry forward. The goal is not perfection; the goal is a faithful draft that captures what is becoming clear.",
          "The mature version of this lesson should review saved reflections, surface repeated words, invite companion guidance, and preserve a draft line for the final niche declaration.",
        ],
      },
      {
        row: 75,
        slug: "niche-congratulations-75",
        type: "completion",
        section: "Congratulations",
        title: "Congratulations",
        typeLabel: "Completion",
        duration: "5-8 min",
        lessonMainIdea: "Close the Journey with prayer, celebration, and one concrete next step beyond the course.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "The ending should feel like a commissioning, not a hard stop. The learner has gathered language, evidence, prayers, and next steps that now need to be lived.",
          "This unit can point them toward their next faithful experiment, future coaching, a Camp Circle, or deeper work with the Field Guide.",
        ],
      },
      {
        row: 76,
        slug: "niche-prayer-76",
        type: "completion",
        section: "Congratulations",
        title: "Prayer",
        typeLabel: "Completion",
        duration: "5-8 min",
        lessonMainIdea: "Close the Journey with prayer, celebration, and one concrete next step beyond the course.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "The ending should feel like a commissioning, not a hard stop. The learner has gathered language, evidence, prayers, and next steps that now need to be lived.",
          "This unit can point them toward their next faithful experiment, future coaching, a Camp Circle, or deeper work with the Field Guide.",
        ],
      },
      {
        row: 77,
        slug: "niche-whats-next-77",
        type: "completion",
        section: "Congratulations",
        title: "What's next",
        typeLabel: "Completion",
        duration: "5-8 min",
        lessonMainIdea: "Close the Journey with prayer, celebration, and one concrete next step beyond the course.",
        anchorScripture: "Matthew 5:16",
        teachingBlocks: [
          "The ending should feel like a commissioning, not a hard stop. The learner has gathered language, evidence, prayers, and next steps that now need to be lived.",
          "This unit can point them toward their next faithful experiment, future coaching, a Camp Circle, or deeper work with the Field Guide.",
        ],
      },
    ],
  },
];

export const dyddMainCourseStats = {
  moduleCount: dyddMainCourseOutline.length,
  unitCount: dyddMainCourseOutline.reduce((count, module) => count + module.units.length, 0),
  pathfinderCount: dyddMainCourseOutline.reduce((count, module) => count + module.units.filter((unit) => unit.type === "pathfinder").length, 0),
  designIdReflectionCount: dyddMainCourseOutline.reduce((count, module) => count + module.units.filter((unit) => unit.type === "designid-reflection").length, 0),
};

import type { JourneyLessonBlock } from "./dydd-course-outline";

// Authored main Journey source rows25–28. Stable app IDs intentionally retain legacy row suffixes.
export type ExpertiseLesson = { sourceRow: number; title: string; focus: string[]; media: {type: "image"; image: string; label: string}; lessonMainIdea: string; teachingBlocks: string[]; lessonBody: JourneyLessonBlock[]; careTitle: string; careIntro: string; care: {stage: "connect" | "act" | "reflect" | "explore"; title: string; explanation: string; prompt: string; questionId: string}[]; prayer: string | null };
export const expertiseLessons: Record<string, ExpertiseLesson> = {
  "expertise-the-journey-to-expertise-26": {
    "sourceRow": 25,
    "title": "The Journey To Expertise",
    "focus": [
      "The Mighty Oak",
      "Journey"
    ],
    "media": {
      "type": "image",
      "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/762e3fe0-bc82-4a36-b69a-e818ae2380b9/2+tree.png?format=2500w",
      "label": "A mighty oak tree"
    },
    "lessonMainIdea": "The Mighty Oak, Journey",
    "teachingBlocks": [],
    "lessonBody": [
      {
        "type": "paragraph",
        "text": "Consider the mighty oak tree. On average, an oak takes eighty to one hundred years to reach its full, mature size. That’s roughly 700,000 to 875,000 hours of standing through storms, soaking up sunlight, enduring harsh winters, and stretching toward the sky, day after day, decade after decade. Its strength doesn’t come from rushing but from a long, faithful process of becoming deeply rooted."
      },
      {
        "type": "paragraph",
        "text": "Your own growth is the same. Whether it’s in your faith, your gifts, your relationships, or your calling, God shapes you over time. He doesn’t expect you to become an expert overnight. Instead, He invites you to lean into a process where your natural talents grow into competence and, with practice, into mastery, not because of shortcuts, but because of deep-rooted, sustained growth."
      },
      {
        "type": "paragraph",
        "text": "Before we talk about what it takes to develop expertise, I want you to remember this: You are not behind. You are not late. Like the oak, you are designed for slow, faithful formation. God is shaping your expertise not for applause or achievement but for His kingdom purposes."
      },
      {
        "type": "paragraph",
        "text": "“Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus” (Philippians 1:6)."
      },
      {
        "type": "heading",
        "text": "A Biblical Principal"
      },
      {
        "type": "paragraph",
        "text": "Talent: God gives the seed of talent"
      },
      {
        "type": "paragraph",
        "text": "Competency: Faithfulness develops competency"
      },
      {
        "type": "paragraph",
        "text": "Expertise: Time & experience cultivate expertise"
      }
    ],
    "careTitle": "The Slow and Faithful Journey to Expertise",
    "careIntro": "",
    "care": [
      {
        "stage": "connect",
        "title": "Connect",
        "explanation": "",
        "prompt": "Where do you see signs of God’s steady growth in your life, even if the process has been slow?",
        "questionId": "growth-signs"
      },
      {
        "stage": "act",
        "title": "Act",
        "explanation": "Take one step this week that cultivates growth rather than comparison. Choose consistency over speed. Practice your craft, use your gifts, or serve someone with excellence, not for applause, but as an offering of worship.",
        "prompt": "What is your step?",
        "questionId": "expertise-the-journey-to-expertise-26-care-act"
      },
      {
        "stage": "reflect",
        "title": "Reflect",
        "explanation": "Expertise requires reflection as much as effort. Look back and consider how God has used your past, the victories and the struggles, to shape the way you serve today.",
        "prompt": "How has God used both your successes and struggles to strengthen your skills?",
        "questionId": "success-struggle-formation"
      },
      {
        "stage": "explore",
        "title": "Explore",
        "explanation": "The oak tree never stops reaching upward. It continues to grow toward light, even in maturity. In the same way, expertise is a lifelong journey, an ever-deepening partnership with God as He matures your gifts for His glory.",
        "prompt": "Where do you see signs of God's steady growth in your life?",
        "questionId": "expertise-the-journey-to-expertise-26-care-explore"
      }
    ],
    "prayer": "“Father, thank you for being patient in my becoming. Teach me to trust the slow, steady work of Your hands. Help me to root deeply in faith, to stand firm through seasons of change, and to see every experience, joyful or painful, as part of Your shaping. When I grow weary, remind me that You are not finished with me yet. May my developing expertise reflect Your excellence, bless others, and bring honor to Your name. Amen.”"
  },
  "expertise-talent-27": {
    "sourceRow": 26,
    "title": "Talent",
    "focus": [
      "Raw Ability",
      "Inclination",
      "Potential"
    ],
    "media": {
      "type": "image",
      "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/dcd71145-495b-4bcc-a146-b06fc50945c3/photo-of-boy-climbing-trees-in-the-jungle-2025-01-09-01-14-57-utc.jpg?format=2500w",
      "label": "A boy beginning to climb a tree"
    },
    "lessonMainIdea": "Raw Ability, Inclination, Potential",
    "teachingBlocks": [],
    "lessonBody": [
      {
        "type": "paragraph",
        "text": "Nobody wakes up one morning and is just an expert, not in learning, not in working, not in parenting, not in preaching, and definitely not in driving. (The left lane is for passing, just saying.) We all start with a spark, a talent, a curiosity, a “hey, I might be good at this” moment, and from there, it’s a winding road of practice, mistakes, growth, lots of time, and God’s grace."
      },
      {
        "type": "paragraph",
        "text": "We start with talent, an innate ability gifted us by God, as part of our created self. Talent is potential, ready for development through experience. It must be nurtured, refined, and developed through training, experience, and intentional practice to develop into competence, and ultimately expertise. The Bible suggests that talent is something we are instinctively born with, giving us unique skills and abilities that do not require much formal training or experience."
      },
      {
        "type": "paragraph",
        "text": "“For we are God’s handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do” Ephesians 2:10."
      },
      {
        "type": "paragraph",
        "text": "You may have a natural gift (innate ability) at something, but if that talent isn’t cultivated through practice, learning, or experience, it may remain at a basic level, even if that level is higher than those around you."
      },
      {
        "type": "paragraph",
        "text": "It is this strengthening and practice that turns talent into competency, especially as we grow in knowledge in the areas we are talented in. It makes sense, then, that as we grow in our knowledge of God, we grow in the talents He created us with. When we learn more of who He is, how He sees us, and have faith to grow in our talents, it creates competency as we become more knowledgeable about how God wants to use them."
      },
      {
        "type": "paragraph",
        "text": "“Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms.” Peter 4:10"
      }
    ],
    "careTitle": "Talent",
    "careIntro": "Take a deep breath. Set aside distractions. Be still and remember that you were created intentionally by God, designed with purpose, not by accident. Think about those moments when something came naturally to you, where you felt a spark, energy, or ease.",
    "care": [
      {
        "stage": "connect",
        "title": "Connect",
        "explanation": "",
        "prompt": "What are your talents? Don’t hold back. This is a place for a brain dump. You may be surprised at how many things you list.",
        "questionId": "expertise-talent-27-workbook-response"
      },
      {
        "stage": "act",
        "title": "Act",
        "explanation": "",
        "prompt": "Name one talent you can dust off and surrender to God this week.",
        "questionId": "expertise-talent-27-care-act"
      },
      {
        "stage": "reflect",
        "title": "Reflect",
        "explanation": "",
        "prompt": "Are you cultivating them or letting them sit dormant?",
        "questionId": "expertise-talent-27-care-reflect"
      },
      {
        "stage": "explore",
        "title": "Explore",
        "explanation": "",
        "prompt": "Have you invited God into the process of developing your talents into something more?",
        "questionId": "expertise-talent-27-care-explore"
      }
    ],
    "prayer": null
  },
  "expertise-competence-28": {
    "sourceRow": 27,
    "title": "Competence",
    "focus": [
      "Reliable",
      "Muscle Memory"
    ],
    "media": {
      "type": "image",
      "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/47b5b4e4-f214-4133-9241-3b39ecd71439/young-boy-adventuring-high-up-in-a-tree-2025-04-05-03-49-59-utc.jpg?format=2500w",
      "label": "A young boy climbing high in a tree"
    },
    "lessonMainIdea": "Reliable, Muscle Memory",
    "teachingBlocks": [],
    "lessonBody": [
      {
        "type": "paragraph",
        "text": "Competence is that magical stage where you’ve moved past winging it but you’re not quite ready to call yourself a master. Think of it like learning to ride a bike: You’ve ditched the training wheels, you can steer without crashing into the neighbor’s mailbox, but no one’s asking you to join the Tour de France just yet. Competence is where talent starts flexing its muscles."
      },
      {
        "type": "paragraph",
        "text": "Some of us hesitate to call ourselves experts, and honestly, that’s okay. One of the beautiful things about God’s design is that He never demands instant mastery from us; instead, He invites us to grow, step by step. Competence is that important middle ground on the road toward expertise. It’s the phase where skills are developing, knowledge is expanding, and experience is stacking up, but you’re still in the process, not at the finish line. The real difference between competence and expertise isn’t about perfection; it’s about the depth, refinement, and maturity God helps build over time."
      },
      {
        "type": "paragraph",
        "text": "Competency can be defined as the crossroads of knowledge, skills, and ability."
      },
      {
        "type": "list",
        "items": [
          "Knowledge: Facts and information acquired through experience using all our senses. “The fear of the Lord is the beginning of knowledge; but fools despise wisdom and instruction” (Proverbs 1:7).",
          "Skills: Specific things we develop through repetition in learned activities. “Do you see someone skilled in their work? They will serve before kings; they will not serve before officials of low rank” (Proverbs 22:29).",
          "Ability: Performance of natural, innate skills strengthened through practice over time. “Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms” (1 Peter 4:10)."
        ]
      },
      {
        "type": "heading",
        "text": "Competence requires:"
      },
      {
        "type": "list",
        "items": [
          "Faithfulness & intentional growth. Not cruise control.",
          "Stewardship. Not complacency"
        ]
      },
      {
        "type": "paragraph",
        "text": "“Whoever can be trusted with very little can also be trusted with much…” Luke 16:10"
      }
    ],
    "careTitle": "Competence",
    "careIntro": "Competence is when potential becomes reliable.",
    "care": [
      {
        "stage": "connect",
        "title": "Connect",
        "explanation": "",
        "prompt": "What in your life has muscle memory developed?",
        "questionId": "expertise-competence-28-workbook-response"
      },
      {
        "stage": "act",
        "title": "Act",
        "explanation": "",
        "prompt": "What would it look like to train, practice, or study more in that area?",
        "questionId": "expertise-competence-28-care-act"
      },
      {
        "stage": "reflect",
        "title": "Reflect",
        "explanation": "",
        "prompt": "Take a moment and be honest with yourself, are you coasting or growing. Are there areas where you’ve built some “muscle memory” but may be tempted to cruise?",
        "questionId": "expertise-competence-28-care-reflect"
      },
      {
        "stage": "explore",
        "title": "Explore",
        "explanation": "",
        "prompt": "Ask God to reveal one area in work, home, church, or personal, where He wants you to invest in growth this season. Who could you learn from, ask for feedback, or partner within this development?",
        "questionId": "expertise-competence-28-care-explore"
      }
    ],
    "prayer": null
  },
  "expertise-expertise-29": {
    "sourceRow": 28,
    "title": "Expertise",
    "focus": [
      "Deep",
      "Relational"
    ],
    "media": {
      "type": "image",
      "image": "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/83a17880-b26f-484c-93e6-6dd774113a8f/side-view-using-the-rope-hanging-man-is-doing-c-2025-03-18-21-28-57-utc.JPG?format=2500w",
      "label": "An experienced climber using a rope"
    },
    "lessonMainIdea": "Deep, Relational",
    "teachingBlocks": [],
    "lessonBody": [
      {
        "type": "paragraph",
        "text": "Expertise used to be hard to come by. A true expert was a master of their craft who had paid the price of dedication and diligence over an extended period of time."
      },
      {
        "type": "paragraph",
        "text": "Nowadays, “expertise” can be found almost anywhere, and access to it is cheap and easy. Expert answers are in the palm of our hands for any topic. Knowledge has become ubiquitous, empowering the multitudes with easy access."
      },
      {
        "type": "paragraph",
        "text": "Expertise is more than just knowledge; it’s the application of it: wisdom. To know something only takes you so far. Experiencing it over time solidifies and hard codes it in our being as we live out the benefits or consequences. Our world is full of pseudo-experts pretending they have the answers but often cutting corners that develop glaring holes because they lack experience."
      },
      {
        "type": "paragraph",
        "text": "There is no shortcut to expertise. Remember the mighty oak tree."
      },
      {
        "type": "heading",
        "text": "Deep effort produces deep results."
      },
      {
        "type": "list",
        "items": [
          "Knowledge tuns into Wisdom: Info to insight",
          "Skill becomes Intuition: Effort to instinct",
          "Ability morphs into Credibility: Stewardship to mastery"
        ]
      },
      {
        "type": "heading",
        "text": "Expertise is Devotion Formed Through Relationship"
      },
      {
        "type": "paragraph",
        "text": "Any expert will tell you that they formed a deep and knowing relationship with the people, subject, or content in which they are considered expert. Over time, it becomes relational, personal even. The sheer volume of time and effort creates an intimacy."
      },
      {
        "type": "paragraph",
        "text": "The same is true about your relationship with Jesus. The more time and effort you put into your relationship with Him, the better you know Him. Consider the apostles, in particular, Peter and John. Having just spent three years of highly concentrated relationship building with Jesus, they find themselves arrested for sharing near the temple. In Acts 4 we see that they are questioned and that Peter, full of the Spirit, responded with articulate intellectual depth. Don’t forget, Peter was a fisherman, not a scholar. He was unschooled and ordinary, yet he was speaking in such a way as to astonish the most learned and academic people of the land."
      },
      {
        "type": "paragraph",
        "text": "“When they saw the courage of Peter and John and realized that they were unschooled, ordinary men, they were astonished, and they took note that these men had been with Jesus”. Acts 4:13"
      },
      {
        "type": "paragraph",
        "text": "Did you see it? The answer was that Peter’s expertise was relational. What astonished them about what he was courageously saying, was attributed to their time with Jesus. There having “been” with Jesus was the answer."
      },
      {
        "type": "paragraph",
        "text": "When it comes to expertise and faith, there are no shortcuts. The only way is the carefully slow-cooked devotion, of having been with Jesus."
      },
      {
        "type": "paragraph",
        "text": "Do you have knowledge of Jesus, or do you have insight?"
      },
      {
        "type": "paragraph",
        "text": "Are you skilled at living your faith or has it become instinct?"
      },
      {
        "type": "paragraph",
        "text": "Is your relationship with Jesus credible?"
      }
    ],
    "careTitle": "Expertise",
    "careIntro": "Expertise grows through faithful practice, humble learning, and time spent with Jesus. Use CARE to notice where He is forming wisdom in you and choose a next step that serves others.",
    "care": [
      {
        "stage": "connect",
        "title": "Connect",
        "explanation": "",
        "prompt": "If expertise is relational at its heart, consider your own relationship with Jesus. Would people who experienced you be able to say, “they have been with Jesus”?",
        "questionId": "expertise-expertise-29-care-connect"
      },
      {
        "stage": "act",
        "title": "Act",
        "explanation": "",
        "prompt": "Excellence grows through faithful repetition.  “Whatever you do, work at it with all your heart, as working for the Lord” (Colossians 3:23). Choose one deliberate, learnable practice, and start showing up to it consistently. Record your plan.",
        "questionId": "expertise-expertise-29-care-act"
      },
      {
        "stage": "reflect",
        "title": "Reflect",
        "explanation": "",
        "prompt": "Where are you competent, and where is God inviting you toward expertise? “But solid food is for the mature, who by constant use have trained themselves to distinguish good from evil” Hebrews 5:14. Name the shortcuts you’ve been tempted to take.",
        "questionId": "competent-to-expert"
      },
      {
        "stage": "explore",
        "title": "Explore",
        "explanation": "",
        "prompt": "Stay curious; stay teachable. “He has filled him with the Spirit of God, with wisdom, with understanding, with knowledge and with all kinds of skills” (Exodus 35:31). Plan your next learning stretch: a book list, a course, shadowing a seasoned practitioner, or teaching what you know to someone newer. Ask where your craft can bless others and strengthen the Body.",
        "questionId": "next-learning-stretch"
      }
    ],
    "prayer": "“Father, thank you for the slow, faithful work You are doing in me. Root me like an oak by streams of water, steady through storms and seasons. Free me from chasing shortcuts; teach me to value perseverance, practice, and humble learning. Use my experiences, the ordinary and the hard, to form wisdom that serves others and honors You. Fill me with Your Spirit, sharpen my skill, and align my motives with Your kingdom. May my growing competence mature into Christ-shaped expertise that gives shade and shelter to many. In Jesus’s name, amen.”"
  }
};

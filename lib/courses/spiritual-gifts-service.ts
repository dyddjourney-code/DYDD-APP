import type { CourseDefinition } from "./course-catalog";
import { spiritualGiftsCompanionMoments } from "./course-companion-moment-data";

export const spiritualGiftsCourse = {
  accent: "gold",
  assessmentType: "spiritual_gifts",
  companionNote:
    "Dydi should help learners read their top gifts as a prayerful starting point for service, maturity, community confirmation, and love-shaped practice.",
  description:
    "A companion course for unpacking Spiritual Gifts results with Scripture, humility, service, and practical next steps.",
  logo: "/brand/tools/spiritual-gifts-logo.jpg",
  modules: [
    {
      slug: "welcome",
      title: "Module 1: Welcome and Orientation",
      lessons: [
        {
          body: [
            "Spiritual gifts are given by the Holy Spirit to build up others and serve the Body of Christ in love. This course is designed to help you receive your results with humility, clarity, and courage. The goal is not to chase labels or prove usefulness. The goal is to grow in faithful service, love, and participation in the Body of Christ.",
            {
              kind: "scripture",
              text: "“So, Christ himself gave the apostles, the prophets, the evangelists, the pastors and teachers, to equip his people for works of service, so that the body of Christ may be built up until we all reach unity in the faith and in the knowledge of the Son of God and become mature, attaining to the whole measure of the fullness of Christ.” Ephesians 4:11-13",
            },
            "Your assessment highlights gifts that may be active or emerging right now. The report gives you language, Scripture, practical expressions, and deeper guidance, but it is meant for discernment rather than diagnosis.",
            "Hold your report prayerfully. Stay curious. Look for confirmation through service and community. Let love govern every gift.",
          ],
          image: {
            alt: "Open Bible and notebook for Spiritual Gifts course orientation",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/b4818d6f-7792-449a-befc-0840d2c50966/381da578-b867-4ad2-92d2-146916bd994a-2026-03-11.jpeg?format=300w",
          },
          focus: [
            "Spiritual gifts are grace for the common good.",
            "Assessment results offer insight, not certainty.",
            "The healthiest response is prayer, service, humility, and love.",
          ],
          reflectionPrompt:
            "When you think about spiritual gifts, do you feel curiosity, clarity, confusion, comparison, excitement, or pressure?",
          slug: "welcome-to-spiritual-gifts",
          summary:
            "Frames spiritual gifts as grace for service rather than labels for identity or status.",
          title: "Welcome to Spiritual Gifts",
          companionMoment: spiritualGiftsCompanionMoments.welcome,
        },
      ],
    },
    {
      slug: "report",
      title: "Module 2: Unpacking Your Report",
      lessons: [
        {
          body: [
            "Your report is a starting point for discernment. Begin with gratitude rather than analysis. Notice what seems familiar, what feels surprising, and what invites prayer, conversation, or service.",
            "Your top five gifts emerged most consistently in your responses. They may represent gifts that are active, emerging, familiar, or ready for further testing through service.",
            "The definitions and Scripture references create language, but Scripture remains the foundation. Use the practical expressions to ask where you have already seen these gifts strengthen someone else.",
            "The deep-dive sections help you focus not only on what the gift is, but how it can mature. A strong gift still needs love, humility, correction, and practice.",
          ],
          image: {
            alt: "Spiritual Gifts report cover for lesson on reading results",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/39e07952-dc25-436b-8d4e-3efd59a72e81/SG+Report.jpg?format=2500w",
          },
          focus: [
            "Read the report slowly and prayerfully.",
            "Treat top gifts as discernment invitations.",
            "Use deep dives to notice maturity, growth areas, and next steps.",
          ],
          reflectionPrompt:
            "What stands out first in your report: a gift you expected, a gift that surprised you, a Scripture, a growth area, or a next step?",
          slug: "what-you-see",
          summary:
            "Helps learners read the top five, definitions, Scriptures, expressions, and deep dives without overclaiming the results.",
          title: "What You See",
        },
        {
          body: [
            "The report is most useful when it leads to prayer, service, community feedback, and growth in love. Ask God for wisdom and invite the Spirit to confirm, correct, mature, and direct.",
            "Use the report in community because gifts are given for the Body. Trusted leaders, mentors, friends, and ministry teammates can help confirm what is fruitful and notice what needs maturity.",
            {
              kind: "scripture",
              text: "“Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms.” 1 Peter 4:10",
            },
            "Use the report through service. Gifts become clearer when they are practiced in small, faithful ways. Notice what strengthens others, bears fruit, and aligns with Scripture.",
            "Use the report over time. Some gifts remain consistent, while others emerge through need, calling, training, and obedience in a new season.",
          ],
          image: {
            alt: "Hands clasped together around a table in unity",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/948124bb-6d94-42fe-96be-3006c43cc8a8/hands-clasped-together-in-unity-at-wooden-table-2026-09-15-20-10-17-utc.jpg?format=2500w",
          },
          focus: [
            "Pray through the Scriptures connected to your gifts.",
            "Ask trusted people what they see confirmed in your life.",
            "Practice one gift in a small, faithful way before rushing to a label.",
          ],
          reflectionPrompt:
            "What would it look like to use your report as a guide for service rather than a label for identity?",
          slug: "how-to-use-the-report",
          summary:
            "Turns report insight into prayer, service, feedback, humility, and patient discernment.",
          title: "How to Use the Report",
          companionMoment: spiritualGiftsCompanionMoments.report,
        },
      ],
    },
    {
      slug: "gifts",
      title: "Module 3: Spiritual Gifts",
      lessons: [
        {
          body: [
            "In John chapters 14-16, Jesus promises the Holy Spirit to the disciples. He explains that the Holy Spirit is an advocate to help us, teach us, remind us, and testify about what Jesus lived and died for. He was preparing the disciples to be without Him, but he was actually telling them it was best that He goes, because it would be better for the Holy Spirit to be with us, then Jesus to be standing beside us.",
            "Jesus promised us the Holy Spirit to:",
            {
              kind: "list",
              items: [
                "Be with us as our Helper",
                "Teach us and remind us of His words",
                "Empower us as His witnesses",
                "Continue His work",
              ],
            },
            "Spiritual gifts are supernatural empowerments given by the Holy Spirit equipping us to serve others, strengthen the Church, and participate in God's work. They are received, not achieved. Gifts are not primarily about personal fulfillment. They are given for the common good. The question is not only, \"What is my gift?\" but, \"How is God inviting me to serve?\"",
            {
              kind: "scripture",
              text: [
                "“Now about the gifts of the Spirit, brothers and sisters, I do not want you to be uninformed. You know that when you were pagans, somehow or other you were influenced and led astray to mute idols. Therefore I want you to know that no one who is speaking by the Spirit of God says, “Jesus be cursed,” and no one can say, “Jesus is Lord,” except by the Holy Spirit.",
                "There are different kinds of gifts, but the same Spirit distributes them. There are different kinds of service, but the same Lord. There are different kinds of working, but in all of them and in everyone it is the same God at work.",
                "Now to each one the manifestation of the Spirit is given for the common good. To one there is given through the Spirit a message of wisdom, to another a message of knowledge by means of the same Spirit, to another faith by the same Spirit, to another gifts of healing by that one Spirit, to another miraculous powers, to another prophecy, to another distinguishing between spirits, to another speaking in different kinds of tongues, and to still another the interpretation of tongues. All these are the work of one and the same Spirit, and he distributes them to each one, just as he determines.” 1 Corinthians 12:1-11",
              ],
            },
            "Paul describes believers as one Body with many members. No one carries every gift, every member matters, and difference is part of God's design.",
            "Additionally, Gifts require love. First Corinthians 12 flows directly into First Corinthians 13 because gifts without love become distorted. Love gives gifts their Christlike shape.",
          ],
          image: {
            alt: "Hands reaching toward a heart on a wooden table",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/d9c32b17-5849-4ddb-a3f0-039b4eddf3e4/hands-reaching-for-a-heart-on-a-wooden-table-2026-01-05-06-26-34-utc.jpg?format=2500w",
          },
          focus: [
            "Gifts come from God and serve the common good.",
            "Difference in the Body is part of God's design.",
            "Maturity matters as much as identification.",
          ],
          reflectionPrompt:
            "How does your understanding of spiritual gifts change when you begin with \"for the common good\"?",
          slug: "what-are-spiritual-gifts",
          summary:
            "Explains spiritual gifts as Spirit-given contribution for the Body, governed by love.",
          title: "What Are the Spiritual Gifts?",
        },
        {
          body: [
            "Spiritual gifts are not:",
            {
              kind: "list",
              items: [
                "Personality labels: They may overlap with personality, skills, or interests, but they are Spirit-given for service.",
                "A measure of spiritual maturity: A person may have a strong gift and still need deep formation. Maturity is seen in love, humility, obedience, wisdom, and fruit.",
                "A spiritual status system: Hidden service is not less valuable than visible service, and no gift should become a ranking of importance.",
              ],
            },
            "Your Report is not a limitation on God: Your report does not tell God what He can or cannot do through you. Gifts clarify patterns; they do not create boundaries around obedience.",
          ],
          image: {
            alt: "Man holding a trophy to illustrate spiritual gifts are not status",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/77d00833-4ba7-47d0-b502-fc93647337a3/man-celebrates-win-holding-trophy-against-yellow-b-2026-03-17-04-15-02-utc.jpeg?format=2500w",
          },
          focus: [
            "A gift is not a personality label or identity replacement.",
            "A gift does not excuse immaturity.",
            "Gifts without love can harm, but gifts governed by love can heal.",
          ],
          reflectionPrompt:
            "What misuse of spiritual gifts have you seen or experienced: comparison, pride, pressure, passivity, confusion, or fear?",
          slug: "what-they-are-not",
          summary:
            "Protects learners from turning gift language into comparison, status, limitation, or pressure.",
          title: "What They Are Not",
        },
      ],
    },
    {
      slug: "practice",
      title: "Module 4: Learned by Doing",
      lessons: [
        {
          body: [
            "Serve, and watch what God blesses. How do you know if your gift of exhortation is active if you never encourage anyone? Spiritual gifts are discerned and developed through faithful action, not only through reflection. Assessment gives language, service gives evidence, and fruit over time gives confirmation.",
            {
              kind: "list",
              items: [
                "Surrender and start small. You do not need a title to practice a gift. Begin with a small act of service and notice whether others are strengthened, encouraged, equipped, comforted, clarified, or helped.",
                "Read scripture. Learn about the gifts and explore how God used them in people’s lives. Pay attention to the ways Jesus interacted with people.",
                "Pray for wisdom and insight. Ask God to help you see clearly how He is gifting you. Seek to understand by sitting still and listening.",
                "Pay attention to fruit. Ask whether people experience love, whether the Body is strengthened, whether the practice aligns with Scripture, and whether humility is growing.",
                "Learn through feedback. Ask trusted people what they saw, what was helpful, and what could mature. Correction is part of stewardship.",
              ],
            },
            "Assessment gives language. Service gives guidance. Fruitfulness affirms where the Spirit is at work in your life.",
          ],
          image: {
            alt: "Women working together at a modern workplace",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/9f8f9d52-4016-4898-a0fb-fcad95e41c1b/smiling-women-working-together-at-modern-workplace-2026-03-25-01-30-58-utc.jpg?format=300w",
          },
          focus: [
            "Discernment requires movement.",
            "A small serving experiment is often better than a permanent assignment.",
            "Feedback helps a gift mature in love.",
          ],
          reflectionPrompt:
            "Where could you practice one possible gift in a small, humble, low-pressure way?",
          slug: "theory-to-practice",
          summary:
            "Moves gifts from report language into a small serving experiment.",
          title: "Theory to Practice",
        },
        {
          body: [
            "Spiritual gifts belong in the Body. They are not private possessions; they are entrusted for service, and community gives them a place to bless others.",
            {
              kind: "scripture",
              text: "“For by the grace given me I say to every one of you: Do not think of yourself more highly than you ought, but rather think of yourself with sober judgment, in accordance with the faith God has distributed to each of you. For just as each of us has one body with many members, and these members do not all have the same function, so in Christ we, though many, form one body, and each member belongs to all the others. We have different gifts, according to the grace given to each of us. If your gift is prophesying, then prophesy in accordance with your faith; if it is serving, then serve; if it is teaching, then teach; if it is to encourage, then give encouragement; if it is giving, then give generously; if it is to lead, do it diligently; if it is to show mercy, do it cheerfully.” Romans 12: 3-8",
            },
            "Community confirms what we often cannot see alone. Repeated encouragement from trusted people may confirm an active or emerging gift. Community also corrects. Gifts can be used immaturely, and loving feedback helps us notice when a gift has become harsh, hidden, controlling, unclear, prideful, or disconnected from love.",
            "Different gifts work together. The Body grows as each part does its work in love, and humility grows when we honor gifts different from our own.",
          ],
          image: {
            alt: "Diverse group working together around a shared table",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/6799e381-1255-4ac9-9b23-20567c2a2673/diverse-group-of-young-business-people-working-in-2026-03-18-05-03-41-utc+800.jpg?format=2500w",
          },
          focus: [
            "Gifts are best discerned in community.",
            "Correction is not rejection; it is formation.",
            "No one person carries the whole mission.",
          ],
          reflectionPrompt:
            "Who can help you discern your gifts with honesty, encouragement, and wisdom?",
          slug: "within-community",
          summary:
            "Places gift discernment inside trusted community, confirmation, correction, and coordinated service.",
          title: "Within Community",
          companionMoment: spiritualGiftsCompanionMoments.community,
        },
      ],
    },
    {
      slug: "study",
      title: "Module 5: Further Study",
      lessons: [
        {
          body: [
            "Common questions about spiritual gifts can be answered with Scripture, humility, and a commitment to faithful practice. To know your gifts, look at Scripture, notice service patterns, ask trusted community, pay attention to fruit, and practice over time.",
            {
              kind: "subheading",
              text: "FAQ’s",
            },
            {
              kind: "subheading",
              text: "Does Everyone have Spiritual gifts?",
            },
            "Yes, everyone who has repented of their sins and accepted Jesus as their Lord and Savior receives the Holy Spirit and at least one gift.",
            {
              kind: "scripture",
              text: "“Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms.” 1 Peter 4:10",
            },
            {
              kind: "subheading",
              text: "Can Spiritual Gifts change over time?",
            },
            "Yes, some gifts may remain consistent over time, while others may emerge more clearly in different seasons. God may also empower people for specific needs and moments.",
            {
              kind: "scripture",
              text: "“All these are the work of one and the same Spirit, and he distributes them to each one, just as he determines.” 1 Corinthians 12:11",
            },
            {
              kind: "subheading",
              text: "How do you know what your Spiritual gifts are?",
            },
            "Simply stated, through service. As we mentioned in the previous module, Gifts are learned by doing. The easiest way to discover or grow in your gifts is through action.",
            {
              kind: "subheading",
              text: "What is the difference between Spiritual Gifts and talent?",
            },
            "Talent comes from DESIGN. You were formed in your mother’s womb. God formed you with intention and care. You are His workmanship, a treasure beyond measure. Talent is natural, broad in purpose, and either from birth or from practice and repetition.",
            "Gifts are empowerment. They are supernatural equipping for Kingdom work. They come from your new birth in Christ.",
            "If a top gift surprises you, treat the surprise as an invitation to explore. Ask where the gift may have already appeared, ask others what they see, and practice before dismissing it. If you do not like your results, bring that reaction honestly to God. Avoid comparison. Remember that the report is a tool, not a verdict, and focus on service rather than status.",
          ],
          image: {
            alt: "Student reading carefully at a wooden table",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/7e91e9dd-c8e8-418e-aa72-63084a529fed/focused-student-reads-carefully-at-wooden-table-2026-01-06-09-26-55-utc.jpg?format=2500w",
          },
          focus: [
            "Discern gifts through Scripture, service, community, and fruit.",
            "Surprise can become an invitation to explore.",
            "The report is a tool, not a verdict.",
          ],
          reflectionPrompt:
            "What question about spiritual gifts do you most want answered?",
          slug: "spiritual-gift-faq",
          summary:
            "Answers common gift questions with a grounded, humble discernment posture.",
          title: "Spiritual Gift FAQ",
        },
        {
          body: [
            "Christians and churches may categorize or emphasize spiritual gifts differently. The New Testament discusses gifts in several passages, including Romans 12, First Corinthians 12, Ephesians 4, and First Peter 4.",
            {
              alt: "Discover Your Divine Design Spiritual Gifts list chart with Scripture passage correlations and ministry expression markers",
              fit: "contain",
              kind: "image",
              src: "/brand/tools/spiritual-gifts-scripture-chart.png",
            },
            {
              kind: "subheading",
              text: "Ministry Expressions",
            },
            "A few of the items in the Discover Your Design list are best understood as ministry expressions rather than traditional spiritual gifts. They may not appear in the major New Testament gift lists in the same way as teaching, mercy, leadership, prophecy, or exhortation, but they are clearly seen in Scripture as Spirit-empowered ways people serve God and strengthen others.",
            "These expressions help us recognize that God’s design in a person can show up through mission, prayer, worship, beauty, skill, and creative work. They are not “less spiritual” because they are not always named in the gift lists. They are simply broader expressions of calling, ability, and ministry fruit.",
            {
              kind: "subheading",
              text: "Craftsmanship",
            },
            "Craftsmanship is one of the clearest Old Testament examples of God empowering a person for creative and skillful work. In Exodus 31, Bezalel is described as being filled with the Spirit of God with wisdom, understanding, knowledge, and skill for artistic design and hands-on craftsmanship. This reminds us that design, building, beauty, artistry, and excellence can all become ways of serving God.",
            "This also connects beautifully with Ephesians 2:10, the central verse for Discover Your Divine Design: we are God’s workmanship, created in Christ Jesus for good works. Craftsmanship reflects both the God who makes and the people He forms to make things well.",
            {
              kind: "subheading",
              text: "Intercession",
            },
            "Intercession is a focused expression of prayer on behalf of others. While every believer is called to pray, some people carry a stronger burden to stand in prayer for people, families, leaders, churches, communities, or specific situations.",
            "Scripture repeatedly shows the importance of praying for others. Jesus intercedes for us, Paul often prayed for the churches, and James reminds believers that prayer is powerful and effective. Intercession is not just private concern; it is spiritual service offered through prayer.",
            "References: Hebrews 7:25; Colossians 1; Colossians 4; James 5.",
            {
              kind: "subheading",
              text: "Missionary",
            },
            "Missionary ministry is rooted in the idea of being sent. The word “apostle” carries the meaning of one who is sent forth, and the Great Commission gives every believer a mission-shaped calling: to go, make disciples, baptize, and teach.",
            "Not everyone will serve cross-culturally or vocationally as a missionary, but some people are especially drawn to go beyond familiar spaces with the gospel. They feel a burden for people who have not yet heard, understood, or experienced the good news of Jesus in a life-giving way.",
            "Reference: Matthew 28:18-20.",
            {
              kind: "subheading",
              text: "Music / Worship",
            },
            "Music and worship are closely connected, but they are not exactly the same. Music is one of the ways worship can be expressed; worship is the deeper posture of honoring, loving, and responding to God.",
            "Some people are especially designed to help others turn their attention toward God through song, melody, beauty, and gathered praise. Ephesians 5 and Colossians 3 both connect Spirit-filled life with psalms, hymns, spiritual songs, singing, gratitude, and worship from the heart.",
            "References: Ephesians 5:18-19; Colossians 3:16.",
            "Gift names help create shared language, and different assessments may use different gift lists or definitions. The question is whether the language helps people serve faithfully according to Scripture.",
            "Where churches differ on how certain gifts operate today, the posture should be Scripture, pastoral wisdom, humility, and love. Participants should honor their church leadership and remain teachable. Shared foundations remain steady: gifts come from God, gifts serve others, gifts build up the Body, gifts require love, and gifts need maturity.",
          ],
          image: {
            alt: "Hand holding a cross against golden sky",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/a347531f-a916-4ee2-8f8a-da3deefe6682/hand-holding-cross-against-the-golden-sky-2026-01-09-06-14-29-utc.jpg?format=300w",
          },
          focus: [
            "Different traditions may group gifts differently.",
            "Gift language should help people serve faithfully.",
            "Humility matters where Christians disagree.",
          ],
          reflectionPrompt:
            "How can you stay grounded when different churches, traditions, or teachers explain gifts differently?",
          slug: "different-approaches",
          summary:
            "Names denominational differences without apology or defensiveness, while staying grounded in Scripture and love.",
          title: "Different Approaches",
        },
        {
          body: [
            "The DYDD approach connects gifts with identity, design, formation, service, and purpose without reducing a person to assessment results.",
            "DYDD begins with the belief that each person is created intentionally by God. Spiritual gifts are part of faithful participation in the good works God prepared, but they are not the whole story. The larger journey includes identity, design, story, desire, gifts, and niche. Spiritual gifts help name how the Spirit equips you to strengthen others within that broader journey.",
            "Spiritual Gifts + Identity: Your gifts do not define your worth; they flow from who you already are in Christ.",
            "Spiritual Gifts + Expertise: God can work through the skills you have developed, but spiritual gifts add Spirit-empowered fruit beyond natural ability.",
            "Spiritual Gifts + Story: Your story often shapes where and how your gifts are most likely to serve others with compassion and impact.",
            "Spiritual Gifts + Desire: Your desires can point toward the people, needs, and purposes where God may want your gifts to be used.",
          ],
          image: {
            alt: "DYDD pathway illustration connecting gifts and formation",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/a41a6cf7-fbee-4855-97d2-323bfe455241/envato-labs-image-edit+%2861%29.png?format=2500w",
          },
          focus: [
            "Spiritual gifts are part of the larger DYDD journey.",
            "Design, gifts, fruit, story, and desire belong together.",
            "The goal is faithful service, not assessment identity.",
          ],
          reflectionPrompt:
            "How do spiritual gifts connect with the broader question of who God created you to be and how He invites you to serve?",
          slug: "dydd-approach",
          summary:
            "Connects Spiritual Gifts to the broader Discover Your Divine Design pathway.",
          title: "The DYDD Approach",
        },
      ],
    },
    {
      slug: "next",
      title: "Module 6: What's Next",
      lessons: [
        {
          body: [
            "Spiritual gifts grow through practice, humility, training, correction, love, and ongoing dependence on the Holy Spirit. Paul tells Timothy to fan into flame the gift of God.",
            "Every gift has mature and immature expressions. Discernment can become suspicion, teaching can become information without love, exhortation can become pressure, and craftsmanship can become perfectionism if identity attaches to performance.",
            "Make a simple growth plan: pray through the gift, study the Scriptures connected to it, practice in a small setting, ask for feedback, seek training or mentoring, and review fruit over time.",
            "Not every gift needs a platform. Some gifts mature in hidden faithfulness. Confidence should grow with humility because the aim is not self-expression, but faithful service.",
          ],
          image: {
            alt: "Barefoot walk along a sandy beach shoreline",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/e67da71a-517c-42c4-9a1d-aa9fd8c1a0ec/barefoot-stroll-along-the-sandy-beach-shoreline-2026-03-20-04-41-26-utc.jpg?format=2500w",
          },
          focus: [
            "Gifts can be neglected or developed.",
            "Maturity and love shape trustworthy service.",
            "A 30-day growth plan turns insight into practice.",
          ],
          reflectionPrompt:
            "What gift do you sense God inviting you to practice, develop, or steward more intentionally in this season?",
          slug: "grow-in-your-gifts",
          summary:
            "Helps learners build a practical plan to steward one gift with humility and dependence.",
          title: "Grow in Your Gifts",
          companionMoment: spiritualGiftsCompanionMoments.growth,
        },
        {
          body: [
            "Spiritual gifts connect with the broader DYDD pathway by helping participants serve from grace, design, fruit, and purpose.",
            "DesignID helps you understand identity reflections. Spiritual Gifts helps you notice Spirit-empowered contribution. FruitLife360 helps you remain grounded in Christlike formation. DesignPD helps you apply design through planning, deciding, and doing.",
            "A gift is not only for formal ministry. Gifts may appear in homes, workplaces, churches, friendships, creative work, leadership, and ordinary service.",
            "Humility keeps gifts from becoming pride. Courage keeps gifts from being buried. Love teaches when and how to offer what God has given.",
          ],
          image: {
            alt: "Illustration of DYDD assessment pathways connected together",
            src: "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/df578735-33b3-4bc5-a9be-26f3a80fd535/image-gen+%2823%29.png?format=300w",
          },
          focus: [
            "Gifts are stewardship.",
            "The DYDD ecosystem brings gifts, design, fruit, and action together.",
            "The final invitation is to receive, practice, confirm, mature, and serve.",
          ],
          reflectionPrompt:
            "How can your gifts serve others while keeping Christ, not self-importance, at the center?",
          slug: "dydd-connections",
          summary:
            "Closes the course by connecting gifts to the wider DYDD app path and a next faithful step.",
          title: "DYDD Connections",
        },
      ],
    },
  ],
  price: "Free assessment",
  slug: "spiritual-gifts-service",
  sourceNote:
    "Built from the Spiritual Gifts Assessment report: Top 5 gifts, definitions, Scriptures, practical expressions, deep dives, maturity language, and growth steps.",
  tagline: "Gifts for service",
  title: "Spiritual Gifts in Service",
} satisfies CourseDefinition;

import type { CompanionMoment, CompanionMomentSpeaker } from "./companion-moments";

const dydi: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/dydi-full-body.png",
  imageAlt: "Dydi standing as a friendly DYDD guide",
  name: "Dydi",
  role: "DYDD guide",
};

const daniel: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/shepherd-male-daniel-full-body.png",
  imageAlt: "Daniel standing as a warm Shepherd guide",
  name: "Daniel",
  role: "protective guide",
};

const mara: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/shepherd-female-mara-full-body.png",
  imageAlt: "Mara standing as a warm Shepherd encourager",
  name: "Mara",
  role: "meaning-making encourager",
};

const naomi: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/artisan-female-naomi-full-body.png",
  imageAlt: "Naomi standing as a careful craftsperson",
  name: "Naomi",
  role: "careful craftsperson",
};

const clara: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/steward-female-clara-full-body.png",
  imageAlt: "Clara standing as a faithful organizer",
  name: "Clara",
  role: "faithful organizer",
};

const miles: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/steward-male-miles-full-body.png",
  imageAlt: "Miles standing as a wise trustee",
  name: "Miles",
  role: "wise trustee",
};

const marcus: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/architect-male-marcus-full-body.png",
  imageAlt: "Marcus standing as a steady builder",
  name: "Marcus",
  role: "steady builder",
};

const leo: CompanionMomentSpeaker = {
  image: "/brand/characters/full-body/artisan-male-leo-full-body.png",
  imageAlt: "Leo standing as a creative storyteller",
  name: "Leo",
  role: "design translator",
};

export const spiritualGiftsCompanionMoments = {
  welcome: {
    audioSrc: "/audio/companions/course-moments/sg-welcome-dydi.mp3",
    duration: "About 1 minute",
    kicker: "Companion welcome",
    speakers: [dydi],
    title: "Receive This as an Invitation",
    transcript: [
      {
        speaker: "Dydi",
        text: "Before you begin, take a breath. Your spiritual gifts are not a pressure to perform or a label to protect. They are grace to steward. This course will help you read your report slowly, pray honestly, and look for the places your gifts can build others up in love. Do not rush to prove anything. Ask God for humility, courage, and a small faithful next step.",
      },
    ],
  },
  report: {
    audioSrc: "/audio/companions/course-moments/sg-report-daniel.mp3",
    duration: "Under 1 minute",
    kicker: "Report posture",
    speakers: [daniel],
    title: "Look for Grace, Not Pressure",
    transcript: [
      {
        speaker: "Daniel",
        text: "When you read your report, notice what gives life before you start fixing anything. Which gift sounds familiar? Which one surprises you? Which one needs maturity before it needs more opportunity? A gift is safest when it is governed by love. So read this as a beginning: one gift, one prayer, one trusted person, and one small place to serve.",
      },
    ],
  },
  community: {
    audioSrc: "/audio/companions/course-moments/sg-community-mara.mp3",
    duration: "Under 1 minute",
    kicker: "Community reflection",
    speakers: [mara],
    title: "Let Trusted People Help You See",
    transcript: [
      {
        speaker: "Mara",
        text: "You were not meant to discern your gifts alone. Sometimes other people see grace in us before we have words for it. Ask someone safe and honest, \"Where have you seen God use me to strengthen others?\" Then listen without defending and without shrinking back. Confirmation is not a crown. It is a kindness that helps you serve with more love.",
      },
    ],
  },
  growth: {
    audioSrc: "/audio/companions/course-moments/sg-growth-clara.mp3",
    duration: "Under 1 minute",
    kicker: "Next faithful step",
    speakers: [clara],
    title: "Make the Next Step Small Enough to Do",
    transcript: [
      {
        speaker: "Clara",
        text: "A growth plan does not have to be complicated. Choose one gift from your report. Choose one maturity practice. Choose one place to serve. Then set a seven-day checkpoint. Small faithful steps repeated over time create real formation. The question is not, \"Can I master this gift?\" The better question is, \"How can I steward this grace faithfully this week?\"",
      },
    ],
  },
} satisfies Record<string, CompanionMoment>;

export const fruitLifeCompanionMoments = {
  welcome: {
    audioSrc: "/audio/companions/course-moments/fl-welcome-dydi.mp3",
    duration: "About 1 minute",
    kicker: "Companion welcome",
    speakers: [dydi],
    title: "Begin with Grace",
    transcript: [
      {
        speaker: "Dydi",
        text: "FruitLife 360 is not here to grade your spiritual life. It is a mirror for noticing what the Spirit may be forming in you. Begin with grace. Receive encouragement first. Then let the report help you notice one fruit, one ordinary setting, and one practice where you can walk with Jesus more intentionally this week.",
      },
    ],
  },
  observers: {
    audioSrc: "/audio/companions/course-moments/fl-observers-mara.mp3",
    duration: "Under 1 minute",
    kicker: "Feedback posture",
    speakers: [mara],
    title: "Receive Feedback Without Losing Heart",
    transcript: [
      {
        speaker: "Mara",
        text: "Observer feedback can feel tender because it touches real life. So receive it gently. Look for repeated themes, not one sharp sentence. Look for encouragement before correction. And when something stings, ask, \"Lord, is there an invitation here?\" You are not being reduced to a score. You are being invited into formation with hope.",
      },
    ],
  },
  abiding: {
    audioSrc: "/audio/companions/course-moments/fl-abiding-daniel.mp3",
    duration: "Under 1 minute",
    kicker: "John 15 reminder",
    speakers: [daniel],
    title: "Fruit Grows by Abiding",
    transcript: [
      {
        speaker: "Daniel",
        text: "Jesus does not tell branches to strain harder. He says, remain in Me. That matters. Fruit formation includes practice, but it starts with dependence. Before you choose a strategy, ask where you need to stay close to Christ. What would it look like to bring this fruit into prayer before you bring it into effort?",
      },
    ],
  },
  practice: {
    audioSrc: "/audio/companions/course-moments/fl-practice-naomi.mp3",
    duration: "Under 1 minute",
    kicker: "Practice prompt",
    speakers: [naomi],
    title: "Choose One Concrete Practice",
    transcript: [
      {
        speaker: "Naomi",
        text: "Formation becomes clearer when practice is specific. Do not choose every fruit at once. Choose one fruit. Choose one ordinary setting. Choose one action you can repeat for seven days. Then notice what happens in your words, tone, pace, and attention. Growth often begins quietly, but faithful practice gives it room to take root.",
      },
    ],
  },
  connection: {
    audioSrc: "/audio/companions/course-moments/fl-dydd-miles.mp3",
    duration: "Under 1 minute",
    kicker: "DYDD connection",
    speakers: [miles],
    title: "Let Formation Govern the Whole Journey",
    transcript: [
      {
        speaker: "Miles",
        text: "Design, gifts, calling, and action all need formation. FruitLife helps keep the center steady. The question is not only, \"What am I designed to do?\" It is also, \"Who am I becoming as I do it?\" Let your next step be both purposeful and faithful. Steward the work, but also steward the heart carrying the work.",
      },
    ],
  },
} satisfies Record<string, CompanionMoment>;

export const designIdCompanionMoments = {
  welcome: {
    audioSrc: "/audio/companions/course-moments/designid-welcome-dydi.mp3",
    duration: "About 1 minute",
    kicker: "Companion welcome",
    speakers: [dydi],
    title: "Start with Identity, Not Pressure",
    transcript: [
      {
        speaker: "Dydi",
        text: "DesignID is not meant to box you in. It gives language for patterns God may have woven into your life: how you see, serve, build, care, create, organize, and respond. As you begin, hold the report with curiosity. You are not trying to become a type. You are learning to notice grace, design, and the next faithful step.",
      },
    ],
  },
  profile: {
    audioSrc: "/audio/companions/course-moments/designid-profile-marcus.mp3",
    duration: "Under 1 minute",
    kicker: "Profile lens",
    speakers: [marcus],
    title: "Turn Your Profile into Stewardship",
    transcript: [
      {
        speaker: "Marcus",
        text: "Your profile is useful when it becomes stewardship. Do not stop at, \"This is how I am wired.\" Ask, \"What does this help me build, clarify, protect, or serve?\" Primary and secondary reflections can show repeated patterns, but maturity asks how those patterns bless real people in real places.",
      },
    ],
  },
  capacity: {
    audioSrc: "/audio/companions/course-moments/designid-capacity-naomi.mp3",
    duration: "Under 1 minute",
    kicker: "Capacity reflection",
    speakers: [naomi],
    title: "Capacity Is Information",
    transcript: [
      {
        speaker: "Naomi",
        text: "Capacity is not a moral score. It is information for wisdom. If a reflection is low, stretched, or tired, that may name a need for rest, partnership, practice, or clearer boundaries. If a reflection is strong, that may name a place to steward carefully. Either way, listen with gentleness and respond with one wise adjustment.",
      },
    ],
  },
  shadow: {
    audioSrc: "/audio/companions/course-moments/designid-shadows-leo.mp3",
    duration: "Under 1 minute",
    kicker: "Shadow reflection",
    speakers: [leo],
    title: "Treat Shadow as an Invitation",
    transcript: [
      {
        speaker: "Leo",
        text: "Shadow language can sound heavy, but it can also be merciful. It helps us notice what happens when a good reflection gets pressured, disconnected, or afraid. Do not use shadow to shame yourself. Use it as a lamp. Ask, \"What beautiful thing is trying to protect itself here, and how can God redeem it?\"",
      },
    ],
  },
} satisfies Record<string, CompanionMoment>;

export const dyddJourneyCompanionMoments = {
  welcome: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-welcome-dydi.mp3",
    duration: "About 1 minute",
    kicker: "Journey welcome",
    speakers: [dydi],
    title: "Begin the Journey Without Rushing",
    transcript: [
      {
        speaker: "Dydi",
        text: "Welcome to Discover Your Divine Design. Do not treat this like a race to finish content. This journey is meant to help you notice what God has already been forming in you: identity, story, gifts, desire, expertise, and purpose. Start simply. Bring honesty. Ask God for one faithful step at a time.",
      },
    ],
  },
  care: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-care-daniel-mara.mp3",
    duration: "About 1 minute",
    kicker: "CARE rhythm",
    speakers: [daniel, mara],
    title: "Let CARE Slow the Work Down",
    transcript: [
      {
        speaker: "Daniel",
        text: "CARE is not a worksheet trick. It is a way of slowing down enough to connect with God before you act.",
      },
      {
        speaker: "Mara",
        text: "And after you act, you reflect. You notice what happened in your heart, your relationships, and your courage. Then you explore what God may be inviting next.",
      },
      {
        speaker: "Daniel",
        text: "So when a lesson feels big, bring it back to the next small faithful step.",
      },
    ],
  },
  identity: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-identity-mara.mp3",
    duration: "Under 1 minute",
    kicker: "Identity reminder",
    speakers: [mara],
    title: "Whose Comes Before Who",
    transcript: [
      {
        speaker: "Mara",
        text: "Before you try to name what you do, let God remind you whose you are. Identity is not something you perform into existence. It is received in Christ and then expressed through love. As you answer these questions, be gentle with yourself. Let truth come before pressure.",
      },
    ],
  },
  expertise: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-expertise-naomi-miles.mp3",
    duration: "About 1 minute",
    kicker: "Expertise reflection",
    speakers: [naomi, miles],
    title: "Steward What Has Been Formed",
    transcript: [
      {
        speaker: "Naomi",
        text: "Expertise often grows quietly through practice, repetition, failure, learning, and care. Do not only look for what feels impressive.",
      },
      {
        speaker: "Miles",
        text: "Look for what has been entrusted to you over time. Talents, competencies, and hard-won wisdom can all become stewardship when they are offered back to God.",
      },
    ],
  },
  story: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-story-leo-mara.mp3",
    duration: "About 1 minute",
    kicker: "Story reflection",
    speakers: [leo, mara],
    title: "God Does Not Waste the Story",
    transcript: [
      {
        speaker: "Leo",
        text: "Your story is not just a timeline of events. It carries themes, wounds, provision, courage, and moments where God was writing more than you could see.",
      },
      {
        speaker: "Mara",
        text: "Hold it tenderly. Some memories need gratitude. Some need grief. Some need redemption language. Ask what God has been forming through the story, not only what happened in it.",
      },
    ],
  },
  desire: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-desire-elena.mp3",
    duration: "Under 1 minute",
    kicker: "Desire discernment",
    speakers: [
      {
        image: "/brand/characters/full-body/architect-female-full-body.png",
        imageAlt: "Elena standing as a catalytic strategist",
        name: "Elena",
        role: "catalytic strategist",
      },
    ],
    title: "Pay Attention to Holy Desire",
    transcript: [
      {
        speaker: "Elena",
        text: "Desire can become noisy when it is ruled by fear, comparison, or ambition. But desire can also become a clue. Pay attention to the burdens, hopes, and possibilities that keep returning in prayer. Do not force them into a final answer yet. Name them honestly and ask what faithful direction they may be pointing toward.",
      },
    ],
  },
  gifts: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-gifts-clara-daniel.mp3",
    duration: "About 1 minute",
    kicker: "Gifts bridge",
    speakers: [clara, daniel],
    title: "Let Gifts Serve the Whole Journey",
    transcript: [
      {
        speaker: "Clara",
        text: "When you reach the Gifts chapter, keep your results connected to everything you have already named: identity, expertise, story, and desire.",
      },
      {
        speaker: "Daniel",
        text: "A gift is not meant to stand alone. It becomes fruitful when love governs it and community confirms it. Ask where your gifts can serve the people God is placing in front of you.",
      },
    ],
  },
  nicheConversation: {
    audioSrc: "/audio/companions/course-moments/dydd-journey-niche-four-voices.mp3",
    duration: "About 2 minutes",
    kicker: "Pathfinder conversation",
    speakers: [dydi, daniel, naomi, marcus],
    title: "Four Voices Before the Niche Declaration",
    transcript: [
      {
        speaker: "Dydi",
        text: "Before you draft the final declaration, gather the pieces slowly. Identity, story, expertise, desire, and gifts are not separate piles. They are becoming one faithful picture.",
      },
      {
        speaker: "Daniel",
        text: "And if the picture still feels incomplete, that is all right. Purpose often becomes clearer through obedience, not before it.",
      },
      {
        speaker: "Naomi",
        text: "Use plain words first. Do not try to make the sentence sound impressive. Make it honest, usable, and faithful to what you have actually discovered.",
      },
      {
        speaker: "Marcus",
        text: "Then give it structure. Who are you called to serve? What has God formed in you? What kind of good work is beginning to take shape?",
      },
      {
        speaker: "Dydi",
        text: "Let this be a working declaration, not a final prison. God can keep refining the language as you keep walking.",
      },
    ],
  },
} satisfies Record<string, CompanionMoment>;

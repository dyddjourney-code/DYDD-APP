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

export type PassportBadgeState = "earned" | "next" | "ahead";

export type PassportBadge = {
  connectedTo: string;
  earnBy: string;
  group?: "journey" | "extension";
  image: string;
  state: PassportBadgeState;
  summary: string;
  title: string;
};

export const defaultPassportBadges: PassportBadge[] = [
  {
    connectedTo: "Discover Your Divine Design Journey",
    earnBy: "Start the Discover Your Divine Design Journey.",
    image: "/brand/badges/dydd-trail-badges-preview.png",
    state: "next",
    summary: "Marks the moment a traveler begins the main DYD Journey and steps onto the path.",
    title: "DYD Journey Started",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Identity section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/identity-badge.svg",
    state: "ahead",
    summary: "Marks the beginning of seeing who you are before what you do.",
    title: "Identity",
  },
  {
    connectedTo: "DesignID assessment and report",
    earnBy: "Complete DesignID and open the report artifact.",
    image: "/brand/badges/designid-badge.png",
    state: "ahead",
    summary: "Names your primary reflection pattern and the way your design tends to serve.",
    title: "DesignID",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Expertise section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/expertise-badge.svg",
    state: "ahead",
    summary: "Recognizes skills, capacity, learning, and practiced contribution.",
    title: "Expertise",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Story section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/story-badge.svg",
    state: "ahead",
    summary: "Helps name formation, redemption, wounds, testimony, and wisdom.",
    title: "Story",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Desire section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/desire-badge.svg",
    state: "ahead",
    summary: "Names holy motivation, longing, burden, and the pull toward purpose.",
    title: "Desire",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Gifts section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/gifts-badge.svg",
    state: "ahead",
    summary: "Connects gifts to love, service, maturity, and the body of Christ.",
    title: "Gifts",
  },
  {
    connectedTo: "Spiritual Gifts assessment",
    earnBy: "Complete the Spiritual Gifts assessment.",
    image: "/brand/badges/spiritual-gifts-badge.png",
    state: "ahead",
    summary: "Confirms spiritual gifts through a focused assessment and report.",
    title: "Spiritual Gifts Assessment",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Niche section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/niche-badge.svg",
    state: "ahead",
    summary: "Brings identity, design, story, desire, and gifts into a clearer purpose lane.",
    title: "Niche",
  },
  {
    connectedTo: "FruitLife360 assessment",
    earnBy: "Complete the FruitLife360 process or receive a completed report.",
    group: "extension",
    image: "/brand/badges/fruitlife-360-badge.png",
    state: "ahead",
    summary: "Shows visible fruit and growth themes through self and observer feedback.",
    title: "FruitLife360",
  },
  {
    connectedTo: "DesignPD assessment and report",
    earnBy: "Complete DesignID first, then complete the DesignPD assessment.",
    group: "extension",
    image: "/brand/badges/designpd-badge.png",
    state: "ahead",
    summary: "Applies design through the way you plan, decide, and do.",
    title: "DesignPD",
  },
];

export const designIdReflectionBadges: PassportBadge[] = ["Architect", "Artisan", "Shepherd", "Steward"].map((title) => ({
  title,
  connectedTo: "Your primary DesignID result",
  earnBy: "Complete DesignID to discover your primary design.",
  group: "extension",
  image: `/brand/badges/${title.toLowerCase()}-badge.png`,
  state: "ahead",
  summary: `The ${title} design marker appears on your main trail when it is your primary DesignID result.`,
}));

export function buildPassportBadges({ completedAssessments, primaryDesign }: {
  completedAssessments: string[];
  primaryDesign?: string;
}): PassportBadge[] {
  const completed = new Set(completedAssessments);
  const assessmentByTitle: Record<string, string> = {
    DesignID: "designid", DesignPD: "designpd",
    "Spiritual Gifts Assessment": "spiritual_gifts", FruitLife360: "fruit_360",
  };
  const earnedReflection = completed.has("designid")
    ? designIdReflectionBadges.find((badge) => badge.title.toLowerCase() === primaryDesign?.trim().toLowerCase())
    : undefined;
  const badges = defaultPassportBadges.flatMap((badge): PassportBadge[] => {
    const current: PassportBadge = {
      ...badge,
      state: completed.has(assessmentByTitle[badge.title]) ? "earned" : badge.state,
    };
    return badge.title === "DesignID" && earnedReflection
      ? [current, { ...earnedReflection, group: "journey", state: "earned" }]
      : [current];
  });
  return [...badges, ...designIdReflectionBadges.filter((badge) => badge.title !== earnedReflection?.title)];
}

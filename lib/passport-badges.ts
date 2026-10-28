export type PassportBadgeState = "earned" | "next" | "ahead" | "locked";

export type PassportBadge = {
  connectedTo: string;
  earnBy: string;
  group?: "journey" | "extension";
  kind?: "course";
  image: string;
  state: PassportBadgeState;
  summary: string;
  title: string;
};

export const defaultPassportBadges: PassportBadge[] = [
  {
    connectedTo: "Discover Your Divine Design Journey",
    earnBy: "Mark every lesson in Welcome & Orientation complete using the lesson checklist.",
    image: "/brand/badges/dydd-trail-badges-preview.png",
    state: "next",
    summary: "Recognizes completing the Welcome & Orientation chapter. Opening a lesson alone does not count.",
    title: "DYD Journey Started",
  },
  {
    connectedTo: "The main DYDD Journey — What is DYDD? chapter",
    earnBy: "Mark every lesson in the What is DYDD? chapter complete using the lesson checklist.",
    image: "/brand/badges/dydd-trail-badges-preview.png",
    state: "ahead",
    summary: "Recognizes completing the entire What is DYDD? chapter, separately from Welcome & Orientation.",
    title: "What is DYDD?",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Mark every lesson in the Identity chapter complete using the lesson checklist. There are no timers or reflection grades.",
    image: "/brand/badges/identity-badge.svg",
    state: "ahead",
    summary: "Marks the beginning of seeing who you are before what you do.",
    title: "Identity",
  },
  {
    connectedTo: "DesignID assessment and report",
    earnBy: "Complete DesignID and save its completed scored result/report. Your primary design badge is awarded from that saved result.",
    image: "/brand/badges/designid-badge.png",
    state: "ahead",
    summary: "Names your primary reflection pattern and the way your design tends to serve.",
    title: "DesignID",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Mark every lesson in the Expertise chapter complete using the lesson checklist. There are no timers or reflection grades.",
    image: "/brand/badges/expertise-badge.svg",
    state: "ahead",
    summary: "Recognizes skills, capacity, learning, and practiced contribution.",
    title: "Expertise",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Mark every lesson in the Story chapter complete using the lesson checklist. There are no timers or reflection grades.",
    image: "/brand/badges/story-badge.svg",
    state: "ahead",
    summary: "Helps name formation, redemption, wounds, testimony, and wisdom.",
    title: "Story",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Mark every lesson in the Desire chapter complete using the lesson checklist. There are no timers or reflection grades.",
    image: "/brand/badges/desire-badge.svg",
    state: "ahead",
    summary: "Names holy motivation, longing, burden, and the pull toward purpose.",
    title: "Desire",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Mark every lesson in the Gifts chapter complete using the lesson checklist. There are no timers or reflection grades.",
    image: "/brand/badges/gifts-badge.svg",
    state: "ahead",
    summary: "Connects gifts to love, service, maturity, and the body of Christ.",
    title: "Gifts",
  },
  {
    connectedTo: "Spiritual Gifts assessment",
    earnBy: "Complete the Spiritual Gifts assessment and save its completed scored result/report.",
    image: "/brand/badges/spiritual-gifts-badge.png",
    state: "ahead",
    summary: "Confirms spiritual gifts through a focused assessment and report.",
    title: "Spiritual Gifts Assessment",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Mark every lesson in the Niche chapter complete using the lesson checklist. There are no timers or reflection grades.",
    image: "/brand/badges/niche-badge.svg",
    state: "ahead",
    summary: "Recognizes completing all Niche chapter lessons. The separate Niche Declared milestone requires saved Pathfinder pieces and an explicit declaration completion.",
    title: "Niche",
  },
  {
    connectedTo: "FruitLife360 assessment",
    earnBy: "Complete the self reflection and every required observer response, then receive a completed saved FruitLife360 report.",
    group: "extension",
    image: "/brand/badges/fruitlife-360-badge.png",
    state: "ahead",
    summary: "Shows visible fruit and growth themes through self and observer feedback.",
    title: "FruitLife360",
  },
  {
    connectedTo: "DesignPD derived report — Dig Deeper trail ($15)",
    earnBy: "Complete DesignID, then unlock and save the DesignPD report derived from your saved DesignID result. This optional Dig Deeper trail is $15; there is no separate DesignPD assessment.",
    group: "extension",
    image: "/brand/badges/designpd-badge.png",
    state: "ahead",
    summary: "Applies design through the way you plan, decide, and do.",
    title: "DesignPD",
  },
];

defaultPassportBadges.splice(defaultPassportBadges.findIndex(b => b.title === "Niche") + 1, 0, {
 title: "Niche Declared", connectedTo: "Journey Pathfinder and your saved working niche declaration",
 earnBy: "Save all required Pathfinder pieces (identity, story, reflections, love for others, talents/skills, competency/expertise, desire, gifts, resulting in, and encouraged by) plus your working niche declaration. Then explicitly select Mark Niche Declared complete in the Niche builder.",
 image: "/brand/badges/niche-badge.svg", state: "ahead",
 summary: "Recognizes your explicit declaration milestone, separately from completing the Niche chapter. You can edit your words later and keep the badge.",
});

export const designIdReflectionBadges: PassportBadge[] = ["Architect", "Artisan", "Shepherd", "Steward"].map((title) => ({
  title,
  connectedTo: "Your primary DesignID result",
  earnBy: "Complete DesignID to discover your primary design.",
  group: "extension",
  image: `/brand/badges/${title.toLowerCase()}-badge.png`,
  state: "ahead",
  summary: `The ${title} design marker is earned on both your main trail and DesignID short trail when it is your primary result.`,
}));

const courseMarkers = [
  { title: "DesignID Course", slug: "designid-foundations", assessment: "DesignID" },
  { title: "Spiritual Gifts Course", slug: "spiritual-gifts-service", assessment: "Spiritual Gifts Assessment" },
  { title: "FruitLife360 Course", slug: "fruitlife-360-formation", assessment: "FruitLife360" },
  { title: "DesignPD Course", slug: "designpd-alignment", assessment: "DesignPD" },
];

export function buildPassportBadges({ completedAssessments, primaryDesign, completedCourses = [], earnedBadgeKeys = [] }: {
  completedAssessments: string[];
  primaryDesign?: string;
  completedCourses?: string[];
  earnedBadgeKeys?: string[];
}): PassportBadge[] {
  const earned = new Set(earnedBadgeKeys);
  const completed = new Set([...completedAssessments, ...earnedBadgeKeys]);
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
      state: earned.has(badge.title) || completed.has(assessmentByTitle[badge.title]) ? "earned" : badge.title === "DesignPD" && !completed.has("designid") ? "locked" : badge.state,
    };
    return badge.title === "DesignID" && earnedReflection
      ? [current, { ...earnedReflection, group: "journey", state: "earned" }]
      : [current];
  });
  const courses: PassportBadge[] = courseMarkers.map((marker) => {
    const assessment = defaultPassportBadges.find((badge) => badge.title === marker.assessment)!;
    const prerequisite = marker.slug === "designpd-alignment"
      ? "Complete DesignID, then unlock and save its derived DesignPD report (optional $15 Dig Deeper trail)."
      : marker.slug === "fruitlife-360-formation"
        ? "Receive a completed saved FruitLife360 report after your self reflection and all required observers."
        : `Complete and save your ${marker.assessment === "Spiritual Gifts Assessment" ? "Spiritual Gifts" : marker.assessment} scored result/report first.`;
    return {
      title: marker.title, image: assessment.image, group: "extension", kind: "course",
      connectedTo: marker.assessment === "DesignPD" ? "DesignPD Dig Deeper paid trail ($15)" : `${marker.assessment === "Spiritual Gifts Assessment" ? "Spiritual Gifts" : marker.assessment} short trail`,
      earnBy: `${prerequisite} Mark every lesson in the ${marker.title.replace(" Course", "")} course complete using its lesson checklist, including explicitly marking the final lesson complete. Opening the last lesson does not count. No timers or reflection grading.`,
      summary: "Recognizes completing every teaching lesson, separately from earning the saved result/report milestone.",
      state: completedCourses.includes(marker.slug) || earned.has(marker.slug) ? "earned" : marker.assessment === "DesignPD" && !completed.has("designid") ? "locked" : "ahead",
    };
  });
  // Persisted historical reflection awards are audit history, not current design.
  // Main Passport and short trails share this single current-primary projection.
  return [...badges, ...(earnedReflection ? [] : designIdReflectionBadges), ...courses];
}

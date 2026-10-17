import type { AssessmentSnapshotSummary } from "@/lib/assessments/student-context";
export const trailDefinitions = [
  {
    id: "designid",
    name: "DesignID",
    assessmentType: "designid",
    courseSlug: "designid-foundations",
    courseHref: "/courses/designid-foundations",
    assessmentHref: "/designid",
    signpost: "/brand/trailheads/designid-signpost.png",
    description:
      "Discover your reflection of God’s design, then learn how it shapes your contribution, relationships, and everyday life.",
    rating: "Moderate",
    ratingNote: "Personal discovery with thoughtful reflection and practical application.",
    terrain: "Personal discovery, report exploration, and reflection",
    gear: "Your completed DesignID results for the course",
    bestFor: "Anyone exploring how they naturally contribute",
    prerequisite:
      "Begin with DesignID. Your completed assessment opens the connected course.",
  },
  {
    id: "spiritual-gifts",
    name: "Spiritual Gifts",
    assessmentType: "spiritual_gifts",
    courseSlug: "spiritual-gifts-service",
    courseHref: "/courses/spiritual-gifts-service",
    assessmentHref: "/spiritual-gifts?channel=app",
    signpost: "/brand/trailheads/spiritual-gifts-signpost.png",
    description:
      "Recognize gifts to explore through prayer, service, and community, then learn to steward them with humility and love.",
    rating: "Easy",
    ratingNote: "A short exploration with room for prayerful reflection.",
    terrain: "Gift discovery, Scripture, and serving experiments",
    gear: "Your Spiritual Gifts results for the course",
    bestFor: "Anyone discovering where and how to serve",
    prerequisite:
      "Take the Spiritual Gifts assessment first. Your results open the course.",
  },
  {
    id: "fruitlife-360",
    name: "FruitLife360",
    assessmentType: "fruit_360",
    courseSlug: "fruitlife-360-formation",
    courseHref: "/courses/fruitlife-360-formation",
    assessmentHref: "/fruitlife360",
    signpost: "/brand/trailheads/fruitlife-360-signpost.png",
    description:
      "Notice the fruit of the Spirit in everyday life through honest reflection and feedback, then choose meaningful practices for growth.",
    rating: "Easy",
    ratingNote: "Gentle reflection and simple practices; allow time for observer feedback.",
    terrain: "Self-reflection, feedback, and everyday formation",
    gear: "Your completed FruitLife360 report for the course",
    bestFor: "Those ready for honest feedback and intentional growth",
    prerequisite:
      "Complete your FruitLife360 assessment and report before starting the course.",
  },
  {
    id: "designpd",
    name: "DesignPD",
    assessmentType: "designpd",
    courseSlug: "designpd-alignment",
    courseHref: "/courses/designpd-alignment",
    assessmentHref: "/designpd",
    signpost: "/brand/trailheads/designpd-signpost.png",
    description:
      "Build on DesignID to explore how you plan, decide, and do—then develop healthier rhythms for purposeful action.",
    rating: "Moderate",
    ratingNote: "A deeper application of the design you already know.",
    terrain: "Decision-making, practical experiments, and sustainable rhythms",
    gear: "DesignID first, then your unlocked DesignPD report",
    bestFor: "Travelers ready to turn design insight into action",
    prerequisite:
      "DesignID comes first. Unlock your DesignPD report to open its connected course.",
  },
] as const;
export function isTrailAssessmentComplete(
  type: string | null,
  snapshots: AssessmentSnapshotSummary[],
) {
  if (!type) return true;
  return snapshots.some((snapshot) => {
    if (snapshot.assessment_type !== type) return false;
    if (type === "designpd" && snapshot.source === "designpd_app") {
      const pdf = snapshot.scores?.pdfMonkey as
        | Record<string, unknown>
        | undefined;
      return ["ready", "success"].includes(String(pdf?.status));
    }
    return true;
  });
}

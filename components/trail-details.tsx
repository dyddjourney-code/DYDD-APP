import type { ReactNode } from "react";
import { TrailDetailsDialog } from "@/components/trail-details-dialog";
import { designIdCourse } from "@/lib/courses/designid-foundations";
import { designPdCourse } from "@/lib/courses/designpd-alignment";
import { spiritualGiftsCourse } from "@/lib/courses/spiritual-gifts-service";
import { fruitLife360Course } from "@/lib/courses/fruitlife-360-formation";
import { dyddMainCourseOutline } from "@/lib/journey/dydd-course-outline";

const details = {
  journey: {
    name: "Discover Your Divine Design Journey",
    about: "A biblical, guided course to help you understand your God-given design and purpose. Explore your identity in Christ, experience and expertise, personal story, desires, spiritual gifts, and niche—the people and good works you are uniquely positioned to serve.",
    bestFor: "Anyone seeking a fuller understanding of their design, calling, and next faithful steps. Choose this trail when you want the complete journey rather than a single assessment-based course.",
    before: "No assessment is required to begin. The Journey introduces connected assessments where they support your discovery; individual tools and paid expansions keep their own access requirements.",
    experience: "Guided teaching, Scripture, workbook reflection, practical action, and Pathfinder checkpoints help you gather what you discover into a personal niche declaration. Bring your Discover Your Divine Design book, workbook, and a place to reflect.",
    outcome: "Leave with clearer language for your design and purpose, a niche declaration, and a faithful next step for serving others. You do not need every answer before you begin.",
    access: "The Journey is included in your app access. Optional assessment expansions are separate; DesignPD is not required to begin.",
  },
  designid: {
    name: "DesignID",
    about: "Understand how you naturally reflect God's design through the Architect, Artisan, Shepherd, and Steward reflections. This course helps you read your personal results without reducing your identity to a label, then apply what you learn to contribution, communication, and relationships.",
    bestFor: "A practical starting point for anyone who wants language for their strengths, growth areas, and natural way of contributing—without committing to the full Journey first.",
    before: "Complete the DesignID assessment first. Your completed results open DesignID Foundations and give you a personal report to use throughout the course.",
    experience: "Explore the biblical foundation of design, the four reflections, your own report, and practical application. Lessons combine teaching, reflection, and examples; keep your results available as you learn.",
    outcome: "Recognize your strongest reflections, appreciate the differences in others, and choose practical ways to use your design with humility, love, and purpose.",
    access: "Assessment and connected course are included in your app access. DesignPD is an optional, separately unlocked next step—not a requirement for this course.",
  },
  "spiritual-gifts": {
    name: "Spiritual Gifts",
    about: "Explore how the Holy Spirit may be equipping you to build up others. The assessment gives you a starting point; the course helps you unpack your gifts through Scripture, prayer, maturity, and real opportunities to serve.",
    bestFor: "Anyone wondering where or how to serve, or seeking clearer language for gifts that may be active or emerging in their life.",
    before: "Complete the Spiritual Gifts assessment first. Your results open Spiritual Gifts in Service. No DesignID assessment or full Journey is required.",
    experience: "Read your top gifts, explore their biblical grounding and healthy expression, consider growth areas, and seek confirmation from trusted people. Reflection and practical service help you test what you discover.",
    outcome: "Choose a humble serving experiment, identify a maturity practice, and invite community feedback. Results are an invitation to discernment—not a permanent title or proof of spiritual importance.",
    access: "The Spiritual Gifts assessment and its connected course are included in your app access.",
  },
  "fruitlife-360": {
    name: "FruitLife360",
    about: "Prayerfully notice how the fruit of the Spirit is becoming visible in everyday life. FruitLife360 brings self-reflection and trusted-observer feedback into a gentle formation process focused on growth in Christ, not performance or comparison.",
    bestFor: "Anyone ready to receive honest perspective, notice both encouragement and growth opportunities, and practice a more Christlike response in daily life.",
    before: "Complete the FruitLife360 assessment process and receive your report before entering FruitLife360 Formation. If responses are still being collected, follow the active assessment in Field Kit.",
    experience: "Explore your report, the nine fruit of the Spirit, differences between your own view and others' observations, and the ways pressure affects your responses. Choose small practices rooted in grace and prayer.",
    outcome: "Name one area for intentional growth, choose a Spirit-led practice, and use feedback as a helpful mirror rather than a verdict about your worth or standing before God.",
    access: "The FruitLife360 assessment and connected course are included in your monthly subscription.",
  },
  designpd: {
    name: "DesignPD",
    about: "An extended trail built on DesignID that explores how your design moves through planning, deciding, and doing. Turn insight into clearer decisions, healthier collaboration, and sustainable action in life, leadership, work, ministry, and relationships.",
    bestFor: "People who already know their DesignID and want to understand why they approach plans, decisions, and follow-through the way they do—and how to work more effectively with others.",
    before: "Complete DesignID, then create your DesignPD report (included during the free beta). DesignPD uses your existing DesignID results to create an additional report; it is not a separate questionnaire. Your completed, unlocked DesignPD report opens the course.",
    experience: "Explore your Plan, Decide, and Do tendencies, recognize strengths and pressure points, and practice clearer conversations, support agreements, and realistic rhythms. Keep both your DesignID and DesignPD reports available.",
    outcome: "Build a practical operating rhythm for your design: clearer plans, wiser decisions, appropriate support, and a manageable next action you can sustain.",
    access: "Included during the free beta after DesignID. The unlocked DesignPD report includes access to its connected course; this expansion is not needed for the focused trails or to begin the main Journey. No payment is required during beta; already-saved reports retain course access.",
  },
} as const;

export function TrailDetails({ trailId, supplement }: { trailId: keyof typeof details; supplement?: ReactNode }) {
  const info = details[trailId];
  const courses = { designid: designIdCourse, designpd: designPdCourse, "spiritual-gifts": spiritualGiftsCourse, "fruitlife-360": fruitLife360Course };
  const modules = trailId === "journey"
    ? dyddMainCourseOutline.map((module) => ({ title: module.title, lessons: module.units }))
    : courses[trailId].modules;
  const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0);
  const journeyMinutes = dyddMainCourseOutline.flatMap((module) => module.units).reduce(
    (total, unit) => {
      const [low, high = low] = unit.duration.match(/\d+/g)?.map(Number) ?? [0];
      return [total[0] + low, total[1] + high];
    }, [0, 0],
  );
  const minutes = trailId === "journey" ? journeyMinutes : [lessonCount * 15, lessonCount * 25];
  const timeEstimate = `${Math.round(minutes[0] / 30) / 2}–${Math.round(minutes[1] / 30) / 2} hours`;


  return (
    <TrailDetailsDialog name={info.name}>
      <p className="trail-details-intro">{info.about}</p>
      {supplement}
      <dl className="trail-details-stats">
        <div><dt>Course structure</dt><dd>{modules.length} modules · {lessonCount} {trailId === "journey" ? "lesson and workbook units" : "lessons"}</dd></div>
        <div><dt>Pace</dt><dd>Self-paced · return to your saved lesson</dd></div>
      </dl>
      <section><h3>Who this trail is for</h3><p>{info.bestFor}</p></section>
      <section><h3>Before you begin</h3><p>{info.before}</p></section>
      <section><h3>What you will do</h3><p>{info.experience}</p></section>
      <section><h3>How much time to allow</h3><p><strong>Rough course estimate: {timeEstimate}.</strong> {trailId === "journey" ? "Based on the suggested times in the Journey outline; allow extra time for workbook reflection and real-life application." : "Based on 15–25 minutes per lesson for teaching and reflection; allow extra time for real-life practice."}</p><p>Plan around 15–25 minutes for a teaching-and-reflection session, with room to pause for prayer and practice. This is a planning estimate, not a timed requirement. Work through one lesson at a time or several together; there is no fixed weekly schedule.</p>{trailId === "fruitlife-360" ? <p>Allow additional calendar time for trusted observers to respond before your report is ready. Feedback collection and everyday practice are separate from course reading time.</p> : null}{trailId === "journey" ? <p>The full Journey is a longer course. Short orientation units and workbook checkpoints vary in length; move at a pace that allows the discoveries to become part of your life.</p> : null}</section>
      <section><h3>Your course outline</h3><p>Open a module to see every lesson{trailId === "journey" ? " and workbook checkpoint" : ""}.</p>
        <div className="trail-details-outline">{modules.map((module) => (
          <details key={module.title}><summary>{module.title}<span>{module.lessons.length} {trailId === "journey" ? "units" : "lessons"}</span></summary><ol>{module.lessons.map((lesson) => <li key={lesson.slug}>{lesson.title}</li>)}</ol></details>
        ))}</div>
      </section>
      <section><h3>What you will take with you</h3><p>{info.outcome}</p></section>
      <section><h3>Access and cost</h3><p>{info.access}</p></section>
    </TrailDetailsDialog>
  );
}

import Link from "next/link";
import { PageHelp } from "@/components/page-help";

const featuredCourse = {
  action: "Start journey",
  description:
    "A full scope course that guides you through the complete Discover Your Divine Design journey, helping you connect the core themes and move toward clearer calling and direction.",
  href: "/journey",
  logo: "/brand/dydd-logo-transparent.webp",
  points: [
    "Walk through the full Discover Your Divine Design framework",
    "Teaching across identity, design, and calling",
    "Practical guidance for faithful application",
  ],
  prerequisite:
    "Best starting point for the full Discover Your Divine Design experience. Assessment results can be added as you move through the journey.",
  title: "Discover Your Divine Design Journey",
};

const courses = [
  {
    action: "Take assessment",
    description:
      "A short course that helps you understand your DesignID results with clarity and confidence.",
    href: "/field-kit",
    logo: "/brand/tools/designid-logo.webp",
    points: [
      "Clear walkthrough of your report",
      "Understand reflection and energy patterns",
      "Practical next steps for everyday application",
    ],
    prerequisite: "Requires a completed DesignID assessment.",
    title: "Unpack Your DesignID Assessment",
  },
  {
    action: "Take assessment",
    description:
      "A focused course that helps you read your Spiritual Gifts results as grace for service, maturity, and love.",
    href: "/field-kit",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    points: [
      "Understand your top gifts",
      "Connect gifts to humble service",
      "Notice growth areas and next faithful steps",
    ],
    prerequisite: "Requires a completed Spiritual Gifts assessment.",
    title: "Spiritual Gifts in Service",
  },
  {
    action: "Take assessment",
    description:
      "A self-paced course created to help you understand your DesignPD report and apply your design in the way you plan, make decisions, and move into purposeful action.",
    href: "/field-kit",
    logo: "/brand/tools/designpd-logo.jpg",
    points: [
      "Understand your Plan, Decide, and Do patterns",
      "Connect report insights to real-life action",
      "Build healthier rhythms for purpose and progress",
    ],
    prerequisite: "Requires a completed DesignPD assessment.",
    title: "Unpack Your DesignPD Report",
  },
  {
    action: "Take assessment",
    description:
      "A formation course using visible fruit, observer feedback, and honest growth conversations.",
    href: "/fruitlife360",
    logo: "/brand/tools/fruitful-life-360-logo.jpg",
    points: [
      "Review fruit of the Spirit formation themes",
      "Learn from self and observer feedback",
      "Choose simple growth practices for the next season",
    ],
    prerequisite: "Requires a completed Fruit Life 360 assessment.",
    title: "Fruit Life 360 Growth Course",
  },
  {
    action: "Coming soon",
    description:
      "A future course that will help you understand your Design Pathways results and choose the clearest next route for growth.",
    href: "/field-kit",
    logo: "/brand/tools/design-pathways-logo.jpg",
    points: [
      "Identify your current pathway",
      "Connect pathway insight to next steps",
      "Use your results inside the larger Discover Your Divine Design journey",
    ],
    prerequisite: "Will require a completed Design Pathways assessment.",
    title: "Design Pathways",
  },
];

export default function TrailheadsPage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <nav className="course-nav" aria-label="Trailheads navigation">
        <Link href="/hq">Back to Base Camp</Link>
        <Link href="/journey">Journey</Link>
        <Link href="/field-kit">Field Kit</Link>
      </nav>

      <header className="standalone-hero trailheads-hero">
        <div>
          <p className="eyebrow">Trailheads</p>
          <h1>Discover Your Divine Design Courses</h1>
          <p className="lede">
            Discover Your Divine Design courses guide you through a focused part
            of the journey with clear lessons, practical reflection, and next
            steps you can use.
          </p>
        </div>
        <div className="trailheads-help">
          <PageHelp
            title="Courses Help"
            items={[
              "Start with the Discover Your Divine Design Journey when someone needs the full walkthrough.",
              "Use the smaller courses after the matching assessment has been completed.",
              "If an assessment is missing, send the learner to the assessment first instead of opening the course.",
            ]}
          />
        </div>
      </header>

      <section className="course-catalog-section" aria-label="Discover Your Divine Design course catalog">
        <div className="catalog-heading compact course-heading-row">
          <h2>Main course</h2>
          <p className="section-label">Courses</p>
        </div>

        <article className="featured-course-banner">
          <img
            className="featured-course-guide"
            src="/brand/dydd-trailheads-signpost-dydi.png"
            alt="Dydi beside the Discover Your Divine Design course signpost"
          />
          <div className="featured-course-copy">
            <div className="featured-course-logo-block">
              <img src={featuredCourse.logo} alt="Discover Your Divine Design logo" />
              <Link className="button primary" href={featuredCourse.href}>
                {featuredCourse.action}
              </Link>
            </div>
            <span>Main course</span>
            <h3>{featuredCourse.title}</h3>
            <p>{featuredCourse.description}</p>
            <ul>
              {featuredCourse.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <small>Prerequisite: {featuredCourse.prerequisite}</small>
          </div>
        </article>

        <div className="catalog-heading compact course-heading-row">
          <h2>Assessment-based courses</h2>
          <p className="section-label">Courses</p>
        </div>

        <div className="course-catalog-grid">
          {courses.map((course) => (
            <article
              className={`catalog-course-card ${course.action === "Coming soon" ? "locked" : "open"}`}
              key={course.title}
            >
              <div className="catalog-course-logo">
                <img src={course.logo} alt={`${course.title} logo`} />
              </div>
              <div>
                <span>Assessment course</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <ul>
                  {course.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <small>Prerequisite: {course.prerequisite}</small>
              </div>
              <Link
                className={`button ${course.action === "Coming soon" ? "secondary" : "primary"}`}
                href={course.href}
              >
                {course.action}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

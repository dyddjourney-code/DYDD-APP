import Link from "next/link";
import { PageHelp } from "@/components/page-help";

const featuredCourse = {
  action: "Start journey",
  difficulty: "Guided",
  description:
    "A full scope course that guides you through the complete Discover Your Divine Design journey, helping you connect the core themes and move toward clearer calling and direction.",
  effort: "Main route",
  href: "/journey",
  logo: "/brand/dydd-logo-transparent.webp",
  permit: "Book or course access",
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
    action: "Launch course",
    difficulty: "Easy to moderate",
    description:
      "A short course that helps you understand your DesignID results with clarity and confidence.",
    effort: "Short trail",
    href: "/courses/designid-foundations",
    logo: "/brand/tools/designid-logo.webp",
    signpost: "/brand/trailheads/designid-signpost.png",
    points: [
      "Clear walkthrough of your report",
      "Understand reflection and energy patterns",
      "Practical next steps for everyday application",
    ],
    price: "$20 assessment completed",
    prerequisite: "Requires a completed DesignID assessment.",
    status: "unlocked",
    slug: "designid",
    title: "Unpack Your DesignID Assessment",
  },
  {
    action: "Launch course",
    difficulty: "Easy",
    description:
      "A focused course that helps you read your Spiritual Gifts results as grace for service, maturity, and love.",
    effort: "Short trail",
    href: "/courses/spiritual-gifts-service",
    logo: "/brand/tools/spiritual-gifts-logo.jpg",
    signpost: "/brand/trailheads/spiritual-gifts-signpost.png",
    points: [
      "Understand your top gifts",
      "Connect gifts to humble service",
      "Notice growth areas and next faithful steps",
    ],
    price: "Free assessment completed",
    prerequisite: "Requires a completed Spiritual Gifts assessment.",
    status: "unlocked",
    slug: "spiritual-gifts",
    title: "Spiritual Gifts in Service",
  },
  {
    action: "Launch course",
    difficulty: "Deeper application",
    description:
      "A self-paced course created to help you understand your DesignPD report and apply your design in the way you plan, make decisions, and move into purposeful action.",
    effort: "Medium trail",
    href: "/courses/designpd-alignment",
    logo: "/brand/tools/designpd-logo.jpg",
    signpost: "/brand/trailheads/designpd-signpost.png",
    points: [
      "Understand your Plan, Decide, and Do patterns",
      "Connect report insights to real-life action",
      "Build healthier rhythms for purpose and progress",
    ],
    price: "$50 assessment required",
    prerequisite: "Requires a completed DesignPD assessment.",
    status: "unlocked",
    slug: "designpd",
    title: "Unpack Your DesignPD Report",
  },
  {
    action: "Launch course",
    difficulty: "Reflective",
    description:
      "A formation course using visible fruit, observer feedback, and honest growth conversations.",
    effort: "Medium trail",
    href: "/courses/fruitlife-360-formation",
    logo: "/brand/tools/fruitful-life-360-logo.jpg",
    signpost: "/brand/trailheads/fruitlife-360-signpost.png",
    points: [
      "Review fruit of the Spirit formation themes",
      "Learn from self and observer feedback",
      "Choose simple growth practices for the next season",
    ],
    price: "Free assessment required",
    prerequisite: "Requires a completed Fruit Life 360 assessment.",
    status: "unlocked",
    slug: "fruitlife-360",
    title: "Fruit Life 360 Growth Course",
  },
  {
    action: "Launch course",
    difficulty: "Discernment",
    description:
      "A discernment course that helps you understand possible pathways, test them with small experiments, and choose the next faithful step.",
    effort: "Medium trail",
    href: "/courses/design-pathways-discernment",
    logo: "/brand/tools/design-pathways-logo.jpg",
    signpost: "/brand/trailheads/design-pathways-signpost.png",
    points: [
      "Identify your current pathway",
      "Connect pathway insight to next steps",
      "Use your results inside the larger Discover Your Divine Design journey",
    ],
    price: "Free assessment planned",
    prerequisite: "Design Pathways can begin as a guided discernment course while the assessment is being finalized.",
    status: "unlocked",
    slug: "design-pathways",
    title: "Design Pathways Discernment",
  },
];

export default function TrailheadsPage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <header className="standalone-hero trailheads-hero">
        <div>
          <p className="eyebrow">Trailheads</p>
          <h1>Choose your trailhead.</h1>
          <p className="lede">
            Every trailhead gives you the name of the route, the expected effort,
            the difficulty, and the access needed before you begin.
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
          <h2>Main journey hub</h2>
        </div>

        <article className="featured-course-banner trailhead-sign-board">
          <img
            className="featured-course-guide"
            src="/brand/dydd-trailheads-signpost-dydi.png"
            alt="Dydi beside the Discover Your Divine Design course signpost"
          />
          <div className="featured-course-copy">
            <div className="featured-course-logo-block">
              <img src={featuredCourse.logo} alt="Discover Your Divine Design logo" />
            </div>
            <h3>{featuredCourse.title}</h3>
            <p>{featuredCourse.description}</p>
            <dl className="trailhead-facts">
              <div>
                <dt>Time or effort</dt>
                <dd>{featuredCourse.effort}</dd>
              </div>
              <div>
                <dt>Difficulty</dt>
                <dd>{featuredCourse.difficulty}</dd>
              </div>
              <div>
                <dt>Permit</dt>
                <dd>{featuredCourse.permit}</dd>
              </div>
            </dl>
            <ul>
              {featuredCourse.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <small>Prerequisite: {featuredCourse.prerequisite}</small>
            <Link className="button primary" href={featuredCourse.href}>
              {featuredCourse.action}
            </Link>
          </div>
        </article>

        <div className="trailhead-start-note">
          <p className="section-label">Start logic</p>
          <p>
            The main DYDD Journey is the hub. Spiritual Gifts, FruitLife 360, DesignID,
            and Design Pathways can begin as entry trails. DesignPD should come after
            DesignID because it depends on that design language.
          </p>
        </div>

        <div className="catalog-heading compact course-heading-row">
          <h2>Assessment-based courses</h2>
        </div>

        <div className="course-catalog-grid">
          {courses.map((course) => (
            <article
              className={`catalog-course-card ${course.status === "unlocked" ? "open" : "locked"}`}
              id={course.slug}
              key={course.title}
            >
              <div className="catalog-course-logo">
                <img
                  className="catalog-course-signpost"
                  src={course.signpost}
                  alt={`${course.title} signpost`}
                />
              </div>
              <div>
                <span>{course.status === "unlocked" ? "Course unlocked" : "Assessment required"}</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <dl className="trailhead-facts compact">
                  <div>
                    <dt>Effort</dt>
                    <dd>{course.effort}</dd>
                  </div>
                  <div>
                    <dt>Difficulty</dt>
                    <dd>{course.difficulty}</dd>
                  </div>
                  <div>
                    <dt>Permit</dt>
                    <dd>{course.price}</dd>
                  </div>
                </dl>
                <ul>
                  {course.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <small>Price: {course.price}</small>
                <small>Prerequisite: {course.prerequisite}</small>
              </div>
              <Link
                className={`button ${course.status === "unlocked" ? "primary" : "secondary"}`}
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

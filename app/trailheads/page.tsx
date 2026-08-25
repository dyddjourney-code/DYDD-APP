import Link from "next/link";
import { PageHelp } from "@/components/page-help";

const trailheads = [
  {
    action: "Open journey",
    detail:
      "The main guided path for the book, workbook, assessments, reflection, and companion support.",
    href: "/journey",
    image: "/brand/dydd-logo.webp",
    meta: "Main trail",
    title: "Discover Your Divine Design Journey",
  },
  {
    action: "Open Field Kit",
    detail:
      "A quick first step for identity, reflection pattern language, and a usable report early in week one.",
    href: "/field-kit",
    image: "/brand/tools/designid-logo.webp",
    meta: "Fast start",
    title: "DesignID",
  },
  {
    action: "Open Field Kit",
    detail:
      "A service and calling layer that helps connect spiritual gifts to the rest of the DYDD journey.",
    href: "/field-kit",
    image: "/brand/tools/spiritual-gifts-icon-correct.png",
    meta: "Calling marker",
    title: "Spiritual Gifts",
  },
  {
    action: "Open Pathfinder",
    detail:
      "A future focused trail for clarifying the niche where design insight becomes direction.",
    href: "/pathfinder",
    image: "/brand/badges/niche-badge.svg",
    meta: "Purpose work",
    title: "Pathfinder",
  },
  {
    action: "Open FruitLife",
    detail:
      "A growth mirror for visible fruit, observer feedback, and formation conversations.",
    href: "/fruitlife360",
    image: "/brand/tools/badge-icons/fruitlife-360-icon.png",
    meta: "Growth marker",
    title: "FruitLife 360",
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
          <h1>Choose the entry point, then follow the markers.</h1>
          <p className="lede">
            Trailheads keep the app from becoming one giant path. They give
            people clear ways to start, resume, or focus without losing the
            larger Discover Your Divine Design road.
          </p>
        </div>
        <img
          src="/brand/dydd-trailheads-signpost-dydi.png"
          alt="Dydi beside the DYDD trailheads signpost"
        />
      </header>

      <PageHelp
        items={[
          "Choose Journey when someone is ready for the full guided path.",
          "Choose Field Kit when someone needs a specific assessment, report, or badge view.",
          "Choose Pathfinder when the work is focused on niche, calling, and direction.",
        ]}
      />

      <section className="trailhead-page-list" aria-label="Available trailheads">
        {trailheads.map((trailhead) => (
          <article className="trail-route open" key={trailhead.title}>
            <img src={trailhead.image} alt={`${trailhead.title} icon`} />
            <div>
              <span>{trailhead.meta}</span>
              <h3>{trailhead.title}</h3>
              <p>{trailhead.detail}</p>
            </div>
            <Link className="button secondary" href={trailhead.href}>
              {trailhead.action}
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

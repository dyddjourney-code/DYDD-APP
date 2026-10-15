import Link from "next/link";
import { RangerReliefMap } from "@/components/ranger-relief-map";
import { RangerDesk } from "@/components/ranger-desk";

const pathGroups = [
  {
    accent: "main",
    title: "Recommended main trail",
    description: "The best first path when someone wants the whole picture.",
    items: [
      {
        image: "/brand/dydd-logo-transparent.webp",
        label: "Discover Your Divine Design Journey",
        status: "Recommended first path",
        text:
          "The holistic route through identity, design, gifting, calling, and next faithful steps. This path can include DesignID and Spiritual Gifts as part of the larger journey.",
      },
    ],
  },
  {
    accent: "short",
    title: "Focused short paths",
    description: "Smaller stand-alone starts for one clear growth step.",
    items: [
      {
        image: "/brand/badges/designid-badge.png",
        label: "DesignID",
        status: "Can stand alone",
        text:
          "Understand your design language and walk through the DesignID course without starting the full journey first.",
      },
      {
        image: "/brand/badges/spiritual-gifts-badge.png",
        label: "Spiritual Gifts",
        status: "Can stand alone",
        text:
          "Name gifts, grow in maturity, and connect gifting to humble service and faithful action.",
      },
      {
        image: "/brand/badges/fruitlife-360-badge.png",
        label: "FruitLife360",
        status: "Can stand alone",
        text:
          "Use fruit, feedback, and honest reflection to see visible growth and where grace can deepen.",
      },
    ],
  },
  {
    accent: "extended",
    title: "Extended pathways",
    description: "Deeper routes to walk after the foundation has been laid.",
    items: [
      {
        image: "/brand/badges/designpd-badge.png",
        label: "DesignPD",
        status: "After DesignID + DYDD Journey",
        text:
          "Apply your design to planning, deciding, and doing after the core discovery work has been walked.",
      },
    ],
  },
];

export default function RangerStationPage() {
  return (
    <main className="journey-shell hq-standalone-page ranger-station-page">
      <div className="ranger-station-header-image">
        <img
          src="/brand/dydd-ranger-station-header.png"
          alt="Discover Your Divine Design Ranger Station forest sign"
        />
      </div>

      <nav className="ranger-orientation-strip" aria-label="Start at Ranger Station">
        <a href="#ecosystem-map"><span>First</span><strong>Explore the map</strong></a>
        <a href="#ranger-desk"><span>Then</span><strong>Ask your questions</strong></a>
        <a href="/trailheads"><span>Get started</span><strong>Choose a trail</strong></a>
      </nav>

      <section id="ecosystem-map" className="ranger-map-section relief-map-section" aria-label="Interactive DYDD relief map">
        <div className="ranger-map-copy">
          <p className="section-label">DYDD Ecosystem Map</p>
        </div>
        <RangerReliefMap />
      </section>

      <RangerDesk />

      <section className="visual-journey-map ranger-journey-map ranger-path-finder" aria-label="What path is right for me">
        <div className="card-heading">
          <p className="section-label">What path is right for me?</p>
          <p>
            The full journey is the best first path for most people. A focused path can
            also stand alone when someone wants a smaller beginning, while extended
            pathways work best after key discovery pieces are already in place.
          </p>
        </div>
        <div className="ranger-path-groups">
          {pathGroups.map((group) => (
            <section className={`ranger-path-group ${group.accent}`} key={group.title}>
              <header>
                <p>{group.title}</p>
                <span>{group.description}</span>
              </header>
              <div className="ranger-path-grid">
                {group.items.map((trail) => (
                  <article className="ranger-path-card" key={trail.label}>
                    <div className="journey-map-marker">
                      <img src={trail.image} alt={`${trail.label} marker`} />
                    </div>
                    <strong>{trail.label}</strong>
                    <small>{trail.text}</small>
                    <em>{trail.status}</em>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="ranger-path-cta" aria-label="Ready to start">
          <strong>Ready to start?</strong>
          <Link href="/trailheads">All paths start at Trailheads</Link>
        </div>
        <p className="ranger-path-note">
          Simple rule: begin with the full journey when you want the whole picture, choose
          a focused path when you want one clear growth step, and save extended pathways
          for after the foundation has been laid.
        </p>
      </section>
    </main>
  );
}

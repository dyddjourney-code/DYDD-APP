import Link from "next/link";

const tools = [
  {
    detail: "Identity, contribution, reflection language, and a completed report.",
    image: "/brand/badges/designid-badge.png",
    status: "First paid tool",
    title: "DesignID",
  },
  {
    detail: "A free first step for naming how the Spirit may be empowering service.",
    image: "/brand/badges/spiritual-gifts-badge.png",
    status: "Free tool",
    title: "Spiritual Gifts",
  },
  {
    detail: "A discernment layer for direction, experiments, and next steps.",
    image: "/brand/badges/design-pathways-badge.png",
    status: "Free tool",
    title: "Design Pathways",
  },
  {
    detail: "Plan, Decide, and Do patterns for practical daily alignment.",
    image: "/brand/badges/designpd-badge.png",
    status: "Paid tool",
    title: "DesignPD",
  },
  {
    detail: "A 360-style mirror for visible fruit and growth conversations.",
    image: "/brand/badges/fruitlife-360-badge.png",
    status: "Free tool",
    title: "FruitLife 360",
  },
];

const badgeGroups = [
  {
    badges: [
      ["Identity", "/brand/badges/identity-badge.svg"],
      ["Expertise", "/brand/badges/expertise-badge.svg"],
      ["Story", "/brand/badges/story-badge.svg"],
      ["Desire", "/brand/badges/desire-badge.svg"],
      ["Gifts", "/brand/badges/gifts-badge.svg"],
      ["Niche", "/brand/badges/niche-badge.svg"],
    ],
    title: "D.E.S.I.G.N. Badges",
  },
  {
    badges: tools.map((tool) => [tool.title, tool.image]),
    title: "Field Kit Tool Badges",
  },
  {
    badges: [
      ["Shepherd", "/brand/badges/shepherd-badge.svg"],
      ["Artisan", "/brand/badges/artisan-badge.svg"],
      ["Architect", "/brand/badges/architect-badge.svg"],
      ["Steward", "/brand/badges/steward-badge.svg"],
    ],
    title: "Reflection Badges",
  },
];

export default function FieldKitPage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <nav className="course-nav" aria-label="Field Kit navigation">
        <Link href="/hq">Back to Base Camp</Link>
        <Link href="/trailheads">Trailheads</Link>
        <Link href="/gear">Gear</Link>
      </nav>

      <header className="standalone-hero fieldkit-hero">
        <div>
          <p className="eyebrow">Field Kit</p>
          <h1>Tools, artifacts, and earned trail markers live here.</h1>
          <p className="lede">
            The Field Kit is the learner’s collected equipment: assessments,
            saved reports, artifacts, earned badges, and a closed view of what
            badges are possible later.
          </p>
        </div>
        <img src="/brand/badges/dydd-trail-badges-preview.png" alt="DYDD badge set preview" />
      </header>

      <section className="fieldkit-page-grid" aria-label="Field Kit tools">
        {tools.map((tool) => (
          <article className="fieldkit-tool-card" key={tool.title}>
            <img src={tool.image} alt={`${tool.title} badge`} />
            <span>{tool.status}</span>
            <strong>{tool.title}</strong>
            <p>{tool.detail}</p>
          </article>
        ))}
      </section>

      <section className="artifact-panel artifact-workbench" id="artifacts">
        <div className="card-heading">
          <p className="section-label">Artifacts</p>
          <h2>Reports and saved discoveries will collect here.</h2>
        </div>
        <div className="hq-empty-state">
          <strong>Artifact shelf staged.</strong>
          <p>
            This page is ready to receive completed reports, workbook exports,
            certificates, milestone records, and anything the Journey creates.
          </p>
        </div>
      </section>

      <section className="badge-panel" id="trail-badges">
        <div className="card-heading">
          <p className="section-label">Trail Badges</p>
          <h2>Earned badges stay visible. Possible badges stay tucked away.</h2>
        </div>
        <div className="badge-system-intro">
          <p>
            The default view should emphasize what a person has earned. The
            “what is possible?” view stays closed until they want to explore.
          </p>
          <span>Accordion</span>
        </div>
        <details className="badge-accordion">
          <summary>What badges are possible?</summary>
          <div className="badge-accordion-groups">
            {badgeGroups.map((group) => (
              <section className="badge-group" key={group.title}>
                <div className="badge-group-heading">
                  <h3>{group.title}</h3>
                  <small>Preview</small>
                </div>
                <div className="badge-grid">
                  {group.badges.map(([title, image]) => (
                    <article className="trail-badge locked" key={title}>
                      <div className="badge-art">
                        <img src={image} alt={`${title} badge`} />
                      </div>
                      <div className="badge-copy">
                        <span>Possible</span>
                        <strong>{title}</strong>
                        <p>Condition logic will connect during the Journey build.</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      </section>
    </main>
  );
}

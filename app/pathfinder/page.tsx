import Link from "next/link";

export default function PathfinderPage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <nav className="course-nav" aria-label="Pathfinder navigation">
        <Link href="/hq">Back to Base Camp</Link>
        <Link href="/journey">Journey</Link>
        <Link href="/gear">Gear</Link>
      </nav>

      <header className="standalone-hero pathfinder-hero">
        <div>
          <p className="eyebrow">Pathfinder</p>
          <h1>The niche workspace can live here when we are ready.</h1>
          <p className="lede">
            Pathfinder should become the focused place where identity,
            expertise, story, desire, gifts, and opportunity converge into a
            clear niche declaration and experiments.
          </p>
        </div>
        <img src="/brand/badges/niche-badge.svg" alt="Niche badge" />
      </header>

      <section className="niche-panel">
        <div className="card-heading">
          <p className="section-label">Future build</p>
          <h2>Niche declaration builder.</h2>
        </div>
        <div className="niche-builder-steps">
          <span>Who I serve</span>
          <span>What I bring</span>
          <span>Why it matters</span>
          <span>Next experiment</span>
        </div>
      </section>
    </main>
  );
}

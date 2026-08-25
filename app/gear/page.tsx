import Link from "next/link";

export default function GearPage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <nav className="course-nav" aria-label="Gear navigation">
        <Link href="/hq">Back to Base Camp</Link>
        <Link href="/journey">Journey</Link>
        <Link href="/field-kit">Field Kit</Link>
      </nav>

      <header className="standalone-hero gear-hero">
        <div>
          <p className="eyebrow">Gear</p>
          <h1>The journal becomes the connective tissue.</h1>
          <p className="lede">
            Gear is where reflection lands. DesignID, Spiritual Gifts, the
            workbook, and future companion prompts can all send people back
            here to write, pray, decide, and remember.
          </p>
        </div>
      </header>

      <section className="gear-panel" id="journal">
        <div className="card-heading">
          <p className="section-label">Journal</p>
          <h2>Reflection prompts can be launched from anywhere.</h2>
        </div>
        <div className="journal-workbench">
          <label>
            <span>Reflect on DesignID</span>
            <textarea placeholder="What did DesignID help me name about my design?" rows={4} />
          </label>
          <label>
            <span>Reflect on Spiritual Gifts</span>
            <textarea placeholder="Where do I sense God inviting me to serve?" rows={4} />
          </label>
          <label>
            <span>Next faithful step</span>
            <textarea placeholder="The next step I need to take is..." rows={4} />
          </label>
        </div>
      </section>

      <section className="gear-grid" aria-label="Future gear areas">
        <section id="waypoints">
          <strong>Waypoints</strong>
          <p>
            Devotion-style checkpoints can become Scripture, prayer, and weekly
            direction without crowding the main Journey.
          </p>
          <small>Planned</small>
        </section>
        <section>
          <strong>Companion Notes</strong>
          <p>
            Dydi can eventually read selected journal context and help the
            learner keep moving with encouragement and clarity.
          </p>
          <small>Planned</small>
        </section>
        <section>
          <strong>Saved Decisions</strong>
          <p>
            Important declarations, commitments, and action steps should become
            easy to revisit from one place.
          </p>
          <small>Planned</small>
        </section>
      </section>
    </main>
  );
}

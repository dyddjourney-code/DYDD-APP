import { saveGearJournalEntries } from "@/app/gear/actions";
import { PageHelp } from "@/components/page-help";

type GearPageProps = {
  searchParams?: Promise<{
    message?: string;
    saved?: string;
  }>;
};

export default async function GearPage({ searchParams }: GearPageProps) {
  const params = await searchParams;

  return (
    <main className="journey-shell hq-standalone-page">
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

      <PageHelp
        items={[
          "Use the journal to capture reflection that begins in assessments, Journey chapters, or Waypoints.",
          "Save focused entries instead of trying to make one perfect long journal record.",
          "Later, selected journal context can help Dydi guide the next faithful step.",
        ]}
      />

      <section className="gear-panel" id="journal">
        <div className="card-heading">
          <p className="section-label">Journal</p>
          <h2>Reflection prompts can be launched from anywhere.</h2>
        </div>
        {params?.saved ? (
          <p className="journey-save-notice">Saved {params.saved} journal entries.</p>
        ) : params?.message ? (
          <p className="journey-save-notice">{params.message}</p>
        ) : null}
        <form action={saveGearJournalEntries} className="journal-workbench">
          <label>
            <span>Reflect on DesignID</span>
            <textarea
              name="journal-designid-reflection"
              placeholder="What did DesignID help me name about my design?"
              rows={4}
            />
          </label>
          <label>
            <span>Reflect on Spiritual Gifts</span>
            <textarea
              name="journal-spiritual-gifts-reflection"
              placeholder="Where do I sense God inviting me to serve?"
              rows={4}
            />
          </label>
          <label>
            <span>Next faithful step</span>
            <textarea
              name="journal-next-faithful-step"
              placeholder="The next step I need to take is..."
              rows={4}
            />
          </label>
          <button className="button secondary" type="submit">
            Save journal entries
          </button>
        </form>
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

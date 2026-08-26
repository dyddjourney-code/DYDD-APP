import { PageHelp } from "@/components/page-help";

export default function FiresidePage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <header className="standalone-hero fireside-page-hero">
        <div>
          <p className="eyebrow">Fireside</p>
          <h1>A future gathering place for encouragement and conversation.</h1>
          <p className="lede">
            Fireside can hold studies, podcast/video teaching, live moments,
            replays, community prompts, and deeper companion-led reflection
            without turning Base Camp into a content archive.
          </p>
        </div>
      </header>

      <PageHelp
        items={[
          "Use Fireside for teaching, stories, replays, and shared encouragement.",
          "Keep broad content here so Base Camp can stay simple and directional.",
          "Future discussion prompts can connect back to Journey chapters and Camp Circle.",
        ]}
      />

      <section className="fireside-panel">
        <div className="card-heading">
          <p className="section-label">Planned</p>
          <h2>Teaching, replays, stories, and shared reflection.</h2>
        </div>
        <p>
          This page is intentionally light for now. It gives Fireside a real
          destination in the app while we build the Journey and Field Kit first.
        </p>
      </section>

      <section className="fireside-panel" id="waypoints">
        <div className="card-heading">
          <p className="section-label">Waypoints</p>
          <h2>Short encouragement for the next step.</h2>
        </div>
        <p>
          Waypoints can become Scripture, prayer, devotion-style checkpoints,
          and weekly direction without crowding the main Journey.
        </p>
      </section>
    </main>
  );
}

import { PageHelp } from "@/components/page-help";

const connectionFeatures = [
  {
    label: "Daily Verse",
    title: "Start the day with Scripture.",
    description:
      "A simple daily Scripture touchpoint for encouragement, reflection, and steady attention to the journey.",
  },
  {
    label: "Weekly Devotion",
    title: "Receive a focused weekly word.",
    description:
      "A weekly devotion can speak broadly to the whole DYDD community or be shaped around the four reflections.",
  },
  {
    label: "Podcast & Teaching",
    title: "Listen, watch, and keep growing.",
    description:
      "Podcast episodes, videos, teachings, sermons, and replay content can live here as the Fireside library grows.",
  },
  {
    label: "Live Gatherings",
    title: "Join the next conversation.",
    description:
      "Virtual classes, live events, workshops, and paid group experiences can invite people into deeper connection.",
  },
];

export default function FiresidePage() {
  return (
    <main className="journey-shell hq-standalone-page fireside-page">
      <header className="standalone-hero fireside-page-hero">
        <div>
          <p className="eyebrow">Fireside</p>
          <h1>Connection for the journey.</h1>
          <p className="lede">
            Scripture, devotion, teaching, conversation, and live moments can
            gather here so people keep walking with encouragement.
          </p>
        </div>
      </header>

      <div className="fireside-help">
        <PageHelp
          title="Fireside Help"
          items={[
            "Use Fireside for Scripture, devotion, teaching, podcast, video, and live event connections.",
            "Keep relational content here so Base Camp and the Journey stay focused.",
            "Future subscriptions can support daily verses and weekly devotion options.",
          ]}
        />
      </div>

      <section className="fireside-author-strip" aria-label="Who we are">
        <div className="fireside-author-photo">
          <img
            alt="John Willoughby in Discover Your Divine Design cartoon style"
            src="/brand/john-author-cartoon-dydd-style.png"
          />
        </div>
        <div className="fireside-author-copy">
          <p className="section-label">Who We Are</p>
          <h2>A journey rooted in purpose.</h2>
          <p>
            Discover Your Divine Design was created by John Willoughby, a
            leader, coach, and devoted follower of Christ who believes every
            person has been created by God with purpose, on purpose.
          </p>
          <p>
            Drawing from leadership development, biblical teaching, and personal
            growth, John built a Scripture-rooted process that helps people
            explore identity, expertise, story, desires, spiritual gifts, and
            niche within the Body of Christ.
          </p>
        </div>
      </section>

      <section className="fireside-connect-panel">
        <div className="fireside-connect-heading">
          <p className="section-label">Stay Connected</p>
          <h2>Daily and weekly encouragement.</h2>
          <p>
            Fireside can become the place where people subscribe to receive a
            daily verse, follow weekly devotion content, and find the teachings
            that help them continue the Discover Your Divine Design journey.
          </p>
        </div>
        <form className="fireside-subscribe-card">
          <label htmlFor="fireside-email">Email address</label>
          <div>
            <input
              id="fireside-email"
              name="email"
              placeholder="jordan@example.com"
              type="email"
            />
            <button className="button primary" type="button">
              Subscribe
            </button>
          </div>
          <small>
            Subscription delivery will connect later. This preview shows the
            intended experience and placement.
          </small>
        </form>
      </section>

      <section className="fireside-content-grid" aria-label="Fireside connections">
        {connectionFeatures.map((feature) => (
          <article className="fireside-feature-card" key={feature.label}>
            <p className="section-label">{feature.label}</p>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="fireside-panel" id="waypoints">
        <div className="card-heading">
          <p className="section-label">Waypoints</p>
          <h2>Short encouragement for the next step.</h2>
        </div>
        <p>
          Waypoints can stay here for now as brief Scripture, prayer,
          devotion-style checkpoints, and next-step prompts while the broader
          Fireside plan takes shape.
        </p>
      </section>
    </main>
  );
}

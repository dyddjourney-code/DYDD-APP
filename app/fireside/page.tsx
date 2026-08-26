import { PageHelp } from "@/components/page-help";

const liveFiresideFeatures = [
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
            "Future subscriptions can support weekly DYDD Waypoints and Fireside updates.",
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
          <p className="section-label">DYDD Waypoints</p>
          <h2>Pause, breathe, and keep walking.</h2>
          <p>
            Weekly content designed to help you along your journey. Every now
            and then, it is good to stand still, breathe, and notice what God is
            forming in you. These Waypoints can speak to the whole DYDD community
            while offering simple reflection callouts for Shepherd, Artisan,
            Architect, and Steward design patterns.
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
            Subscribe to receive the weekly DYDD Waypoint by email when delivery
            is connected.
          </small>
        </form>
      </section>

      <section className="fireside-live-section" aria-label="Live Fireside">
        <div className="card-heading">
          <p className="section-label">Live Fireside</p>
          <p>
            Conversations, teaching, podcast episodes, videos, and live
            gatherings can sit here as the Fireside library grows.
          </p>
        </div>
        <div className="fireside-content-grid" aria-label="Fireside connections">
          {liveFiresideFeatures.map((feature) => (
            <article className="fireside-feature-card" key={feature.label}>
              <p className="section-label">{feature.label}</p>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

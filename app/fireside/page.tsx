import { PageHelp } from "@/components/page-help";
import { WaypointExplorer } from "@/components/waypoint-explorer";

const waypointCategories = [
  "Identity",
  "Design",
  "Calling",
  "Spiritual Gifts",
  "Faithful Practice",
  "Relationships & Community",
  "Work & Leadership",
];

const currentWaypoint = {
  title: "Designed to Move With Grace",
  date: "August 26, 2026",
  category: "Design",
  scripture: "Romans 12:6",
  tags: ["Design", "Reflection Patterns", "Purposeful Action"],
  excerpt:
    "Your design is not meant to become a label that holds you still. It is meant to help you move with more honesty, faith, and grace.",
};

const previousWaypoint = {
  title: "Begin With Who God Says You Are",
  date: "August 19, 2026",
  category: "Identity",
  scripture: "Ephesians 2:10",
  tags: ["Identity", "Belonging", "Calling"],
  excerpt:
    "Before you rush to prove your purpose, pause long enough to receive your identity. Calling grows from belonging, not striving.",
};

const waypointArchive = [
  currentWaypoint,
  previousWaypoint,
  {
    title: "When Your Gifts Need Room to Breathe",
    date: "August 12, 2026",
    category: "Spiritual Gifts",
    tags: ["Spiritual Gifts", "Service", "Discernment"],
    excerpt:
      "Spiritual gifts mature when they are practiced with humility, love, and room for the Holy Spirit to lead.",
  },
  {
    title: "The Courage to Name What Matters",
    date: "August 5, 2026",
    category: "Calling",
    tags: ["Calling", "Desire", "Direction"],
    excerpt:
      "A clear next step often begins by telling the truth about the desires God keeps bringing back to the surface.",
  },
  {
    title: "Faithfulness in the Ordinary Work",
    date: "July 29, 2026",
    category: "Work & Leadership",
    tags: ["Work", "Leadership", "Stewardship"],
    excerpt:
      "The work in front of you may be more sacred than it looks when it is offered back to God with intention.",
  },
];

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

      <section className="fireside-connect-panel" id="waypoints">
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

      <section
        className="waypoints-section"
        aria-label="DYDD Waypoints library"
      >
        <article className="waypoint-current-card">
          <div className="waypoint-card-topline">
            <span>Current Waypoint</span>
            <span>{currentWaypoint.date}</span>
          </div>
          <p className="section-label">{currentWaypoint.category}</p>
          <h2>{currentWaypoint.title}</h2>
          <p className="waypoint-scripture">{currentWaypoint.scripture}</p>
          <p>
            Your design is not meant to become a label that holds you still. It
            is meant to help you move with more honesty, faith, and grace. When
            Paul wrote that we have different gifts according to the grace given
            to us, he was reminding the church that design is received before it
            is expressed.
          </p>
          <p>
            This week, slow down enough to notice where your natural wiring
            brings life and where it starts carrying pressure it was never meant
            to hold. God does not ask you to become someone else in order to be
            faithful. He invites you to bring what He placed in you under His
            care, His timing, and His love.
          </p>
          <div className="waypoint-reflection-box">
            <strong>For your design:</strong>
            <span>
              Shepherds can notice who needs care. Artisans can notice what
              needs expression. Architects can notice what needs structure.
              Stewards can notice what needs faithful follow-through.
            </span>
          </div>
          <div className="waypoint-tag-row">
            {currentWaypoint.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </article>

        <aside className="waypoint-previous-card">
          <div className="waypoint-card-topline">
            <span>Last Week</span>
            <span>{previousWaypoint.date}</span>
          </div>
          <p className="section-label">{previousWaypoint.category}</p>
          <h3>{previousWaypoint.title}</h3>
          <p className="waypoint-scripture">{previousWaypoint.scripture}</p>
          <p>
            Before you rush to prove your purpose, pause long enough to receive
            your identity. You are not beginning from emptiness, pressure, or
            performance. You are God&apos;s workmanship, created in Christ Jesus
            for good works He prepared ahead of time.
          </p>
          <p>
            Identity gives the journey its footing. When you remember who you
            belong to, your next step can become less frantic and more faithful.
          </p>
          <div className="waypoint-tag-row">
            {previousWaypoint.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </aside>

        <div className="waypoint-archive-panel">
          <div className="card-heading">
            <p className="section-label">Previous Waypoints</p>
            <p>
              Search by title, category, reflection theme, or tag as the
              Waypoint library grows.
            </p>
          </div>
          <WaypointExplorer
            categories={waypointCategories}
            waypoints={waypointArchive}
          />
        </div>
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

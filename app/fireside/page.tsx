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
  id: "designed-to-move-with-grace",
  title: "Designed to Move With Grace",
  date: "August 26, 2026",
  category: "Design",
  scripture: "Romans 12:6",
  tags: ["Design", "Reflection Patterns", "Purposeful Action"],
  excerpt:
    "Your design is not meant to become a label that holds you still. It is meant to help you move with more honesty, faith, and grace.",
  body: [
    "Your design is not meant to become a label that holds you still. It is meant to help you move with more honesty, faith, and grace. When Paul wrote that we have different gifts according to the grace given to us, he was reminding the church that design is received before it is expressed.",
    "This week, slow down enough to notice where your natural wiring brings life and where it starts carrying pressure it was never meant to hold. God does not ask you to become someone else in order to be faithful. He invites you to bring what He placed in you under His care, His timing, and His love.",
  ],
  reflection:
    "Shepherds can notice who needs care. Artisans can notice what needs expression. Architects can notice what needs structure. Stewards can notice what needs faithful follow-through.",
};

const previousWaypoint = {
  id: "begin-with-who-god-says-you-are",
  title: "Begin With Who God Says You Are",
  date: "August 19, 2026",
  category: "Identity",
  scripture: "Ephesians 2:10",
  tags: ["Identity", "Belonging", "Calling"],
  excerpt:
    "Before you rush to prove your purpose, pause long enough to receive your identity. Calling grows from belonging, not striving.",
  body: [
    "Before you rush to prove your purpose, pause long enough to receive your identity. You are not beginning from emptiness, pressure, or performance. You are God's workmanship, created in Christ Jesus for good works He prepared ahead of time.",
    "Identity gives the journey its footing. When you remember who you belong to, your next step can become less frantic and more faithful.",
  ],
  reflection:
    "Take one quiet moment this week to ask: where am I trying to earn what God has already named over me?",
};

const waypointArchive = [
  currentWaypoint,
  previousWaypoint,
  {
    id: "when-your-gifts-need-room-to-breathe",
    title: "When Your Gifts Need Room to Breathe",
    date: "August 12, 2026",
    category: "Spiritual Gifts",
    scripture: "1 Peter 4:10",
    tags: ["Spiritual Gifts", "Service", "Discernment"],
    excerpt:
      "Spiritual gifts mature when they are practiced with humility, love, and room for the Holy Spirit to lead.",
    body: [
      "Spiritual gifts are not trophies to display. They are graces to steward. When you make room for prayer, practice, and humility, your gifts become less about pressure and more about love.",
      "This week, pay attention to the places where service feels both stretching and life-giving. That may be one of the places God is inviting you to grow.",
    ],
    reflection:
      "Ask God to show you one gift He wants you to practice with love instead of pressure.",
  },
  {
    id: "the-courage-to-name-what-matters",
    title: "The Courage to Name What Matters",
    date: "August 5, 2026",
    category: "Calling",
    scripture: "Proverbs 20:5",
    tags: ["Calling", "Desire", "Direction"],
    excerpt:
      "A clear next step often begins by telling the truth about the desires God keeps bringing back to the surface.",
    body: [
      "Sometimes clarity begins with honesty. The purpose God is forming in you may already be showing up through the burdens, hopes, questions, and desires that keep returning.",
      "You do not have to force a final answer today. Name what matters, bring it to God, and take the next faithful step.",
    ],
    reflection:
      "Write down one desire or burden that keeps returning, then ask what faithful step belongs to today.",
  },
  {
    id: "faithfulness-in-the-ordinary-work",
    title: "Faithfulness in the Ordinary Work",
    date: "July 29, 2026",
    category: "Work & Leadership",
    scripture: "Colossians 3:23",
    tags: ["Work", "Leadership", "Stewardship"],
    excerpt:
      "The work in front of you may be more sacred than it looks when it is offered back to God with intention.",
    body: [
      "Purpose does not only live in dramatic moments. It often takes shape in ordinary work, steady faithfulness, small acts of courage, and responsibilities carried with love.",
      "This week, look for one ordinary task that can become an offering instead of a burden.",
    ],
    reflection:
      "Choose one routine responsibility and do it as an act of worship and stewardship.",
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

      <section className="waypoints-section" aria-label="DYDD Waypoints library">
        <WaypointExplorer
          categories={waypointCategories}
          currentId={currentWaypoint.id}
          previousId={previousWaypoint.id}
          waypoints={waypointArchive}
        />
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

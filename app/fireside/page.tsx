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
    id: "the-shape-of-faithful-strength",
    title: "The Shape of Faithful Strength",
    date: "August 5, 2026",
    category: "Design",
    scripture: "1 Corinthians 12:18",
    tags: ["Design", "Reflection Patterns", "Strengths"],
    excerpt:
      "Your strongest patterns become healthier when they are received as placement instead of pressure.",
    body: [
      "God places people in the Body with intention. That means your design is not random, and it is not meant to become a burden you have to prove.",
      "This week, pay attention to one strength that keeps showing up naturally. Ask how it can serve with love instead of needing applause or control.",
    ],
    reflection:
      "Notice one design strength this week and ask how it can become service instead of pressure.",
  },
  {
    id: "when-your-design-needs-rest",
    title: "When Your Design Needs Rest",
    date: "July 15, 2026",
    category: "Design",
    scripture: "Matthew 11:28",
    tags: ["Design", "Rest", "Reflection Patterns"],
    excerpt:
      "Even the parts of you that feel most natural still need to be restored by Jesus.",
    body: [
      "The way you are wired can be life-giving, but it can also become tired. Shepherds can overcarry, Artisans can overextend, Architects can overbuild, and Stewards can overmanage.",
      "Jesus does not only redeem your weakness. He also teaches your strengths how to rest.",
    ],
    reflection:
      "Ask where your natural pattern has been carrying too much without receiving care.",
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
    id: "called-before-you-feel-ready",
    title: "Called Before You Feel Ready",
    date: "July 22, 2026",
    category: "Calling",
    scripture: "2 Corinthians 12:9",
    tags: ["Calling", "Courage", "Faithful Practice"],
    excerpt:
      "Calling rarely waits until you feel completely prepared. It often grows through dependent obedience.",
    body: [
      "God's invitation does not always arrive after confidence. Sometimes obedience is the place where confidence is formed.",
      "This week, consider one step you have delayed because you were waiting to feel ready. Bring that hesitation honestly to God, then ask what small faithful action belongs next.",
    ],
    reflection:
      "Name one small step of obedience that does not require full confidence before you begin.",
  },
  {
    id: "belonging-before-building",
    title: "Belonging Before Building",
    date: "July 8, 2026",
    category: "Identity",
    scripture: "John 15:5",
    tags: ["Identity", "Belonging", "Rest"],
    excerpt:
      "The fruit of your life grows from abiding before it grows from effort.",
    body: [
      "It is easy to treat the journey like a project to complete. Jesus invites you first into abiding, because lasting fruit grows from connection before productivity.",
      "Before you build, lead, serve, or decide, return to the simple truth that you belong to Him.",
    ],
    reflection:
      "Pause before one task this week and pray: Jesus, help me begin from belonging.",
  },
  {
    id: "named-by-grace-not-output",
    title: "Named by Grace, Not Output",
    date: "June 24, 2026",
    category: "Identity",
    scripture: "Galatians 2:20",
    tags: ["Identity", "Grace", "Purposeful Action"],
    excerpt:
      "Your work matters, but it was never meant to carry the weight of naming who you are.",
    body: [
      "Fruitful work is a gift, but it becomes heavy when it tries to become your identity. In Christ, you are received before you are productive.",
      "Let grace name you again this week, especially in the places where output has been loud.",
    ],
    reflection:
      "Ask where your output has started to define you, then let grace speak first.",
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
  {
    id: "leadership-that-listens-first",
    title: "Leadership That Listens First",
    date: "June 17, 2026",
    category: "Work & Leadership",
    scripture: "James 1:19",
    tags: ["Work", "Leadership", "Relationships"],
    excerpt:
      "Faithful leadership often begins by slowing down enough to hear what is really happening.",
    body: [
      "Leadership does not always need the fastest answer. Sometimes the most faithful move is to listen long enough for people, context, and wisdom to become clearer.",
      "This week, choose one conversation where listening will be more helpful than fixing too quickly.",
    ],
    reflection:
      "Practice one conversation where your first gift is attention, not advice.",
  },
];

const liveGatherings = [
  {
    format: "Virtual",
    type: "DYDD Overview",
    title: "Discover Your Divine Design Intro Night",
    date: "Coming soon",
    price: "Free preview",
    description:
      "A simple live introduction to the full DYDD journey, the assessments, and the course path.",
  },
  {
    format: "Virtual",
    type: "DesignID",
    title: "Understanding Your DesignID Results",
    date: "Coming soon",
    price: "Included with DesignID",
    description:
      "A focused walkthrough for people who have completed DesignID and want help applying the report.",
  },
  {
    format: "Live",
    type: "Workshop",
    title: "Purpose & Calling Workshop",
    date: "Coming soon",
    price: "Paid seat",
    description:
      "A deeper guided session for groups, churches, or teams who want to explore purpose together.",
  },
];

const liveTypes = [
  "DYDD overviews",
  "DesignID sessions",
  "Spiritual Gifts sessions",
  "Workshops",
  "Virtual classes",
  "Live gatherings",
];

const podcastNameIdeas = [
  "The DYDD Fireside",
  "Waypoints with John",
  "On Purpose, For Purpose",
  "The Divine Design Table",
  "Along the Way",
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

      <section
        className="fireside-waypoints-feature"
        id="waypoints"
        aria-label="DYDD Waypoints trail banner"
      >
        <div className="fireside-image-header">
          <img
            alt="Illustrated DYDD Waypoints trail through a forest with natural places to pause"
            src="/brand/dydd-waypoints-banner.png"
          />
          <div className="fireside-image-title waypoints-title">
            <p>DYDD Waypoints</p>
            <span>Pause, breathe, and keep walking.</span>
          </div>
        </div>
      </section>

      <section className="waypoints-section" aria-label="DYDD Waypoints library">
        <WaypointExplorer
          categories={waypointCategories}
          currentId={currentWaypoint.id}
          previousId={previousWaypoint.id}
          waypoints={waypointArchive}
        />
      </section>

      <section className="fireside-live-section" id="live" aria-label="Live Fireside">
        <div className="fireside-image-header live-fireside-header">
          <img
            alt="Illustrated Live Fireside gathering around a campfire"
            src="/brand/dydd-live-fireside-banner-concept.png"
          />
          <div className="fireside-image-title live-title">
            <p>Live Fireside</p>
            <span>Gatherings, teaching, and conversations.</span>
          </div>
        </div>

        <div className="fireside-live-type-row" aria-label="Live Fireside categories">
          {liveTypes.map((type) => (
            <span key={type}>{type}</span>
          ))}
        </div>

        <div className="fireside-live-layout">
          <section className="fireside-event-board" aria-label="Upcoming live gatherings">
            <div className="fireside-board-heading">
              <div>
                <p className="section-label">Event Calendar</p>
                <h3>Coming Up</h3>
              </div>
              <span>Enrollment coming soon</span>
            </div>

            <div className="fireside-event-list">
              {liveGatherings.map((event) => (
                <article className="fireside-event-card" key={event.title}>
                  <div className="fireside-event-meta">
                    <span>{event.format}</span>
                    <span>{event.type}</span>
                  </div>
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <div className="fireside-event-footer">
                    <span>{event.date}</span>
                    <strong>{event.price}</strong>
                  </div>
                  <button className="button secondary" type="button">
                    Save my spot
                  </button>
                </article>
              ))}
            </div>
          </section>

          <aside className="fireside-podcast-panel" aria-label="Podcast direction">
            <p className="section-label">Podcast & Teaching</p>
            <h3>A listening path for the journey.</h3>
            <p>
              Podcast episodes, short teachings, video clips, sermons, and
              replay content can sit here once the rhythm is ready.
            </p>
            <div className="fireside-podcast-name-grid" aria-label="Podcast name ideas">
              {podcastNameIdeas.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
            <p>
              My favorite direction right now is{" "}
              <strong>The DYDD Fireside</strong> because it matches this page
              and gives room for teaching, interviews, stories, and
              devotion-style episodes.
            </p>
          </aside>
        </div>

        <div className="fireside-live-note">
          <p>
            Later this can connect to real event registration, payment, calendar
            reminders, replay access, and subscriber invitations.
          </p>
        </div>
      </section>
    </main>
  );
}

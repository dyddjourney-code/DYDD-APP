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

export default function LivePage() {
  return (
    <main className="journey-shell hq-standalone-page fireside-page">
      <section
        className="fireside-live-section"
        id="live"
        aria-label="Live Fireside"
      >
        <div className="fireside-image-header live-fireside-header">
          <img
            alt="Illustrated Live Fireside gathering around a campfire"
            src="/brand/dydd-live-fireside-banner-concept.png"
          />
          <div className="live-header-copy">
            <p>Live Fireside</p>
            <span>Gatherings, teaching, and conversations.</span>
          </div>
        </div>

        <div
          className="fireside-live-type-row"
          aria-label="Live Fireside categories"
        >
          {liveTypes.map((type) => (
            <span key={type}>{type}</span>
          ))}
        </div>

        <div className="fireside-live-layout">
          <section
            className="fireside-event-board"
            aria-label="Upcoming live gatherings"
          >
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

          <aside
            className="fireside-podcast-panel"
            aria-label="Podcast direction"
          >
            <p className="section-label">Podcast & Teaching</p>
            <h3>A listening path for the journey.</h3>
            <p>
              Podcast episodes, short teachings, video clips, sermons, and
              replay content can sit here once the rhythm is ready.
            </p>
            <div
              className="fireside-podcast-name-grid"
              aria-label="Podcast name ideas"
            >
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

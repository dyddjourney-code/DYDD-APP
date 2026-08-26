const bookResources = [
  {
    title: "Discover Your Divine Design",
    image: "/brand/dydd-book-cover.webp",
    alt: "Discover Your Divine Design book cover",
    description:
      "The theological and conceptual foundation of the DYDD journey, exploring identity in Christ, personal design, and faithful living with clarity and grace.",
    cta: "Purchase book",
    href: "https://www.amazon.com/Discover-Your-Divine-Design-Purpose/dp/B0DZL6MG7K",
  },
  {
    title: "Discover Your Divine Design Workbook",
    image:
      "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/d2a3900f-0b7c-4b09-84d4-1429dcb48c8f/DYDD_Workbook.jpeg?format=750w",
    alt: "Discover Your Divine Design workbook cover",
    description:
      "A guided companion to the book created to support prayerful engagement, personal reflection, and faithful application.",
    cta: "Purchase workbook",
    href: "https://www.amazon.com/s?k=Discover+Your+Divine+Design+Workbook+John+Willoughby",
  },
];

const liveExperiences = [
  {
    label: "DYDD Workshop",
    title: "Discover Your Divine Design Training Workshop",
    image:
      "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/67bc84f8-96c2-4e03-b701-c766a40f92a0/diverse-people-in-a-seminar-2025-02-10-11-57-04-utc.jpg?format=750w",
    description:
      "A workshop introducing the full DYDD framework so participants can explore identity in Christ, personal design, and calling together.",
    idealFor: ["Churches and ministries", "Small groups and cohorts", "Retreats and formation gatherings"],
  },
  {
    label: "Foundations",
    title: "DesignID Foundations Workshop",
    image:
      "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/2c4932b8-76eb-4828-baee-0553d4b6f8d9/happy-multiracial-group-of-coworkers-take-selfie-t-2025-01-07-05-56-33-utc.jpg?format=750w",
    description:
      "A focused experience for understanding DesignID, the four design reflections, grace flow, and shared language for empathy and collaboration.",
    idealFor: ["Teams and organizations", "Ministry staff and volunteers", "Groups seeking practical self-awareness"],
  },
  {
    label: "Leadership",
    title: "DesignID Leadership Team Workshop",
    image:
      "https://images.squarespace-cdn.com/content/v1/685da500fbad741e29c08c78/ac8d6497-3b9e-4731-9c5e-31c96646e888/businesswoman-in-presentation-at-conference-raisin-2024-10-19-04-44-41-utc.jpg?format=750w",
    description:
      "A strategic workshop for leadership teams who want to understand how design shapes leadership style, communication, and wise collaboration.",
    idealFor: ["Leadership teams", "Pastors and ministry leaders", "Executive and organizational groups"],
  },
];

export default function GearPage() {
  return (
    <main className="journey-shell hq-standalone-page">
      <header className="standalone-hero gear-hero">
        <div>
          <p className="eyebrow">Gear</p>
          <h1>Books and resources for the journey.</h1>
          <p className="lede">
            Start with the core Discover Your Divine Design book and workbook.
            These resources support the full journey and give people something
            simple to keep using beyond the app.
          </p>
        </div>
      </header>

      <section className="gear-panel gear-books-panel" id="books">
        <div className="card-heading">
          <p className="section-label">Books</p>
          <h2>The main resources live here first.</h2>
          <p>
            The book and workbook are the core gear for the DYDD journey. They
            can be highlighted elsewhere, but this page gives them a clear home.
          </p>
        </div>
        <div className="gear-book-grid">
          {bookResources.map((book) => (
            <article className="gear-book-card" key={book.title}>
              <div className="gear-book-cover">
                <img src={book.image} alt={book.alt} />
              </div>
              <div className="gear-book-copy">
                <h3>{book.title}</h3>
                <p>{book.description}</p>
                <a className="button secondary" href={book.href} target="_blank" rel="noreferrer">
                  {book.cta}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gear-panel gear-workshops-panel" id="workshops">
        <div className="card-heading">
          <p className="section-label">Workshops & Live Experiences</p>
          <h2>Live support for groups, teams, and churches.</h2>
          <p>
            Facilitated experiences can help people build shared language,
            deepen clarity, and apply the DYDD framework in community.
          </p>
        </div>
        <div className="gear-experience-grid">
          {liveExperiences.map((experience) => (
            <article className="gear-experience-card" key={experience.title}>
              <div className="gear-experience-media">
                <img src={experience.image} alt="" />
                <span>{experience.label}</span>
              </div>
              <div className="gear-experience-copy">
                <h3>{experience.title}</h3>
                <p>{experience.description}</p>
                <strong>Ideal for:</strong>
                <ul>
                  {experience.idealFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <a
          className="button primary gear-contact-button"
          href="https://www.discoverdivine.design/discover-your-divine-design-contact"
          target="_blank"
          rel="noreferrer"
        >
          Contact to schedule
        </a>
      </section>
    </main>
  );
}

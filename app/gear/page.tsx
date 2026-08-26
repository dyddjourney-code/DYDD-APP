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
      "A guided companion to the book created to support prayerful engagement, personal reflection, and faithful application. The workbook is included digitally inside the Discover Your Divine Design Journey; this paper copy is for people who prefer something they can hold, write in, and keep nearby.",
    cta: "Purchase workbook",
    href: "https://www.amazon.com/s?k=Discover+Your+Divine+Design+Workbook+John+Willoughby",
  },
];

const liveExperiences = [
  {
    label: "DYDD Workshop",
    title: "Discover Your Divine Design Training Workshop",
    image: "/brand/gear/dydd-workshop-cartoon.png",
    description:
      "A workshop introducing the full DYDD framework so participants can explore identity in Christ, personal design, and calling together.",
    idealFor: ["Churches and ministries", "Small groups and cohorts", "Retreats and formation gatherings"],
  },
  {
    label: "Foundations",
    title: "DesignID Foundations Workshop",
    image: "/brand/gear/designid-foundations-cartoon.png",
    description:
      "A focused experience for understanding DesignID, the four design reflections, grace flow, and shared language for empathy and collaboration.",
    idealFor: ["Teams and organizations", "Ministry staff and volunteers", "Groups seeking practical self-awareness"],
  },
  {
    label: "Leadership",
    title: "DesignID Leadership Team Workshop",
    image: "/brand/gear/designid-leadership-cartoon.png",
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
          <h1>Resources for the journey.</h1>
          <p className="lede">
            Books, workshops, and live experiences that help people carry the
            Discover Your Divine Design journey into daily life.
          </p>
        </div>
      </header>

      <section className="gear-panel gear-books-panel" id="books">
        <div className="card-heading">
          <p className="section-label">Books</p>
          <p>
            The book and workbook are the core gear for the Discover Your Divine
            Design journey. The workbook is included digitally inside the
            journey, and the paper copy is available below for anyone who wants
            a printed companion.
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
      </section>
    </main>
  );
}

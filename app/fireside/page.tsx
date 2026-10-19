import { ReviewAwareLink } from "@/components/review-aware-link";

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

      <section className="fireside-overview-grid" aria-label="Explore Fireside">
        <article className="fireside-overview-card">
          <ReviewAwareLink className="fireside-preview-image" href="/waypoints" aria-label="Explore DYDD Waypoints">
            <img src="/brand/dydd-waypoints-banner.png" alt="Illustrated DYDD Waypoints trail through a forest with natural places to pause" />
          </ReviewAwareLink>
          <h2>DYDD Waypoints</h2>
          <p>Pause, breathe, and keep walking. Find Scripture, reflection, and encouragement for the journey.</p>
          <ReviewAwareLink className="button" href="/waypoints">Go to Waypoints</ReviewAwareLink>
        </article>
        <article className="fireside-overview-card">
          <ReviewAwareLink className="fireside-preview-image" href="/live" aria-label="Explore Live Fireside">
            <img src="/brand/dydd-live-fireside-banner-concept.png" alt="Illustrated Live Fireside gathering around a campfire" />
          </ReviewAwareLink>
          <h2>Live Fireside</h2>
          <p>Gatherings, teaching, and conversations. Explore upcoming live and virtual moments to connect along the way.</p>
          <ReviewAwareLink className="button" href="/live">Go to Live</ReviewAwareLink>
        </article>
      </section>
    </main>
  );
}

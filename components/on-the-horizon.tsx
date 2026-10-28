import { horizonTrails } from "@/lib/on-the-horizon";
import styles from "./on-the-horizon.module.css";

export function OnTheHorizon() {
  return (
    <details className={styles.accordion} id="on-the-horizon">
      <summary className={styles.summary}>
        <span className={styles.summaryCopy}>
          <span className={styles.eyebrow}>On the Horizon</span>
          <span className={styles.title}>Blazing New Trails</span>
          <span className={styles.teaser}>Your discovery is a beginning, not a finish line. Take a look at what’s ahead.</span>
        </span>
        <span className={styles.toggle} aria-hidden="true"><span className={styles.plus} /></span>
      </summary>
      <div className={styles.body}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>A journey that keeps growing</p>
          <h2>There’s more trail ahead.</h2>
          <p>Discovering your God-given design opens up a lifetime of learning to live it out. We’re continuing to develop tools and guided experiences to help you take that discovery into your relationships, work, service, and everyday decisions.</p>
          <p>This is a glimpse of the trails we’re preparing to explore—and an invitation to keep walking with us.</p>
        </header>
        <div className={styles.trails}>
          {horizonTrails.map((trail, index) => (
            <article className={styles.trail} key={trail.id}>
              <span className={styles.number} aria-hidden="true">0{index + 1}</span>
              <div className={styles.trailCopy}>
                <div className={styles.trailTop}>
                  <p className={styles.invitation}>{trail.invitation}</p>
                  <span className={trail.status === "Exploring" ? styles.exploring : styles.planned}>{trail.status}</span>
                </div>
                <h3>{trail.title}</h3>
                <p>{trail.description}</p>
                <p className={styles.takeaway}>{trail.takeaway}</p>
              </div>
            </article>
          ))}
        </div>
        <footer className={styles.footer}>
          <h3>Keep discovering. Keep growing. Keep walking.</h3>
          <p>Return here to see how the journey is growing. As new trails take shape, we’ll share more about what’s ready and how to take part.</p>
          <p className={styles.note}><strong>Reading the trail signs:</strong> Planned means we intend to build it; Exploring means we’re considering the possibilities. These experiences aren’t available yet. Timing and access details will be shared as each one takes shape.</p>
        </footer>
      </div>
    </details>
  );
}

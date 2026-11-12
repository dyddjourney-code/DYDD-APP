import styles from './public-assessments.module.css';
/** Shown only after the guest has completed all current assessment purchases. */
export function GuestJourneyInvitation() {
 return <div className={styles.discoveryInvitation}>
  <footer className={styles.discoveryCopy} aria-labelledby="guest-journey-heading">
   <img className={styles.discoveryLogo} src="/brand/dydd-logo-transparent.webp" alt="Discover Your Divine Design" />
   <h2 id="guest-journey-heading">Explore the Discover Your Divine Design journey</h2>
   <p>Discover the journey, learn about the assessments, and find resources for your next step.</p>
   <a className={styles.primary} href="https://www.discoverdivine.design/" target="_blank" rel="noopener noreferrer">Explore the DYDD journey</a>
  </footer>
  <aside className={styles.discoveryGifts} aria-label="Explore Spiritual Gifts"><span>Another way to explore</span><a href="https://www.discoverdivine.design/spiritual-gifts-test" target="_blank" rel="noopener noreferrer">Explore Spiritual Gifts</a></aside>
 </div>;
}

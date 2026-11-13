import Link from "next/link";
import styles from "./suggested-trail-route.module.css";

const stops = [
  { name: "DYDD Journey", href: "/journey", note: "Begin the full journey" },
  { name: "DesignID", href: "/trailheads#designid", note: "Launches within the Journey" },
  { name: "Spiritual Gifts", href: "/trailheads#spiritual-gifts", note: "Launches within the Journey" },
  { name: "Fruitful Life 360", href: "/trailheads#fruitlife-360", note: "Independent path" },
  { name: "DesignPD", href: "/trailheads#designpd", note: "Build on your DesignID insight" },
];

export function SuggestedTrailRoute() {
  return (
    <section className={styles.route} aria-labelledby="suggested-trail-route-title">
      <header className={styles.heading}>
        <h2 id="suggested-trail-route-title">Suggested Trail Route</h2>
        <p>A suggested order, not a set of locks. You can also begin with a focused path.</p>
      </header>
      <img className={styles.banner} src="/brand/suggested-trail-route.webp" width={1800} height={460} alt="" loading="lazy" />
      <ol className={styles.stops} aria-label="Suggested trail order">
        {stops.map((stop, index) => (
          <li key={stop.name}>
            <Link href={stop.href}>
              <span className={styles.number} aria-hidden="true">{index + 1}</span>
              <span><strong>{stop.name}</strong><small>{stop.note}</small></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

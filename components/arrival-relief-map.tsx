"use client";

import { useState, type CSSProperties } from "react";
import { ReviewAwareLink } from "@/components/review-aware-link";
import styles from "./arrival-relief-map.module.css";

// Existing ecosystem places and real routes. These are not new courses or gates.
const destinations = [
  { id: "trailheads", label: "Trailheads", x: 21, y: 45, title: "Choose a trail", body: "Take the full DYDD Journey, or choose a focused course or assessment. See the available paths and their access details before you begin.", href: "/trailheads", cta: "Explore Trailheads" },
  { id: "field-kit", label: "Field Kit", x: 79, y: 45, title: "Gather your discoveries", body: "Return to your available results, reports and Journey reflections. The discoveries you bring back from the trail have a place here.", href: "/field-kit", cta: "Open Field Kit" },
  { id: "fireside", label: "Fireside", x: 50, y: 77, title: "Pause along the way", body: "Make room for teaching, encouragement and Scripture-rooted reflection. Find a word for the road before returning to your next step.", href: "/fireside", cta: "Visit Fireside" },
] as const;

/** The image and all markers share one uncropped coordinate plane at every width. */
export function ArrivalReliefMap({ reducedMotion }: { reducedMotion: boolean }) {
  const [selected, setSelected] = useState<(typeof destinations)[number]["id"]>("trailheads");
  const active = destinations.find(place => place.id === selected)!;
  return <section className={`${styles.map} ${reducedMotion ? styles.quiet : ""}`} aria-label="Interactive relief landscape" data-arrival-map>
    <p className={styles.mapNote}>Choose a place on the landscape</p>
    <div className={styles.landscape}>
      <img src="/brand/adventure/relief-landscape.webp" alt="Raised forest relief landscape with branching trailheads, an explorer archive cabin and a fireside clearing connected by winding paths and a river" width={1672} height={941} fetchPriority="high" />
      <span className={styles.compass} aria-hidden="true">N <span>↑</span></span>
      {destinations.map((place, index) => <button key={place.id} className={`${styles.hotspot} ${selected === place.id ? styles.selected : ""}`} type="button" aria-label={`Explore ${place.label}`} aria-pressed={selected === place.id} aria-controls="arrival-map-selection" style={{ "--x": `${place.x}%`, "--y": `${place.y}%` } as CSSProperties} onClick={() => setSelected(place.id)}>
        <span className={styles.pin} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className={styles.label}>{place.label}</span>
      </button>)}
    </div>
    <div id="arrival-map-selection" className={styles.selection} aria-label="Selected destination">
      <div aria-live="polite" aria-atomic="true"><p className={styles.place}>{active.label}</p><h2>{active.title}</h2><p>{active.body}</p></div>
      <ReviewAwareLink href={active.href} className={styles.link}>{active.cta}<span aria-hidden="true">↗</span></ReviewAwareLink>
    </div>
  </section>;
}

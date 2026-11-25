"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ReviewAwareLink } from "@/components/review-aware-link";
import { mapPoints } from "./arrival-map-places";
import styles from "./arrival-relief-map.module.css";

// Geographic placement on the existing, unchanged landscape. Trails are orientation
// overlays, not new course content or a claim of measured park geography.
const positions: Record<string, [number, number]> = {
  "start-here": [10, 83], "base-camp": [69, 85], "ranger-station": [70, 66],
  trailheads: [21, 45], fireside: [50, 77], "camp-circles": [87, 72],
  waypoints: [50, 14], "dydd-journey": [37, 64], "spiritual-gifts": [34, 34],
  "fruitlife-360": [47, 43], designpd: [70, 23], designid: [54, 29], "field-kit": [79, 45],
};
const destinations = [...mapPoints, { id: "field-kit", label: "Field Kit", title: "Gather your discoveries", body: "Return to your available results, reports and Journey reflections. The discoveries you bring back from the trail have a place here.", bullets: ["Available assessment results and reports", "Journey reflections"], href: "/field-kit", cta: "Open Field Kit", type: "place" }];
const trails = [
  { id: "dydd-journey", d: "M69 85 Q54 90 37 64 Q22 61 21 45 Q25 18 50 14" },
  { id: "spiritual-gifts", d: "M21 45 Q26 37 34 34 Q42 22 50 14" },
  { id: "fruitlife-360", d: "M21 45 Q33 51 47 43 Q53 38 54 29" },
  { id: "designid", d: "M21 45 Q39 37 54 29 Q59 19 70 23" },
  { id: "designpd", d: "M54 29 Q62 35 70 23 Q78 24 79 45" },
];
type View = { x: number; y: number; z: number };
const overview: View = { x: 0, y: 0, z: 1 };
export function ArrivalReliefMap({ reducedMotion, onOrient }: { reducedMotion: boolean; onOrient: (place: "camp" | "desk") => void }) {
  const [selected, setSelected] = useState("start-here");
  const [view, setView] = useState<View>(overview);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const current = useRef(view);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const origins = useRef(new Map<number, { x: number; y: number }>());
  const active = destinations.find(place => place.id === selected)!;
  function update(next: View) {
    const surface = viewport.current;
    const z = Math.max(1, Math.min(3, next.z));
    const bx = (surface?.clientWidth ?? 0) * (z - 1) / 2;
    const by = (surface?.clientHeight ?? 0) * (z - 1) / 2;
    const value = { z, x: Math.max(-bx, Math.min(bx, next.x)), y: Math.max(-by, Math.min(by, next.y)) };
    current.current = value; setView(value);
  }
  useEffect(() => { const observer = new ResizeObserver(() => update(current.current)); if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect(); }, []);
  function zoom(z: number, x = 0, y = 0) {
    const old = current.current; const scale = Math.max(1, Math.min(3, z)) / old.z;
    update({ z, x: x - (x - old.x) * scale, y: y - (y - old.y) * scale });
  }
  function choose(id: string) {
    setSelected(id); const [x, y] = positions[id]; const r = viewport.current?.getBoundingClientRect();
    if (r) update({ z: 1.7, x: (50 - x) / 100 * r.width * 1.7, y: (50 - y) / 100 * r.height * 1.7 });
  }
  function down(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    origins.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = pointers.current.size > 1;
    // Capture on the actual button when present: retain native clicks while
    // still receiving drag/end events outside the image or marker.
    ((e.target as HTMLElement).closest("button") ?? e.currentTarget).setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(e.pointerId); if (!previous) return;
    const next = { x: e.clientX, y: e.clientY }; const all = [...pointers.current.entries()];
    const origin = origins.current.get(e.pointerId)!;
    if (Math.hypot(next.x - origin.x, next.y - origin.y) > 4) moved.current = true;
    if (all.length === 2) {
      const other = all.find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(previous.x - other.x, previous.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      const r = e.currentTarget.getBoundingClientRect();
      if (before > 0) zoom(current.current.z * after / before, (next.x + other.x) / 2 - r.x - r.width / 2, (next.y + other.y) / 2 - r.y - r.height / 2);
    } else update({ ...current.current, x: current.current.x + next.x - previous.x, y: current.current.y + next.y - previous.y });
    pointers.current.set(e.pointerId, next);
  }
  function up(e: PointerEvent<HTMLDivElement>) { pointers.current.delete(e.pointerId); origins.current.delete(e.pointerId); setDragging(pointers.current.size > 0); }
  return <section className={`${styles.map} ${reducedMotion ? styles.quiet : ""}`} aria-label="Interactive relief landscape" data-arrival-map>
    <div className={styles.toolbar}><p className={styles.mapNote}>Ranger Station · Relief table <span>Zoom or pinch in, then drag · Select a place to learn more</span></p><div className={styles.controls} aria-label="Map view controls"><button type="button" aria-label="Zoom out" disabled={view.z <= 1} onClick={() => zoom(view.z - .25)}>−</button><output aria-label="Map zoom">{Math.round(view.z * 100)}%</output><button type="button" aria-label="Zoom in" disabled={view.z >= 3} onClick={() => zoom(view.z + .25)}>+</button><button type="button" onClick={() => update(overview)}>Overview</button></div></div>
    <div className={styles.table}><div ref={viewport} className={`${styles.landscape} ${dragging ? styles.dragging : ""}`} data-map-viewport tabIndex={0} aria-label="Relief map. Arrow keys pan; plus and minus zoom; Home returns to overview." onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onClickCapture={e => { const dragged = moved.current; moved.current = false; if (dragged && e.detail > 0) { e.preventDefault(); e.stopPropagation(); } }} onKeyDown={e => {
      if (e.target !== e.currentTarget) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"].includes(e.key)) e.preventDefault();
      if (e.key === "Home") update(overview);
      else if (e.key === "+" || e.key === "=") zoom(current.current.z + .25);
      else if (e.key === "-") zoom(current.current.z - .25);
      else if (e.key.startsWith("Arrow")) update({ ...current.current, x: current.current.x + (e.key === "ArrowLeft" ? 45 : e.key === "ArrowRight" ? -45 : 0), y: current.current.y + (e.key === "ArrowUp" ? 45 : e.key === "ArrowDown" ? -45 : 0) });
    }}>
      <div className={styles.plane} data-map-plane data-zoom={view.z} data-pan-x={view.x} data-pan-y={view.y} style={{ transform: `translate3d(${view.x}px,${view.y}px,0) scale(${view.z})`, "--inverse-zoom": 1 / view.z } as CSSProperties}>
        <img src="/brand/adventure/relief-landscape.webp" alt="Raised forest relief landscape with branching trails, an archive cabin, fireside clearing and a winding river" width={1672} height={941} fetchPriority="high" draggable={false} />
        <svg className={styles.trails} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{trails.map(trail => <path key={trail.id} pathLength={100} d={trail.d} className={selected === trail.id ? styles.activeTrail : ""} />)}</svg>
        {destinations.map((place, index) => <button key={place.id} className={`${styles.hotspot} ${selected === place.id ? styles.selected : ""}`} type="button" aria-label={`Explore ${place.label}`} aria-pressed={selected === place.id} aria-controls="arrival-map-selection" style={{ "--x": `${positions[place.id][0]}%`, "--y": `${positions[place.id][1]}%` } as CSSProperties} onClick={() => choose(place.id)}><span className={styles.pin} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><span className={styles.label}>{place.label}</span></button>)}
      </div><span className={styles.compass} aria-hidden="true">N <span>↑</span></span>
    </div><div className={styles.tableEdge}>DISCOVER YOUR DIVINE DESIGN <span>Choose your next faithful step</span></div></div>
    <nav className={styles.index} aria-label="Relief map destinations">{destinations.map(place => <button type="button" key={place.id} aria-pressed={selected === place.id} onClick={() => choose(place.id)}>{place.label}</button>)}</nav>
    <div id="arrival-map-selection" className={styles.selection} aria-label="Selected destination"><div aria-live="polite" aria-atomic="true"><p className={styles.place}>{active.type === "trail" ? "Trail" : "Place"} · {active.label}</p><h2>{active.title}</h2><p>{active.body}</p><ul>{active.bullets.map(b => <li key={b}>{b}</li>)}</ul></div>{active.id === "ranger-station" || active.id === "base-camp" || active.id === "start-here" ? <button type="button" className={styles.link} onClick={() => onOrient(active.id === "ranger-station" ? "desk" : "camp")}>{active.cta}<span aria-hidden="true">↗</span></button> : <ReviewAwareLink href={active.href} className={styles.link}>{active.cta}<span aria-hidden="true">↗</span></ReviewAwareLink>}</div>
  </section>;
}

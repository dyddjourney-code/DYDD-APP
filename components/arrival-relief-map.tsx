"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ReviewAwareLink } from "@/components/review-aware-link";
import { mapTerrain, positions, trails, routeNotes, riverFlow, riverWaterPools } from "./arrival-map-geography";
import { mapPoints } from "./arrival-map-places";
import styles from "./arrival-relief-map.module.css";

const destinations = [...mapPoints, { id: "field-kit", label: "Field Kit", title: "Gather your discoveries", body: "Return to your available results, reports and Journey reflections. The discoveries you bring back from the trail have a place here.", bullets: ["Available assessment results and reports", "Journey reflections"], href: "/field-kit", cta: "Open Field Kit", type: "place" }];
type View = { x: number; y: number; z: number };
const overview: View = { x: 0, y: 0, z: 1 };
export function ArrivalReliefMap({ reducedMotion, onOrient, onPassport }: { reducedMotion: boolean; onOrient: (place: "camp" | "desk") => void; onPassport: () => void }) {
  const [selected, setSelected] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const host = useRef<HTMLElement>(null);
  const popup = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const planeSize = useRef({width: 0, height: 0});
  const [plane, setPlane] = useState({width: 0, height: 0});
  const [view, setView] = useState<View>(overview);
  const [dragging, setDragging] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const current = useRef(view);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const origins = useRef(new Map<number, { x: number; y: number }>());
  const active = destinations.find(place => place.id === selected);
  function update(next: View) {
    const surface = viewport.current;
    const z = Math.max(1, Math.min(3, next.z));
    const bx = Math.max(0, (planeSize.current.width * z - (surface?.clientWidth ?? 0)) / 2);
    const by = Math.max(0, (planeSize.current.height * z - (surface?.clientHeight ?? 0)) / 2);
    const value = { z, x: Math.max(-bx, Math.min(bx, next.x)), y: Math.max(-by, Math.min(by, next.y)) };
    current.current = value; setView(value);
  }
  useEffect(() => {
    const surface = viewport.current;
    if (!surface) return;
    const resize = () => {
      const width = Math.min(surface.clientWidth, surface.clientHeight * mapTerrain.width / mapTerrain.height);
      const size = {width, height: width * mapTerrain.height / mapTerrain.width};
      planeSize.current = size; setPlane(size); update(current.current);
    };
    const observer = new ResizeObserver(resize); observer.observe(surface); resize();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const surface = viewport.current;
    if (!surface) return;
    const wheel = (event: WheelEvent) => {
      const z=current.current.z;
      if (host.current?.dataset.expanded !== "true" && ((z <= 1 && event.deltaY > 0) || (z >= 3 && event.deltaY < 0))) return;
      event.preventDefault();
      const r=surface.getBoundingClientRect();
      zoom(current.current.z * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * .002), event.clientX-r.x-r.width/2, event.clientY-r.y-r.height/2);
    };
    surface.addEventListener("wheel", wheel, {passive:false});
    return () => surface.removeEventListener("wheel", wheel);
  }, []);
  useEffect(() => {
    const change = () => { if (!document.fullscreenElement) setExpanded(false); };
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    if (!expanded) return;
    const old = document.body.style.overflow;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => viewport.current?.focus({preventScroll:true}));
    const keydown = (event: KeyboardEvent) => {
      if (popup.current?.open) return;
      if (event.key === "Escape") { setExpanded(false); if (document.fullscreenElement) void document.exitFullscreen(); }
      if (event.key === "Tab") {
        const items = [...(host.current?.querySelectorAll<HTMLElement>('button:not([disabled]), summary, a[href], [tabindex="0"]') ?? [])].filter(item => item.getBoundingClientRect().width && item.getBoundingClientRect().height);
        const first=items[0],last=items[items.length-1];
        if (!host.current?.contains(document.activeElement) || (event.shiftKey && document.activeElement===first) || (!event.shiftKey && document.activeElement===last)) { event.preventDefault(); (event.shiftKey ? last : first)?.focus(); }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => { cancelAnimationFrame(focusFrame); document.body.style.overflow = old; document.removeEventListener("keydown", keydown); if(previous?.isConnected)previous.focus({preventScroll:true}); };
  }, [expanded]);

  async function fullscreen() {
    if (expanded) { setExpanded(false); if (document.fullscreenElement) await document.exitFullscreen(); }
    else { setExpanded(true); try { await host.current?.requestFullscreen?.(); } catch { /* Viewport-filling fallback for browsers without Fullscreen API support. */ } }
  }
  async function openPassport() {
    host.current?.querySelector("details")?.removeAttribute("open");
    setExpanded(false);
    if (document.fullscreenElement) await document.exitFullscreen();
    host.current?.querySelector("summary")?.focus({preventScroll:true});
    onPassport();
  }
  function closePopup() { popup.current?.close(); opener.current?.focus({preventScroll: true}); }
  function zoom(z: number, x = 0, y = 0) {
    const old = current.current; const scale = Math.max(1, Math.min(3, z)) / old.z;
    update({ z, x: x - (x - old.x) * scale, y: y - (y - old.y) * scale });
  }
  function choose(id: string) {
    opener.current = host.current?.querySelector(`[aria-label="Explore ${destinations.find(place => place.id === id)?.label}"]`) as HTMLElement | null;
    setSelected(id);
    requestAnimationFrame(() => { if (!popup.current?.open) popup.current?.showModal(); });
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
      if (before > 0) {
        const old=current.current,z=Math.max(1,Math.min(3,old.z*after/before)),scale=z/old.z;
        const oldMid={x:(previous.x+other.x)/2-r.x-r.width/2,y:(previous.y+other.y)/2-r.y-r.height/2};
        const newMid={x:(next.x+other.x)/2-r.x-r.width/2,y:(next.y+other.y)/2-r.y-r.height/2};
        update({z,x:newMid.x-(oldMid.x-old.x)*scale,y:newMid.y-(oldMid.y-old.y)*scale});
      }
    } else update({ ...current.current, x: current.current.x + next.x - previous.x, y: current.current.y + next.y - previous.y });
    pointers.current.set(e.pointerId, next);
  }
  function up(e: PointerEvent<HTMLDivElement>) { pointers.current.delete(e.pointerId); origins.current.delete(e.pointerId); setDragging(pointers.current.size > 0); }
  return <section ref={host} className={`${styles.map} ${reducedMotion ? styles.quiet : ""} ${expanded ? styles.expanded : ""}`} aria-label="Interactive relief landscape" data-arrival-map data-expanded={expanded}>
    <div className={styles.mapHeading}><span>THE DYDD PARK</span><p>A place to discover. A trail to follow.</p></div>
    <div className={styles.table}>
      <div className={styles.tools}>
        <details className={styles.access}><summary aria-label="Map help and accessible destinations">Map guide</summary><div className={styles.guide}><p>Scroll or pinch to zoom. Drag to explore. Select a name and dot for details.</p><p>Keyboard: + / − to zoom, arrows to pan, Home for the whole park.</p><div className={styles.controls}><button type="button" aria-label="Zoom out" disabled={view.z <= 1} onClick={() => zoom(view.z - .25)}>−</button><output aria-label="Map zoom">{Math.round(view.z * 100)}%</output><button type="button" aria-label="Zoom in" disabled={view.z >= 3} onClick={() => zoom(view.z + .25)}>+</button><button type="button" onClick={() => update(overview)}>Whole park</button></div><nav className={styles.index} aria-label="Relief map destinations">{destinations.map(place => <button type="button" key={place.id} aria-pressed={selected === place.id} onClick={() => { host.current?.querySelector("details")?.removeAttribute("open"); choose(place.id); }}>{place.label}</button>)}</nav><button type="button" className={styles.passport} onClick={() => void openPassport()}>Open my Passport</button></div></details>
        <button type="button" className={styles.fullscreen} aria-label={expanded ? "Exit full screen map" : "Full screen map"} aria-pressed={expanded} onClick={() => void fullscreen()}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{expanded ? <path d="M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6"/> : <path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/>}</svg></button>
      </div>
      <div ref={viewport} className={`${styles.landscape} ${dragging ? styles.dragging : ""}`} style={{aspectRatio: expanded ? undefined : `${mapTerrain.width}/${mapTerrain.height}`}} data-map-viewport tabIndex={0} aria-label="Relief map. Arrow keys pan; plus and minus zoom; Home returns to overview." onDoubleClick={e => { if ((e.target as HTMLElement).closest("button")) return; if (!moved.current) zoom(current.current.z < 2 ? 2 : 1); }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onClickCapture={e => { const dragged = moved.current; moved.current = false; if (dragged && e.detail > 0) { e.preventDefault(); e.stopPropagation(); } }} onKeyDown={e => {
        if (e.target !== e.currentTarget) return;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"].includes(e.key)) e.preventDefault();
        if (e.key === "Home") update(overview);
        else if (e.key === "+" || e.key === "=") zoom(current.current.z + .25);
        else if (e.key === "-") zoom(current.current.z - .25);
        else if (e.key.startsWith("Arrow")) update({ ...current.current, x: current.current.x + (e.key === "ArrowLeft" ? 45 : e.key === "ArrowRight" ? -45 : 0), y: current.current.y + (e.key === "ArrowUp" ? 45 : e.key === "ArrowDown" ? -45 : 0) });
      }}>
        {!imageReady && !imageError && <div className={styles.loading} aria-label="Loading park landscape"/>}
        {imageError && <p className={styles.imageError} role="status">The landscape could not load. Use Map guide to explore every destination.</p>}
        <div className={styles.plane} data-map-plane data-zoom={view.z} data-pan-x={view.x} data-pan-y={view.y} style={{ width:plane.width || "100%",height:plane.height || "100%",transform: `translate3d(calc(-50% + ${view.x}px),calc(-50% + ${view.y}px),0) scale(${view.z})`, "--inverse-zoom": 1 / view.z } as CSSProperties}>
          <img src={mapTerrain.image} alt="Source-faithful close-up of the ranger station’s raised relief model: tactile mountain ridges, miniature forest, winding river and timber footbridge, ranger cabin with separate Field Kit outbuilding, bridge trailhead, two camp clearings and a fireside hiking loop on the original wooden table" width={mapTerrain.width} height={mapTerrain.height} fetchPriority="high" draggable={false} onLoad={() => setImageReady(true)} onError={() => setImageError(true)} />
          <svg className={styles.riverFlow} data-river-flow viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="arrival-river-water" clipPathUnits="userSpaceOnUse">{riverWaterPools.map(points => <polygon key={points} points={points}/>)}</clipPath></defs><g clipPath="url(#arrival-river-water)">{riverFlow.map((d, index) => <path key={d} d={d} style={{ "--flow-delay": `${-index * .73}s` } as CSSProperties}/>)}</g></svg>
          <svg className={styles.trails} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{[...trails].sort((a,b)=>Number(a.id===selected)-Number(b.id===selected)).map(trail => <g key={trail.id} data-trail={trail.id} data-route-kind={trail.kind} style={{ "--route-color": trail.color, "--route-hot": trail.hot } as CSSProperties} className={selected === trail.id ? styles.activeTrail : ""}><path className={styles.trailLights} d={trail.d}/></g>)}</svg>
          <svg className={styles.detailsArt} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {selected === "fireside" && <g className={styles.fireWarmth}><ellipse cx="86.9" cy="54.5" rx=".6" ry=".9" fill="#e4b06b" opacity=".25"/><ellipse cx="86.9" cy="54.5" rx=".17" ry=".25" fill="#f7d69a"/></g>}
            {selected === "designid" && <g transform="translate(44.3 68.5) rotate(63)"><ellipse rx=".35" ry=".9" fill="#433d29" opacity=".35" transform="translate(.12 .12)"/><path d="M0 -.85 Q.55 -.4 .25 .7 L-.25 .7 Q-.55 -.4 0 -.85" fill="#d4bb81" stroke="#665035" strokeWidth=".08"/><path d="M-.22 -.1H.22M-.22 .35H.22" stroke="#8c7248" strokeWidth=".12"/></g>}
          </svg>
          {destinations.map(place => <button key={place.id} className={`${styles.hotspot} ${selected === place.id ? styles.selected : ""}`} type="button" data-place={place.id} data-side={place.id === "start-here" ? "left" : place.id === "ranger-station" ? "roof" : ["designid", "fireside", "trailheads", "field-kit", "designpd", "fruitlife-360"].includes(place.id) ? "left" : "right"} aria-label={`Explore ${place.label}`} aria-pressed={selected === place.id} aria-haspopup="dialog" aria-controls="arrival-map-selection" style={{ "--x": `${positions[place.id][0]}%`, "--y": `${positions[place.id][1]}%` } as CSSProperties} onClick={() => choose(place.id)}><span className={styles.pin} aria-hidden="true"/><span className={styles.label}>{place.label}</span></button>)}
        </div>
        <span className={styles.compass} aria-hidden="true">N<span>↑</span></span>
      </div>
    </div>
    <dialog ref={popup} id="arrival-map-selection" className={styles.popup} aria-labelledby="map-destination-title" onCancel={e=>{e.preventDefault();closePopup();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePopup();}}}>
      {active && <><button autoFocus type="button" className={styles.close} aria-label="Close destination details" onClick={closePopup}>×</button><p className={styles.place}>{active.type === "trail" ? "Explore the trail" : "A place in the park"} · {active.label}</p><h2 id="map-destination-title">{active.title}</h2>{routeNotes[active.id] && <p className={styles.routeNote}>{routeNotes[active.id]}</p>}<p>{active.body}</p><ul>{active.bullets.map(b => <li key={b}>{b}</li>)}</ul>{active.id === "ranger-station" || active.id === "base-camp" || active.id === "start-here" ? <button type="button" className={styles.link} onClick={() => { closePopup(); setExpanded(false); if(document.fullscreenElement)void document.exitFullscreen(); onOrient(active.id === "ranger-station" ? "desk" : "camp"); }}>{active.cta}<span aria-hidden="true">↗</span></button> : <ReviewAwareLink href={active.href} className={styles.link}>{active.cta}<span aria-hidden="true">↗</span></ReviewAwareLink>}</>}
    </dialog>
  </section>;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ReviewAwareLink } from "@/components/review-aware-link";

const destinations = [
  { href: "/base-camp", label: "Base Camp", icon: "camp" },
  { href: "/ranger-station", label: "Ranger Station", icon: "compass" },
  { href: "/trailheads", label: "Trailheads", icon: "trail" },
  { href: "/journey", label: "My Journey", icon: "journey" },
  { href: "/field-kit", label: "Field Kit", icon: "kit" },
  { href: "/fireside", label: "Fireside", icon: "fire" },
];
const moreDestinations = [
  { href: "/base-camp#passport", label: "Passport Book", detail: "Your milestones and discoveries" },
  { href: "/base-camp#your-profile", label: "Traveler profile", detail: "Your story and account details" },
  { href: "/gear", label: "Gear", detail: "Resources for the trail" },
  { href: "/waypoints", label: "Waypoints", detail: "Pause for encouragement" },
  { href: "/live", label: "Live", detail: "Gather for an upcoming experience" },
  { href: "/camp-circle", label: "Camp Circles", detail: "Walk alongside others" },
  { href: "/camp-circle/my-circles", label: "My Circles", detail: "Return to your groups" },
  { href: "/command-center", label: "Command Center", detail: "Your design, plans and next steps" },
  { href: "/command-center/design-map", label: "Design Map", detail: "Bring your discoveries together" },
  { href: "/command-center/maps", label: "MAPS", detail: "Make a plan for your next step" },
  { href: "/command-center/expedition", label: "Expedition", detail: "Put your design into practice" },
];

export function ForestIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    camp: <><path d="m3 20 9-15 9 15H3Z"/><path d="m8 20 4-7 4 7M12 5v8"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15 8-2 6-4 2 2-6 4-2ZM12 1v2M12 21v2M1 12h2M21 12h2"/></>,
    trail: <><path d="M12 3v19M4 5h12l4 3-4 3H4V5ZM8 14h12v5H8l-4-2.5L8 14Z"/></>,
    journey: <><path d="M5 21c-3-6 10-3 9-9S7 9 11 3M15 3h5v5M20 3l-6 6"/></>,
    kit: <><path d="M8 7V5a4 4 0 0 1 8 0v2M5 7h14v15H5V7ZM5 12h14M10 12v3h4v-3"/></>,
    fire: <><path d="M12 2c2 5 0 5 4 8 1-2 1-3 1-4 6 7 4 13-5 14-8-1-10-7-5-12 0 3 1 4 2 5 3-3 3-6 3-11ZM5 23l14-3M5 20l14 3"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.compass}</svg>;
}

export function ForestNavigation() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { dialog.current?.close(); setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  function close() { dialog.current?.close(); setOpen(false); opener.current?.focus(); }
  return <>
    <a className="forest-skip" href="#forest-content">Skip to content</a>
    <header className="forest-header">
      <ReviewAwareLink href="/base-camp" className="forest-brand" aria-label="DYDD Base Camp"><ForestIcon name="compass" /><span>DYDD</span></ReviewAwareLink>
      <span className="forest-environment">Sandbox 2</span>
      <ReviewAwareLink href="/base-camp#your-profile" className="forest-profile">Traveler profile</ReviewAwareLink>
      <button ref={opener} className="forest-menu" aria-label="Open camp map" aria-haspopup="dialog" aria-expanded={open} onClick={() => {dialog.current?.showModal(); setOpen(true);}}><ForestIcon name="menu" /><span>Camp map</span></button>
    </header>
    <nav className="forest-dock" aria-label="Camp navigation">
      {destinations.map(item => <ReviewAwareLink key={item.href} href={item.href} aria-current={(pathname === item.href || (item.href === "/base-camp" && pathname === "/hq")) ? "page" : undefined}><ForestIcon name={item.icon}/><span>{item.label}</span></ReviewAwareLink>)}
    </nav>
    <dialog className="forest-map" ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={event => {if(event.target === event.currentTarget) close();}}>
      <div className="forest-map-inner"><div className="forest-map-heading"><h2>Camp map</h2><button className="forest-close" onClick={close} aria-label="Close camp map">×</button></div>
        <nav aria-label="All destinations">{[...destinations.map(item => ({...item,detail:""})), ...moreDestinations].map(item => <ReviewAwareLink href={item.href} key={item.href} onClick={close}><strong>{item.label}</strong>{item.detail ? <span>{item.detail}</span> : null}<b aria-hidden="true">↗</b></ReviewAwareLink>)}</nav>
        <p className="forest-map-note">Separate sandbox accounts and data. No real charges. External report delivery is off.</p>
      </div>
    </dialog>
  </>;
}

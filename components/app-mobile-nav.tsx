"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ReviewAwareLink } from "@/components/review-aware-link";

const mobileNavGroups = [
  { href: "/base-camp", label: "Base Camp", children: [] },
  { href: "/ranger-station", label: "Ranger Station", children: [
    { href: "/trailheads", label: "Trailheads" },
    { href: "/field-kit", label: "Field Kit" },
    { href: "/gear", label: "Gear" },
  ] },
  { href: "/fireside", label: "Fireside", children: [
    { href: "/waypoints", label: "Waypoints" },
    { href: "/live", label: "Live" },
  ] },
  { href: "/camp-circle", label: "Camp Circles", children: [
    { href: "/camp-circle/my-circles", label: "My Circles" },
  ] },
  { href: "/command-center", label: "Command Center", children: [
    { href: "/command-center/design-map", label: "Design Map" },
    { href: "/command-center/expedition", label: "Expedition" },
  ] },
];

export function AppMobileNav() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function close() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px)");
    const dismissOnDesktop = () => { if (desktop.matches) dialogRef.current?.close(); };
    desktop.addEventListener("change", dismissOnDesktop);
    return () => desktop.removeEventListener("change", dismissOnDesktop);
  }, []);

  return (
    <div className="mobile-app-nav">
      <button className="mobile-nav-trigger" type="button" ref={triggerRef}
        aria-label="Open app navigation" aria-haspopup="dialog"
        aria-controls="mobile-navigation" aria-expanded={open}
        onClick={() => { dialogRef.current?.showModal(); setOpen(true); }}>
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
        <strong>Menu</strong>
      </button>
      <dialog className="mobile-nav-drawer" id="mobile-navigation" ref={dialogRef}
        aria-labelledby="mobile-navigation-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, a[href]");
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first?.focus();
          }
        }}
        onClose={() => { setOpen(false); triggerRef.current?.focus(); }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
        }}>
        <header className="mobile-nav-heading">
          <div><span>Discover Your Divine Design</span><h2 id="mobile-navigation-title">Explore the journey</h2></div>
          <button className="mobile-nav-close" type="button" autoFocus onClick={close} aria-label="Close app navigation">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>
        <nav aria-label="Mobile app navigation" onClick={(event) => {
          // Selection must dismiss even when Next.js stays on the current route.
          if ((event.target as Element).closest("a[href]")) close();
        }}>
          {mobileNavGroups.filter(group => process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox" || group.href !== "/command-center").map((group) => (
            <div className="mobile-nav-group" key={group.href}>
              <ReviewAwareLink href={group.href} aria-current={pathname === group.href ? "page" : undefined}>{group.label}</ReviewAwareLink>
              {group.children.length > 0 && <div className="mobile-nav-children">
                {group.children.map((item) => <ReviewAwareLink href={item.href} key={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</ReviewAwareLink>)}
              </div>}
            </div>
          ))}
        </nav>
      </dialog>
    </div>
  );
}

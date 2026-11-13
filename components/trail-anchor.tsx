"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const trailIds = new Set(["designid", "spiritual-gifts", "fruitlife-360", "designpd", "collection-designid", "collection-spiritual-gifts", "collection-fruitlife-360", "collection-designpd", "results-journey", "results-designid", "results-spiritual-gifts", "results-fruitlife-360", "results-designpd"]);

/** Keep an incoming trail link on its named block after hydration/font reflow.
 * Stop correcting as soon as the learner intentionally scrolls or interacts. */
export function TrailAnchor() {
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false;
    let frame = 0;
    let navigationTimers: number[] = [];
    const align = () => {
      if (stopped) return;
      const id = window.location.hash.slice(1);
      if (!trailIds.has(id)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (stopped) return;
        let target = document.getElementById(id);
        if (target && id.startsWith("results-")) {
          // Mobile report bodies are collapsed by default. Open only the named
          // collection, then align its visible reports, never an unrelated trail.
          target.querySelectorAll<HTMLDetailsElement>("details.fieldkit-mobile-details").forEach((details) => {
            if (getComputedStyle(details).display !== "none") details.open = true;
          });
          target = Array.from(target.querySelectorAll<HTMLElement>("[data-fieldkit-results]"))
            .find((section) => section.getClientRects().length > 0) ?? target;
          const header = document.querySelector<HTMLElement>(".mobile-app-nav");
          const headerBottom = header && ["sticky", "fixed"].includes(getComputedStyle(header).position)
            ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
          target.style.scrollMarginTop = `${Math.max(100, headerBottom + 16)}px`;
        }
        if (target && Math.abs(target.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)) > 2)
          target.scrollIntoView({ block: "start", behavior: "instant" });
      });
    };
    const stop = () => { stopped = true; cancelAnimationFrame(frame); };
    const hash = () => {
      stopped = false;
      navigationTimers.forEach(clearTimeout);
      align();
      // Next may finish its own fragment scroll after the click task. Settle
      // each new navigation too, not only the first three seconds after mount.
      navigationTimers = [50, 150, 350, 750, 1500].map((delay) => window.setTimeout(align, delay));
    };
    // Next Link uses history.pushState for same-page hashes (no hashchange).
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.getAttribute("href")!, window.location.href);
      if (destination.pathname !== window.location.pathname || !trailIds.has(destination.hash.slice(1))) return;
      window.setTimeout(hash, 0);
    };
    const observer = new ResizeObserver(align);
    const root = document.querySelector(".trailhead-renewal, .fieldkit-renewal, .fruitlife-release-shell");
    if (root) observer.observe(root);
    align();
    void document.fonts.ready.then(align);
    document.addEventListener("click", click, true);
    window.addEventListener("hashchange", hash);
    window.addEventListener("popstate", hash);
    window.addEventListener("pageshow", align);
    // Browser history may restore an old pixel offset after the first effect.
    // Settle only the incoming named anchor, bounded to the initial load window.
    const settling = window.setInterval(align, 100);
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.addEventListener(event, stop, { passive: true });
    const timeout = window.setTimeout(() => { observer.disconnect(); clearInterval(settling); }, 3000);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      navigationTimers.forEach(clearTimeout);
      clearTimeout(timeout);
      clearInterval(settling);
      observer.disconnect();
      document.removeEventListener("click", click, true);
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("popstate", hash);
      window.removeEventListener("pageshow", align);
      for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.removeEventListener(event, stop);
    };
  }, [pathname]);
  return null;
}

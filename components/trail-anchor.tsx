"use client";

import { useEffect } from "react";

const trailIds = new Set(["designid", "spiritual-gifts", "fruitlife-360", "designpd"]);

/** Keep an incoming trail link on its named block after hydration/font reflow.
 * Stop correcting as soon as the learner intentionally scrolls or interacts. */
export function TrailAnchor() {
  useEffect(() => {
    let stopped = false;
    let frame = 0;
    const align = () => {
      if (stopped) return;
      const id = window.location.hash.slice(1);
      if (!trailIds.has(id)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (stopped) return;
        const target = document.getElementById(id);
        if (target && Math.abs(target.getBoundingClientRect().top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)) > 2)
          target.scrollIntoView({ block: "start", behavior: "instant" });
      });
    };
    const stop = () => { stopped = true; cancelAnimationFrame(frame); };
    const hash = () => { stopped = false; align(); };
    const observer = new ResizeObserver(align);
    const root = document.querySelector(".trailhead-renewal");
    if (root) observer.observe(root);
    align();
    void document.fonts.ready.then(align);
    window.addEventListener("hashchange", hash);
    window.addEventListener("pageshow", align);
    // Browser history may restore an old pixel offset after the first effect.
    // Settle only the incoming named anchor, bounded to the initial load window.
    const settling = window.setInterval(align, 100);
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.addEventListener(event, stop, { passive: true });
    const timeout = window.setTimeout(() => { observer.disconnect(); clearInterval(settling); }, 3000);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      clearInterval(settling);
      observer.disconnect();
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("pageshow", align);
      for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) window.removeEventListener(event, stop);
    };
  }, []);
  return null;
}

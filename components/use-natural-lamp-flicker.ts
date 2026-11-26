"use client";

import { useEffect, type RefObject } from "react";

/** Independent bounded intensity wander, not a repeating pulse or moving flame.
 * Each completed interval chooses a fresh duration/target; reduced motion cancels
 * every owned animation and restores the static source-backed lighting. */
export function useNaturalLampFlicker(root: RefObject<HTMLElement | null>, scene: string) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const active = new Set<Animation>();
    let stopped = false;
    const clear = () => { for (const animation of active) { animation.onfinish = null; animation.cancel(); } active.clear(); };
    const start = () => {
      clear();
      if (media.matches || stopped) return;
      const lamps = host.querySelectorAll<HTMLElement>("[data-candlelight], [data-room-lamp]");
      const glass = host.querySelectorAll<HTMLElement>("[data-lamp-emission] img, [data-room-emission] img");
      const wander = (element: HTMLElement, emission: boolean, previous: number) => {
        if (stopped || media.matches || !element.isConnected) return;
        const next = emission ? .97 + Math.random() * .06 : .61 + Math.random() * .08;
        const value = (n: number) => emission ? { filter: `brightness(${n})` } : { opacity: n };
        const animation = element.animate([value(previous), value(next)], {
          duration: 1400 + Math.random() * 2600, easing: "ease-in-out", fill: "forwards",
        });
        active.add(animation);
        animation.onfinish = () => {
          active.delete(animation);
          // Install the next continuous segment before removing the old effect.
          wander(element, emission, next);
          animation.cancel();
        };
      };
      lamps.forEach(element => wander(element, false, .65));
      glass.forEach(element => wander(element, true, 1));
    };
    start(); media.addEventListener("change", start);
    return () => { stopped = true; media.removeEventListener("change", start); clear(); };
  }, [root, scene]);
}

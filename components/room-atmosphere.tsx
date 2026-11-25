"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./room-atmosphere.module.css";

type Scene = "ranger" | "archive";
const bulbs: Record<Scene, readonly (readonly [number, number])[]> = {
  ranger: [[49.8,16.1],[21.5,30.5],[37.2,25.5],[61.5,25.5],[89.8,50.5],[11.3,13.5]],
  archive: [[64,14.5],[55,23.8],[49.2,33.2],[63.8,33.2],[81.2,18],[41,45]],
};

/** Original 1672 × 941 art; decorations share its measured cover crop, never viewport coordinates. */
export function RoomAtmosphere({ scene, className, background = false }: {
  scene: Scene; className: string; background?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = frame.current, overlay = plane.current;
    if (!host || !overlay) return;
    const measure = () => {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height) return;
      const computed = getComputedStyle(host);
      const position = (background ? computed.backgroundPosition : computed.objectPosition).split(/\s+/);
      const fraction = (value: string | undefined) => value === "left" || value === "top" ? 0 : value === "right" || value === "bottom" ? 1 : value?.endsWith("%") ? parseFloat(value) / 100 : .5;
      const scale = Math.max(width / 1672, height / 941);
      const imageWidth = 1672 * scale, imageHeight = 941 * scale;
      Object.assign(overlay.style, {
        width: `${imageWidth}px`, height: `${imageHeight}px`,
        left: `${(width - imageWidth) * fraction(position[0])}px`,
        top: `${(height - imageHeight) * fraction(position[1])}px`, visibility: "visible",
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    // A media query can change crop position without changing the measured box.
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [scene, background]);

  return <div ref={frame} className={`${className} ${styles.frame}`} aria-hidden="true">
    {!background && <img className={styles.art} src={`/brand/environments/${scene}.webp`} alt="" fetchPriority="high" />}
    <div ref={plane} className={styles.plane} data-scene={scene}>
      <div className={styles.daylight} data-room-daylight />
      <div className={styles.emission} data-room-emission>{bulbs[scene].map(([x,y],index)=><img key={index} src={`/brand/lighting/${scene}-${index+1}.webp`} alt="" style={{left:`${x}%`,top:`${y}%`,width:`${2*(scene==="ranger"&&index===5?1.6:scene==="archive"&&index===5?.8:index===0?.8:.5)}%`,height:`${2*(scene==="ranger"&&index===5?.32:scene==="archive"&&index===5?.3:index===0?1.8:1.1)}%`,animationDelay:`${-index*.39}s`}}/>)}</div>
      {bulbs[scene].map(([x,y], index) => <i key={index} className={styles.lamp} data-room-lamp={`${scene}-${index+1}`} data-light-kind={scene==="ranger"&&index===5?"wall-bar":"lantern"} style={{ left: `${x}%`, top: `${y}%`, "--phase": `${-index * 1.73}s`, "--duration": `${3.7 + index * .43}s` } as CSSProperties}><b /></i>)}
    </div>
  </div>;
}

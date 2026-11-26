import type { CSSProperties } from "react";
import styles from "./base-camp-nature.module.css";

// Pixel registrations against the unchanged 1672 × 941 Base Camp source.
const foliage = [
  { name: "camp-leaf-center", box: [994, 451, 94, 81], delay: "-2.6s" },
  { name: "camp-vine", box: [685, 88, 41, 159], delay: "-1.8s" },
  { name: "camp-leaf", box: [1355, 527, 204, 88], delay: "-.7s" },
  { name: "camp-leaf-low", box: [1456, 735, 175, 112], delay: "-3.4s" },
] as const;
const position = ([x, y, w, h]: readonly number[]): CSSProperties => ({
  left: `${x / 1672 * 100}%`, top: `${y / 941 * 100}%`,
  width: `${w / 1672 * 100}%`, height: `${h / 941 * 100}%`,
});

/** Decorative local source pixels only; never animates the foundation or lights. */
export function BaseCampNature() {
  return <div className={styles.nature} aria-hidden="true" data-base-camp-nature>
    <div className={styles.fall} style={position([865, 201, 45, 76])} data-source-waterfall>
      <img className={styles.water} src="/brand/nature/camp-fall.png" alt="" draggable={false} />
    </div>
    {foliage.map(({ name, box, delay }) => <img key={name}
      className={`${styles.foliage} ${name === "camp-vine" ? styles.vine : styles.leaf}`}
      src={`/brand/nature/${name}.png`} alt="" draggable={false}
      data-source-foliage={name} style={{ ...position(box), animationDelay: delay }} />)}
  </div>;
}

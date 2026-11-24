"use client";

import { useId } from "react";
import styles from "./dydi-character.module.css";

export interface DydiCharacterProps {
  walking?: boolean;
  talking?: boolean;
  pointing?: boolean;
  reducedMotion?: boolean;
  className?: string;
}

/** Source-image 2.5D puppet. Position/travel belongs to the containing scene.
 * The book and pocket hide the hands, so pointing is a restrained arm-led cue.
 */
export function DydiCharacter({ walking = false, talking = false, pointing = false, reducedMotion = false, className }: DydiCharacterProps) {
  const titleId = useId();
  const part = (name: string) => <image href={`/brand/adventure/dydi-${name}.webp`} width="800" height="1200" />;
  return (
    <span className={[styles.character, className].filter(Boolean).join(" ")} data-walking={walking} data-talking={talking} data-pointing={pointing} data-reduced-motion={reducedMotion}>
      <svg className={styles.rig} viewBox="160 0 480 1200" role="img" aria-labelledby={titleId} focusable="false">
        <title id={titleId}>Dydi, your adventure guide</title>
        <ellipse className={styles.shadow} cx="405" cy="1160" rx="153" ry="15" />
        <g className={styles.body}>
          <g className={styles.rightThigh}>
            {part("right-thigh")}
            <g className={styles.rightShin}>
              {part("right-shin")}
              <g className={styles.rightBoot}>{part("right-boot")}</g>
            </g>
          </g>
          <g className={styles.leftThigh}>
            {part("left-thigh")}
            <g className={styles.leftShin}>
              {part("left-shin")}
              <g className={styles.leftBoot}>{part("left-boot")}</g>
            </g>
          </g>
          <g className={styles.torso}>
            <g className={styles.arm}>
              {part("upper-arm")}
              <g className={styles.forearm}>{part("forearm")}</g>
            </g>
            {part("torso")}
            <g className={styles.bookArm}>{part("book-arm")}</g>
            <g className={styles.head}>
              {part("head")}
              <g className={styles.mouth}>{part("mouth")}</g>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}

export default DydiCharacter;

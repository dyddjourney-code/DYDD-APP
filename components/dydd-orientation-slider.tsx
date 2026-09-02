"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

const orientationSlides = [
  {
    accent: "discover",
    kicker: "What is DYDD?",
    title: "Discover Your Divine Design",
    body:
      "A guided journey that helps you notice how God has intentionally shaped your identity, gifts, story, desire, and purpose.",
    blocks: [
      ["Discover", "Uncover patterns and design"],
      ["Your", "Own it personally"],
      ["Divine", "Recognize God's hand in it"],
      ["Design", "Live from where you were made"],
    ],
  },
  {
    accent: "purpose",
    kicker: "The point",
    title: "On Purpose - For Purpose",
    body:
      "You are God's workmanship, created in Christ Jesus for good works prepared ahead of time. The journey helps that become clear and lived.",
    scripture:
      "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.",
    scriptureReference: "Ephesians 2:10",
    blocks: [
      ["On Purpose", "You are a masterpiece, designed for grace."],
      ["For Purpose", "You are designed to participate and engage."],
    ],
  },
  {
    accent: "design",
    kicker: "The DESIGN framework",
    title: "A path for the whole person",
    body:
      "DYDD walks through the pieces that help calling become visible: Identity, Expertise, Story, Desire, Gifts, and Niche.",
    image: "/brand/design/design-tree-storybook.png",
    blocks: [
      ["Identity", "Intentionally crafted"],
      ["Expertise", "Equipped with skills"],
      ["Story", "Given a redeemed story"],
      ["Desire", "Stirred with holy motivations"],
      ["Gifts", "Empowered by gifts"],
      ["Niche", "Called to live out your purpose"],
    ],
  },
];

export function DyddOrientationSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = orientationSlides[activeIndex];
  const previousIndex = (activeIndex + orientationSlides.length - 1) % orientationSlides.length;
  const nextIndex = (activeIndex + 1) % orientationSlides.length;

  return (
    <section className="dydd-orientation-slider" aria-label="Discover Your Divine Design orientation">
      <article
        aria-live="polite"
        className={`dydd-slider-panel dydd-slide-${activeSlide.accent}`}
        id={`dydd-slide-${activeIndex}`}
      >
        <p className="section-label">{activeSlide.kicker}</p>
        <div className={activeSlide.image ? "dydd-slider-split" : ""}>
          <div className="dydd-slider-copy">
            <h2>{activeSlide.title}</h2>
            <p>{activeSlide.body}</p>
          </div>
          {activeSlide.image ? (
            <figure className="dydd-slider-image">
              <img src={activeSlide.image} alt="DESIGN framework carved into a tree" />
            </figure>
          ) : null}
        </div>
        <div className={`dydd-slider-blocks count-${activeSlide.blocks.length}`}>
          {activeSlide.blocks.map(([title, text], index) => (
            <section key={title} style={{ "--block-index": index } as CSSProperties}>
              <strong>{title}</strong>
              <span>{text}</span>
            </section>
          ))}
        </div>
        {activeSlide.scripture ? (
          <blockquote className="dydd-slider-scripture">
            <p>{activeSlide.scripture}</p>
            <cite>{activeSlide.scriptureReference}</cite>
          </blockquote>
        ) : null}
        <div className="dydd-slider-controls" aria-label="Orientation slider controls">
          <button
            aria-label={`Previous: ${orientationSlides[previousIndex].kicker}`}
            type="button"
            onClick={() => setActiveIndex(previousIndex)}
          >
            <span aria-hidden="true" />
          </button>
          <div className="dydd-slider-progress" aria-hidden="true">
            {orientationSlides.map((slide, index) => (
              <span className={activeIndex === index ? "is-active" : ""} key={slide.kicker} />
            ))}
          </div>
          <button
            aria-label={`Next: ${orientationSlides[nextIndex].kicker}`}
            className="next"
            type="button"
            onClick={() => setActiveIndex(nextIndex)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </article>
    </section>
  );
}

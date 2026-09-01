"use client";

import { useState } from "react";

const orientationSlides = [
  {
    kicker: "What is DYD?",
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
    kicker: "The point",
    title: "On Purpose, For Purpose",
    body:
      "You are God's workmanship, created in Christ Jesus for good works prepared ahead of time. The journey helps that become clear and lived.",
    blocks: [
      ["On Purpose", "You are a masterpiece, designed for grace."],
      ["For Purpose", "You are designed to participate and engage."],
    ],
  },
  {
    kicker: "The DESIGN framework",
    title: "A path for the whole person",
    body:
      "DYDD walks through the pieces that help calling become visible: Identity, Expertise, Story, Desire, Gifts, and Niche.",
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

  return (
    <section className="dydd-orientation-slider" aria-label="Discover Your Divine Design orientation">
      <div className="dydd-slider-tabs" role="tablist" aria-label="Orientation topics">
        {orientationSlides.map((slide, index) => (
          <button
            aria-controls={`dydd-slide-${index}`}
            aria-selected={activeIndex === index}
            className={activeIndex === index ? "is-active" : ""}
            id={`dydd-tab-${index}`}
            key={slide.kicker}
            role="tab"
            type="button"
            onClick={() => setActiveIndex(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {slide.kicker}
          </button>
        ))}
      </div>

      <article
        aria-labelledby={`dydd-tab-${activeIndex}`}
        className="dydd-slider-panel"
        id={`dydd-slide-${activeIndex}`}
        role="tabpanel"
      >
        <p className="section-label">{activeSlide.kicker}</p>
        <h2>{activeSlide.title}</h2>
        <p>{activeSlide.body}</p>
        <div className={`dydd-slider-blocks count-${activeSlide.blocks.length}`}>
          {activeSlide.blocks.map(([title, text]) => (
            <section key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

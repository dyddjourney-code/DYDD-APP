"use client";

import { useMemo, useState } from "react";

export type PassportBadgeState = "earned" | "next" | "ahead";

export type PassportBadge = {
  connectedTo: string;
  earnBy: string;
  image: string;
  state: PassportBadgeState;
  summary: string;
  title: string;
};

const badgeStatusLabel: Record<PassportBadgeState, string> = {
  ahead: "Ahead",
  earned: "Earned",
  next: "Next",
};

export const defaultPassportBadges: PassportBadge[] = [
  {
    connectedTo: "DesignID assessment and report",
    earnBy: "Complete DesignID and open the report artifact.",
    image: "/brand/badges/designid-badge.png",
    state: "ahead",
    summary: "Names your primary reflection pattern and the way your design tends to serve.",
    title: "DesignID",
  },
  {
    connectedTo: "Spiritual Gifts assessment",
    earnBy: "Complete the Spiritual Gifts assessment.",
    image: "/brand/badges/spiritual-gifts-badge.png",
    state: "ahead",
    summary: "Connects grace-given gifts to humble service and maturity.",
    title: "Spiritual Gifts",
  },
  {
    connectedTo: "FruitLife 360 assessment",
    earnBy: "Complete the FruitLife 360 process or receive a completed report.",
    image: "/brand/badges/fruitlife-360-badge.png",
    state: "ahead",
    summary: "Shows visible fruit and growth themes through self and observer feedback.",
    title: "FruitLife 360",
  },
  {
    connectedTo: "Design Pathways trail",
    earnBy: "Begin the Design Pathways discernment experience.",
    image: "/brand/badges/design-pathways-badge.png",
    state: "ahead",
    summary: "Helps you discern current direction, experiments, and possible next paths.",
    title: "Design Pathways",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Identity section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/identity-badge.svg",
    state: "next",
    summary: "Marks the beginning of seeing who you are before what you do.",
    title: "Identity",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Expertise section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/expertise-badge.svg",
    state: "ahead",
    summary: "Recognizes skills, capacity, learning, and practiced contribution.",
    title: "Expertise",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Story section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/story-badge.svg",
    state: "ahead",
    summary: "Helps name formation, redemption, wounds, testimony, and wisdom.",
    title: "Story",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Desire section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/desire-badge.svg",
    state: "ahead",
    summary: "Names holy motivation, longing, burden, and the pull toward purpose.",
    title: "Desire",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Gifts section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/gifts-badge.svg",
    state: "ahead",
    summary: "Connects gifts to love, service, maturity, and the body of Christ.",
    title: "Gifts",
  },
  {
    connectedTo: "The main DYDD Journey",
    earnBy: "Complete the Niche section of the Discover Your Divine Design Journey.",
    image: "/brand/badges/niche-badge.svg",
    state: "ahead",
    summary: "Brings identity, design, story, desire, and gifts into a clearer purpose lane.",
    title: "Niche",
  },
  {
    connectedTo: "DesignPD assessment and report",
    earnBy: "Complete DesignID first, then complete the DesignPD assessment.",
    image: "/brand/badges/designpd-badge.png",
    state: "ahead",
    summary: "Applies design through the way you plan, decide, and do.",
    title: "DesignPD",
  },
];

export function DydPassportBook({
  badges = defaultPassportBadges,
  firstName = "Traveler",
}: {
  badges?: PassportBadge[];
  firstName?: string;
}) {
  const [selectedTitle, setSelectedTitle] = useState(
    badges.find((badge) => badge.state === "next")?.title ?? badges[0]?.title ?? "",
  );
  const selectedBadge = useMemo(
    () => badges.find((badge) => badge.title === selectedTitle) ?? badges[0],
    [badges, selectedTitle],
  );
  const earnedCount = badges.filter((badge) => badge.state === "earned").length;
  const nextBadge = badges.find((badge) => badge.state === "next") ?? badges.find((badge) => badge.state !== "earned");

  return (
    <section className="passport-book" id="passport" aria-label="DYD Passport Book">
      <div className="passport-book-cover">
        <div>
          <p className="section-label">DYD Passport Book</p>
          <h2>{firstName}&apos;s trail record.</h2>
          <p>
            Badges collect here as milestones are earned. Each marker shows what it means,
            how it is earned, and which part of the journey it belongs to.
          </p>
        </div>
        <aside className="passport-next-badge" aria-label="Next badge">
          <span>Next marker</span>
          <strong>{nextBadge?.title ?? "Choose a trail"}</strong>
          <small>{nextBadge?.earnBy ?? "Open Ranger Station to choose a starting point."}</small>
        </aside>
      </div>

      <div className="passport-layout">
        <div className="passport-earned-page">
          <div className="passport-count-stamp">
            <span>{earnedCount}</span>
            <small>Earned</small>
          </div>
          <p>
            Earned badges stay visible first. Future app logic can add dates, trail notes,
            certificates, journal prompts, and unlocked next steps.
          </p>
        </div>

        <div className="passport-badge-grid" aria-label="Possible and earned badges">
          {badges.map((badge) => (
            <button
              className={`passport-badge-button ${badge.state} ${selectedBadge?.title === badge.title ? "selected" : ""}`}
              key={badge.title}
              onClick={() => setSelectedTitle(badge.title)}
              onMouseEnter={() => setSelectedTitle(badge.title)}
              type="button"
            >
              <img src={badge.image} alt={`${badge.title} badge`} />
              <span>{badgeStatusLabel[badge.state]}</span>
              <strong>{badge.title}</strong>
            </button>
          ))}
        </div>

        {selectedBadge ? (
          <article className="passport-badge-popover" aria-live="polite">
            <img src={selectedBadge.image} alt={`${selectedBadge.title} badge detail`} />
            <div>
              <span>{badgeStatusLabel[selectedBadge.state]}</span>
              <h3>{selectedBadge.title}</h3>
              <p>{selectedBadge.summary}</p>
              <dl>
                <div>
                  <dt>Earn it by</dt>
                  <dd>{selectedBadge.earnBy}</dd>
                </div>
                <div>
                  <dt>Connected to</dt>
                  <dd>{selectedBadge.connectedTo}</dd>
                </div>
              </dl>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}

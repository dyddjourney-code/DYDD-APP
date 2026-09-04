"use client";

import { useMemo, useState } from "react";
import { defaultPassportBadges, type PassportBadge, type PassportBadgeState } from "@/lib/passport-badges";

const badgeStatusLabel: Record<PassportBadgeState, string> = {
  ahead: "Ahead",
  earned: "Earned",
  next: "Next",
};

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
    <section className="passport-book" id="passport" aria-label="DYDD Passport Book">
      <div className="passport-book-cover">
        <div>
          <p className="section-label">DYDD Passport Book</p>
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

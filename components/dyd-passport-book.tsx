"use client";

import { useMemo, useState } from "react";
import { buildPassportBadges, type PassportBadge, type PassportBadgeState } from "@/lib/passport-badges";

const badgeStatusLabel: Record<PassportBadgeState, string> = {
  ahead: "Ahead",
  locked: "Locked",
  earned: "Earned",
  next: "Next",
};

export function DydPassportBook({
  badges = buildPassportBadges({ completedAssessments: [] }),
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
  const nextBadge = badges.find((badge) => badge.state === "next") ?? badges.find((badge) => badge.state === "ahead");
  const journeyBadges = badges.filter((badge) => badge.group !== "extension");
  const reflectionNames = ["Architect", "Artisan", "Shepherd", "Steward"];
  const shortTrails = [
    { title: "Spiritual Gifts", titles: ["Spiritual Gifts Assessment", "Spiritual Gifts Course"] },
    { title: "FruitLife360", titles: ["FruitLife360", "FruitLife360 Course"] },
    { title: "DesignID", titles: ["DesignID", ...reflectionNames, "DesignID Course"] },
  ];
  const badgesFor = (titles: string[]) => titles.flatMap((title) => badges.filter((badge) => badge.title === title));
  const deeperBadges = badgesFor(["DesignPD", "DesignPD Course"]);
  const primaryDesignBadge = journeyBadges.find((badge) =>
    ["Architect", "Artisan", "Shepherd", "Steward"].includes(badge.title) && badge.state === "earned",
  );
  const renderBadgeButton = (badge: PassportBadge) => (
    <button
      className={`passport-badge-button ${badge.state} ${selectedBadge?.title === badge.title ? "selected" : ""}`}
      key={badge.title}
      onClick={() => setSelectedTitle(badge.title)}
      onMouseEnter={() => setSelectedTitle(badge.title)}
      onFocus={() => setSelectedTitle(badge.title)}
      aria-pressed={selectedBadge?.title === badge.title}
      type="button"
    >
      <img src={badge.image} alt={`${badge.title} badge`} />
      {badge.kind === "course" ? <small className="passport-course-ribbon">Course</small> : null}
      <span>{badgeStatusLabel[badge.state]}</span>
      <strong>{badge.title}</strong>
    </button>
  );

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
            Your earned badges mark the steps you have taken. Select any badge to see
            what it means and how to earn it.
          </p>
        </div>

        <div className="passport-badge-stack" aria-label="Possible and earned badges">
          <section aria-label="Main trail badges" className="passport-badge-group">
            <p className="section-label">Main trail</p>
            <h3>Discover Your Divine Design Journey Badges</h3>
            <div className="passport-badge-grid journey">
              {journeyBadges.map((badge) => {
                if (badge === primaryDesignBadge) return null;
                if (badge.title === "DesignID" && primaryDesignBadge) {
                  return (
                    <div className="passport-designid-markers" key={badge.title} aria-label="DesignID and your primary design">
                      {renderBadgeButton(badge)}
                      {renderBadgeButton(primaryDesignBadge)}
                    </div>
                  );
                }
                return renderBadgeButton(badge);
              })}
            </div>
          </section>
          <section aria-label="Short trail badges" className="passport-badge-group passport-trail-section">
            <p className="section-label">Short trails</p>
            <p className="passport-trail-note">Start here or along the main trail. The same milestone is earned everywhere it appears.</p>
            <div className="passport-short-trails-row">
              {shortTrails.map((trail) => (
                <section className="passport-short-trail" aria-label={`${trail.title} trail badges`} key={trail.title}>
                  <h3>{trail.title}</h3>
                  <div className="passport-badge-grid">{badgesFor(trail.titles).map(renderBadgeButton)}</div>
                </section>
              ))}
            </div>
          </section>
          <section aria-label="Dig deeper trail badges" className="passport-badge-group passport-trail-section passport-deeper-trail">
            <p className="section-label">Dig deeper trails</p>
            <h3>DesignPD</h3>
            <p className="passport-trail-note">Complete DesignID first. DesignPD is an optional expansion with its own assessment and course.</p>
            <div className="passport-badge-grid">{deeperBadges.map(renderBadgeButton)}</div>
          </section>
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
                  <dd>{selectedBadge.state === "locked" ? "Complete DesignID first, then unlock the DesignPD expansion." : selectedBadge.earnBy}</dd>
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

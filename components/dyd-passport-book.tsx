"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildPassportBadges, type PassportBadge, type PassportBadgeState } from "@/lib/passport-badges";

const badgeStatusLabel: Record<PassportBadgeState, string> = {
  ahead: "Ahead",
  locked: "Locked",
  earned: "Earned",
  next: "Next",
};

export function DydPassportBook({
  badges = buildPassportBadges({ completedAssessments: [] }),
  firstName: _firstName = "Traveler",
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
  const detailId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [mobile, setMobile] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 980px)");
    const update = () => {
      setMobile(query.matches);
      if (!query.matches) setDetailOpen(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [detailOpen]);

  const renderDetailCopy = (badge: PassportBadge) => (
    <>
      <p>{badge.summary}</p>
      <dl>
        <div><dt>Earn it by</dt><dd>{badge.earnBy}</dd></div>
        <div><dt>Connected to</dt><dd>{badge.connectedTo}</dd></div>
      </dl>
    </>
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
      onClick={(event) => {
        setSelectedTitle(badge.title);
        if (window.matchMedia("(max-width: 980px)").matches) {
          triggerRef.current = event.currentTarget;
          setDetailOpen(true);
        }
      }}
      aria-haspopup={mobile ? "dialog" : undefined}
      aria-controls={mobile ? detailId : undefined}
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
          <h2>DYDD Passport Book</h2>
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
          <p className="passport-mobile-hint">Tap any badge for its meaning and how to earn it.</p>
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
            <h3>DesignPD · $15</h3>
            <p className="passport-trail-note">Optional paid Dig Deeper trail. Complete DesignID first, then unlock a DesignPD report derived from your saved DesignID result and explore its course. No separate assessment.</p>
            <div className="passport-badge-grid">{deeperBadges.map(renderBadgeButton)}</div>
          </section>
        </div>

        {selectedBadge ? (
          <article className="passport-badge-popover" aria-live="polite">
            <img src={selectedBadge.image} alt={`${selectedBadge.title} badge detail`} />
            <div>
              <span>{badgeStatusLabel[selectedBadge.state]}</span>
              <h3>{selectedBadge.title}</h3>
              {renderDetailCopy(selectedBadge)}
            </div>
          </article>
        ) : null}
      </div>
      {selectedBadge ? (
        <dialog
          ref={dialogRef}
          id={detailId}
          className="passport-detail-sheet"
          aria-labelledby={`${detailId}-title`}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex="0"]'));
            const first = stops[0], last = stops[stops.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
          onCancel={(event) => { event.preventDefault(); setDetailOpen(false); }}
          onClick={(event) => { if (event.target === event.currentTarget) setDetailOpen(false); }}
        >
          <header className="passport-sheet-header">
            <div>
              <span>{badgeStatusLabel[selectedBadge.state]} · Badge details</span>
              <h3 id={`${detailId}-title`}>{selectedBadge.title}</h3>
            </div>
            <button type="button" autoFocus onClick={() => setDetailOpen(false)} aria-label="Close badge details">Close</button>
          </header>
          <div className="passport-sheet-body" tabIndex={0} role="region" aria-label="Badge meaning and requirements" key={selectedBadge.title}>
            <img src={selectedBadge.image} alt="" />
            <h4>Overview</h4>
            {renderDetailCopy(selectedBadge)}
          </div>
        </dialog>
      ) : null}
    </section>
  );
}

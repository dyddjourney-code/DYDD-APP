"use client";

import { useMemo, useState } from "react";

type Waypoint = {
  id: string;
  title: string;
  date: string;
  category: string;
  scripture: string;
  tags: string[];
  excerpt: string;
  body: string[];
  reflection: string;
};

type WaypointExplorerProps = {
  categories: string[];
  currentId: string;
  previousId: string;
  waypoints: Waypoint[];
};

export function WaypointExplorer({
  categories,
  currentId,
  previousId,
  waypoints,
}: WaypointExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(currentId);
  const [shareState, setShareState] = useState("Share");

  const selectedWaypoint =
    waypoints.find((waypoint) => waypoint.id === selectedId) ?? waypoints[0];
  const previousWaypoint =
    waypoints.find((waypoint) => waypoint.id === previousId) ?? waypoints[1];

  const visibleWaypoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return waypoints.filter((waypoint) => {
      const matchesCategory =
        category === "All" || waypoint.category === category;
      const searchable = [
        waypoint.title,
        waypoint.date,
        waypoint.category,
        waypoint.scripture,
        waypoint.excerpt,
        ...waypoint.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchable.includes(normalizedQuery);
    });
  }, [category, query, waypoints]);

  const similarWaypoints = useMemo(() => {
    const selectedTags = new Set([
      selectedWaypoint.category,
      ...selectedWaypoint.tags,
    ]);

    return waypoints
      .filter((waypoint) => waypoint.id !== selectedWaypoint.id)
      .filter((waypoint) =>
        [waypoint.category, ...waypoint.tags].some((tag) =>
          selectedTags.has(tag),
        ),
      );
  }, [selectedWaypoint, waypoints]);

  function categoryClass(categoryName: string) {
    return `waypoint-category-chip waypoint-category-${categoryName
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}`;
  }

  function selectWaypoint(id: string) {
    setSelectedId(id);
    setShareState("Share");
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/fireside#waypoints`;
    const shareText = `${selectedWaypoint.title} - ${selectedWaypoint.scripture}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedWaypoint.title,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `${selectedWaypoint.title}\n${shareText}\n${shareUrl}`,
        );
        setShareState("Link copied");
        window.setTimeout(() => setShareState("Share"), 1800);
      }
    } catch {
      setShareState("Share");
    }
  }

  return (
    <>
      <article className="waypoint-display-card">
        <div className="waypoint-card-topline">
          <span>
            {selectedWaypoint.id === currentId
              ? "Current Waypoint"
              : "Selected Waypoint"}
          </span>
          <span>{selectedWaypoint.date}</span>
        </div>

        <div className="waypoint-display-heading">
          <div>
            <p className={categoryClass(selectedWaypoint.category)}>
              {selectedWaypoint.category}
            </p>
            <h2>{selectedWaypoint.title}</h2>
            <p className="waypoint-scripture">{selectedWaypoint.scripture}</p>
          </div>
          <button
            className="button secondary waypoint-share-button"
            onClick={handleShare}
            type="button"
          >
            {shareState}
          </button>
        </div>

        <div className="waypoint-body">
          {selectedWaypoint.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="waypoint-reflection-box">
          <strong>For your design:</strong>
          <span>{selectedWaypoint.reflection}</span>
        </div>

        <div className="waypoint-tag-row">
          {selectedWaypoint.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </article>

      <div className="waypoint-quick-actions" aria-label="Waypoint shortcuts">
        <button
          className={
            selectedWaypoint.id === currentId
              ? "waypoint-current-button is-active"
              : "waypoint-current-button"
          }
          onClick={() => selectWaypoint(currentId)}
          type="button"
        >
          <span>Current week</span>
          <strong>
            {waypoints.find((waypoint) => waypoint.id === currentId)?.title}
          </strong>
        </button>
        {previousWaypoint ? (
          <button
            className={
              selectedWaypoint.id === previousWaypoint.id
                ? "waypoint-last-week-card is-active"
                : "waypoint-last-week-card"
            }
            onClick={() => selectWaypoint(previousWaypoint.id)}
            type="button"
          >
            <span>See last week</span>
            <strong>{previousWaypoint.title}</strong>
            <small>
              {previousWaypoint.scripture} · {previousWaypoint.date}
            </small>
          </button>
        ) : null}
      </div>

      {similarWaypoints.length > 0 ? (
        <aside className="waypoint-similar-strip" aria-label="Similar topics">
          <div className="waypoint-similar-heading">
            <p className="section-label">Similar Topics</p>
            <span>{similarWaypoints.length} related</span>
          </div>
          <div>
            {similarWaypoints.map((waypoint) => (
              <button
                key={waypoint.id}
                onClick={() => selectWaypoint(waypoint.id)}
                type="button"
              >
                <span className={categoryClass(waypoint.category)}>
                  {waypoint.category}
                </span>
                <strong>{waypoint.title}</strong>
                <small>{waypoint.scripture}</small>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="waypoint-archive-panel">
        <div className="card-heading">
          <p className="section-label">Find a Waypoint</p>
          <p>
            Search by title, Scripture, category, reflection theme, or tag as
            the Waypoint library grows.
          </p>
        </div>

        <div className="waypoint-explorer">
          <div className="waypoint-search-row">
            <label>
              <span>Search Waypoints</span>
              <input
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search identity, gifts, calling..."
                type="search"
                value={query}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                onChange={(event) => setCategory(event.target.value)}
                value={category}
              >
                <option value="All">All categories</option>
                {categories.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="waypoint-results" aria-live="polite">
            {visibleWaypoints.length > 0 ? (
              visibleWaypoints.map((waypoint) => (
                <button
                  className={
                    waypoint.id === selectedWaypoint.id
                      ? "waypoint-result-card is-selected"
                      : "waypoint-result-card"
                  }
                  key={waypoint.id}
                  onClick={() => selectWaypoint(waypoint.id)}
                  type="button"
                >
                  <div>
                    <p className={categoryClass(waypoint.category)}>
                      {waypoint.category}
                    </p>
                    <h3>{waypoint.title}</h3>
                    <p>{waypoint.excerpt}</p>
                  </div>
                  <div className="waypoint-meta-row">
                    <span>{waypoint.scripture}</span>
                    <span>{waypoint.date}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="waypoint-empty-state">
                No Waypoints match that search yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

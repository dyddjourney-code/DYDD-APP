"use client";

import { useMemo, useState } from "react";

type WaypointSummary = {
  title: string;
  date: string;
  category: string;
  tags: string[];
  excerpt: string;
};

type WaypointExplorerProps = {
  categories: string[];
  waypoints: WaypointSummary[];
};

export function WaypointExplorer({
  categories,
  waypoints,
}: WaypointExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const visibleWaypoints = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return waypoints.filter((waypoint) => {
      const matchesCategory =
        category === "All" || waypoint.category === category;
      const searchable = [
        waypoint.title,
        waypoint.date,
        waypoint.category,
        waypoint.excerpt,
        ...waypoint.tags,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchable.includes(normalizedQuery);
    });
  }, [category, query, waypoints]);

  return (
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
            <article className="waypoint-result-card" key={waypoint.title}>
              <div>
                <p className="section-label">{waypoint.category}</p>
                <h3>{waypoint.title}</h3>
                <p>{waypoint.excerpt}</p>
              </div>
              <div className="waypoint-meta-row">
                <span>{waypoint.date}</span>
                {waypoint.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="waypoint-empty-state">
            No Waypoints match that search yet.
          </p>
        )}
      </div>
    </div>
  );
}

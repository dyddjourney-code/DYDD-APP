"use client";

import { useState } from "react";

const maxObserverCount = 12;

export function ObserverInvitations() {
  const [observerCount, setObserverCount] = useState(0);

  function addObserver() {
    setObserverCount((count) => Math.min(maxObserverCount, count + 1));
  }

  function removeObserver() {
    setObserverCount((count) => Math.max(0, count - 1));
  }

  return (
    <div className="fruitlife-observer-roster">
      {observerCount === 0 ? (
        <p className="fruitlife-empty-note">
          No observers added. This will begin as a self-assessment.
        </p>
      ) : null}
      {Array.from({ length: observerCount }, (_, index) => {
        const observerNumber = index + 1;

        return (
          <div className="fruitlife-observer-row" key={observerNumber}>
            <span>{observerNumber}</span>
            <label>
              Name
              <input name={`observer_name_${observerNumber}`} type="text" />
            </label>
            <label>
              Email
              <input name={`observer_email_${observerNumber}`} type="email" />
            </label>
            <label>
              Relationship
              <input
                name={`observer_relationship_${observerNumber}`}
                placeholder="Spouse, friend, pastor, coworker"
                type="text"
              />
            </label>
          </div>
        );
      })}

      <div className="fruitlife-observer-controls">
        <button
          className="button secondary"
          disabled={observerCount >= maxObserverCount}
          onClick={addObserver}
          type="button"
        >
          Add Observer
        </button>
        {observerCount > 0 ? (
          <button className="button text-button" onClick={removeObserver} type="button">
            Remove Last
          </button>
        ) : null}
        <small>{observerCount} of {maxObserverCount} observer spots added.</small>
      </div>
    </div>
  );
}

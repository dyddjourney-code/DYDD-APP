"use client";

import { useState } from "react";

type PageHelpProps = {
  items: string[];
  title?: string;
};

export function PageHelp({ items, title = "How to use this page" }: PageHelpProps) {
  const [open, setOpen] = useState(false);
  const buttonLabel = title.toLowerCase().includes("help") ? title : `${title} Help`;

  return (
    <div className="page-help">
      <button
        aria-haspopup="dialog"
        aria-expanded={open}
        className="page-help-trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        {buttonLabel}
      </button>
      {open ? (
        <div className="page-help-overlay" role="presentation">
          <section
            aria-label={title}
            aria-modal="true"
            className="page-help-modal"
            role="dialog"
          >
            <div className="page-help-modal-header">
              <div>
                <p className="section-label">Help</p>
                <h2>{title}</h2>
              </div>
              <button
                aria-label="Close help"
                className="page-help-close"
                onClick={() => setOpen(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <ul>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}

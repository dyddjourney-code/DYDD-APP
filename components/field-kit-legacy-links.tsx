"use client";
import { useEffect } from "react";
/** Keep saved links to the retired assessment catalog useful. */
export function FieldKitLegacyLinks() {
  useEffect(() => {
    const destination =
      window.location.hash === "#optional-expansions"
        ? "#designpd"
        : window.location.hash === "#subscription-assessments"
          ? "#subscription-assessments"
          : null;
    if (destination)
      window.location.replace(
        `/trailheads${window.location.search}${destination}`,
      );
  }, []);
  return null;
}

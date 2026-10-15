"use client";
import { ReviewAwareLink as Link } from "@/components/review-aware-link";
import { useEffect, useState } from "react";
export function TrailResumeLink({
  href,
  progressKey,
  startLabel,
  continueLabel,
}: {
  href: string;
  progressKey: string;
  startLabel: string;
  continueLabel: string;
}) {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    try {
      setStarted(Boolean(localStorage.getItem(progressKey)));
    } catch {}
  }, [progressKey]);
  return (
    <Link className="button primary" href={href}>
      {started ? continueLabel : startLabel}
    </Link>
  );
}

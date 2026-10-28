type CompletionStatus = {
  artifacts: Array<{ artifact_type: string; artifact_status: string }>;
  session: {
    id: string;
    self_completed_at: string | null;
    observer_completed_count: number;
    observer_goal: number;
    report_status: string;
  };
};

// Submission, observer completion, and PDF readiness are distinct persisted facts.
// Never turn a queued payload or a partial 360 into a finished report.
export function fruitLifeCompletionState(status: CompletionStatus) {
  const { session, artifacts } = status;
  const submitted = Boolean(session.self_completed_at);
  const waitingForObservers = submitted && session.observer_completed_count < session.observer_goal;
  const ready = submitted && !waitingForObservers && artifacts.some(
    (artifact) => artifact.artifact_type === "pdf" && artifact.artifact_status === "ready",
  );
  const failed = ["error", "failed"].includes(session.report_status);

  return {
    submitted,
    waitingForObservers,
    ready,
    heading: !submitted ? "Continue your FruitLife360 reflection." : ready ? "Your FruitLife360 report is ready." : "Your FruitLife360 reflection is saved.",
    description: !submitted
      ? "Your self reflection has not been submitted yet. Check your session progress to continue."
      : waitingForObservers
        ? `Your self reflection is saved. ${session.observer_completed_count} of ${session.observer_goal} observer reflections are complete. Your full report will be available after your invited observers respond. You can track progress and manage invitations below.`
        : ready
          ? "Open your saved report below, then take the course to explore what you notice and choose practices for growth."
          : failed
            ? "Your reflection is saved, but your report is not available yet. Check your session progress for updates."
            : "Your reflection is saved and your report is being prepared. This page will update when it is ready. Then open your report and take the course to explore your results.",
  };
}

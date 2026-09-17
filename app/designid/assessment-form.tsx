"use client";

import { type FormEvent, useMemo, useState } from "react";
import { designIdQuestionBlocks, designIdRankField } from "@/lib/designid/intake";

type DesignIdAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialReviewer: {
    email: string;
    name: string;
  };
  message?: string;
};

const rankOptions = [
  { label: "First / most like me", value: "3" },
  { label: "Second", value: "2" },
  { label: "Third", value: "1" },
  { label: "Fourth / least like me", value: "0" },
];

export function DesignIdAssessmentForm({
  action,
  initialReviewer,
  message,
}: DesignIdAssessmentFormProps) {
  const totalSteps = designIdQuestionBlocks.length + 1;
  const [stepIndex, setStepIndex] = useState(0);
  const [rankValues, setRankValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentBlock = stepIndex > 0 ? designIdQuestionBlocks[stepIndex - 1] : null;
  const progress = stepIndex === 0 ? 0 : Math.round((stepIndex / totalSteps) * 100);
  const progressLabel = useMemo(() => {
    if (!currentBlock) return "Start";
    return `Question set ${currentBlock.block} of ${designIdQuestionBlocks.length}`;
  }, [currentBlock]);

  function setRank(code: string, value: string) {
    setError("");
    setRankValues((current) => ({ ...current, [code]: value }));
  }

  function validateCurrentBlock() {
    if (!currentBlock) return true;

    const values = currentBlock.statements.map((statement) => rankValues[statement.code]);
    if (values.some((value) => !value)) {
      setError("Rank all four statements before continuing.");
      return false;
    }

    if (new Set(values).size !== 4) {
      setError("Use each rank once: First, Second, Third, and Fourth.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentBlock()) return;
    setStepIndex((index) => Math.min(totalSteps, index + 1));
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function goBack() {
    setError("");
    setStepIndex((index) => Math.max(0, index - 1));
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (stepIndex < totalSteps) {
      event.preventDefault();
      goNext();
      return;
    }

    if (!validateCurrentBlock()) {
      event.preventDefault();
      return;
    }

    setIsSubmitting(true);
  }

  return (
    <form action={action} className="designid-form" onSubmit={handleSubmit}>
      {Object.entries(rankValues).map(([code, value]) => (
        <input key={code} name={designIdRankField(code)} type="hidden" value={value} />
      ))}

      {message ? <p className="form-message">{message}</p> : null}
      {error ? <p className="form-message error">{error}</p> : null}

      {stepIndex > 0 ? (
        <section className="spiritual-gifts-progress-card designid-progress-card">
          <img src="/brand/tools/designid-logo.webp" alt="DesignID logo" />
          <div>
            <p className="section-label">DesignID</p>
            <h2>{progressLabel}</h2>
          </div>
          <div className="spiritual-gifts-step-meter">
            <span>Progress</span>
            <strong>{progress}%</strong>
            <div aria-label={`${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </section>
      ) : null}

      <section className={`spiritual-gifts-panel spiritual-gifts-start-card ${stepIndex === 0 ? "active" : ""}`}>
        <div className="spiritual-gifts-start-brand">
          <img src="/brand/tools/designid-logo.webp" alt="DesignID logo" />
        </div>
        <div className="spiritual-gifts-start-copy">
          <p className="section-label">Discover Your Divine Design</p>
          <h1>Begin your DesignID assessment.</h1>
          <p>
            You will move through 20 short sets. In each set, rank all four statements from
            most like you to least like you. This version uses the approved revised wording
            from the DesignID question audit.
          </p>
          <div className="spiritual-gifts-start-cues" aria-label="Assessment details">
            <span>20 sets</span>
            <span>4 statements each</span>
            <span>PDF report</span>
          </div>
        </div>
        <div className="spiritual-gifts-locked-identity" aria-label="Assessment account identity">
          <div>
            <span>Name</span>
            <strong>{initialReviewer.name}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{initialReviewer.email}</strong>
          </div>
        </div>
      </section>

      {designIdQuestionBlocks.map((block) => (
        <fieldset
          className={`fruitlife-panel designid-question-panel ${stepIndex === block.block ? "active" : ""}`}
          key={block.block}
        >
          <p className="section-label">Question Set {block.block}</p>
          <h2>Rank all four statements.</h2>
          <p>
            Choose each rank once. First means this sounds most like your natural pattern;
            fourth means it sounds least like your natural pattern.
          </p>
          <div className="designid-rank-list">
            {block.statements.map((statement) => (
              <label className="designid-rank-row" key={statement.code}>
                <span>{statement.text}</span>
                <select
                  onChange={(event) => setRank(statement.code, event.target.value)}
                  required
                  value={rankValues[statement.code] ?? ""}
                >
                  <option value="">Choose rank</option>
                  {rankOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <section className={`fruitlife-panel designid-question-panel ${stepIndex === totalSteps ? "active" : ""}`}>
        <p className="section-label">Ready to Submit</p>
        <h2>Submit your DesignID assessment.</h2>
        <p>
          The app will score your reflection pattern, create a report artifact, and send the
          report link to your account email.
        </p>
      </section>

      <div className="fruitlife-step-controls">
        <button className="button secondary" disabled={stepIndex === 0 || isSubmitting} onClick={goBack} type="button">
          Back
        </button>
        {stepIndex < totalSteps ? (
          <button className="button primary" disabled={isSubmitting} type="submit">
            {stepIndex === 0 ? "Start Assessment" : "Next"}
          </button>
        ) : (
          <button className="button primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting..." : "Submit DesignID"}
          </button>
        )}
      </div>
    </form>
  );
}

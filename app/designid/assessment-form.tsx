"use client";

import { type FormEvent, useMemo, useState } from "react";
import { MapsConfirmationSort } from "./maps-confirmation-sort";
import { mapsConfirmationField, mapsConfirmationBuckets, type MapsAssignments } from "@/lib/designid/maps-confirmation";
import { designIdQuestionBlocks, designIdAllocationField } from "@/lib/designid/intake";

type DesignIdAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialReviewer: {
    email: string;
    name: string;
  };
  message?: string;
};

export function DesignIdAssessmentForm({
  action,
  initialReviewer,
  message,
}: DesignIdAssessmentFormProps) {
  const totalSteps = designIdQuestionBlocks.length + 2;
  const [stepIndex, setStepIndex] = useState(0);
  const [pointValues, setPointValues] = useState<Record<string, string>>({});
  const [mapsAssignments, setMapsAssignments] = useState<MapsAssignments>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentBlock = stepIndex > 0 ? designIdQuestionBlocks[stepIndex - 1] : null;
  const progress = stepIndex === 0 ? 0 : Math.round((stepIndex / totalSteps) * 100);
  const progressLabel = useMemo(() => {
    if (stepIndex === totalSteps - 1) return "MAPS confirmation";
    if (stepIndex === totalSteps) return "Review and submit";
    if (!currentBlock) return "Start";
    return `Question set ${currentBlock.block} of ${designIdQuestionBlocks.length}`;
  }, [currentBlock, stepIndex, totalSteps]);

  function setPoints(code: string, value: string) {
    setError("");
    setPointValues((current) => ({ ...current, [code]: value }));
  }

  function validateCurrentBlock() {
    if (stepIndex >= totalSteps - 1) {
      if (Object.keys(mapsAssignments).length !== 12 || mapsConfirmationBuckets.some((bucket) => Object.values(mapsAssignments).filter((value) => value === bucket.id).length !== 3)) {
        setError("Place all 12 MAPS words, with three in each group, before continuing.");
        return false;
      }
    }
    if (!currentBlock) return true;

    const values = currentBlock.statements.map((statement) => pointValues[statement.code]);
    if (values.some((value) => value === undefined || value === "")) {
      setError("Choose 0, 1, 2, or 3 points for each of the four statements.");
      return false;
    }

    if (values.reduce((sum, value) => sum + Number(value), 0) !== 5) {
      setError("Allocate exactly 5 points across these four statements before continuing.");
      return false;
    }

    return true;
  }

  function goNext() {
    if (!validateCurrentBlock()) return;
    setStepIndex((index) => Math.min(totalSteps, index + 1));
    window.scrollTo({ behavior: "auto", top: 0 });
  }

  function goBack() {
    setError("");
    setStepIndex((index) => Math.max(0, index - 1));
    window.scrollTo({ behavior: "auto", top: 0 });
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
    <form noValidate action={action} className="designid-form" onSubmit={handleSubmit}>
      {Object.entries(mapsAssignments).map(([id, value]) => (
        <input key={id} name={mapsConfirmationField(id)} type="hidden" value={value} />
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
          <h1>Begin your DesignID assessment.</h1>
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
          <h2>Share 5 points across these four statements.</h2>
          <p>
            Give each statement 0, 1, 2, or 3 points. Give more points to what sounds
            most like you. You can use the same number more than once; your total must be exactly 5.
          </p>
          <div className="designid-allocation-total" role="status" aria-live="polite" aria-atomic="true">
            <strong>{block.statements.reduce((sum, statement) => sum + Number(pointValues[statement.code] ?? 0), 0)} / 5 points</strong>
            <span>{(() => {
              const total = block.statements.reduce((sum, statement) => sum + Number(pointValues[statement.code] ?? 0), 0);
              const complete = block.statements.every((statement) => pointValues[statement.code] !== undefined);
              if (total > 5) return `Remove ${total - 5} ${total - 5 === 1 ? "point" : "points"} to continue.`;
              if (total < 5) return `${5 - total} ${5 - total === 1 ? "point" : "points"} left to share.`;
              return complete ? "All 5 points allocated. Ready to continue." : "Choose a number for every statement, including 0.";
            })()}</span>
          </div>
          <div className="designid-rank-list">
            {block.statements.map((statement) => (
              <div className="designid-rank-row" key={statement.code}>
                <span id={`statement-${statement.code}`}>{statement.text}</span>
                <div className="designid-point-choices" role="radiogroup" aria-labelledby={`statement-${statement.code}`}>
                  {[0, 1, 2, 3].map((points) => (
                    <label key={points}>
                      <input type="radio" name={designIdAllocationField(statement.code)} value={points}
                        checked={pointValues[statement.code] === String(points)}
                        onChange={() => setPoints(statement.code, String(points))} />
                      <span>{points}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <section className={`fruitlife-panel designid-question-panel ${stepIndex === totalSteps - 1 ? "active" : ""}`}>
        <MapsConfirmationSort assignments={mapsAssignments} onChange={(next) => { setMapsAssignments(next); setError(""); }} />
      </section>

      <section className={`fruitlife-panel designid-question-panel ${stepIndex === totalSteps ? "active" : ""}`}>
        <p className="section-label">Ready to Submit</p>
        <h2>Submit your DesignID assessment.</h2>
        <p>
          The app will score your reflection pattern, create a report artifact, and send the
          report link to your account email. Your clarification sort is saved separately and does not change your 100-point score.
        </p>
      </section>

      <div className="fruitlife-step-controls">
        {stepIndex > 0 ? (
          <button className="button secondary" disabled={isSubmitting} onClick={goBack} type="button">
            Back
          </button>
        ) : null}
        {stepIndex < totalSteps ? (
          <button className="button primary" disabled={isSubmitting} type="submit">
            {stepIndex === 0 ? "Start assessment" : "Next"}
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

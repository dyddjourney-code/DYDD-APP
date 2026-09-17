"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { designPdQuestionBank, designPdRatingField, type DesignPdAxis } from "@/lib/designpd/intake";

type DesignPdAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  participantEmail: string;
  participantName: string;
};

const axisTitles: Record<DesignPdAxis, string> = {
  decide: "Decide",
  do: "Do",
  plan: "Plan",
};

const axisSubtitles: Record<DesignPdAxis, string> = {
  decide: "How you move from information to discernment.",
  do: "How you move from direction to action.",
  plan: "How you move from possibility to a path.",
};

const axisOrder: DesignPdAxis[] = ["plan", "decide", "do"];

export function DesignPdAssessmentForm({
  action,
  participantEmail,
  participantName,
}: DesignPdAssessmentFormProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const totalSteps = axisOrder.length + 1;
  const currentAxis = axisOrder[stepIndex - 1];
  const axisQuestions = useMemo(
    () =>
      currentAxis
        ? designPdQuestionBank.filter((question) => question.axis === currentAxis)
        : [],
    [currentAxis],
  );
  const answeredCount = Object.keys(ratings).length;

  function validateAxis(axis: DesignPdAxis) {
    const unanswered = designPdQuestionBank
      .filter((question) => question.axis === axis)
      .filter((question) => !ratings[question.code]);

    if (unanswered.length) {
      setError("Answer each statement in this section before moving forward.");
      return false;
    }

    setError("");
    return true;
  }

  function next() {
    if (stepIndex > 0 && stepIndex <= axisOrder.length && !validateAxis(axisOrder[stepIndex - 1])) {
      return;
    }
    setStepIndex((current) => Math.min(current + 1, totalSteps));
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function back() {
    setError("");
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (stepIndex !== totalSteps) {
      event.preventDefault();
      next();
      return;
    }

    const missing = designPdQuestionBank.filter((question) => !ratings[question.code]);
    if (missing.length) {
      event.preventDefault();
      setError("Answer every DesignPD statement before submitting.");
      setStepIndex(1);
    }
  }

  return (
    <form action={action} className="designpd-form" onSubmit={handleSubmit}>
      {designPdQuestionBank.map((question) => (
        <input
          key={question.code}
          name={designPdRatingField(question.code)}
          type="hidden"
          value={ratings[question.code] ?? ""}
        />
      ))}

      <aside className="spiritual-gifts-progress-card designid-progress-card">
        <img src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
        <div>
          <span>{stepIndex === 0 ? "Ready" : stepIndex === totalSteps ? "Review" : axisTitles[currentAxis]}</span>
          <strong>{Math.min(answeredCount, designPdQuestionBank.length)} / {designPdQuestionBank.length}</strong>
        </div>
      </aside>

      <section className={`fruitlife-panel designid-question-panel ${stepIndex === 0 ? "active" : ""}`}>
        <img className="designid-form-logo" src="/brand/tools/designpd-logo.jpg" alt="DesignPD logo" />
        <p className="section-label">DesignPD</p>
        <h1>Plan. Decide. Do.</h1>
        <p>
          DesignPD uses your completed DesignID result as the foundation, then
          looks at how your design moves through planning, decisions, and action.
        </p>
        <div className="spiritual-gifts-locked-identity">
          <div>
            <span>Name</span>
            <strong>{participantName}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{participantEmail}</strong>
          </div>
        </div>
        <div className="spiritual-gifts-step-controls start">
          <button className="button primary" type="button" onClick={next}>
            Start DesignPD
          </button>
        </div>
      </section>

      {axisOrder.map((axis, index) => {
        const questions = designPdQuestionBank.filter((question) => question.axis === axis);
        const active = stepIndex === index + 1;

        return (
          <section className={`fruitlife-panel designid-question-panel ${active ? "active" : ""}`} key={axis}>
            <div className="designid-question-heading">
              <p className="section-label">DesignPD {axisTitles[axis]}</p>
              <h2>{axisTitles[axis]} pattern</h2>
              <p>{axisSubtitles[axis]}</p>
              <small>
                Choose the number that best describes your usual tendency right now.
              </small>
            </div>
            <div className="designpd-scale-list">
              {questions.map((question) => (
                <fieldset className="designpd-scale-row" key={question.code}>
                  <legend>{question.text}</legend>
                  <div className="designpd-scale-options" aria-label={`${question.leftLabel} to ${question.rightLabel}`}>
                    <span>{question.leftLabel}</span>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value}>
                        <input
                          checked={ratings[question.code] === value}
                          name={`${question.code}_display`}
                          onChange={() =>
                            setRatings((current) => ({
                              ...current,
                              [question.code]: value,
                            }))
                          }
                          type="radio"
                          value={value}
                        />
                        <b>{value}</b>
                      </label>
                    ))}
                    <span>{question.rightLabel}</span>
                  </div>
                </fieldset>
              ))}
            </div>
            {error && active ? <p className="fruitlife-form-error">{error}</p> : null}
            <div className="spiritual-gifts-step-controls">
              <button className="button secondary" type="button" onClick={back}>
                Back
              </button>
              <button className="button primary" type="button" onClick={next}>
                Next
              </button>
            </div>
          </section>
        );
      })}

      <section className={`fruitlife-panel designid-question-panel ${stepIndex === totalSteps ? "active" : ""}`}>
        <p className="section-label">Submit DesignPD</p>
        <h2>Ready to build your report.</h2>
        <p>
          Your answers are saved in this form as you move backward and forward.
          Submit when you are ready to generate your DesignPD report.
        </p>
        {error && stepIndex === totalSteps ? <p className="fruitlife-form-error">{error}</p> : null}
        <div className="spiritual-gifts-step-controls">
          <button className="button secondary" type="button" onClick={back}>
            Back
          </button>
          <button className="button primary" type="submit">
            Submit DesignPD
          </button>
        </div>
      </section>
    </form>
  );
}

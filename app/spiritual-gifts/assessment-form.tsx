"use client";

import { useMemo, useState } from "react";
import {
  spiritualGiftQuestionBank,
  spiritualGiftRatingField,
  spiritualGiftRatingOptions,
} from "@/lib/spiritual-gifts/intake";

type SpiritualGiftsAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialReviewer?: {
    email?: string | null;
    name?: string | null;
  };
  message?: string;
  sessionId?: string;
  token?: string;
};

const questionsPerStep = 6;
const questionGroups = Array.from(
  { length: Math.ceil(spiritualGiftQuestionBank.length / questionsPerStep) },
  (_, index) => spiritualGiftQuestionBank.slice(index * questionsPerStep, index * questionsPerStep + questionsPerStep),
);

export function SpiritualGiftsAssessmentForm({
  action,
  initialReviewer,
  message,
  sessionId,
  token,
}: SpiritualGiftsAssessmentFormProps) {
  const totalSteps = questionGroups.length + 2;
  const [stepIndex, setStepIndex] = useState(0);
  const progressLabel = useMemo(() => {
    if (stepIndex === 0) return "Details";
    if (stepIndex <= questionGroups.length) return `Set ${stepIndex}`;
    return "Reflection";
  }, [stepIndex]);
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const lockIdentity = Boolean(initialReviewer?.email || initialReviewer?.name);

  function goNext() {
    setStepIndex((index) => Math.min(totalSteps - 1, index + 1));
  }

  function goBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  return (
    <form action={action} className="spiritual-gifts-form">
      <input name="session_id" type="hidden" value={sessionId ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />

      {message ? <p className="form-message">{message}</p> : null}

      <section className="spiritual-gifts-progress-card">
        <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        <div>
          <p className="section-label">Spiritual Gifts App Channel</p>
          <h2>Move through the reflection statements.</h2>
          <p>
            Answer prayerfully and instinctively. The scoring stays blind here so the result is not
            shaped by seeing gift labels while you respond.
          </p>
        </div>
        <div className="spiritual-gifts-step-meter">
          <span>{stepIndex + 1} of {totalSteps}</span>
          <strong>{progressLabel}</strong>
          <div aria-label={`${progress}% complete`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className={`spiritual-gifts-panel spiritual-gifts-step-panel ${stepIndex === 0 ? "active" : ""}`}>
        <p className="section-label">Participant</p>
        <h2>Confirm who this assessment belongs to.</h2>
        <div className="fruitlife-grid two">
          <label>
            Your name
            <small>{lockIdentity ? "This came from the app session." : "Use the name for the result."}</small>
            <input
              defaultValue={initialReviewer?.name ?? ""}
              name="reviewer_name"
              readOnly={lockIdentity}
              required
              type="text"
            />
          </label>
          <label>
            Your email
            <small>{lockIdentity ? "This came from the app session." : "Required for the result record."}</small>
            <input
              defaultValue={initialReviewer?.email ?? ""}
              name="reviewer_email"
              readOnly={lockIdentity}
              required
              type="email"
            />
          </label>
        </div>
      </section>

      {questionGroups.map((questions, index) => {
        const isActive = stepIndex === index + 1;

        return (
          <fieldset
            aria-labelledby={`spiritual-gifts-set-${index + 1}-title`}
            className={`spiritual-gifts-panel spiritual-gifts-step-panel spiritual-gift-card ${isActive ? "active" : ""}`}
            key={`question-set-${index + 1}`}
          >
            <div className="spiritual-gift-heading blind">
              <p className="section-label">Reflection Set {index + 1}</p>
              <h3 id={`spiritual-gifts-set-${index + 1}-title`}>Answer what is true most of the time.</h3>
              <p>
                These statements are mixed across the assessment so you can respond honestly without
                tracking which gift is being scored.
              </p>
            </div>
            {questions.map((question) => (
              <label className="fruitlife-scale spiritual-gifts-scale" key={question.code}>
                <span>
                  <small>Statement {question.displayOrder}</small>
                  {question.text}
                </span>
                <select defaultValue="3" name={spiritualGiftRatingField(question.code)} required>
                  {spiritualGiftRatingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} - {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
        );
      })}

      <section className={`spiritual-gifts-panel spiritual-gifts-step-panel ${stepIndex === totalSteps - 1 ? "active" : ""}`}>
        <p className="section-label">Reflection</p>
        <h2>Connect the result to real fruit.</h2>
        <label>
          Where have others consistently affirmed gift or ministry fruit in you?
          <textarea name="others_affirmed" rows={4} />
        </label>
        <label>
          Where have you served repeatedly with grace, joy, and impact?
          <textarea name="service_fruit" rows={4} />
        </label>
        <label>
          Where are you currently serving, leading, helping, or sensing a pull to serve?
          <textarea name="service_context" rows={4} />
        </label>
        <label>
          What do you want to ask God to clarify or mature as you review your gifts?
          <textarea name="growth_prayer" rows={4} />
        </label>
        <label>
          What is one small next step you can take after seeing your results?
          <textarea name="next_step" rows={4} />
        </label>
      </section>

      <div className="fruitlife-step-controls">
        <button className="button secondary" disabled={stepIndex === 0} onClick={goBack} type="button">
          Back
        </button>
        {stepIndex < totalSteps - 1 ? (
          <button className="button primary" onClick={goNext} type="button">
            Next
          </button>
        ) : (
          <button className="button primary" type="submit">
            Submit Spiritual Gifts Assessment
          </button>
        )}
      </div>
    </form>
  );
}

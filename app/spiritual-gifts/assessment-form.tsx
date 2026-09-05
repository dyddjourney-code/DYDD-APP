"use client";

import { useMemo, useState } from "react";
import {
  spiritualGiftQuestionBank,
  spiritualGiftRatingField,
  spiritualGiftRatingOptions,
  spiritualGifts,
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

const questionsByGift = new Map(
  spiritualGifts.map((gift) => [
    gift.key,
    spiritualGiftQuestionBank.filter((question) => question.giftKey === gift.key),
  ]),
);

export function SpiritualGiftsAssessmentForm({
  action,
  initialReviewer,
  message,
  sessionId,
  token,
}: SpiritualGiftsAssessmentFormProps) {
  const totalSteps = spiritualGifts.length + 2;
  const [stepIndex, setStepIndex] = useState(0);
  const currentGift = stepIndex > 0 && stepIndex <= spiritualGifts.length
    ? spiritualGifts[stepIndex - 1]
    : null;
  const progressLabel = useMemo(() => {
    if (stepIndex === 0) return "Details";
    if (currentGift) return currentGift.label;
    return "Reflection";
  }, [currentGift, stepIndex]);
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
          <h2>Move through one gift at a time.</h2>
          <p>
            This native assessment saves inside the DYDD app and keeps the current live assessment
            process separate.
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

      {spiritualGifts.map((gift, index) => {
        const questions = questionsByGift.get(gift.key) ?? [];
        const isActive = stepIndex === index + 1;

        return (
          <fieldset
            aria-labelledby={`spiritual-gifts-${gift.key}-title`}
            className={`spiritual-gifts-panel spiritual-gifts-step-panel spiritual-gift-card ${isActive ? "active" : ""}`}
            key={gift.key}
          >
            <div className="spiritual-gift-heading">
              <p className="section-label">Gift {index + 1}</p>
              <h3 id={`spiritual-gifts-${gift.key}-title`}>{gift.label}</h3>
              <p>{gift.definition}</p>
              <small>{gift.scriptures}</small>
            </div>
            <div className="spiritual-gift-reflections" aria-label={`${gift.label} DesignID correlations`}>
              {Object.entries(gift.reflections).map(([reflection, text]) => (
                <p key={reflection}>
                  <strong>{reflection}</strong>
                  <span>{text}</span>
                </p>
              ))}
            </div>
            {questions.map((question) => (
              <label className="fruitlife-scale spiritual-gifts-scale" key={question.code}>
                <span>{question.text}</span>
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
        <h2>Connect the result to service.</h2>
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

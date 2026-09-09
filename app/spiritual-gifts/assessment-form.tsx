"use client";

import { useMemo, useRef, useState } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const totalSteps = questionGroups.length + 2;
  const [stepIndex, setStepIndex] = useState(0);
  const progressLabel = useMemo(() => {
    if (stepIndex === 0) return "Start";
    if (stepIndex <= questionGroups.length) return `Set ${stepIndex} of ${questionGroups.length}`;
    return "Finish";
  }, [stepIndex]);
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100);
  const lockIdentity = Boolean(initialReviewer?.email || initialReviewer?.name);
  const identitySource = lockIdentity ? "account" : "public";

  function goNext() {
    const activePanel = formRef.current?.querySelector(".spiritual-gifts-step-panel.active");
    const requiredFields = Array.from(
      activePanel?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[required], textarea[required]") ??
        [],
    );
    const invalidField = requiredFields.find((field) => !field.checkValidity());

    if (invalidField) {
      invalidField.reportValidity();
      return;
    }

    setStepIndex((index) => Math.min(totalSteps - 1, index + 1));
  }

  function goBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  return (
    <form action={action} className="spiritual-gifts-form" ref={formRef}>
      <input name="session_id" type="hidden" value={sessionId ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />
      <input name="signup_source" type="hidden" value="public-spiritual-gifts-assessment" />

      {message ? <p className="form-message">{message}</p> : null}

      {stepIndex > 0 ? (
      <section className="spiritual-gifts-progress-card">
        <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        <div>
          <p className="section-label">Spiritual Gifts</p>
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

      <section className={`spiritual-gifts-panel spiritual-gifts-step-panel spiritual-gifts-start-card ${stepIndex === 0 ? "active" : ""}`}>
        <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        <div>
          <p className="section-label">Spiritual Gifts</p>
          <h1>{lockIdentity ? "Start your assessment." : "Start your Spiritual Gifts assessment."}</h1>
          <p>Discover how God may be gifting your service.</p>
        </div>
        <input name="identity_source" type="hidden" value={identitySource} />
        {lockIdentity ? (
          <>
            <input name="reviewer_name" type="hidden" value={initialReviewer?.name ?? ""} />
            <input name="reviewer_email" type="hidden" value={initialReviewer?.email ?? ""} />
          </>
        ) : (
          <div className="spiritual-gifts-start-fields">
            <label>
              Name
              <input
                autoComplete="name"
                defaultValue={initialReviewer?.name ?? ""}
                name="reviewer_name"
                required
                type="text"
              />
            </label>
            <label>
              Email
              <input
                autoComplete="email"
                defaultValue={initialReviewer?.email ?? ""}
                name="reviewer_email"
                required
                type="email"
              />
            </label>
          </div>
        )}
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
              <div className="spiritual-gifts-rubric" aria-label="Rating scale">
                {spiritualGiftRatingOptions.map((option) => (
                  <span key={option.value}>
                    <strong>{option.value}</strong>
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
            {questions.map((question) => (
              <fieldset className="fruitlife-scale spiritual-gifts-scale" key={question.code}>
                <legend>
                  <small>Statement {question.displayOrder}</small>
                  {question.text}
                </legend>
                <div className="spiritual-gifts-rating-buttons" aria-label={`Rate statement ${question.displayOrder}`}>
                  {spiritualGiftRatingOptions.map((option) => (
                    <label key={option.value}>
                      <input
                        name={spiritualGiftRatingField(question.code)}
                        required
                        type="radio"
                        value={option.value}
                      />
                      <span>{option.value}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
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
            {stepIndex === 0 ? "Start questions" : "Next"}
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

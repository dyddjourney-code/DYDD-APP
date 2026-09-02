"use client";

import { useMemo, useState } from "react";
import {
  fruitLifeFruits,
  fruitLifePressureQuestions,
  fruitLifeQuestionBank,
  fruitLifeRatingOptions,
  fruitRatingField,
  type FruitLifeResponseType,
} from "@/lib/fruitlife360/intake";
import { FruitRankSorter } from "./fruit-rank-sorter";

type FruitLifeAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialReviewer?: {
    email?: string | null;
    name?: string | null;
    relationship?: string | null;
  };
  message?: string;
  participantName?: string | null;
  responseType: FruitLifeResponseType;
  sessionId?: string;
  token?: string;
};

const fruitLifeQuestionsByFruit = new Map(
  fruitLifeFruits.map((fruit) => [
    fruit.key,
    fruitLifeQuestionBank.filter((question) => question.fruitKey === fruit.key),
  ]),
);

const fruitLifePressureByFruit = new Map(
  fruitLifeFruits.map((fruit) => [
    fruit.key,
    fruitLifePressureQuestions.find((question) => question.fruitKey === fruit.key),
  ]),
);

export function FruitLifeAssessmentForm({
  action,
  initialReviewer,
  message,
  participantName,
  responseType,
  sessionId,
  token,
}: FruitLifeAssessmentFormProps) {
  const isSelf = responseType === "self";
  const totalSteps = fruitLifeFruits.length + 3;
  const [stepIndex, setStepIndex] = useState(0);
  const currentFruit = stepIndex >= 2 && stepIndex < fruitLifeFruits.length + 2
    ? fruitLifeFruits[stepIndex - 2]
    : null;
  const progressLabel = useMemo(() => {
    if (stepIndex === 0) return "Details";
    if (stepIndex === 1) return "Ranking";
    if (currentFruit) return currentFruit.label;
    return isSelf ? "Personal Growth" : "Observer Notes";
  }, [currentFruit, isSelf, stepIndex]);

  const reviewerName = initialReviewer?.name ?? "";
  const reviewerEmail = initialReviewer?.email ?? "";
  const relationship = initialReviewer?.relationship ?? (isSelf ? "Self" : "");
  const lockIdentity = Boolean(initialReviewer?.name || initialReviewer?.email || initialReviewer?.relationship);

  function goNext() {
    setStepIndex((index) => Math.min(totalSteps - 1, index + 1));
  }

  function goBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  return (
    <form action={action} className="fruitlife-form fruitlife-assessment-form">
      <input name="session_id" type="hidden" value={sessionId ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />

      {message ? <p className="form-message">{message}</p> : null}

      <section className="fruitlife-assessment-card">
        <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife 360 logo" />
        <div>
          <p className="section-label">{isSelf ? "Self path" : "Observer path"}</p>
          <h2>{isSelf ? "Notice what is visible right now." : "Help them see with kindness."}</h2>
          <p>
            {isSelf
              ? "Rank the fruit, move through one fruit card at a time, and name one growth desire."
              : `Reflect on ${participantName ?? "this participant"} with clear, gracious feedback.`}
          </p>
        </div>
        <div className="fruitlife-assessment-steps" aria-label="Assessment progress">
          <span>{stepIndex + 1} of {totalSteps}</span>
          <span>{progressLabel}</span>
        </div>
      </section>

      <section className={`fruitlife-panel fruitlife-step-panel ${stepIndex === 0 ? "active" : ""}`}>
        <p className="section-label">{isSelf ? "Self Reflection" : "Observer Reflection"}</p>
        <h2>{isSelf ? "Confirm your reflection details." : "Confirm your observer details."}</h2>
        <p>
          {isSelf
            ? "This first card confirms who this FruitLife 360 reflection belongs to. The next card begins the fruit ranking."
            : `These details were set by ${participantName ?? "the participant"} when the invitation was created. They keep the report organized without asking you to manage an account.`}
        </p>
        <div className="fruitlife-grid two">
          <label>
            Your name
            <small>{lockIdentity ? "This was set when the invitation was created." : "Use the name connected to the report."}</small>
            <input
              defaultValue={reviewerName}
              name="reviewer_name"
              readOnly={lockIdentity}
              required
              type="text"
            />
          </label>
          <label>
            Your email
            <small>{lockIdentity ? "This was set when the invitation was created." : "Required for the self reflection."}</small>
            <input
              defaultValue={reviewerEmail}
              name="reviewer_email"
              readOnly={lockIdentity}
              required={isSelf || lockIdentity}
              type="email"
            />
          </label>
          <label>
            Relationship
            <small>{lockIdentity || isSelf ? "Locked for this invitation." : "Example: friend, spouse, pastor, coworker."}</small>
            <input
              defaultValue={relationship}
              name="relationship_label"
              readOnly={isSelf || lockIdentity}
              type="text"
            />
          </label>
        </div>
      </section>

      <section className={`fruitlife-panel fruitlife-step-panel ${stepIndex === 1 ? "active" : ""}`}>
        <p className="section-label">Fruit Ranking</p>
        <h2>{isSelf ? "Rank your fruit visibility." : "Rank the fruit you see."}</h2>
        <p>
          Drag the fruit from most visible at the top to least visible at the bottom. The short
          definitions are included so the ranking is meaningful.
        </p>
        <FruitRankSorter />
      </section>

      {fruitLifeFruits.map((fruit, index) => {
        const questions = fruitLifeQuestionsByFruit.get(fruit.key) ?? [];
        const pressureQuestion = fruitLifePressureByFruit.get(fruit.key);
        const isActive = stepIndex === index + 2;

        return (
          <fieldset
            className={`fruitlife-fruit fruitlife-step-panel ${fruit.colorClass} ${isActive ? "active" : ""}`}
            key={fruit.key}
          >
            <legend>{fruit.label}</legend>
            <p>{fruit.definition}</p>
            {questions.map((question) => (
              <label className="fruitlife-scale" key={question.code}>
                <span>{isSelf ? question.selfText : question.observerText}</span>
                <select defaultValue="3" name={fruitRatingField(question.code)} required>
                  {fruitLifeRatingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} - {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            {pressureQuestion ? (
              <label className="fruitlife-scale fruitlife-pressure-scale">
                <span>{isSelf ? pressureQuestion.selfText : pressureQuestion.observerText}</span>
                <select defaultValue="3" name={fruitRatingField(pressureQuestion.code)} required>
                  {fruitLifeRatingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} - {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </fieldset>
        );
      })}

      <section className={`fruitlife-panel fruitlife-step-panel ${stepIndex === totalSteps - 1 ? "active" : ""}`}>
        <p className="section-label">{isSelf ? "Personal Growth" : "Observer Reflection"}</p>
        <h2>{isSelf ? "Name the formation desire." : "Offer language the report can use."}</h2>
        {isSelf ? (
          <label>
            Which fruit of the Spirit do you most want God to keep forming in you this season, and why?
            <textarea name="reflection_growth" rows={5} />
          </label>
        ) : (
          <>
            <label>
              What fruit do you most clearly see in this person?
              <textarea name="reflection_strength" rows={4} />
            </label>
            <label>
              Where do you see a growth invitation for this person?
              <textarea name="reflection_growth" rows={4} />
            </label>
            <label>
              What encouragement should this person hear from this reflection?
              <textarea name="reflection_encouragement" rows={4} />
            </label>
          </>
        )}
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
            Submit FruitLife Reflection
          </button>
        )}
      </div>
    </form>
  );
}

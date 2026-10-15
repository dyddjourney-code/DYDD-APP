"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fruitLifeFruits,
  fruitLifePressureQuestions,
  fruitLifeQuestionBank,
  fruitLifeRatingOptions,
  fruitRatingField,
  type FruitLifeResponseType,
} from "@/lib/fruitlife360/intake";
import legacyInstrument from "@/lib/fruitlife360/legacy-instrument.json";
import { FruitRankSorter } from "./fruit-rank-sorter";

type FruitLifeAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  initialReviewer?: {
    email?: string | null;
    name?: string | null;
    relationship?: string | null;
  };
  message?: string;
  invitationNotice?: string;
  instrumentVersion?: string;
  participantName?: string | null;
  responseType: FruitLifeResponseType;
  sessionId?: string;
  token?: string;
};

export function FruitLifeAssessmentForm({
  action,
  initialReviewer,
  invitationNotice,
  message,
  instrumentVersion,
  participantName,
  responseType,
  sessionId,
  token,
}: FruitLifeAssessmentFormProps) {
  const isSelf = responseType === "self";
  const questions = instrumentVersion === legacyInstrument.version ? legacyInstrument.questions : fruitLifeQuestionBank;
  const pressureQuestions = instrumentVersion === legacyInstrument.version ? legacyInstrument.pressureQuestions : fruitLifePressureQuestions;
  const fruitLifeQuestionsByFruit = new Map(fruitLifeFruits.map(fruit => [fruit.key, questions.filter(question => question.fruitKey === fruit.key)]));
  const fruitLifePressureByFruit = new Map(fruitLifeFruits.map(fruit => [fruit.key, pressureQuestions.find(question => question.fruitKey === fruit.key)]));
  const draftKey = `fruitlife360:v1:${sessionId ?? "preview"}:${responseType}:${token ?? ""}`;
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [rankOrder, setRankOrder] = useState<string[]>(fruitLifeFruits.map(fruit => fruit.key));
  const [draftNotice, setDraftNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const totalSteps = fruitLifeFruits.length + 3;
  const [stepIndex, setStepIndex] = useState(0);
  const [ratingValues, setRatingValues] = useState<Record<string, string>>({});
  const [reflectionValues, setReflectionValues] = useState({
    encouragement: "",
    growth: "",
    strength: "",
  });
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        setRatingValues(draft.ratings ?? {});
        setReflectionValues(draft.reflections ?? { encouragement: "", growth: "", strength: "" });
        if (draft.rank?.length === 9 && new Set(draft.rank).size === 9 && draft.rank.every((key: string) => fruitLifeFruits.some(fruit => fruit.key === key))) setRankOrder(draft.rank);
        setStepIndex(Math.max(0, Math.min(totalSteps - 1, Number(draft.step) || 0)));
        setDraftNotice("Your unfinished reflection was restored on this browser.");
      }
    } catch { /* Draft storage may be disabled by the browser. */ }
    setDraftLoaded(true);
  }, [draftKey, totalSteps]);
  useEffect(() => {
    if (!draftLoaded) return;
    try { localStorage.setItem(draftKey, JSON.stringify({ ratings: ratingValues, reflections: reflectionValues, rank: rankOrder, step: stepIndex })); } catch { /* Assessment still works without local storage. */ }
  }, [draftKey, draftLoaded, ratingValues, reflectionValues, rankOrder, stepIndex]);

  function goNext() {
    const active = formRef.current?.querySelector(".fruitlife-step-panel.active");
    const invalid = active?.querySelector<HTMLInputElement>("input:invalid,textarea:invalid,select:invalid");
    if (invalid) { invalid.reportValidity(); return; }
    setStepIndex((index) => Math.min(totalSteps - 1, index + 1));
  }

  function goBack() {
    setStepIndex((index) => Math.max(0, index - 1));
  }

  function setRating(fieldName: string, value: string) {
    setRatingValues((current) => ({
      ...current,
      [fieldName]: value,
    }));
  }

  return (
    <form ref={formRef} action={action} onSubmit={() => setSubmitting(true)} className="fruitlife-form fruitlife-assessment-form">
      <input name="session_id" type="hidden" value={sessionId ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />

      {message ? <p className="form-message">{message}</p> : null}
      <p className="fruitlife-latest-note">{draftNotice || "Your progress saves on this browser so you can return using the same link."}</p>

      <section aria-label={isSelf ? "FruitLife360 Self Reflection" : "FruitLife360 Observer Reflection"} className={`fruitlife-assessment-card ${isSelf ? "fruitlife-self-header" : ""}`}>
        <img src="/brand/tools/fruitful-life-360-logo.jpg" alt="FruitLife360 logo" />
        {!isSelf ? (
          <div>
            <p className="section-label">Observer path</p>
            <h2>FruitLife360 Observer Reflection</h2>
            <p>Reflect on {participantName ?? "this participant"} with clear, gracious feedback.</p>
          </div>
        ) : null}
        <div className="fruitlife-assessment-steps" aria-label="Assessment progress">
          <span>{stepIndex + 1} of {totalSteps}</span>
          <span>{progressLabel}</span>
        </div>
      </section>

      <section className={`fruitlife-panel fruitlife-step-panel ${stepIndex === 0 ? "active" : ""}`}>
        <p className="section-label">{isSelf ? "Self Reflection" : "Observer Reflection"}</p>
        <h2>{isSelf ? "Your reflection details" : "Your observer details"}</h2>
        {isSelf && invitationNotice ? <p className="journey-save-notice">{invitationNotice}</p> : null}
        <p>
          {isSelf
            ? "These details connect this reflection to your FruitLife360 report."
            : `These details connect your feedback to ${participantName ?? "the participant"}'s report.`}
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
          Drag the fruit, or use the Up and Down buttons, to place the most visible fruit at the
          top and the least visible fruit at the bottom.
        </p>
        {draftLoaded ? <FruitRankSorter initialOrder={rankOrder} onChange={setRankOrder} /> : <p>Loading your reflection…</p>}
      </section>

      {fruitLifeFruits.map((fruit, index) => {
        const questions = fruitLifeQuestionsByFruit.get(fruit.key) ?? [];
        const pressureQuestion = fruitLifePressureByFruit.get(fruit.key);
        const isActive = stepIndex === index + 2;

        return (
          <fieldset
            aria-labelledby={`fruitlife-${fruit.key}-title`}
            className={`fruitlife-fruit fruitlife-step-panel ${fruit.colorClass} ${isActive ? "active" : ""}`}
            key={fruit.key}
          >
            <h3 className="fruitlife-fruit-title" id={`fruitlife-${fruit.key}-title`}>
              {fruit.label}
            </h3>
            <p>{fruit.definition}</p>
            <p className="fruitlife-rating-instructions">
              {isSelf
                ? "For each statement below, choose the dropdown rating that best describes how visible this fruit is in your everyday life. For the pressure statement, consider how you respond when life is difficult or stressful."
                : "For each statement below, choose the dropdown rating that best describes how visible this fruit is in the participant’s everyday life. For the pressure statement, consider what you observe when life is difficult or stressful."}
            </p>
            {questions.map((question) => (
              <label className="fruitlife-scale" key={question.code}>
                <span>{isSelf ? question.selfText : question.observerText}</span>
                <select
                  name={fruitRatingField(question.code)}
                  onChange={(event) => setRating(fruitRatingField(question.code), event.target.value)}
                  required
                  value={ratingValues[fruitRatingField(question.code)] ?? "3"}
                >
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
                <select
                  name={fruitRatingField(pressureQuestion.code)}
                  onChange={(event) =>
                    setRating(fruitRatingField(pressureQuestion.code), event.target.value)
                  }
                  required
                  value={ratingValues[fruitRatingField(pressureQuestion.code)] ?? "3"}
                >
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
            <textarea
              name="reflection_growth"
              onChange={(event) =>
                setReflectionValues((current) => ({ ...current, growth: event.target.value }))
              }
              required
              rows={5}
              value={reflectionValues.growth}
            />
          </label>
        ) : (
          <>
            <label>
              What fruit do you most clearly see in this person?
              <textarea
                name="reflection_strength"
                onChange={(event) =>
                  setReflectionValues((current) => ({ ...current, strength: event.target.value }))
                }
                required
                rows={4}
                value={reflectionValues.strength}
              />
            </label>
            <label>
              Where do you see a growth invitation for this person?
              <textarea
                name="reflection_growth"
                onChange={(event) =>
                  setReflectionValues((current) => ({ ...current, growth: event.target.value }))
                }
                required
                rows={4}
                value={reflectionValues.growth}
              />
            </label>
            <label>
              What encouragement should this person hear from this reflection?
              <textarea
                name="reflection_encouragement"
                onChange={(event) =>
                  setReflectionValues((current) => ({
                    ...current,
                    encouragement: event.target.value,
                  }))
                }
                required
                rows={4}
                value={reflectionValues.encouragement}
              />
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
          <button className="button primary" disabled={submitting} type="submit">
            {submitting ? "Saving reflection…" : "Submit FruitLife Reflection"}
          </button>
        )}
      </div>
    </form>
  );
}

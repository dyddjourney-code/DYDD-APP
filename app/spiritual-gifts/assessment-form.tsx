"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  spiritualGiftQuestionBank,
  spiritualGiftRatingField,
  spiritualGiftRatingOptions,
} from "@/lib/spiritual-gifts/intake";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SpiritualGiftsAssessmentFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  channel?: "app" | "public";
  initialReviewer?: {
    email?: string | null;
    name?: string | null;
  };
  identitySignature?: string;
  message?: string;
  reviewKey?: string;
  reviewMode?: string;
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
  channel = "public",
  identitySignature,
  initialReviewer,
  message,
  reviewKey,
  reviewMode,
  sessionId,
  token,
}: SpiritualGiftsAssessmentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const totalSteps = questionGroups.length + 3;
  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientReviewer, setClientReviewer] = useState(initialReviewer);
  const [accountLookupComplete, setAccountLookupComplete] = useState(channel !== "app" || Boolean(initialReviewer));
  const reflectionStep = questionGroups.length + 1;
  const reviewStep = questionGroups.length + 2;
  const accountReviewer = initialReviewer ?? clientReviewer;
  const progressLabel = useMemo(() => {
    if (stepIndex === 0) return "Start";
    if (stepIndex <= questionGroups.length) return `Set ${stepIndex} of ${questionGroups.length}`;
    if (stepIndex === reflectionStep) return "Reflection";
    return "Review";
  }, [reflectionStep, stepIndex]);
  const progress = stepIndex === 0
    ? 0
    : stepIndex <= questionGroups.length
      ? Math.round(((stepIndex - 1) / questionGroups.length) * 100)
      : 100;
  const lockIdentity = Boolean(accountReviewer?.email || accountReviewer?.name);
  const identitySource = lockIdentity ? "account" : "public";

  useEffect(() => {
    let isMounted = true;

    async function loadAccountIdentity() {
      if (channel !== "app" || initialReviewer) {
        setAccountLookupComplete(true);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setAccountLookupComplete(true);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("school_profiles")
        .select("full_name,email")
        .eq("id", user.id)
        .maybeSingle();
      const authDisplayName = String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();

      if (isMounted) {
        setClientReviewer({
          email: profile?.email ?? user.email ?? "",
          name: profile?.full_name?.trim() || authDisplayName || user.email?.split("@")[0] || "",
        });
        setAccountLookupComplete(true);
      }
    }

    void loadAccountIdentity();

    return () => {
      isMounted = false;
    };
  }, [channel, initialReviewer]);

  useEffect(() => {
    if (stepIndex > 0) {
      window.scrollTo({ behavior: "smooth", top: 0 });
    }
  }, [stepIndex]);

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

  function handleSubmit() {
    setIsSubmitting(true);
  }

  return (
    <form action={action} className="spiritual-gifts-form" onSubmit={handleSubmit} ref={formRef}>
      <input name="session_id" type="hidden" value={sessionId ?? ""} />
      <input name="token" type="hidden" value={token ?? ""} />
      <input
        name="signup_source"
        type="hidden"
        value={channel === "app" ? "app-spiritual-gifts-assessment" : "public-spiritual-gifts-assessment"}
      />
      <input name="review" type="hidden" value={reviewMode ?? ""} />
      <input name="key" type="hidden" value={reviewKey ?? ""} />
      <input name="app_identity_signature" type="hidden" value={identitySignature ?? ""} />

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
        <div className="spiritual-gifts-start-brand">
          <img src="/brand/tools/spiritual-gifts-logo.jpg" alt="Spiritual Gifts logo" />
        </div>
        <div className="spiritual-gifts-start-copy">
          <p className="section-label">Discover Your Divine Design</p>
          <h1>{lockIdentity ? "Begin discovering your spiritual gifts." : "Discover your spiritual gifts."}</h1>
          <p>
            A free assessment designed to help you recognize how God may have gifted you to serve,
            love, and build up the Body of Christ.
          </p>
          <div className="spiritual-gifts-start-cues" aria-label="Assessment details">
            <span>Free assessment</span>
            <span>Personal PDF report</span>
            <span>Top 3 deep dive</span>
          </div>
        </div>
        <input name="identity_source" type="hidden" value={identitySource} />
        {lockIdentity ? (
          <>
            <input name="reviewer_name" type="hidden" value={accountReviewer?.name ?? ""} />
            <input name="reviewer_email" type="hidden" value={accountReviewer?.email ?? ""} />
            <div className="spiritual-gifts-locked-identity" aria-label="Assessment account identity">
              <div>
                <span>Name</span>
                <strong>{accountReviewer?.name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{accountReviewer?.email}</strong>
              </div>
            </div>
          </>
        ) : channel === "app" ? (
          <div className="spiritual-gifts-account-pending">
            <span>{accountLookupComplete ? "Account not found" : "Checking account"}</span>
            <p>
              {accountLookupComplete
                ? "Return to Field Kit and refresh your account session before starting."
                : "Loading the account name and email for this assessment."}
            </p>
            {accountLookupComplete ? (
              <a className="button secondary" href="/field-kit">
                Back to Field Kit
              </a>
            ) : null}
          </div>
        ) : (
          <div className="spiritual-gifts-start-fields">
            <label>
              <span>Name</span>
              <input
                autoComplete="name"
                defaultValue={initialReviewer?.name ?? ""}
                name="reviewer_name"
                required
                type="text"
              />
            </label>
            <label>
              <span>Email</span>
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

      <section className={`spiritual-gifts-panel spiritual-gifts-step-panel spiritual-gifts-reflection-card ${stepIndex === reflectionStep ? "active" : ""}`}>
        <p className="section-label">Next Step</p>
        <h2>Connect your result to faithful action.</h2>
        <p>
          This is optional, but your answer will appear in your PDF report as a starting place for reflection and prayer.
        </p>
        <div className="spiritual-gifts-reflection-fields">
          <label>
            <span>What is one place you may want to serve, grow, or explore next?</span>
            <textarea name="next_step" rows={5} />
          </label>
        </div>
      </section>

      <section className={`spiritual-gifts-panel spiritual-gifts-step-panel spiritual-gifts-review-card ${stepIndex === reviewStep ? "active" : ""}`}>
        <p className="section-label">Ready</p>
        <h2>Submit your Spiritual Gifts assessment.</h2>
        <p>
          Your 1-5 responses are complete. When you submit, your report will be generated
          and emailed to you as a PDF.
        </p>
      </section>

      <div className={`fruitlife-step-controls spiritual-gifts-step-controls ${stepIndex === 0 ? "start" : ""}`}>
        {stepIndex > 0 ? (
          <button className="button secondary" onClick={goBack} type="button">
            Back
          </button>
        ) : null}
        {stepIndex < reviewStep ? (
          <button
            className="button primary"
            disabled={channel === "app" && !lockIdentity}
            onClick={goNext}
            type="button"
          >
            {stepIndex === 0 ? "Start questions" : "Next"}
          </button>
        ) : (
          <button className="button primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting and building your PDF..." : "Submit Spiritual Gifts Assessment"}
          </button>
        )}
      </div>
    </form>
  );
}

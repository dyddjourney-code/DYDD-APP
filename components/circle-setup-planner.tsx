"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  blankCirclePlan,
  circleSizes,
  completionGoals,
  normalizePlan,
  validatePlan,
  scheduledDates,
  meetingLessons,
  planGoal,
  type CirclePlan,
  type SavedCircle,
} from "@/lib/circles/plan";
import { CircleScheduleEditor } from "./circle-schedule-editor";
import { CircleFieldGuide } from "@/components/circle-field-guide";
const stages = ["Circle details", "Meeting schedule", "People", "Review"];
export function CircleSetupPlanner({ renderDashboard }: { renderDashboard?: (plan: CirclePlan, tab: string, samples: boolean) => ReactNode }) {
  const params = useSearchParams();
  const query = new URLSearchParams();
  for (const key of ["review", "key"])
    if (params.get(key)) query.set(key, params.get(key)!);
  const api = "/api/circles" + (query.size ? "?" + query.toString() : "");
  const storageKey = `dydd-circle-plan-v1:${params.get("review") || "learner"}`;
  const [plan, setPlan] = useState<CirclePlan>(blankCirclePlan),
    [step, setStep] = useState(0);
  const [circles, setCircles] = useState<SavedCircle[]>([]),
    [selected, setSelected] = useState<SavedCircle | null>(null);
  const [newId, setNewId] = useState(""),
    [workspace, setWorkspace] = useState(false),
    [tab, setTab] = useState(params.get("fieldGuide") === "1" ? "Field Guide" : "Progress");
  const [showSetup, setShowSetup] = useState(true);
  const [samples, setSamples] = useState(true);
  const [participant, setParticipant] = useState({ name: "", email: "" });
  const [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loaded, setLoaded] = useState(false),
    [signedIn, setSignedIn] = useState(true);
  useEffect(() => {
    let ignore = false;
    setNewId(crypto.randomUUID());
    setLoaded(false);
    (async () => {
      try {
        const response = await fetch(api, { cache: "no-store" });
        const data = await response.json();
        if (ignore) return;
        if (response.status === 401) setSignedIn(false);
        else if (!response.ok)
          throw Error(data.error || "Your Circles could not be loaded.");
        else {
          setSignedIn(true);
          setCircles(data.circles);
          setShowSetup(data.circles.length === 0);
          const requested = new URL(window.location.href).searchParams.get(
            "circle",
          );
          const circle = data.circles.find(
            (c: SavedCircle) => requested ? c.id === requested : c.status === "active",
          );
          if (circle) {
            setShowSetup(true);
            setSelected(circle);
            setPlan(normalizePlan(circle.plan));
            setWorkspace(circle.status !== "draft");
          } else if (requested)
            setError("This Circle is not available in your account.");
        }
        const saved = localStorage.getItem(storageKey);
        if (
          saved &&
          !new URL(window.location.href).searchParams.get("circle") &&
          !data.circles?.some((c: SavedCircle) => c.status === "active")
        ) {
          try {
            const p = normalizePlan(JSON.parse(saved));
            if (!validatePlan(p)) setPlan(p);
          } catch {}
        }
      } catch (e) {
        if (!ignore) setError((e as Error).message);
      } finally {
        if (!ignore) setLoaded(true);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [api, storageKey]);
  const size = circleSizes[plan.format],
    peopleCount = plan.participants.length + 1;
  function change(p: CirclePlan) {
    setPlan(p);
    setNotice("");
    setError("");
  }
  function update(field: keyof CirclePlan, value: string) {
    change({ ...plan, [field]: value });
  }
  function rememberCircle(id?: string) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("circle", id);
    else url.searchParams.delete("circle");
    window.history.replaceState(null, "", url);
  }
  function open(circle: SavedCircle) {
    setShowSetup(true);
    setTab("Progress");
    setSamples(true);
    rememberCircle(circle.id);
    setSelected(circle);
    setPlan(normalizePlan(circle.plan));
    setWorkspace(circle.status !== "draft");
    setStep(0);
    setParticipant({ name: "", email: "" });
    setError("");
    setNotice("");
  }
  function startNew() {
    setShowSetup(true);
    setSamples(true);
    rememberCircle();
    setSelected(null);
    setNewId(crypto.randomUUID());
    setPlan(blankCirclePlan());
    setStep(0);
    setWorkspace(false);
    setParticipant({ name: "", email: "" });
    setError("");
    setNotice("");
  }
  function next() {
    if (step === 0 && !plan.name.trim()) {
      setError("Give your Circle a name before continuing.");
      return;
    }
    if (
      step === 0 &&
      (!Number.isInteger(+plan.expectedPeople) ||
        +plan.expectedPeople < size.min ||
        +plan.expectedPeople > size.max ||
        +plan.expectedPeople < peopleCount)
    ) {
      setError(`Choose ${size.label}, including you and everyone listed.`);
      return;
    }
    if (step === 1) {
      const invalid = validatePlan(plan);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    if (step === 2 && (participant.name.trim() || participant.email.trim())) {
      setError(
        "Add the participant, or clear the name and email before continuing.",
      );
      return;
    }
    setStep(Math.min(3, step + 1));
    setError("");
  }
  async function save(status: SavedCircle["status"]) {
    const invalid = validatePlan(plan, status === "active");
    if (invalid) {
      setError(invalid);
      return;
    }
    if (participant.name.trim() || participant.email.trim()) {
      setError("Add or clear the participant before saving.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected?.id || newId,
          revision: selected?.revision || 0,
          status,
          plan,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.error || "Your Circle could not be saved.");
      const circle: SavedCircle = data.circle;
      rememberCircle(circle.id);
      setSelected(circle);
      setCircles((current) => [
        circle,
        ...current.filter((c) => c.id !== circle.id),
      ]);
      setPlan(normalizePlan(circle.plan));
      setWorkspace(circle.status !== "draft");
      if (!workspace) setTab("Progress");
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      setNotice(
        circle.status === "draft"
          ? "Draft saved to your account."
          : "Circle saved. Your workspace is ready.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/circles/export" + (query.size ? "?" + query : ""),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        },
      );
      if (!response.ok) {
        const data = await response.json();
        throw Error(data.error || "The PDF could not be created.");
      }
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = `${plan.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "circle"}-plan.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("PDF plan downloaded.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function addParticipant(event: React.FormEvent) {
    event.preventDefault();
    const name = participant.name.trim(),
      email = participant.email.trim().toLowerCase();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a name and valid email address.");
      return;
    }
    if (plan.participants.some((p) => p.email === email)) {
      setError("That email is already on your participant list.");
      return;
    }
    if (peopleCount >= size.max) {
      setError(`${plan.format} allows ${size.label}, including you.`);
      return;
    }
    change({
      ...plan,
      participants: [...plan.participants, { name, email }],
      expectedPeople: String(Math.max(+plan.expectedPeople, peopleCount + 1)),
    });
    setParticipant({ name: "", email: "" });
  }
  const people = (
    <div className="invite-rail">
      <p>
        <strong>
          {peopleCount} of {plan.expectedPeople} people listed
        </strong>{" "}
        · You’re included as organizer.
      </p>
      <form className="circle-builder-form" onSubmit={addParticipant}>
        <div className="circle-field-pair">
          <label htmlFor="participant-name">
            Participant name
            <input
              id="participant-name"
              maxLength={120}
              required
              value={participant.name}
              onChange={(e) =>
                setParticipant({ ...participant, name: e.target.value })
              }
            />
          </label>
          <label htmlFor="participant-email">
            Email address
            <input
              id="participant-email"
              type="email"
              maxLength={254}
              required
              value={participant.email}
              onChange={(e) =>
                setParticipant({ ...participant, email: e.target.value })
              }
            />
          </label>
        </div>
        <button className="button secondary" type="submit">
          Add person
        </button>
      </form>
      {plan.participants.length === 0 ? (
        <p className="circle-fine-print">Add people now or later.</p>
      ) : (
        <ul className="circle-planned-roster">
          {plan.participants.map((p) => (
            <li key={p.email}>
              <div>
                <strong>{p.name}</strong>
                <span>{p.email}</span>
                {workspace && <small>Not invited</small>}
              </div>
              <button
                className="button secondary"
                type="button"
                aria-label={`Remove ${p.name}`}
                onClick={() =>
                  change({
                    ...plan,
                    participants: plan.participants.filter(
                      (person) => person.email !== p.email,
                    ),
                  })
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {workspace && (
        <p className="circle-fine-print">
          Listed only · invitations are not enabled yet.
        </p>
      )}
    </div>
  );
  const dates = scheduledDates(plan);
  return (
    <section
      id="start-circle"
      className="camp-circle-panel circle-setup"
      aria-labelledby="start-circle-title"
    >
      <div className="card-heading wide-heading circle-dashboard-heading"><h2 id="start-circle-title">{showSetup ? (workspace ? plan.name : selected ? "Edit your Circle" : "Start a Circle") : "Your Circles"}</h2><button className="button secondary" type="button" onClick={startNew} disabled={busy}>Start another Circle</button></div>
      {!loaded ? (
        <p role="status">Loading your Circles…</p>
      ) : (
        <>
          {circles.length > 0 && <section className="circle-saved-list" aria-label="Your saved Circles"><div className="circle-current-heading"><h3>Current Circles</h3><span>{circles.filter(c => c.status !== "archived").length} Circles</span></div><div>{circles.filter(c => c.status !== "archived").map(c => {
            const ds = scheduledDates(c.plan), today = new Date().toLocaleDateString("en-CA", { timeZone: c.plan.timezone }), upcoming = ds.find(d => d >= today), number = upcoming ? ds.indexOf(upcoming) + 1 : 0;
            const modules = number ? [...new Set(meetingLessons(c.plan, number).map(l => l.moduleTitle))].join(" · ") : "";
            return <button type="button" className={`circle-saved-item${selected?.id === c.id && showSetup ? " selected" : ""}`} key={c.id} onClick={() => open(c)} disabled={busy} aria-pressed={selected?.id === c.id && showSetup}><span className="circle-card-topline">{c.plan.format}<b>{c.status === "draft" ? "Draft" : ds[0] && ds[0] > today ? "Not started" : "Scheduled"}</b></span><strong>{c.plan.name}</strong><span>{c.plan.expectedPeople} planned · {c.plan.participants.length + 1} listed</span><span>Start: {ds[0] || "Not set"} · Finish: {ds.at(-1) || "Not set"}</span><span className="circle-card-next"><b>Next meeting</b>{upcoming ? `${upcoming}${c.plan.time ? ` · ${c.plan.time}` : ""} · ${c.plan.timezone}` : "No upcoming meeting scheduled"}</span>{modules && <small>{modules}</small>}<span>{c.status === "draft" ? "Continue setup" : "Progress · Data · Schedule · People · Field Guide"}</span></button>;
          })}</div><details className="circle-archive-drawer"><summary>Archived Circles ({circles.filter(c => c.status === "archived").length})</summary>{circles.filter(c => c.status === "archived").map(c => <button className="circle-saved-item" type="button" key={c.id} onClick={() => open(c)}><strong>{c.plan.name}</strong><span>{c.plan.expectedPeople} planned · View archive</span></button>)}{!circles.some(c => c.status === "archived") && <p>No archived Circles.</p>}</details></section>}
          {!signedIn && (
            <p className="circle-form-error">
              <a
                href={
                  "/login?next=" + encodeURIComponent("/camp-circle/my-circles")
                }
              >
                Sign in
              </a>{" "}
              to save or create your Circle.
            </p>
          )}
          {showSetup && (workspace ? (
            <>
              <div className="circle-workspace-meta">
                <span>{plan.format}</span>
                <span>{plan.meetingCount} meetings</span>
                <span>
                  {dates.at(-1) ? `Finish: ${dates.at(-1)}` : "Dates to be set"}
                </span>
              </div>
              <div
                className="circle-action-row"
                aria-label="Circle workspace sections"
              >
                {["Progress", "Data", "Schedule", "People", "Field Guide"].map((t) => (
                  <button
                    type="button"
                    className={`button${t === tab ? "" : " secondary"}`}
                    aria-pressed={t === tab}
                    key={t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {(tab === "Progress" || tab === "Data") && <><label className="circle-sample-toggle"><input type="checkbox" checked={samples} onChange={e => setSamples(e.target.checked)} />Preview with sample people ({plan.expectedPeople})</label>{renderDashboard?.(plan, tab, samples)}</>}
              <div className="circle-selected-summary"><strong>{plan.name}</strong><span>{Number(plan.expectedPeople)} planned · {plan.participants.length + 1} listed</span><span>Next: {dates.find(d => d >= new Date().toLocaleDateString("en-CA", {timeZone: plan.timezone})) || "No upcoming meeting"}{plan.time ? ` · ${plan.time}` : ""} · {plan.timezone}</span></div>
              {tab === "Schedule" && (
                <>
                  <p className="circle-fine-print">
                    {planGoal(plan)} · {plan.time || "Time to be set"} ·{" "}
                    {plan.timezone} · {plan.meetingMinutes} minutes
                  </p>
                  <CircleScheduleEditor plan={plan} change={change} />
                </>
              )}
              {tab === "People" && people}
              {tab === "Field Guide" && selected?.status === "active" && (
                <CircleFieldGuide key={selected.id} circleId={selected.id} plan={plan} onSchedule={() => setTab("Schedule")} />
              )}
              {tab === "Field Guide" && selected?.status !== "active" && <p>The full Field Guide is available inside a started Circle.</p>}
              <div className="circle-action-row">
                <button
                  type="button"
                  className="button"
                  onClick={() => save("active")}
                  disabled={busy || selected?.status === "archived"}
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => {
                    setWorkspace(false);
                    setStep(0);
                    setNotice("");
                  }}
                  disabled={busy || selected?.status === "archived"}
                >
                  Edit Circle details
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={download}
                  disabled={busy}
                >
                  Download PDF plan
                </button>
              </div>
            </>
          ) : (
            <>
              <ol
                className="circle-setup-stages"
                aria-label="Circle planning steps"
              >
                {stages.map((label, index) => (
                  <li
                    key={label}
                    aria-current={step === index ? "step" : undefined}
                  >
                    <span>{index + 1}</span>
                    {label}
                  </li>
                ))}
              </ol>
              <div className="circle-planner-body">
                <div className="circle-planner-fields">
                  <h3>{stages[step]}</h3>
                  {step === 0 && (
                    <div className="circle-builder-form">
                      <label htmlFor="plan-name">
                        Circle name
                        <input
                          id="plan-name"
                          maxLength={120}
                          value={plan.name}
                          onChange={(e) => update("name", e.target.value)}
                          placeholder="Name your Circle"
                        />
                      </label>
                      <fieldset className="circle-type-options">
                        <legend>Circle type</legend>
                        {Object.entries(circleSizes).map(([format, rule]) => (
                          <label
                            key={format}
                            className={plan.format === format ? "selected" : ""}
                          >
                            <input
                              type="radio"
                              name="circle-type"
                              checked={plan.format === format}
                              value={format}
                              onChange={() => {
                                if (peopleCount > rule.max) {
                                  setError(
                                    `${format} allows ${rule.label}. Remove extra people first.`,
                                  );
                                  return;
                                }
                                change({
                                  ...plan,
                                  format,
                                  expectedPeople: String(
                                    Math.min(
                                      rule.max,
                                      Math.max(rule.min, +plan.expectedPeople),
                                    ),
                                  ),
                                });
                              }}
                            />
                            <strong>{format}</strong>
                            <span>{rule.label}</span>
                          </label>
                        ))}
                      </fieldset>
                      <label htmlFor="plan-size">
                        Expected people, including you
                        <input
                          id="plan-size"
                          type="number"
                          min={size.min}
                          max={Number.isFinite(size.max) ? size.max : undefined}
                          readOnly={plan.format === "Couple"}
                          value={plan.expectedPeople}
                          onChange={(e) =>
                            update("expectedPeople", e.target.value)
                          }
                        />
                      </label>
                    </div>
                  )}
                  {step === 1 && (
                    <div className="circle-builder-form">
                      <div className="circle-field-pair">
                        <label htmlFor="plan-date">
                          Start date
                          <input
                            id="plan-date"
                            type="date"
                            value={plan.startDate}
                            onChange={(e) =>
                              update("startDate", e.target.value)
                            }
                          />
                        </label>
                        <label htmlFor="plan-time">
                          Meeting time
                          <input
                            id="plan-time"
                            type="time"
                            value={plan.time}
                            onChange={(e) => update("time", e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="circle-field-pair">
                        <label htmlFor="plan-timezone">
                          Time zone
                          <select
                            id="plan-timezone"
                            value={plan.timezone}
                            onChange={(e) => update("timezone", e.target.value)}
                          >
                            {[
                              "America/New_York",
                              "America/Chicago",
                              "America/Denver",
                              "America/Los_Angeles",
                              "America/Anchorage",
                              "Pacific/Honolulu",
                              "Europe/London",
                              "Europe/Paris",
                              "Africa/Johannesburg",
                              "Asia/Kolkata",
                              "Australia/Sydney",
                              "UTC",
                            ].map((zone) => (
                              <option key={zone}>{zone}</option>
                            ))}
                          </select>
                        </label>
                        <label htmlFor="meeting-minutes">
                          Meeting length (minutes)
                          <input
                            id="meeting-minutes"
                            type="number"
                            min="15"
                            max="480"
                            value={plan.meetingMinutes}
                            onChange={(e) =>
                              update("meetingMinutes", e.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="circle-field-pair">
                        <label htmlFor="plan-rhythm">
                          Meeting rhythm
                          <select
                            id="plan-rhythm"
                            value={plan.rhythm}
                            onChange={(e) => update("rhythm", e.target.value)}
                          >
                            <option>Weekly</option>
                            <option>Every other week</option>
                            <option>Custom</option>
                          </select>
                        </label>
                        {plan.rhythm === "Custom" && (
                          <label htmlFor="plan-days">
                            Days between meetings
                            <input
                              id="plan-days"
                              type="number"
                              min="1"
                              max="365"
                              value={plan.customDays}
                              onChange={(e) =>
                                update("customDays", e.target.value)
                              }
                            />
                          </label>
                        )}
                      </div>
                      <div className="circle-field-pair">
                        <label htmlFor="plan-mode">
                          Meet
                          <select
                            id="plan-mode"
                            value={plan.meetingMode}
                            onChange={(e) =>
                              update("meetingMode", e.target.value)
                            }
                          >
                            <option>In person</option>
                            <option>Online</option>
                            <option>Hybrid</option>
                          </select>
                        </label>
                        <label htmlFor="plan-location">
                          Location or meeting link
                          <input
                            id="plan-location"
                            maxLength={500}
                            value={plan.location}
                            onChange={(e) => update("location", e.target.value)}
                          />
                        </label>
                      </div>
                      <label htmlFor="plan-target">
                        Section-completion goal
                        <select
                          id="plan-target"
                          value={plan.target}
                          onChange={(e) => update("target", e.target.value)}
                        >
                          {completionGoals.map((goal) => (
                            <option key={goal}>{goal}</option>
                          ))}
                        </select>
                      </label>
                      {plan.target === "Custom goal" && (
                        <label htmlFor="custom-goal">
                          Your goal
                          <input
                            id="custom-goal"
                            maxLength={300}
                            value={plan.customGoal}
                            onChange={(e) =>
                              update("customGoal", e.target.value)
                            }
                          />
                        </label>
                      )}
                      <CircleScheduleEditor plan={plan} change={change} />
                    </div>
                  )}
                  {step === 2 && people}
                  {step === 3 && (
                    <div className="circle-plan-review">
                      <dl>
                        {[
                          ["Circle", plan.name],
                          ["Type", plan.format],
                          [
                            "Expected people",
                            `${plan.expectedPeople}, including you`,
                          ],
                          [
                            "Meet",
                            `${plan.meetingMode}${plan.location ? " · " + plan.location : ""}`,
                          ],
                          [
                            "Time",
                            `${plan.time || "Decide later"} · ${plan.timezone}`,
                          ],
                          ["Completion goal", planGoal(plan)],
                          [
                            "Schedule",
                            `${plan.meetingCount} meetings · ${dates[0] || "Start date needed"} → ${dates.at(-1) || "Finish date needed"}`,
                          ],
                          [
                            "People",
                            `${plan.participants.length} listed plus you`,
                          ],
                        ].map(([key, value]) => (
                          <div key={key}>
                            <dt>{key}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <div>
                        <h4>Your meeting plan</h4>
                        <ol>
                          {dates.map((date, i) => (
                            <li key={i}>
                              <strong>{date}</strong> ·{" "}
                              {[
                                ...new Set(
                                  meetingLessons(plan, i + 1).map(
                                    (l) => l.moduleTitle,
                                  ),
                                ),
                              ].join(" · ") || "Discussion / catch-up"}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                  <div className="circle-action-row">
                    {step > 0 && (
                      <button
                        className="button secondary"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setStep(step - 1);
                          setError("");
                        }}
                      >
                        Back
                      </button>
                    )}
                    {step < 3 ? (
                      <button
                        className="button"
                        type="button"
                        onClick={next}
                        disabled={busy}
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        className="button"
                        type="button"
                        onClick={() => save("active")}
                        disabled={busy || !signedIn}
                      >
                        {busy
                          ? "Saving…"
                          : selected?.status === "active"
                            ? "Save changes"
                            : "Create Circle"}
                      </button>
                    )}
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() =>
                        save(selected?.status === "active" ? "active" : "draft")
                      }
                      disabled={busy || !signedIn}
                    >
                      {selected?.status === "active"
                        ? "Save changes"
                        : "Save draft"}
                    </button>
                    {step === 3 && (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={download}
                        disabled={busy}
                      >
                        Download PDF plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )
          )}
          {error && (
            <p className="circle-form-error" role="alert">
              {error}
            </p>
          )}
          <p className="circle-form-notice" role="status" aria-live="polite">
            {notice}
          </p>
        </>
      )}
    </section>
  );
}

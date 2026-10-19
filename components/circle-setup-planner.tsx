"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Participant = { name: string; email: string };
type CirclePlan = {
  name: string;
  format: string;
  startDate: string;
  time: string;
  timezone: string;
  rhythm: string;
  customDays: string;
  target: string;
  expectedPeople?: string;
  meetingMode?: string;
  location?: string;
  participants: Participant[];
};
const blankPlan: CirclePlan = { name: "", format: "Small group", startDate: "", time: "", timezone: "America/New_York", rhythm: "Weekly", customDays: "14", target: "", expectedPeople: "6", meetingMode: "In person", location: "", participants: [] };
const stages = ["Circle details", "Meeting schedule", "People", "Review"];
const sizes: Record<string, { min: number; max: number; label: string }> = { Couple: { min: 2, max: 2, label: "2 people" }, "Small group": { min: 3, max: 19, label: "3–19 people" }, Class: { min: 20, max: Infinity, label: "20+ people" } };

function validPlan(value: unknown): value is CirclePlan {
  if (!value || typeof value !== "object") return false;
  const p = value as CirclePlan;
  return [p.name, p.format, p.startDate, p.time, p.timezone, p.rhythm, p.customDays, p.target].every(v => typeof v === "string") && Object.hasOwn(sizes, p.format) && [p.expectedPeople, p.meetingMode, p.location].every(v => v === undefined || typeof v === "string") && Array.isArray(p.participants) && p.participants.every(v => v && typeof v.name === "string" && typeof v.email === "string");
}

function meetingDates(plan: CirclePlan) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.startDate)) return [];
  const days = plan.rhythm === "Weekly" ? 7 : plan.rhythm === "Every other week" ? 14 : Number(plan.customDays);
  if (!Number.isInteger(days) || days < 1 || days > 365) return [];
  return Array.from({ length: 4 }, (_, index) => {
    const date = new Date(`${plan.startDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index * days);
    return date.toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });
  });
}

export function CircleSetupPlanner() {
  const params = useSearchParams();
  const storageKey = `dydd-circle-plan-v1:${params.get("review") || "learner"}`;
  const [plan, setPlan] = useState<CirclePlan>(blankPlan);
  const [step, setStep] = useState(0);
  const [participant, setParticipant] = useState<Participant>({ name: "", email: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (validPlan(parsed)) setPlan({ ...blankPlan, ...parsed, expectedPeople: parsed.expectedPeople || String(Math.max(sizes[parsed.format].min, parsed.participants.length + 1)) });
      }
    } catch { setError("This browser could not restore your draft. You can still prepare and download a plan."); }
    setLoaded(true);
  }, [storageKey]);

  function update(field: keyof Omit<CirclePlan, "participants">, value: string) {
    setPlan(current => ({ ...current, [field]: value }));
    setNotice("");
    setError("");
  }

  function savePlan() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(plan));
      setNotice("Draft saved. Invitations have not been sent.");
      setError("");
    } catch { setError("Your browser could not save this draft. Download your plan to keep a copy."); }
  }

  const size = sizes[plan.format];
  const peopleCount = plan.participants.length + 1;

  function changeFormat(format: string) {
    if (peopleCount > sizes[format].max) { setError(`${format} allows ${sizes[format].label}, including you. Remove extra people first.`); return; }
    setPlan(current => ({ ...current, format, expectedPeople: String(Math.min(sizes[format].max, Math.max(sizes[format].min, Number(current.expectedPeople) || sizes[format].min))) }));
    setError(""); setNotice("");
  }

  function nextStep() {
    if (step === 0 && !plan.name.trim()) { setError("Give your Circle a name before continuing."); return; }
    if (step === 0 && (!Number.isInteger(Number(plan.expectedPeople)) || Number(plan.expectedPeople) < size.min || Number(plan.expectedPeople) > size.max || Number(plan.expectedPeople) < peopleCount)) { setError(`Choose ${size.label}, including you and everyone listed.`); return; }
    if (step === 1 && plan.rhythm === "Custom" && (!Number.isInteger(Number(plan.customDays)) || Number(plan.customDays) < 1 || Number(plan.customDays) > 365)) { setError("Choose a custom meeting interval between 1 and 365 days."); return; }
    if (step === 2 && (participant.name.trim() || participant.email.trim())) { setError("Add the participant to your list, or clear the name and email before continuing."); return; }
    setError("");
    setStep(current => Math.min(current + 1, stages.length - 1));
  }

  function addParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = participant.name.trim();
    const email = participant.email.trim().toLowerCase();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a participant name and a valid email address."); return; }
    if (plan.participants.some(p => p.email === email)) { setError("That email is already on your participant list."); return; }
    if (peopleCount >= size.max) { setError(`${plan.format} allows ${size.label}, including you.`); return; }
    setPlan(current => ({ ...current, participants: [...current.participants, { name, email }], expectedPeople: String(Math.max(Number(current.expectedPeople) || size.min, peopleCount + 1)) }));
    setParticipant({ name: "", email: "" });
    setError(""); setNotice("");
  }

  function downloadPlan() {
    const text = [
      "DISCOVER YOUR DIVINE DESIGN — CIRCLE PLAN", "Draft — invitations not sent.", "",
      `Circle: ${plan.name || "Not named yet"}`, `Type: ${plan.format}`, `Expected people (including organizer): ${plan.expectedPeople}`, `Meeting: ${plan.meetingMode}`, `Location or meeting link: ${plan.location || "Decide later"}`, `Start date: ${plan.startDate || "Decide later"}`, `Meeting time: ${plan.time || "Decide later"}`, `Time zone: ${plan.timezone}`, `Rhythm: ${plan.rhythm === "Custom" ? `Every ${plan.customDays} days` : plan.rhythm}`, `Section-completion goal: ${plan.target || "Decide later"}`, "", "PEOPLE", "You — organizer", ...plan.participants.map(p => `${p.name} <${p.email}>`), "", "FIRST FOUR MEETINGS", ...meetingDates(plan),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(plan.name || "circle").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-plan.txt`; link.click();
    URL.revokeObjectURL(url);
    setNotice("Plan downloaded.");
  }

  return (
    <section id="start-circle" className="camp-circle-panel circle-setup" aria-labelledby="start-circle-title">
      <div className="card-heading wide-heading"><h2 id="start-circle-title">Start a Circle</h2></div>
      {!loaded ? <p role="status">Loading your Circle plan…</p> : <>
        <ol className="circle-setup-stages" aria-label="Circle planning steps">{stages.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
        <div className="circle-planner-body">
          <div className="circle-planner-fields">
            <h3>{stages[step]}</h3>
            {step === 0 && <div className="circle-builder-form">
              <label htmlFor="plan-name">Circle name<input id="plan-name" maxLength={120} value={plan.name} onChange={e => update("name", e.target.value)} placeholder="Name your Circle" /></label>
              <fieldset className="circle-type-options"><legend>Circle type</legend>{Object.entries(sizes).map(([format, rule]) => <label key={format} className={plan.format === format ? "selected" : ""}><input type="radio" name="circle-type" value={format} checked={plan.format === format} onChange={() => changeFormat(format)} /><strong>{format}</strong><span>{rule.label}</span></label>)}</fieldset>
              <label htmlFor="plan-size">Expected people, including you<input id="plan-size" type="number" min={size.min} max={Number.isFinite(size.max) ? size.max : undefined} readOnly={plan.format === "Couple"} value={plan.expectedPeople || ""} onChange={e => update("expectedPeople", e.target.value)} /></label>
            </div>}
            {step === 1 && <div className="circle-builder-form"><div className="circle-field-pair"><label htmlFor="plan-date">Start date (optional)<input id="plan-date" type="date" value={plan.startDate} onChange={e => update("startDate", e.target.value)} /></label><label htmlFor="plan-time">Meeting time (optional)<input id="plan-time" type="time" value={plan.time} onChange={e => update("time", e.target.value)} /></label></div><label htmlFor="plan-timezone">Time zone<select id="plan-timezone" value={plan.timezone} onChange={e => update("timezone", e.target.value)}>{["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris", "Africa/Johannesburg", "Asia/Kolkata", "Australia/Sydney", "UTC"].map(zone => <option key={zone}>{zone}</option>)}</select></label><label htmlFor="plan-rhythm">Meeting rhythm<select id="plan-rhythm" value={plan.rhythm} onChange={e => update("rhythm", e.target.value)}><option>Weekly</option><option>Every other week</option><option>Custom</option></select></label>{plan.rhythm === "Custom" && <label htmlFor="plan-days">Days between meetings<input id="plan-days" type="number" min={1} max={365} value={plan.customDays} onChange={e => update("customDays", e.target.value)} /></label>}<div className="circle-field-pair"><label htmlFor="plan-mode">Meet<select id="plan-mode" value={plan.meetingMode} onChange={e => update("meetingMode", e.target.value)}><option>In person</option><option>Online</option><option>Hybrid</option></select></label><label htmlFor="plan-location">Location or meeting link (optional)<input id="plan-location" maxLength={500} value={plan.location || ""} onChange={e => update("location", e.target.value)} placeholder="Address or video meeting link" /></label></div><label htmlFor="plan-target">Section-completion goal (optional)<input id="plan-target" maxLength={300} value={plan.target} placeholder="For example: finish the assigned section before we meet" onChange={e => update("target", e.target.value)} /></label></div>}
            {step === 2 && <div className="invite-rail"><p><strong>{peopleCount} of {plan.expectedPeople} people listed</strong> · You’re included as organizer.</p><form className="circle-builder-form" onSubmit={addParticipant}><label htmlFor="participant-name">Participant name<input id="participant-name" autoComplete="off" maxLength={120} required value={participant.name} onChange={e => setParticipant(current => ({ ...current, name: e.target.value }))} /></label><label htmlFor="participant-email">Email address<input id="participant-email" type="email" autoComplete="off" maxLength={254} required value={participant.email} onChange={e => setParticipant(current => ({ ...current, email: e.target.value }))} /></label><button type="submit" className="button secondary">Add person</button></form>{plan.participants.length === 0 ? <p className="circle-fine-print">Add people now or later.</p> : <ul className="circle-planned-roster">{plan.participants.map(p => <li key={p.email}><div><strong>{p.name}</strong><span>{p.email}</span></div><button type="button" className="button secondary" aria-label={`Remove ${p.name} from draft`} onClick={() => { setPlan(current => ({ ...current, participants: current.participants.filter(person => person.email !== p.email) })); setNotice(""); }}>Remove</button></li>)}</ul>}</div>}
            {step === 3 && <div className="circle-plan-review"><dl><div><dt>Circle</dt><dd>{plan.name}</dd></div><div><dt>Type</dt><dd>{plan.format}</dd></div><div><dt>Expected people</dt><dd>{plan.expectedPeople}, including you</dd></div><div><dt>Meet</dt><dd>{plan.meetingMode}{plan.location ? ` · ${plan.location}` : ""}</dd></div><div><dt>Start</dt><dd>{plan.startDate || "Decide later"}{plan.time ? ` at ${plan.time}` : ""}</dd></div><div><dt>Time zone</dt><dd>{plan.timezone}</dd></div><div><dt>Rhythm</dt><dd>{plan.rhythm === "Custom" ? `Every ${plan.customDays} days` : plan.rhythm}</dd></div><div><dt>Completion goal</dt><dd>{plan.target || "Decide later"}</dd></div><div><dt>People</dt><dd>{plan.participants.length ? plan.participants.map(p => `${p.name} (${p.email})`).join(", ") : "Add later"}</dd></div></dl>{meetingDates(plan).length > 0 && <div><h4>First four meetings</h4><ol>{meetingDates(plan).map(date => <li key={date}>{date}{plan.time ? ` · ${plan.time}` : ""}</li>)}</ol><p className="circle-fine-print">{plan.timezone}</p></div>}</div>}
            {error && <p className="circle-form-error" role="alert">{error}</p>}
            <p className="circle-form-notice" role="status" aria-live="polite">{notice}</p>
            <div className="circle-action-row">{step > 0 && <button type="button" className="button secondary" onClick={() => { setStep(current => current - 1); setError(""); }}>Back</button>}{step < stages.length - 1 && <button type="button" className="button" onClick={nextStep}>Continue</button>}<button type="button" className="button secondary" onClick={savePlan}>Save draft</button>{step === 3 && <button type="button" className="button" onClick={downloadPlan}>Download plan</button>}</div>
          </div>
        </div>
      </>}

    </section>
  );
}

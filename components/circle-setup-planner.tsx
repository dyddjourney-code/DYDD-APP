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
  participants: Participant[];
};
const blankPlan: CirclePlan = { name: "", format: "Small group", startDate: "", time: "", timezone: "America/New_York", rhythm: "Weekly", customDays: "14", target: "", participants: [] };
const stages = ["Your Circle", "Your rhythm", "Your people", "Review your plan"];

function validPlan(value: unknown): value is CirclePlan {
  if (!value || typeof value !== "object") return false;
  const p = value as CirclePlan;
  return [p.name, p.format, p.startDate, p.time, p.timezone, p.rhythm, p.customDays, p.target].every(v => typeof v === "string") && Array.isArray(p.participants) && p.participants.every(v => v && typeof v.name === "string" && typeof v.email === "string");
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
        if (validPlan(parsed)) setPlan(parsed);
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
      setNotice("Draft saved in this browser. No Circle has been launched and no invitations have been sent.");
      setError("");
    } catch { setError("Your browser could not save this draft. Download your plan to keep a copy."); }
  }

  function nextStep() {
    if (step === 0 && !plan.name.trim()) { setError("Give your Circle a name before continuing."); return; }
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
    if (plan.format === "Couple" && plan.participants.length >= 1) { setError("A Couple Circle includes you and one invited participant."); return; }
    setPlan(current => ({ ...current, participants: [...current.participants, { name, email }] }));
    setParticipant({ name: "", email: "" });
    setError(""); setNotice("");
  }

  function downloadPlan() {
    const text = [
      "DISCOVER YOUR DIVINE DESIGN — CIRCLE PLAN", "Planning draft only — no invitations sent or Circle access granted.", "",
      `Circle: ${plan.name || "Not named yet"}`, `Type: ${plan.format}`, `Start date: ${plan.startDate || "Decide later"}`, `Meeting time: ${plan.time || "Decide later"}`, `Time zone: ${plan.timezone}`, `Rhythm: ${plan.rhythm === "Custom" ? `Every ${plan.customDays} days` : plan.rhythm}`, `Section-completion goal: ${plan.target || "Decide later"}`, "", "PARTICIPANTS TO INVITE", ...plan.participants.map(p => `${p.name} <${p.email}> — Not invited`), "", "INVITATION-ONLY ACCESS", "An existing user with active paid main-journey access accepts their personal invitation to enter the Circle. New users create an account and pay for a journey subscription first. Existing users without active access must activate it. The organizer also needs active paid journey access.", "", "NEXT STAGE", "Connect secure personal invitation links, email delivery, account/subscription verification, membership, and scheduled messages before launch.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(plan.name || "circle").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-plan.txt`; link.click();
    URL.revokeObjectURL(url);
    setNotice("Plan downloaded. This is a planning copy, not a live Circle or invitation link.");
  }

  return (
    <section id="start-circle" className="camp-circle-panel circle-setup" aria-labelledby="start-circle-title">
      <div className="card-heading wide-heading"><p className="section-label">Start a Circle</p><h2 id="start-circle-title">Make room for your people.</h2><p>Prepare a couple, small group, or class for the main Discover Your Divine Design journey. Your existing Circles remain below.</p></div>
      <div className="privacy-callout"><strong>Plan your Circle · Setup preview</strong><p>This planning tool saves a draft in this browser only. It does not yet create a live Circle, send email invitations, generate access links, or collect subscriptions. Those connections are the next build stage. Avoid saving participant information on a shared computer.</p></div>
      {!loaded ? <p role="status">Loading your Circle plan…</p> : <>
        <ol className="circle-setup-stages" aria-label="Circle planning steps">{stages.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
        <div className="circle-planner-body">
          <div className="circle-planner-fields">
            <h3>{stages[step]}</h3>
            {step === 0 && <div className="circle-builder-form"><label htmlFor="plan-name">Circle name<input id="plan-name" maxLength={120} value={plan.name} onChange={e => update("name", e.target.value)} placeholder="Give your gathering a name" /></label><label htmlFor="plan-format">Circle type<select id="plan-format" value={plan.format} onChange={e => { if (e.target.value === "Couple" && plan.participants.length > 1) { setError("A Couple Circle includes you and one invited participant. Remove extra people in Your people first, or keep this as a Small group or Class. Your participant list has not changed."); return; } update("format", e.target.value); }}><option>Couple</option><option>Small group</option><option>Class</option></select></label><p className="circle-fine-print">You are the organizer and a participant. Each person—including you—needs their own account and active paid main-journey subscription. No shared logins or host-purchased seat packs.</p></div>}
            {step === 1 && <div className="circle-builder-form"><p>You can decide dates later. Meeting rhythm and section-completion goals are separate.</p><div className="circle-field-pair"><label htmlFor="plan-date">Start date<input id="plan-date" type="date" value={plan.startDate} onChange={e => update("startDate", e.target.value)} /></label><label htmlFor="plan-time">Meeting time<input id="plan-time" type="time" value={plan.time} onChange={e => update("time", e.target.value)} /></label></div><label htmlFor="plan-timezone">Time zone<select id="plan-timezone" value={plan.timezone} onChange={e => update("timezone", e.target.value)}>{["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris", "Africa/Johannesburg", "Asia/Kolkata", "Australia/Sydney", "UTC"].map(zone => <option key={zone}>{zone}</option>)}</select></label><label htmlFor="plan-rhythm">Meeting rhythm<select id="plan-rhythm" value={plan.rhythm} onChange={e => update("rhythm", e.target.value)}><option>Weekly</option><option>Every other week</option><option>Custom</option></select></label>{plan.rhythm === "Custom" && <label htmlFor="plan-days">Days between meetings<input id="plan-days" type="number" min={1} max={365} value={plan.customDays} onChange={e => update("customDays", e.target.value)} /></label>}<label htmlFor="plan-target">Section-completion goal (optional)<input id="plan-target" maxLength={300} value={plan.target} placeholder="For example: finish the assigned section before we meet" onChange={e => update("target", e.target.value)} /></label></div>}
            {step === 2 && <div className="invite-rail"><p>Add the people you plan to invite. This is a preparation list; adding someone does not send an invitation.</p><form className="circle-builder-form" onSubmit={addParticipant}><label htmlFor="participant-name">Participant name<input id="participant-name" autoComplete="off" maxLength={120} required value={participant.name} onChange={e => setParticipant(current => ({ ...current, name: e.target.value }))} /></label><label htmlFor="participant-email">Email address<input id="participant-email" type="email" autoComplete="off" maxLength={254} required value={participant.email} onChange={e => setParticipant(current => ({ ...current, email: e.target.value }))} /></label><button type="submit" className="button secondary">Add to invitation list</button></form>{plan.participants.length === 0 ? <p className="circle-fine-print">No participants listed yet. You can add people now or come back later.</p> : <ul className="circle-planned-roster">{plan.participants.map(p => <li key={p.email}><div><strong>{p.name}</strong><span>{p.email}</span><small>Not invited · Planning draft</small></div><button type="button" className="button secondary" aria-label={`Remove ${p.name} from draft`} onClick={() => { setPlan(current => ({ ...current, participants: current.participants.filter(person => person.email !== p.email) })); setNotice(""); }}>Remove</button></li>)}</ul>}</div>}
            {step === 3 && <div className="circle-plan-review"><dl><div><dt>Circle</dt><dd>{plan.name}</dd></div><div><dt>Type</dt><dd>{plan.format}</dd></div><div><dt>Start</dt><dd>{plan.startDate || "Decide later"}{plan.time ? ` at ${plan.time}` : ""}</dd></div><div><dt>Time zone</dt><dd>{plan.timezone}</dd></div><div><dt>Rhythm</dt><dd>{plan.rhythm === "Custom" ? `Every ${plan.customDays} days` : plan.rhythm}</dd></div><div><dt>Completion goal</dt><dd>{plan.target || "Decide later"}</dd></div><div><dt>People to invite</dt><dd>{plan.participants.length ? plan.participants.map(p => `${p.name} (${p.email})`).join(", ") : "Add later"}</dd></div></dl>{meetingDates(plan).length > 0 && <div><h4>First four planned meetings</h4><ol>{meetingDates(plan).map(date => <li key={date}>{date}{plan.time ? ` · ${plan.time}` : ""}</li>)}</ol><p className="circle-fine-print">Preview only, in {plan.timezone}. These dates do not schedule emails.</p></div>}<div className="privacy-callout"><strong>Your plan is ready for review—not launched.</strong><p>Save or download your draft. Live invitations and subscription-gated membership are not connected yet. You can edit this plan at any time.</p></div></div>}
            {error && <p className="circle-form-error" role="alert">{error}</p>}
            <p className="circle-form-notice" role="status" aria-live="polite">{notice}</p>
            <div className="circle-action-row">{step > 0 && <button type="button" className="button secondary" onClick={() => { setStep(current => current - 1); setError(""); }}>Back</button>}{step < stages.length - 1 && <button type="button" className="button" onClick={nextStep}>Continue</button>}<button type="button" className="button secondary" onClick={savePlan}>Save draft</button>{step === 3 && <button type="button" className="button" onClick={downloadPlan}>Download plan</button>}</div>
          </div>
          <aside className="circle-access-explainer"><p className="section-label">Invitation-only access</p><h3>One invitation.<br />Two ways to arrive.</h3><article><strong>Already an app user?</strong><p>Accept your personal invitation. If your paid main-journey subscription is active, you enter the Circle. If not, activate it first.</p></article><article><strong>New to DYDD?</strong><p>Follow your invitation, create your account, and pay for your journey subscription. Circle access follows verified subscription activation and acceptance of your invitation.</p></article><p>No public “Join a Circle” button. No random joining. No access granted by adding an email to a roster.</p></aside>
        </div>
      </>}
      <details className="circle-next-stage"><summary>What comes next for Circle organizers?</summary><div><p>Personal invitation emails and secure links, then a roster that distinguishes <strong>Invited → Accepted / Subscription Needed → Ready to Begin → Active</strong>, with declined and expired invitations clearly separated. Payment status will be verified—not entered by the leader.</p><p>Scheduled welcome, before-session, and follow-up emails will follow your Circle calendar, with pause and reschedule controls. Private workbook entries and assessment details will not be shared automatically.</p></div></details>
    </section>
  );
}

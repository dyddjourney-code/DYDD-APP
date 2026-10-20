"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CirclePlan } from "@/lib/circles/plan";
import { meetingLessons, scheduledDates } from "@/lib/circles/plan";
import { facilitatorPlaybookStages } from "@/lib/journey/facilitator-playbook";
import type { FieldGuideContent, GuideArticle } from "@/lib/circles/field-guide-types";

type Area = "launch" | "sessions" | "tools";
function Articles({ items }: { items: GuideArticle[] }) {
  return <div className="fg-articles">{items.map((item, index) => <section key={index}><h4>{item.title}</h4>{item.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</section>)}</div>;
}
function Reading({ items }: { items: GuideArticle[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const panelId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const article = selected === null ? null : items[selected];
  function open(index: number) {
    setSelected(index);
    requestAnimationFrame(() => {
      panel.current?.scrollTo({ top: 0 });
      panel.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 800px)").matches) panel.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  return <aside className="fg-reading-companion" aria-label="Deeper guidance">
    <div className="fg-deeper-label"><h4>Go deeper when you need it</h4><p>Choose a reading. Your practical guidance stays beside you.</p></div>
    <div className="fg-readings">{items.map((item, index) => <button type="button" key={item.title} ref={node => { buttons.current[index] = node; }} aria-expanded={selected === index} aria-controls={panelId} onClick={() => selected === index ? setSelected(null) : open(index)}>{item.title}<span aria-hidden="true">{selected === index ? "−" : "+"}</span></button>)}</div>
    {article && <div className="fg-reading-panel" id={panelId} ref={panel} tabIndex={-1} role="region" aria-label={article.title}>
      <div className="fg-reading-heading"><p className="eyebrow">Full guidance</p><button type="button" className="fg-close-reading" onClick={() => { const previous = selected; setSelected(null); if (previous !== null) buttons.current[previous]?.focus({ preventScroll: true }); }}>Close reading</button></div>
      <h4>{article.title}</h4><div className="fg-source-reading">{article.paragraphs.map((p, i) => p.length < 95 && !/[.!?…]$/.test(p) && !p.startsWith('“') ? <h5 key={i}>{p}</h5> : <p key={i}>{p}</p>)}</div>
    </div>}
  </aside>;
}
function ReadingLayout({ items, children }: { items: GuideArticle[]; children: React.ReactNode }) {
  return <div className={items.length ? "fg-reading-layout" : "fg-reading-layout fg-no-readings"}><div className="fg-main-guidance">{children}</div>{items.length > 0 && <Reading items={items} />}</div>;
}

export function CircleFieldGuide({ circleId, plan, onSchedule }: { circleId: string; plan: CirclePlan; onSchedule: () => void }) {
  const params = useSearchParams();
  const [content, setContent] = useState<FieldGuideContent | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [area, setArea] = useState<Area>("launch");
  const [step, setStep] = useState(0);
  const [session, setSession] = useState(0);
  const [mode, setMode] = useState<"prepare" | "live">("prepare");
  const [storageReady, setStorageReady] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const review = params.get("review"), key = params.get("key");
  const memoryKey = `dydd-leader-preparation-v1:${circleId}`;
  useEffect(() => {
    const controller = new AbortController();
    setContent(null); setError("");
    const q = new URLSearchParams({ circle: circleId });
    if (review && key) { q.set("review", review); q.set("key", key); }
    (async () => {
      try {
        const response = await fetch("/api/circles/field-guide?" + q, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || "Your Field Guide could not be loaded.");
        if (!controller.signal.aborted) setContent(data.content);
      } catch (e) { if (!controller.signal.aborted) setError((e as Error).message); }
    })();
    return () => controller.abort();
  }, [circleId, review, key, retry]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(memoryKey) || "null");
      setStep(Number.isInteger(saved?.step) && saved.step >= 0 && saved.step < 6 ? saved.step : 0);
    } catch { setStorageUnavailable(true); }
    setStorageReady(true);
  }, [memoryKey]);
  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(memoryKey, JSON.stringify({ step })); }
    catch { setStorageUnavailable(true); }
  }, [step, memoryKey, storageReady]);
  function goStep(index: number) {
    setStep(index);
    requestAnimationFrame(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "start" }); });
  }
  function openSession(index: number) { setSession(index); setMode("prepare"); setArea("sessions"); }
  if (error) return <section className="fg-status" role="alert"><h3>Your Field Guide</h3><p>{error}</p><button type="button" className="button secondary" onClick={() => setRetry(retry + 1)}>Try again</button></section>;
  if (!content) return <section className="fg-status" role="status" aria-label="Loading Field Guide"><div className="fg-skeleton" /><div className="fg-skeleton" /><p>Opening your leader resources…</p></section>;
  const current = content.steps[step];
  const dates = scheduledDates(plan);
  const stage = facilitatorPlaybookStages[session];
  const matchingMeetings = Array.from({ length: plan.meetingCount }, (_, i) => ({ number: i + 1, date: dates[i], lessons: meetingLessons(plan, i + 1) })).filter(m => m.lessons.some(l => session === 0 ? ["welcome-and-orientation", "what-is-dydd"].includes(l.moduleSlug) : session === 7 ? l.moduleSlug === "niche" && l.slug.startsWith("niche-") && ["niche-congratulations-75", "niche-prayer-76", "niche-whats-next-77"].includes(l.slug) : session === 6 ? l.moduleSlug === "niche" && !["niche-congratulations-75", "niche-prayer-76", "niche-whats-next-77"].includes(l.slug) : l.moduleSlug === stage.slug));
  return <section className="circle-field-guide-workspace" aria-label="Circle leader Field Guide">
    <header className="fg-header"><div><p className="eyebrow">Your leader companion</p><h2>Field Guide</h2><p>Prepare a little at a time. Lead with what you need beside you.</p></div><span className="fg-eight">8 distinct sessions<br /><small>Your Circle’s own pace</small></span></header>
    <nav className="fg-areas" aria-label="Field Guide areas">{([["launch", "Before You Launch", "Prepare your Circle"], ["sessions", "Session Guides", "Lead each gathering"], ["tools", "Leader Toolkit", "Find practical help"]] as const).map(([id, title, hint], i) => <button type="button" key={id} aria-pressed={area === id} onClick={() => setArea(id)}><span className="fg-area-number" aria-hidden="true">0{i + 1}</span><span><strong>{title}</strong><small>{hint}</small></span></button>)}</nav>
    {area === "launch" && <div className="fg-launch">
      <div className="fg-section-intro"><h3>A simple path to your first gathering</h3><p>Six preparation steps—not another course. Come back anytime, in any order. Read the essentials and open fuller guidance when it helps. Use this as a companion whenever you need it—there is nothing to complete or unlock.</p></div>
      <div className="fg-path-layout"><nav className="fg-path" aria-label="Leader preparation steps"><ol>{content.steps.map((s, i) => <li key={s.id}><button type="button" aria-current={step === i ? "step" : undefined} onClick={() => goStep(i)}><span className="fg-step-number">{i + 1}</span><span>{s.title}<small>{s.subtitle}</small></span></button></li>)}</ol><p className="fg-device-note">{storageUnavailable ? "You can use every guide. Your place may not remain after leaving this device." : "Your place is remembered on this device. Explore freely—nothing needs to be marked complete."}</p></nav>
      <article className="fg-step-content" key={current.id}>
        <p className="eyebrow">Before You Launch · Step {step + 1} of {content.steps.length}</p><h3 tabIndex={-1} ref={heading}>{current.title}</h3><p className="fg-subtitle">{current.subtitle}</p>
        <ReadingLayout items={current.readings}>
        {current.id === "framework" && <ol className="fg-journey-map" aria-label="Eight-session journey">{facilitatorPlaybookStages.map((s, i) => <li key={s.session}><span>{i + 1}</span>{s.title}</li>)}</ol>}
        <Articles items={current.essentials} />
        <aside className="fg-action"><span className="eyebrow">Put it into practice</span><p>{current.action}</p>{current.id === "prepare" && <button className="button secondary" type="button" onClick={onSchedule}>Open my Circle schedule</button>}{current.id === "invite" && <button className="button secondary" type="button" onClick={() => setArea("tools")}>Open invitation tools</button>}{current.id === "ready" && <button className="button" type="button" onClick={() => openSession(0)}>Prepare Session 1</button>}</aside>
        </ReadingLayout>
        <div className="fg-step-controls"><button type="button" className="button secondary" disabled={step === 0} onClick={() => goStep(step - 1)}>Previous step</button>{step < content.steps.length - 1 ? <button type="button" className="button" onClick={() => goStep(step + 1)}>Next: {content.steps[step + 1].title}</button> : <button type="button" className="button" onClick={() => openSession(0)}>Go to Session 1</button>}</div>
      </article></div>
    </div>}
    {area === "sessions" && <div className="fg-sessions"><div className="fg-section-intro"><h3>Eight sessions. Room for your rhythm.</h3><p>The eight guide sessions stay the same. Choose fewer meetings to combine content, or more meetings to spread it out. Schedule distributes individual lessons; adjust the assignments there to give each topic the time your Circle needs.</p></div><nav className="fg-session-picker" aria-label="Choose a session">{facilitatorPlaybookStages.map((s, i) => <button type="button" key={s.session} aria-pressed={session === i} onClick={() => { setSession(i); setMode("prepare"); }}><span>{i + 1}</span><strong>{s.title}</strong>{i === 0 && <small>Full guide</small>}</button>)}</nav>
      <article className="fg-session-content"><p className="eyebrow">{stage.session}</p><h3>{stage.title}</h3>{matchingMeetings.length > 0 ? <p className="fg-schedule-context">On your schedule: {matchingMeetings.map(m => `Meeting ${m.number}${m.date ? " · " + m.date : ""}`).join("; ")}</p> : <p className="fg-schedule-context">Assign the related lessons in your Circle schedule when you’re ready.</p>}
      {session === 0 ? <><div className="fg-mode-picker" aria-label="Session 1 view"><button type="button" className="button" aria-pressed={mode === "prepare"} onClick={() => setMode("prepare")}>Prepare</button><button type="button" className="button" aria-pressed={mode === "live"} onClick={() => setMode("live")}>Leading now</button></div>
      {mode === "prepare" ? <ReadingLayout key="prepare" items={content.sessionOne.readings}><Articles items={content.sessionOne.prepare} /><aside className="fg-action"><p>Ready for the gathering? Open Leading now for the flow, questions, and quick help.</p><button type="button" className="button" onClick={() => setMode("live")}>Open Leading now</button></aside></ReadingLayout> : <div className="fg-live-layout"><div>
        <div className="fg-anchor"><p className="eyebrow">Keep this at the center</p><h4>Grace → intentional design → faithful response</h4><p>Ephesians 2:8–10 · Help people begin noticing God’s work without pressure to have their calling settled tonight.</p></div>
        <details open className="fg-live-flow"><summary>Gathering flow <span>Suggested 90-minute example · adapt to your meeting</span></summary><ol>{content.flow.map(item => <li key={item.title}><span className="fg-minutes">{item.minutes} min</span><div><h4>{item.title}</h4><p>{item.detail}</p></div></li>)}</ol></details>
        </div><div className="fg-live-help"><section className="fg-discuss"><h4>Choose a few good questions</h4><p>The main questions come from the Playbook. Follow-ups and practical responses are suggested adaptations—not additional participant workbook questions.</p>{content.questions.map((q, i) => <details key={q.question}><summary><span className="fg-question-number">{i + 1}</span>{q.question}</summary><div><p><strong>Try a follow-up:</strong> {q.followup}</p><p><strong>Listen for:</strong> {q.help}</p></div></details>)}</section>
        <details><summary>Help in the moment<span>Quiet room, advice-giving, disappointment, comparison</span></summary><Articles items={content.help} /></details>
        <details><summary>Close well and follow through<span>The next date, Identity preparation, and your own debrief</span></summary><Articles items={content.sessionOne.followThrough} /></details>
      </div></div>}
      <aside className="fg-slides"><h4>Teaching-slide PDFs</h4><p>John’s session slides will be available here for Circle leaders once added. No slide PDF has been supplied for this session yet.</p></aside><button type="button" className="button secondary" onClick={() => setArea("tools")}>Open supporting leader tools</button></> : <><p className="fg-rollout-note">Your current quick-reference guidance is below. The full-depth preparation and Leading now treatment is being introduced with Session 1 first.</p><Articles items={[{title:"Lead the conversation",paragraphs:stage.inTheMoment},{title:"Prepare what comes next",paragraphs:stage.prepareNext}]} /><button type="button" className="button secondary" onClick={() => setArea("tools")}>Use shared facilitation tools</button></>}
      </article></div>}
    {area === "tools" && <div className="fg-tools"><div className="fg-section-intro"><h3>Help you can use, right when you need it</h3><p>Start with the tool that fits the situation. These resources support preparation and Session 1; further session-specific tools will be added as the guides expand.</p></div>{content.resources.map(resource => <details key={resource.id}><summary>{resource.title}<span>{resource.description}</span></summary><div className="fg-tool-body"><ReadingLayout items={resource.readings}><Articles items={resource.blocks} /></ReadingLayout></div></details>)}</div>}
    <footer className="fg-source-note">Drawn from John Willoughby’s Leader’s Playbook. Essentials and practical examples are adapted for the digital Circle experience; fuller readings preserve the teaching with descriptive resource titles. Use your current app schedule and assessment instructions where older examples differ.</footer>
  </section>;
}

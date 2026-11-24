"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** The full trail is always available, without putting a course-long menu before the lesson. */
export function CourseTrailNavigation({ children, current, position, total, completed, immersive = true }: {
  children: ReactNode; current: string; position: number; total: number; completed: number; immersive?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  if (!immersive) return <>{children}</>;
  return <div className="course-wayfinder">
    <div className="course-location"><span>YOUR TRAIL · {position} / {total}</span><strong>{current.replace(/^Module\s+\d+:\s*/i, "")}</strong></div>
    <button type="button" className="course-map-opener" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>Trail map <span aria-hidden="true">↗</span></button>
    <div className="course-route-progress" role="progressbar" aria-label="Lessons completed" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><span style={{ width: `${completed / total * 100}%` }} /></div>
    <dialog ref={dialog} className="course-map-dialog" aria-labelledby={titleId} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <header className="course-map-header"><div><p>Your route</p><h2 id={titleId}>One step at a time.</h2><span>{completed} of {total} lessons completed</span></div><button type="button" aria-label="Close trail map" onClick={() => dialog.current?.close()}>×</button></header>
      <div onClick={event => { const target = event.target as HTMLElement; if (target.closest('ol button:not(:disabled)')) dialog.current?.close(); }}>{children}</div>
    </dialog>
  </div>;
}

/** Jump to a real part of this lesson; no parallel content or replacement audio. */
export function LessonPacing({ lessonKey, hasAudio = true }: { lessonKey: string; hasAudio?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const [hasReflection, setHasReflection] = useState(false);
  useEffect(() => { setHasReflection(Boolean(ref.current?.closest('.journey-active-lesson')?.querySelector('.journey-active-workbook, .designid-lesson-reflections, .reflection-answer, .capacity-calendar'))); }, [lessonKey]);
  const move = (step: string) => {
    const lesson = ref.current?.closest('.journey-active-lesson');
    if (!lesson) return;
    const target = step === 'read' ? lesson.querySelector('.lesson-source, .readable-lesson-body, .journey-applied-capacity, .journey-designid-return') : step === 'listen' ? lesson.querySelector('.companion-audio-card') : lesson.querySelector('.journey-active-workbook, .journey-who-whose-care, .journey-care-response-grid, .designid-lesson-reflections, .assessment-lesson-reflections, .reflection-answer, .capacity-calendar, .journey-active-pagination');
    if (step === 'listen') { const disclosure = target?.querySelector('details.companion-listen'); if (disclosure instanceof HTMLDetailsElement) disclosure.open = true; }
    if (target instanceof HTMLElement) { target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  };
  return <nav key={lessonKey} ref={ref} className="lesson-pacing" aria-label="Move through this lesson">
    <button type="button" onClick={() => move('read')}><span>01</span> Read</button>
    {hasAudio && <button type="button" onClick={() => move('listen')}><span>02</span> Listen</button>}
    <button type="button" onClick={() => move('reflect')}><span>{hasAudio ? '03' : '02'}</span> {hasReflection ? "Reflect & continue" : "Continue"}</button>
  </nav>;
}

"use client";
import { useState } from "react";
import {
  circleCurriculum,
  countUntil,
  scheduledDates,
  meetingLessons,
  suggestedAssignments,
  unassignedLessons,
  type CirclePlan,
} from "@/lib/circles/plan";
export function CircleScheduleEditor({
  plan: p,
  change,
}: {
  plan: CirclePlan;
  change: (p: CirclePlan) => void;
}) {
  const [breakStart, setBreakStart] = useState(""),
    [breakEnd, setBreakEnd] = useState(""),
    [error, setError] = useState("");
  const dates = scheduledDates(p),
    missing = unassignedLessons(p);
  function suggest() {
    const count = p.paceMode === "finish" ? countUntil(p) : p.meetingCount;
    if (!Number.isInteger(count) || count < 1 || count > 104) {
      setError("Choose dates and a pace that allow 1–104 meetings.");
      return;
    }
    change({
      ...p,
      meetingCount: count,
      curriculum: circleCurriculum,
      assignments: suggestedAssignments(count),
      movedDates: {},
    });
    setError("");
  }
  function assign(slugs: string[], meeting: number) {
    change({
      ...p,
      assignments: {
        ...p.assignments,
        ...Object.fromEntries(slugs.map((s) => [s, meeting])),
      },
    });
  }
  const modules = [...new Set(circleCurriculum.map((l) => l.moduleSlug))];
  return (
    <div className="circle-schedule-editor circle-builder-form">
      <div className="circle-field-pair">
        <label htmlFor="pace-mode">
          Plan by
          <select
            id="pace-mode"
            value={p.paceMode}
            onChange={(e) => change({ ...p, paceMode: e.target.value })}
          >
            <option value="pace">Number of meetings</option>
            <option value="finish">Finish date</option>
          </select>
        </label>
        {p.paceMode === "pace" ? (
          <label htmlFor="meeting-count">
            Meetings
            <input
              id="meeting-count"
              type="number"
              min="1"
              max="104"
              value={p.meetingCount}
              onChange={(e) => {
                const count = +e.target.value;
                change({
                  ...p,
                  meetingCount: count,
                  assignments: Object.fromEntries(
                    Object.entries(p.assignments).map(([s, n]) => [
                      s,
                      n > count ? 0 : n,
                    ]),
                  ),
                  movedDates: Object.fromEntries(
                    Object.entries(p.movedDates).filter(([n]) => +n <= count),
                  ),
                });
              }}
            />
          </label>
        ) : (
          <label htmlFor="finish-date">
            Finish by
            <input
              id="finish-date"
              type="date"
              min={p.startDate}
              value={p.finishDate}
              onChange={(e) => change({ ...p, finishDate: e.target.value })}
            />
          </label>
        )}
      </div>
      <button type="button" className="button secondary" onClick={suggest}>
        Build suggested schedule
      </button>
      <p className="circle-fine-print">
        Adjust the lesson assignments below to suit your group.
      </p>
      <details className="circle-breaks">
        <summary>
          Holiday breaks{p.breaks.length ? ` (${p.breaks.length})` : ""}
        </summary>
        <div className="circle-field-pair">
          <label htmlFor="break-start">
            Break starts
            <input
              id="break-start"
              type="date"
              value={breakStart}
              onChange={(e) => setBreakStart(e.target.value)}
            />
          </label>
          <label htmlFor="break-end">
            Break ends
            <input
              id="break-end"
              type="date"
              min={breakStart}
              value={breakEnd}
              onChange={(e) => setBreakEnd(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            if (
              !breakStart ||
              !(breakEnd || breakStart) ||
              (breakEnd && breakEnd < breakStart)
            ) {
              setError("Choose a valid break date or range.");
              return;
            }
            change({
              ...p,
              breaks: [
                ...p.breaks,
                { start: breakStart, end: breakEnd || breakStart },
              ],
            });
            setBreakStart("");
            setBreakEnd("");
            setError("");
          }}
        >
          Add break
        </button>
        <ul>
          {p.breaks.map((b, i) => (
            <li key={i}>
              {b.start}
              {b.end !== b.start ? ` – ${b.end}` : ""}{" "}
              <button
                type="button"
                className="button text-button"
                aria-label={`Remove break ${b.start}`}
                onClick={() =>
                  change({ ...p, breaks: p.breaks.filter((_, n) => i !== n) })
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </details>
      {error && (
        <p role="alert" className="circle-form-error">
          {error}
        </p>
      )}
      {missing.length > 0 && (
        <p role="status" className="circle-form-error">
          {missing.length} current lessons need a meeting.{" "}
          <button
            type="button"
            className="button text-button"
            onClick={() =>
              change({
                ...p,
                curriculum: circleCurriculum,
                assignments: Object.fromEntries(
                  circleCurriculum.map((l) => [
                    l.slug,
                    p.assignments[l.slug] &&
                    p.assignments[l.slug] <= p.meetingCount
                      ? p.assignments[l.slug]
                      : 0,
                  ]),
                ),
              })
            }
          >
            Refresh lesson list
          </button>
        </p>
      )}
      {p.curriculum.some(
        (l) => !circleCurriculum.some((c) => c.slug === l.slug),
      ) && (
        <p className="circle-form-error">
          The course has changed. Refresh the lesson list to remove retired
          lessons; existing assignments will be kept.{" "}
          <button
            type="button"
            className="button text-button"
            onClick={() =>
              change({
                ...p,
                curriculum: circleCurriculum,
                assignments: Object.fromEntries(
                  circleCurriculum.map((l) => [
                    l.slug,
                    p.assignments[l.slug] || 0,
                  ]),
                ),
              })
            }
          >
            Refresh lesson list
          </button>
        </p>
      )}
      <details className="circle-lesson-allocation">
        <summary>
          Assign modules and lessons · {circleCurriculum.length} lessons
        </summary>
        {modules.map((module) => {
          const lessons = circleCurriculum.filter(
              (l) => l.moduleSlug === module,
            ),
            values = lessons.map((l) => p.assignments[l.slug] || 0);
          const shared = values.every((n) => n === values[0]) ? values[0] : "";
          return (
            <details key={module}>
              <summary>
                {lessons[0].moduleTitle} <small>{lessons.length} lessons</small>
              </summary>
              <label>
                Whole module
                <select
                  aria-label={`Assign ${lessons[0].moduleTitle}`}
                  value={shared}
                  onChange={(e) =>
                    assign(
                      lessons.map((l) => l.slug),
                      +e.target.value,
                    )
                  }
                >
                  <option value="" disabled>
                    Split across meetings
                  </option>
                  <option value="0">Not assigned</option>
                  {Array.from(
                    { length: Math.min(104, Math.max(0, p.meetingCount)) },
                    (_, i) => (
                      <option key={i} value={i + 1}>
                        Meeting {i + 1}
                      </option>
                    ),
                  )}
                </select>
              </label>
              {lessons.map((l) => (
                <label className="circle-lesson-row" key={l.slug}>
                  <span>
                    {l.title}
                    <small>{l.duration} teaching</small>
                  </span>
                  <select
                    aria-label={`Meeting for ${l.title}`}
                    value={p.assignments[l.slug] || 0}
                    onChange={(e) => assign([l.slug], +e.target.value)}
                  >
                    <option value="0">Not assigned</option>
                    {Array.from(
                      { length: Math.min(104, Math.max(0, p.meetingCount)) },
                      (_, i) => (
                        <option key={i} value={i + 1}>
                          Meeting {i + 1}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              ))}
            </details>
          );
        })}
      </details>
      <div className="circle-finish-summary">
        <strong>{p.meetingCount || 0} meetings</strong>
        <span>
          {dates.length
            ? `${dates[0]} → ${dates.at(-1)}`
            : "Choose a start date to see your finish date"}
        </span>
      </div>
      <div className="circle-meeting-list">
        {Array.from(
          { length: Math.min(104, Math.max(0, p.meetingCount)) },
          (_, i) => {
            const lessons = meetingLessons(p, i + 1);
            return (
              <details key={i}>
                <summary>
                  <strong>Meeting {i + 1}</strong>
                  <span>{dates[i] || "Date to be set"}</span>
                  <small>
                    {lessons.length
                      ? [...new Set(lessons.map((l) => l.moduleTitle))].join(
                          " · ",
                        )
                      : "Discussion / catch-up"}
                  </small>
                </summary>
                <div className="circle-field-pair">
                  <label>
                    Meeting date
                    <input
                      aria-label={`Date for meeting ${i + 1}`}
                      type="date"
                      min={p.startDate}
                      value={dates[i] || ""}
                      onChange={(e) => {
                        const movedDates = { ...p.movedDates };
                        if (e.target.value)
                          movedDates[String(i + 1)] = e.target.value;
                        else delete movedDates[String(i + 1)];
                        change({ ...p, movedDates });
                      }}
                    />
                  </label>
                  <div className="circle-action-row">
                    <button
                      type="button"
                      className="button secondary"
                      disabled={!dates[i]}
                      onClick={() => {
                        const movedDates = { ...p.movedDates };
                        delete movedDates[String(i + 1)];
                        change({
                          ...p,
                          movedDates,
                          breaks: [
                            ...p.breaks,
                            { start: dates[i], end: dates[i] },
                          ],
                        });
                      }}
                    >
                      Skip this date
                    </button>
                    {p.movedDates[String(i + 1)] && (
                      <button
                        type="button"
                        className="button text-button"
                        onClick={() => {
                          const movedDates = { ...p.movedDates };
                          delete movedDates[String(i + 1)];
                          change({ ...p, movedDates });
                        }}
                      >
                        Reset date
                      </button>
                    )}
                  </div>
                </div>
                <ol>
                  {lessons.map((l) => (
                    <li key={l.slug}>
                      {l.moduleTitle} · {l.title}
                    </li>
                  ))}
                </ol>
                {!lessons.length && (
                  <p>
                    Use this meeting for conversation, reflection, or catching
                    up.
                  </p>
                )}
              </details>
            );
          },
        )}
      </div>
    </div>
  );
}

"use client";
import { isSandbox } from '@/lib/environment';
import { careDiscussionIds, discussionCourse, type DiscussionReminder } from '@/lib/reflections/discussion-catalog';
import { ReviewAwareLink } from "@/components/review-aware-link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ReflectionQuestion } from "@/lib/reflections/catalog";
import type {
  ReflectionData,
  ReflectionEntry,
  ReflectionRound,
} from "@/lib/reflections/types";
function reflectionFetch(input: string, init?: RequestInit) {
  const url = new URL(input, window.location.origin);
  const current = new URLSearchParams(window.location.search);
  for (const name of ["review", "key"]) { const value = current.get(name); if (value) url.searchParams.set(name,value); }
  return fetch(url.pathname + url.search, init);
}
const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
function ReflectionText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(
          /(\/field-kit\/reflections\/[a-z0-9-]+\?round=[0-9a-f-]+#reflection-[a-zA-Z0-9%._~-]+)/g,
        )
        .map((part, index) =>
          part.startsWith("/field-kit/reflections/") ? (
            <ReviewAwareLink key={index} href={part}>
              Open source reflection
            </ReviewAwareLink>
          ) : (
            part
          ),
        )}
    </>
  );
}
type Session = {
  courseSlug: string;
  data: ReflectionData;
  round: ReflectionRound | null;
  loading: boolean;
  error: string;
  questions: ReflectionQuestion[];
  drafts: Record<string, string>;
  setDraft: (id: string, value: string) => void;
  save: (q: ReflectionQuestion) => Promise<boolean>;
  automatic: boolean;
  flush: () => Promise<boolean>;
  statuses: Record<string, string>;
  readOnly: boolean;
  recordPosition: (lessonSlug: string) => void;
  reload: () => Promise<void>;
  discussionEnabled: boolean;
  reminderError: string;
  reminders: DiscussionReminder[];
  reminderDrafts: Record<string, { marked: boolean; note: string }>;
  reminderStatuses: Record<string, string>;
  setReminder: (id: string, marked: boolean, note: string) => void;
  saveReminder: (id: string) => Promise<boolean>;
};
const Context = createContext<Session | null>(null);
const empty: ReflectionData = {
  rounds: [],
  entries: [],
  reports: [],
  canStart: false,
  signedIn: false,
};
export function ReflectionSession({
  courseSlug,
  questions,
  children,
  compactControls = false,
}: {
  courseSlug: string;
  questions: ReflectionQuestion[];
  children: ReactNode;
  compactControls?: boolean;
}) {
  const [data, setData] = useState<ReflectionData>(empty),
    [selected, setSelected] = useState(""),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [statuses, setStatuses] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [report, setReport] = useState("");
  const discussionEnabled = isSandbox() && courseSlug === discussionCourse;
  const [reminderError, setReminderError] = useState('');
  const [reminders, setReminders] = useState<DiscussionReminder[]>([]);
  const [reminderDrafts, setReminderDrafts] = useState<Record<string, { marked: boolean; note: string }>>({});
  const [reminderStatuses, setReminderStatuses] = useState<Record<string, string>>({});
  const reminderRef = useRef(reminders); reminderRef.current = reminders;
  const reminderDraftRef = useRef(reminderDrafts); reminderDraftRef.current = reminderDrafts;
  const reminderTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const saveReminderRef = useRef<(id: string) => Promise<boolean>>(async () => false);
  const automatic = compactControls && courseSlug === "discover-your-divine-design";
  const dirty = useRef(false),
    busy = useRef(new Set<string>()),
    draftRef = useRef(drafts);
  draftRef.current = drafts;
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const saveRef = useRef<(q: ReflectionQuestion) => Promise<boolean>>(async () => false);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  const entriesRef = useRef<ReflectionData["entries"]>([]);
  entriesRef.current = data.entries;
  const positionQueue = useRef<Promise<void>>(Promise.resolve());
  const round = data.rounds.find((r) => r.id === selected) ?? null;
  const latest = useMemo(() => {
    const map: Record<string, ReflectionEntry> = {};
    for (const e of data.entries.filter((e) => e.round_id === selected))
      if (!map[e.question_id] || map[e.question_id].revision < e.revision)
        map[e.question_id] = e;
    return map;
  }, [data.entries, selected]);
  const reminderDirty = () => Object.entries(reminderDraftRef.current).some(([id, value]) => {
    const prior = reminderRef.current.find(r => r.round_id === selected && r.question_id === id);
    return value.marked !== (prior?.marked ?? false) || value.note !== (prior?.note ?? '');
  });
  dirty.current = reminderDirty() || Object.entries(drafts).some(
    ([id, value]) => value !== (latest[id]?.response ?? ""),
  );
  const readOnly = Boolean(
    round && (data.rounds[0]?.id !== round.id || data.nextAssessmentReportId),
  );
  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await reflectionFetch(
        `/api/course-reflections?courseSlug=${encodeURIComponent(courseSlug)}`,
        { cache: "no-store" },
      );
      let body = await r.json();
      if (!r.ok) throw Error(body.error);
      if (automatic && body.signedIn && !body.rounds.length) {
        const setup = await reflectionFetch("/api/course-reflections", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ensure-round", courseSlug }),
        });
        const result = await setup.json();
        if (!setup.ok) throw Error(result.error);
        body = { ...body, rounds: [result.round] };
      }
      if (body.nextAssessmentReportId) {
        const sync = await reflectionFetch("/api/course-reflections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "sync-round", courseSlug }),
        });
        const synced = await sync.json();
        if (!sync.ok) throw Error(synced.error);
        const fresh = await reflectionFetch(
          `/api/course-reflections?courseSlug=${encodeURIComponent(courseSlug)}`,
          { cache: "no-store" },
        );
        body = await fresh.json();
        if (!fresh.ok) throw Error(body.error);
      }
      if (discussionEnabled && body.signedIn) {
        try {
          const response = await reflectionFetch(`/api/course-reflections/discussion?courseSlug=${encodeURIComponent(courseSlug)}`, { cache: 'no-store' });
          const saved = await response.json();
          if (!response.ok) throw Error(saved.error);
          reminderRef.current = saved.reminders;
          setReminders(saved.reminders); setReminderError('');
        } catch (e) { setReminderError(e instanceof Error ? e.message : 'Could not load discussion reminders.'); }
        // An optional reminder outage must not prevent opening/saving the actual workbook.
      }
      setData(body);
      const requestedRound = automatic ? null : new URLSearchParams(window.location.search).get("round");
      setSelected((current) =>
        body.rounds.some((r: ReflectionRound) => r.id === current)
          ? current
          : (body.rounds.find((r: ReflectionRound) => r.id === requestedRound)
              ?.id ??
            body.rounds[0]?.id ??
            ""),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reflections.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, [courseSlug]); // One isolated session per course.
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const navigate = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (automatic && link && link.target !== "_blank" && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0 && dirty.current) {
        e.preventDefault(); e.stopPropagation();
        const href = link.href;
        void flushRef.current().then(ok => { if (ok) window.location.assign(href); });
        return;
      }
      const a = (e.target as Element).closest?.("a[href]");
      if (
        a &&
        (a as HTMLAnchorElement).target !== "_blank" &&
        dirty.current &&
        new URL((a as HTMLAnchorElement).href).pathname !==
          window.location.pathname &&
        !window.confirm("You have unsaved reflections. Leave without saving?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, []);
  const setRoundUrl = (id: string) => {
    if (window.location.pathname.startsWith("/field-kit/reflections/")) {
      const url = new URL(window.location.href);
      url.searchParams.set("round", id);
      window.history.replaceState(null, "", url);
    }
  };
  useEffect(() => {
    const reveal = () => {
      if (!window.location.hash.startsWith("#reflection-")) return;
      let anchor: HTMLElement | null;
      try {
        anchor = document.getElementById(
          decodeURIComponent(window.location.hash.slice(1)),
        );
      } catch {
        return;
      }
      if (!anchor) return;
      let parent = anchor.parentElement;
      while (parent) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
        parent = parent.parentElement;
      }
      requestAnimationFrame(() => anchor?.scrollIntoView({ block: "start" }));
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [selected, loading]);
  const changeRound = (id: string) => {
    if (busy.current.size) return;
    if (
      dirty.current &&
      !window.confirm(
        "You have unsaved reflections. Switch rounds without saving?",
      )
    )
      return;
    for (const timer of Object.values(reminderTimers.current)) clearTimeout(timer);
    setReminderDrafts({}); reminderDraftRef.current = {}; setReminderStatuses({});
    setDrafts({});
    setStatuses({});
    setSelected(id);
    setRoundUrl(id);
  };
  const newRound = async () => {
    if (busy.current.size || creating) return;
    if (
      dirty.current &&
      !window.confirm(
        "You have unsaved reflections. Begin a new round without saving them?",
      )
    )
      return;
    setCreating(true);
    setError("");
    try {
      const r = await reflectionFetch("/api/course-reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "new-round",
          courseSlug,
          assessmentSnapshotId: report || null,
        }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setData((d) => ({ ...d, rounds: [b.round, ...d.rounds] }));
      setReminderDrafts({}); reminderDraftRef.current = {}; setReminderStatuses({});
      for (const timer of Object.values(reminderTimers.current)) clearTimeout(timer);
      setSelected(b.round.id);
      setRoundUrl(b.round.id);
      setDrafts({});
      setStatuses({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not begin round.");
    } finally {
      setCreating(false);
    }
  };
  const save = (q: ReflectionQuestion): Promise<boolean> => {
    clearTimeout(timers.current[q.id]);
    if (!round || readOnly) return Promise.resolve(false);
    const savingRound = round.id;
    const task = positionQueue.current.catch(() => {}).then(async () => {
      const previous = entriesRef.current.filter(e => e.round_id === savingRound && e.question_id === q.id).sort((a,b) => b.revision-a.revision)[0];
      const value = draftRef.current[q.id] ?? previous?.response ?? "";
      if (value === (previous?.response ?? "")) {
        if (automatic) setStatuses(s => ({ ...s, [q.id]: "Saved" }));
        return true;
      }
      busy.current.add(q.id);
      setStatuses(s => ({ ...s, [q.id]: "Saving…" }));
      try {
        const r = await reflectionFetch("/api/course-reflections", {
          method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", courseSlug, roundId: savingRound, questionId: q.id, response: value, expectedRevision: previous?.revision ?? 0 }),
        });
        const b = await r.json();
        if (!r.ok) throw Error(b.error);
        const entries = [...entriesRef.current.filter(e => e.id !== b.entry.id), b.entry];
        entriesRef.current = entries;
        dirty.current = reminderDirty() || Object.entries(draftRef.current).some(([id, text]) => {
          const saved = entries.filter(e => e.round_id === savingRound && e.question_id === id).sort((a,b) => b.revision-a.revision)[0];
          return text !== (saved?.response ?? "");
        });
        setData(d => ({ ...d, entries }));
        setStatuses(s => ({ ...s, [q.id]: (draftRef.current[q.id] ?? value) === value ? (automatic ? "Saved" : data.preview ? "Saved to your preview workbook" : "Saved to your account") : "Unsaved changes" }));
        return true;
      } catch (e) {
        setStatuses(s => ({ ...s, [q.id]: e instanceof Error ? e.message : "Could not save. Your draft is still here. Please try again." }));
        return false;
      } finally { busy.current.delete(q.id); }
    });
    positionQueue.current = task.then(() => {});
    return task;
  };
  saveRef.current = save;
  const saveReminder = (id: string): Promise<boolean> => {
    clearTimeout(reminderTimers.current[id]);
    if (!round || readOnly || !discussionEnabled) return Promise.resolve(false);
    const roundId = round.id;
    const task = positionQueue.current.catch(() => {}).then(async () => {
      const draft = reminderDraftRef.current[id];
      if (!draft) return true;
      const previous = reminderRef.current.find(r => r.round_id === roundId && r.question_id === id);
      if (draft.marked === (previous?.marked ?? false) && draft.note === (previous?.note ?? '')) return true;
      busy.current.add('reminder-' + id);
      setReminderStatuses(s => ({ ...s, [id]: 'Saving…' }));
      try {
        const r = await reflectionFetch('/api/course-reflections/discussion', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseSlug, roundId, questionId: id, ...draft, expectedRevision: previous?.revision ?? 0 }) });
        const b = await r.json();
        if (!r.ok) throw Error(b.error);
        const next = [...reminderRef.current.filter(v => !(v.round_id === roundId && v.question_id === id)), b.reminder];
        reminderRef.current = next; setReminders(next);
        setReminderStatuses(s => ({ ...s, [id]: reminderDraftRef.current[id]?.note === draft.note && reminderDraftRef.current[id]?.marked === draft.marked ? 'Saved' : 'Unsaved changes' }));
        return true;
      } catch (e) { setReminderStatuses(s => ({ ...s, [id]: e instanceof Error ? e.message : 'Could not save reminder. Please try again.' })); return false; }
      finally { busy.current.delete('reminder-' + id); }
    });
    positionQueue.current = task.then(() => {});
    return task;
  };
  saveReminderRef.current = saveReminder;
  const flush = async () => {
    const changed = questions.filter(q => Object.hasOwn(draftRef.current, q.id));
    let ok = true;
    for (const q of changed) if (!await saveRef.current(q)) ok = false;
    for (const id of Object.keys(reminderDraftRef.current)) if (!await saveReminderRef.current(id)) ok = false;
    return ok;
  };
  flushRef.current = flush;
  useEffect(() => () => { for (const timer of [...Object.values(timers.current), ...Object.values(reminderTimers.current)]) clearTimeout(timer); }, []);
  const recordPosition = (lessonSlug: string) => {
    if (!round || readOnly) return;
    const roundId = round.id;
    setData((d) => ({
      ...d,
      rounds: d.rounds.map((r) =>
        r.id === roundId ? { ...r, last_lesson_slug: lessonSlug } : r,
      ),
    }));
    positionQueue.current = positionQueue.current
      .catch(() => {})
      .then(async () => {
        const response = await reflectionFetch("/api/course-reflections", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "position",
            courseSlug,
            roundId,
            lessonSlug,
          }),
        });
        if (!response.ok)
          throw Error(
            "Could not save your course position. Your reflection answers are unaffected.",
          );
      })
      .catch((e) => setError(e.message));
  };
  const session: Session = {
    discussionEnabled, reminderError, reminders, reminderDrafts, reminderStatuses, saveReminder,
    setReminder: (id, marked, note) => {
      reminderDraftRef.current = { ...reminderDraftRef.current, [id]: { marked, note } };
      setReminderDrafts(reminderDraftRef.current); dirty.current = true;
      setReminderStatuses(s => ({ ...s, [id]: 'Unsaved changes' }));
      clearTimeout(reminderTimers.current[id]);
      reminderTimers.current[id] = setTimeout(() => { void saveReminderRef.current(id); }, 700);
    },
    courseSlug,
    data,
    round,
    loading,
    error,
    // Retired Journey lesson prompts stay in saved history, not the active workbook.
    questions: (round?.questions ?? questions).filter(
      (question) =>
        courseSlug !== "discover-your-divine-design" ||
        !question.id.endsWith("-lesson-reflection"),
    ),
    drafts,
    setDraft: (id, value) => {
      draftRef.current = { ...draftRef.current, [id]: value };
      dirty.current = true;
      setDrafts(draftRef.current);
      if (automatic) {
        clearTimeout(timers.current[id]);
        const q = questions.find(q => q.id === id);
        if (q) timers.current[id] = setTimeout(() => { void saveRef.current(q); }, 700);
      }
      setStatuses((s) => ({ ...s, [id]: "Unsaved changes" }));
    },
    save,
    automatic,
    flush,
    statuses,
    readOnly,
    recordPosition,
    reload,
  };
  const controls = (
    <section className="reflection-round-bar" aria-label="Reflection rounds">
      {compactControls ? (
        <p>
          Your CARE reflections stay editable here and in Field Kit. Both places
          use the same saved answers.
        </p>
      ) : (
        <div>
          <p className="section-label">Your private workbook</p>
          <h2>Reflections for this walk.</h2>
          <p>
            Save what you discover. Your current walkthrough stays editable. A
            newly completed assessment opens a fresh walkthrough; earlier
            reflections stay intact and read-only.
          </p>
        </div>
      )}
      {loading ? (
        <p role="status">Loading your reflection history…</p>
      ) : !data.signedIn ? (
        <p>
          <a
            href={`/login?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/field-kit")}`}
          >
            Sign in to save your reflections
          </a>
          . Preview answers are not saved.
        </p>
      ) : (
        <div className="reflection-round-controls">
          {data.rounds.length > 0 ? (
            <label>
              Reflection round
              <select
                disabled={Object.values(statuses).includes("Saving…")}
                value={selected}
                onChange={(e) => changeRound(e.target.value)}
              >
                {data.rounds.map((r, i) => (
                  <option key={r.id} value={r.id}>
                    {date(r.started_at)}
                    {i === 0 ? " — current round" : " — previous round"}
                    {r.source === "legacy" ? " (earlier saved work)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p>No saved rounds yet. Begin your first round to write here.</p>
          )}
          {data.canStart ? (
            <>
              <label>
                Connect a report (optional)
                <select
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                >
                  <option value="">Course reflections only</option>
                  {data.reports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button primary"
                type="button"
                onClick={newRound}
                disabled={
                  creating || Object.values(statuses).includes("Saving…")
                }
              >
                {creating
                  ? "Beginning…"
                  : data.rounds.length
                    ? "Begin a new reflection round"
                    : "Begin my reflections"}
              </button>
            </>
          ) : (
            <p>
              Begin this trail at <ReviewAwareLink href="/trailheads">Trailheads</ReviewAwareLink>; its
              completed report opens new reflection rounds.
            </p>
          )}
          {round?.assessment_label ? (
            <p>Connected report: {round.assessment_label}</p>
          ) : null}
          {readOnly ? (
            <p>
              You’re reading a previous round. Choose the current round to
              continue writing, or begin a new one.
            </p>
          ) : null}
        </div>
      )}
      {error ? (
        <p className="form-message error" role="alert">
          {error}{" "}
          <button type="button" onClick={() => void reload()}>
            Try loading again
          </button>
        </p>
      ) : null}
    </section>
  );
  return (
    <Context.Provider value={session}>
      {automatic ? null : controls}
      {children}
    </Context.Provider>
  );
}
export function ReflectionAnswer({
  questionId,
  showQuestion = true,
  reading = false,
}: {
  questionId: string;
  showQuestion?: boolean;
  reading?: boolean;
}) {
  const inputId = useId();
  const [editingHere, setEditingHere] = useState(false);
  const s = useContext(Context);
  useEffect(() => setEditingHere(false), [s?.round?.id]);
  if (!s) return null;
  const q = s.questions.find((q) => q.id === questionId);
  if (!q) return null;
  const entries = s.data.entries
    .filter((e) => e.round_id === s.round?.id && e.question_id === q.id)
    .sort((a, b) => b.revision - a.revision);
  const current = entries[0];
  const value = s.drafts[q.id] ?? current?.response ?? "";
  const previous = s.data.rounds
    .filter(
      (r) =>
        r.id !== s.round?.id &&
        (!s.round || new Date(r.started_at) <= new Date(s.round.started_at)),
    )
    .map((r) => ({
      round: r,
      question: r.questions.find((item) => item.id === q.id),
      entry: s.data.entries
        .filter((e) => e.round_id === r.id && e.question_id === q.id)
        .sort((a, b) => b.revision - a.revision)[0],
    }));
  return (
    <section className="reflection-answer" data-question={q.id}>
      {showQuestion ? <h3>{q.prompt}</h3> : null}
      {s.error ? <p role="alert">{s.error} <button type="button" onClick={() => void s.reload()}>Try again</button></p> : null}
      {!s.loading && !s.data.signedIn ? <p><a href={`/login?next=${encodeURIComponent("/journey")}`}>Sign in to save your reflections</a></p> : null}
      {s.loading ? (
        <p>Loading answer…</p>
      ) : s.readOnly || (reading && !editingHere) ? (
        <>
          <p className="reflection-read-answer">
            <ReflectionText text={value || "Not answered in this round."} />
          </p>
          {current ? <small>Saved {date(current.saved_at)}</small> : null}
          {!s.readOnly && s.round ? (
            <button
              className="button secondary"
              type="button"
              onClick={() => setEditingHere(true)}
            >
              {current?.response ? "Edit reflection" : "Add reflection"}
            </button>
          ) : null}
        </>
      ) : (
        <>
          {s.automatic ? <small>Your answers save automatically.</small> : null}
          <label htmlFor={inputId}>
            Your reflection
            <textarea
              id={inputId}
              value={value}
              maxLength={8000}
              rows={5}
              disabled={!s.round || s.loading}
              onChange={(e) => s.setDraft(q.id, e.target.value)}
              onBlur={() => { if (s.automatic) void s.save(q); }}
              placeholder={
                s.round
                  ? "Write what you want to remember…"
                  : s.automatic ? "Your workbook is opening…" : "Begin a reflection round above to write here."
              }
            />
          </label>
          {s.round ? (
            <div className="reflection-answer-actions">
              {(!s.automatic || (s.statuses[q.id] && !["Saved", "Saving…", "Unsaved changes"].includes(s.statuses[q.id]))) ? <button
                type="button"
                className="button secondary"
                disabled={s.statuses[q.id] === "Saving…" || s.loading}
                onClick={() => void s.save(q)}
              >
                {s.automatic ? "Try saving again" : "Save reflection"}
              </button> : null}
              <span role="status">
                {s.statuses[q.id] ??
                  (current
                    ? `Saved ${date(current.saved_at)}`
                    : "Not answered yet")}
              </span>
            </div>
          ) : null}
        </>
      )}
      <DiscussionControl questionId={q.id} />
      {previous.length ? (
        <details className="reflection-history">
          <summary>View previous dated reflections ({previous.length})</summary>
          {previous.map(({ round, entry, question }) => (
            <article key={round.id}>
              <h4>{date(round.started_at)}</h4>
              {round.assessment_label ? (
                <small>{round.assessment_label}</small>
              ) : null}
              {question && question.prompt !== q.prompt ? (
                <p>Question then: {entry?.prompt ?? question.prompt}</p>
              ) : null}
              <p className="reflection-read-answer">
                {entry?.response ||
                  (question
                    ? "Not answered in this round."
                    : "This question was not part of this round.")}
              </p>
            </article>
          ))}
        </details>
      ) : null}
      {entries.length > 1 ? (
        <details className="reflection-history">
          <summary>Earlier edits in this round ({entries.length - 1})</summary>
          {entries.slice(1).map((e) => (
            <article key={e.id}>
              <small>
                {date(e.saved_at)} · Revision {e.revision}
              </small>
              <p className="reflection-read-answer">
                {e.response || "Answer left blank."}
              </p>
            </article>
          ))}
        </details>
      ) : null}
    </section>
  );
}
function DiscussionControl({ questionId }: { questionId: string }) {
  const s = useContext(Context);
  const noteId = useId();
  const [noteOpen, setNoteOpen] = useState(false);
  if (!s?.discussionEnabled || !careDiscussionIds.has(questionId) || !s.round || s.loading) return null;
  if (s.reminderError) return <div className="discussion-control"><small role="alert">{s.reminderError}</small><button type="button" onClick={() => void s.reload()}>Try loading reminders again</button></div>;
  const saved = s.reminders.find(r => r.round_id === s.round!.id && r.question_id === questionId);
  const current = s.reminderDrafts[questionId] ?? saved ?? { marked: false, note: '' };
  const status = s.reminderStatuses[questionId];
  return <div className="discussion-control">
    <button type="button" className="discussion-mark" aria-pressed={current.marked} disabled={s.readOnly} onClick={() => { s.setReminder(questionId, !current.marked, current.note); }}>
      <span aria-hidden="true">{current.marked ? '◆' : '◇'}</span> {current.marked ? 'Marked for Class' : 'Take to Class'}
    </button>
    {current.marked ? <>
      <small>Private reminder · Not posted or sent to your class.</small>
      {!noteOpen && !current.note ? <button className="discussion-add-note" type="button" onClick={() => setNoteOpen(true)}>Add a note (optional)</button> : <label htmlFor={noteId}>Discussion note (optional)<textarea id={noteId} className="discussion-note" rows={2} maxLength={1000} value={current.note} disabled={s.readOnly} placeholder="What would you like to discuss?" onChange={e => s.setReminder(questionId, true, e.target.value)} onBlur={() => void s.saveReminder(questionId)} /></label>}
    </> : null}
    {status ? <small role="status">{status}</small> : null}
    {status && !['Saved', 'Saving…', 'Unsaved changes'].includes(status) ? <button type="button" onClick={() => void s.saveReminder(questionId)}>Try saving reminder again</button> : null}
  </div>;
}
export function ReflectionWorkbook() {
  const [editing, setEditing] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("");
  const [answerFilter, setAnswerFilter] = useState("all");
  const [discussionOnly, setDiscussionOnly] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).get('view') === 'discussion') setDiscussionOnly(true); }, []);
  const [exportScope, setExportScope] = useState("round");
  const [exportStatus, setExportStatus] = useState("");
  const [exporting, setExporting] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const workbook = useRef<HTMLDivElement>(null);
  const s = useContext(Context);
  const answered = useMemo(() => {
    const latest: Record<string, ReflectionEntry> = {};
    for (const entry of s?.data.entries ?? []) {
      if (entry.round_id !== s?.round?.id) continue;
      if (
        !latest[entry.question_id] ||
        latest[entry.question_id].revision < entry.revision
      )
        latest[entry.question_id] = entry;
    }
    return new Set(
      (s?.questions ?? [])
        .filter((q) => (s?.drafts[q.id] ?? latest[q.id]?.response ?? "").trim())
        .map((q) => q.id),
    );
  }, [s?.data.entries, s?.round?.id, s?.drafts, s?.questions]);
  if (!s) return null;
  const dirtyQuestions = s.questions.filter((q) => {
    const latest = s.data.entries
      .filter((e) => e.round_id === s.round?.id && e.question_id === q.id)
      .sort((a, b) => b.revision - a.revision)[0];
    return (
      s.drafts[q.id] !== undefined &&
      s.drafts[q.id] !== (latest?.response ?? "")
    );
  });
  const exportSaved = async (email: boolean) => {
    setExporting(true);
    setExportStatus("");
    try {
      const query = new URLSearchParams({
        courseSlug: s.courseSlug,
        scope: exportScope,
        round: s.round?.id ?? "",
      });
      const response = await reflectionFetch(`/api/course-reflections/export?${query}`, {
        method: email ? "POST" : "GET",
      });
      if (!response.ok) {
        const body = await response.json();
        throw Error(body.error ?? "Could not export reflections.");
      }
      if (email) {
        const body = await response.json();
        setExportStatus(`Sent to ${body.email}. Check your inbox.`);
      } else {
        const blob = await response.blob(),
          url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download =
          response.headers
            .get("Content-Disposition")
            ?.match(/filename="([^"]+)"/)?.[1] ?? "dydd-reflections.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setExportStatus(
          "Text file downloaded. It includes saved questions and answers, including unanswered questions.",
        );
      }
    } catch (error) {
      setExportStatus(
        error instanceof Error
          ? error.message
          : "Could not export. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };
  const saveAll = async () => {
    if (savingAll) return;
    setSavingAll(true);
    try {
      for (const question of dirtyQuestions) await s.save(question);
    } finally {
      setSavingAll(false);
    }
  };
  const modules = [...new Set(s.questions.map((q) => q.moduleTitle))];
  const hasAnswer = (q: ReflectionQuestion) => answered.has(q.id);
  const isMarked = (id: string) => s.reminderDrafts[id]?.marked ?? s.reminders.find(r => r.round_id === s.round?.id && r.question_id === id)?.marked ?? false;
  const visibleQuestions = s.questions.filter(
    (q) =>
      (!discussionOnly || isMarked(q.id)) &&
      (!moduleFilter || q.moduleTitle === moduleFilter) &&
      (answerFilter === "all" ||
        hasAnswer(q) === (answerFilter === "answered")),
  );
  const toggleSections = (open: boolean) => {
    workbook.current
      ?.querySelectorAll<HTMLDetailsElement>(
        "details.reflection-module, details.reflection-lesson",
      )
      .forEach((section) => {
        section.open = open;
      });
  };
  return (
    <div className="reflection-workbook" ref={workbook}>
      {s.discussionEnabled ? <section className="discussion-view" id="discussion-reminders" aria-label="My discussion reminders">
        <h2>My discussion reminders</h2>
        <p>Private reminders for your next conversation. Nothing is shared.</p>
        <button type="button" className="button secondary" aria-pressed={discussionOnly} onClick={() => { setDiscussionOnly(v => !v); setModuleFilter(''); setAnswerFilter('all'); }}>{discussionOnly ? 'Show all reflections' : `View discussion reminders (${s.questions.filter(q => isMarked(q.id)).length})`}</button>
      </section> : null}
      {!discussionOnly ? <>
      <div className="reflection-workbook-toolbar">
        <div>
          <p className="section-label">Explore your workbook</p>
          <h2>Choose a module. Open a lesson.</h2>
          <p>
            {editing
              ? "Save each reflection when you finish editing."
              : "Everything stays tucked away until you choose to open it."}
          </p>
        </div>
        {!s.readOnly && s.round ? (
          <button
            className="button secondary"
            type="button"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Read my reflections" : "Edit my reflections"}
          </button>
        ) : null}
      </div>
      {!s.readOnly && s.round ? (
        <div className="reflection-review-edit-bar">
          <p>
            Current walkthrough: edit any reflection here or in the course. Both
            use the same saved answer. Earlier walkthroughs stay read-only.
          </p>
          {dirtyQuestions.length ? (
            <>
              <button
                className="button primary"
                type="button"
                disabled={
                  savingAll || Object.values(s.statuses).includes("Saving…")
                }
                onClick={() => void saveAll()}
              >
                {savingAll
                  ? "Saving changes…"
                  : `Save all changes (${dirtyQuestions.length})`}
              </button>
              <p role="status">
                {dirtyQuestions.length} unsaved{" "}
                {dirtyQuestions.length === 1 ? "reflection" : "reflections"}.
                Downloads and email include saved answers only.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
      {s.data.signedIn && s.data.rounds.length ? (
        <section
          className="reflection-export-controls"
          aria-label="Take your reflections with you"
        >
          <div>
            <h3>Take your reflections with you</h3>
            <p>
              Download a text file or email your saved questions and answers to
              your account email.
            </p>
          </div>
          <label>
            Include
            <select
              value={exportScope}
              onChange={(e) => setExportScope(e.target.value)}
            >
              <option value="round">This dated walkthrough</option>
              <option value="course">All walkthroughs in this workbook</option>
              <option value="all">All my reflection workbooks</option>
            </select>
          </label>
          <div className="reflection-export-actions">
            <button
              className="button secondary"
              type="button"
              disabled={exporting || s.loading}
              onClick={() => void exportSaved(false)}
            >
              {exporting ? "Preparing…" : "Download text"}
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={exporting || s.loading || s.data.preview}
              title={s.data.preview ? "Preview mode does not send email; use Download text." : undefined}
              onClick={() => void exportSaved(true)}
            >
              Email to me
            </button>
          </div>
          {s.data.preview ? <p>Preview mode: saves and text downloads work. Email is not sent from previews.</p> : null}
          {exportStatus ? <p role="status">{exportStatus}</p> : null}
        </section>
      ) : null}
      <div
        className="reflection-browse-controls"
        aria-label="Filter reflections"
      >
        <label>
          Module
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            <option value="">All modules</option>
            {modules.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Show
          <select
            value={answerFilter}
            onChange={(e) => setAnswerFilter(e.target.value)}
          >
            <option value="all">All reflections</option>
            <option value="answered">Answered</option>
            <option value="unanswered">Not answered yet</option>
          </select>
        </label>
        <div className="reflection-section-actions">
          <button type="button" onClick={() => toggleSections(true)}>
            Expand all
          </button>
          <button type="button" onClick={() => toggleSections(false)}>
            Collapse all
          </button>
        </div>
      </div>
      </> : null}
      <p className="reflection-filter-count" role="status">
        {visibleQuestions.length} of {s.questions.length} reflections ·{" "}
        {modules.length} modules
      </p>
      <div className="reflection-module-list" key={s.round?.id ?? "preview"}>
        {modules.map((title, index) => {
          const questions = visibleQuestions.filter(
            (q) => q.moduleTitle === title,
          );
          const allQuestions = s.questions.filter(
            (q) => q.moduleTitle === title,
          );
          const lessons = [...new Set(allQuestions.map((q) => q.lessonSlug))];
          return (
            <details
              open={discussionOnly ? true : undefined}
              className={`reflection-module${title === "Niche" ? " reflection-module-niche" : ""}`}
              key={title}
              hidden={!questions.length}
            >
              <summary>
                <span className="reflection-module-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="reflection-module-heading">
                  <strong>{title}</strong>
                  <small>
                    {lessons.length}{" "}
                    {lessons.length === 1 ? "lesson" : "lessons"} ·{" "}
                    {allQuestions.filter(hasAnswer).length} of{" "}
                    {allQuestions.length} answered
                  </small>
                </span>
                <span className="reflection-disclosure" aria-hidden="true" />
              </summary>
              <div className="reflection-module-content">
                {title === "Niche" ? (
                  <p className="reflection-niche-note">
                    Your purpose, Pathfinder discoveries, and working niche
                    declaration—together in their own space.
                  </p>
                ) : null}
                {lessons.map((lessonSlug) => {
                  const lessonQuestions = allQuestions.filter(
                    (q) => q.lessonSlug === lessonSlug,
                  );
                  const visible = questions.filter(
                    (q) => q.lessonSlug === lessonSlug,
                  );
                  return (
                    <details
                      open={discussionOnly ? true : undefined}
                      className="reflection-lesson"
                      key={lessonSlug}
                      hidden={!visible.length}
                    >
                      <summary>
                        <span>
                          <strong>{lessonQuestions[0].lessonTitle}</strong>
                          <small>
                            {lessonQuestions.length}{" "}
                            {lessonQuestions.length === 1
                              ? "reflection"
                              : "reflections"}{" "}
                            · {lessonQuestions.filter(hasAnswer).length}{" "}
                            answered
                          </small>
                        </span>
                        <span
                          className="reflection-disclosure"
                          aria-hidden="true"
                        />
                      </summary>
                      {lessonQuestions.map((q) => (
                        <article
                          key={q.id}
                          className="reflection-workbook-question"
                          id={`reflection-${q.id}`}
                          hidden={!visible.some((item) => item.id === q.id)}
                        >
                          <ReflectionAnswer
                            questionId={q.id}
                            reading={!editing}
                          />
                        </article>
                      ))}
                      <ReviewAwareLink
                        className="reflection-return-lesson"
                        href={`${s.courseSlug === "discover-your-divine-design" ? "/journey" : `/courses/${s.courseSlug}`}?lesson=${encodeURIComponent(lessonSlug)}`}
                      >
                        Return to this lesson
                      </ReviewAwareLink>
                    </details>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
      {!visibleQuestions.length ? (
        <p className="reflection-filter-empty">
          {discussionOnly ? "No discussion reminders in this view yet. Mark any CARE reflection with Take to Class—even before you answer it." : "No reflections match this view. Choose another module or show all reflections."}
        </p>
      ) : null}
    </div>
  );
}

const sourceExperiences = [
  { slug: "discover-your-divine-design", title: "DYDD Journey" },
  { slug: "designid-foundations", title: "DesignID" },
  { slug: "spiritual-gifts-service", title: "Spiritual Gifts" },
  { slug: "fruitlife-360-formation", title: "FruitLife360" },
  { slug: "designpd-alignment", title: "DesignPD" },
];
export function ReflectionNicheBuilder() {
  const session = useContext(Context);
  const dialog = useRef<HTMLDialogElement>(null);
  const sourceRequest = useRef(0);
  const [sourceSlug, setSourceSlug] = useState(sourceExperiences[0].slug),
    [source, setSource] = useState<ReflectionData | null>(null),
    [sourceRound, setSourceRound] = useState(""),
    [sourceError, setSourceError] = useState(""),
    [sourceLoading, setSourceLoading] = useState(false);
  const currentRound = source?.rounds.find((r) => r.id === sourceRound);
  const openSource = () => {
    dialog.current?.showModal();
    void loadSource(sourceSlug);
  };
  const loadSource = async (slug: string) => {
    const requestId = ++sourceRequest.current;
    setSourceLoading(true);
    setSourceError("");
    setSource(null);
    setSourceSlug(slug);
    try {
      const r = await reflectionFetch(
        `/api/course-reflections?courseSlug=${encodeURIComponent(slug)}`,
        { cache: "no-store" },
      );
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      if (requestId !== sourceRequest.current) return;
      setSource(b);
      setSourceRound(b.rounds[0]?.id ?? "");
    } catch (e) {
      if (requestId !== sourceRequest.current) return;
      setSourceError(
        e instanceof Error ? e.message : "Could not load Field Kit.",
      );
    } finally {
      if (requestId === sourceRequest.current) setSourceLoading(false);
    }
  };
  if (!session) return null;
  const add = (q: ReflectionQuestion, entry: ReflectionEntry) => {
    const previous =
      session.drafts["niche-working-declaration"] ??
      session.data.entries
        .filter(
          (e) =>
            e.round_id === session.round?.id &&
            e.question_id === "niche-working-declaration",
        )
        .sort((a, b) => b.revision - a.revision)[0]?.response ??
      "";
    const attribution = `[${sourceExperiences.find((s) => s.slug === sourceSlug)?.title} · ${date(currentRound!.started_at)} · ${q.prompt}]`;
    const sourceUrl = `/field-kit/reflections/${sourceSlug}?round=${currentRound!.id}#reflection-${encodeURIComponent(q.id)}`;
    const text = `${previous}${previous ? "\n\n" : ""}${entry.response}\n${attribution}\nSource: ${sourceUrl}`;
    if (text.length > 8000) {
      setSourceError(
        "The declaration is full (8,000 characters). Shorten the draft before adding more.",
      );
      return;
    }
    session.setDraft("niche-working-declaration", text);
  };
  return (
    <section className="journey-niche-builder" aria-label="Niche builder">
      <p className="section-label">Build your niche</p>
      <h4>Bring your discoveries into one declaration.</h4>
      <p>
        Revisit reports and dated reflections without leaving your draft. Add an
        insight with its source, then shape it into your own words.
      </p>
      <button className="button secondary" type="button" onClick={openSource}>
        Open my Field Kit
      </button>
      <ReflectionAnswer questionId="niche-working-declaration" />
      <dialog
        ref={dialog}
        className="fieldkit-source-dialog"
        aria-labelledby="fieldkit-source-title"
      >
        <header>
          <h2 id="fieldkit-source-title">My Field Kit</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close Field Kit"
          >
            Close
          </button>
        </header>
        <label>
          Experience
          <select
            value={sourceSlug}
            onChange={(e) => void loadSource(e.target.value)}
          >
            {sourceExperiences.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <ReviewAwareLink
          href={`/field-kit#${sourceSlug === "discover-your-divine-design" ? "artifacts" : `collection-${sourceSlug.startsWith("designid") ? "designid" : sourceSlug.startsWith("designpd") ? "designpd" : sourceSlug.startsWith("spiritual") ? "spiritual-gifts" : "fruitlife-360"}`}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open report collection in another tab
        </ReviewAwareLink>
        {sourceLoading ? <p role="status">Loading reflections…</p> : null}
        {sourceError ? <p role="alert">{sourceError}</p> : null}
        {source?.rounds.length ? (
          <>
            <label>
              Dated reflection round
              <select
                value={sourceRound}
                onChange={(e) => setSourceRound(e.target.value)}
              >
                {source.rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    {date(r.started_at)}
                  </option>
                ))}
              </select>
            </label>
            {currentRound?.assessment_label ? (
              <p>{currentRound.assessment_label}</p>
            ) : null}
            {currentRound?.questions.map((q) => {
              const e = source.entries
                .filter(
                  (e) => e.round_id === sourceRound && e.question_id === q.id,
                )
                .sort((a, b) => b.revision - a.revision)[0];
              return (
                <article key={q.id}>
                  <small>
                    {q.moduleTitle} · {q.lessonTitle}
                  </small>
                  <h3>{q.prompt}</h3>
                  <p className="reflection-read-answer">
                    {e?.response || "Not answered in this round."}
                  </p>
                  {e?.response && q.id !== "niche-working-declaration" ? (
                    <button
                      type="button"
                      disabled={!session.round || session.readOnly}
                      onClick={() => add(q, e)}
                    >
                      Add this insight to my draft
                    </button>
                  ) : null}
                </article>
              );
            })}
          </>
        ) : !sourceLoading && !sourceError ? (
          <p>
            No saved reflections for this experience yet. Your niche draft stays
            open while you explore.
          </p>
        ) : null}
      </dialog>
    </section>
  );
}

export function useReflectionPosition() {
  const s = useContext(Context);
  return {
    roundId: s?.round?.id,
    lessonSlug: s?.round?.last_lesson_slug,
    recordPosition: s?.recordPosition,
    flush: s?.automatic ? s.flush : undefined,
  };
}

"use client";
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
            <a key={index} href={part}>
              Open source reflection
            </a>
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
  save: (q: ReflectionQuestion) => Promise<void>;
  statuses: Record<string, string>;
  readOnly: boolean;
  recordPosition: (lessonSlug: string) => void;
  reload: () => Promise<void>;
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
}: {
  courseSlug: string;
  questions: ReflectionQuestion[];
  children: ReactNode;
}) {
  const [data, setData] = useState<ReflectionData>(empty),
    [selected, setSelected] = useState(""),
    [drafts, setDrafts] = useState<Record<string, string>>({}),
    [statuses, setStatuses] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [report, setReport] = useState("");
  const dirty = useRef(false),
    busy = useRef(new Set<string>()),
    draftRef = useRef(drafts);
  draftRef.current = drafts;
  const positionQueue = useRef<Promise<void>>(Promise.resolve());
  const round = data.rounds.find((r) => r.id === selected) ?? null;
  const latest = useMemo(() => {
    const map: Record<string, ReflectionEntry> = {};
    for (const e of data.entries.filter((e) => e.round_id === selected))
      if (!map[e.question_id] || map[e.question_id].revision < e.revision)
        map[e.question_id] = e;
    return map;
  }, [data.entries, selected]);
  dirty.current = Object.entries(drafts).some(
    ([id, value]) => value !== (latest[id]?.response ?? ""),
  );
  const readOnly = Boolean(round && data.rounds[0]?.id !== round.id);
  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
        `/api/course-reflections?courseSlug=${encodeURIComponent(courseSlug)}`,
        { cache: "no-store" },
      );
      const body = await r.json();
      if (!r.ok) throw Error(body.error);
      setData(body);
      const requestedRound = new URLSearchParams(window.location.search).get(
        "round",
      );
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
    if (selected && window.location.hash.startsWith("#reflection-")) {
      const anchor = document.getElementById(
        decodeURIComponent(window.location.hash.slice(1)),
      );
      anchor?.scrollIntoView({ block: "start" });
    }
  }, [selected]);
  const changeRound = (id: string) => {
    if (busy.current.size) return;
    if (
      dirty.current &&
      !window.confirm(
        "You have unsaved reflections. Switch rounds without saving?",
      )
    )
      return;
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
      const r = await fetch("/api/course-reflections", {
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
  const save = async (q: ReflectionQuestion) => {
    if (!round || readOnly || busy.current.has(q.id)) return;
    busy.current.add(q.id);
    const savingRound = round.id;
    const value = drafts[q.id] ?? latest[q.id]?.response ?? "";
    setStatuses((s) => ({ ...s, [q.id]: "Saving…" }));
    try {
      const r = await fetch("/api/course-reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          courseSlug,
          roundId: savingRound,
          questionId: q.id,
          response: value,
          expectedRevision: latest[q.id]?.revision ?? 0,
        }),
      });
      const b = await r.json();
      if (!r.ok) throw Error(b.error);
      setData((d) => ({
        ...d,
        entries: [...d.entries.filter((e) => e.id !== b.entry.id), b.entry],
      }));
      setStatuses((s) => ({
        ...s,
        [q.id]:
          (draftRef.current[q.id] ?? value) === value
            ? "Saved to your account"
            : "Unsaved changes",
      }));
    } catch (e) {
      setStatuses((s) => ({
        ...s,
        [q.id]:
          e instanceof Error
            ? e.message
            : "Could not save. Your draft is still here.",
      }));
    } finally {
      busy.current.delete(q.id);
    }
  };
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
        const response = await fetch("/api/course-reflections", {
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
    courseSlug,
    data,
    round,
    loading,
    error,
    questions: round?.questions ?? questions,
    drafts,
    setDraft: (id, value) => {
      setDrafts((d) => ({ ...d, [id]: value }));
      setStatuses((s) => ({ ...s, [id]: "Unsaved changes" }));
    },
    save,
    statuses,
    readOnly,
    recordPosition,
    reload,
  };
  return (
    <Context.Provider value={session}>
      <section className="reflection-round-bar" aria-label="Reflection rounds">
        <div>
          <p className="section-label">Your private workbook</p>
          <h2>Reflections for this walk.</h2>
          <p>
            Save what you discover. A new round keeps earlier reflections
            intact.
          </p>
        </div>
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
                Begin this trail at <a href="/trailheads">Trailheads</a>; its
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
  const s = useContext(Context);
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
      {s.loading ? (
        <p>Loading answer…</p>
      ) : s.readOnly || reading ? (
        <>
          <p className="reflection-read-answer">
            <ReflectionText text={value || "Not answered in this round."} />
          </p>
          {current ? <small>Saved {date(current.saved_at)}</small> : null}
        </>
      ) : (
        <>
          <label htmlFor={inputId}>
            Your reflection
            <textarea
              id={inputId}
              value={value}
              maxLength={8000}
              rows={5}
              disabled={!s.round || s.loading}
              onChange={(e) => s.setDraft(q.id, e.target.value)}
              placeholder={
                s.round
                  ? "Write what you want to remember…"
                  : "Begin a reflection round above to write here."
              }
            />
          </label>
          {s.round ? (
            <div className="reflection-answer-actions">
              <button
                type="button"
                className="button secondary"
                disabled={s.statuses[q.id] === "Saving…" || s.loading}
                onClick={() => void s.save(q)}
              >
                Save reflection
              </button>
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
export function ReflectionWorkbook() {
  const [editing, setEditing] = useState(false);
  const s = useContext(Context);
  if (!s) return null;
  return (
    <div className="reflection-workbook">
      {!s.readOnly && s.round ? (
        <div className="reflection-workbook-toolbar">
          <p>
            {editing
              ? "Save each reflection when you finish editing."
              : "Read your collected reflections. Open editing whenever you want to continue."}
          </p>
          <button
            className="button secondary"
            type="button"
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? "Read my reflections" : "Edit my reflections"}
          </button>
        </div>
      ) : null}
      {s.questions.map((q) => (
        <article
          key={q.id}
          className="reflection-workbook-question"
          id={`reflection-${q.id}`}
        >
          <p className="section-label">{q.moduleTitle}</p>
          <h2>{q.lessonTitle}</h2>
          <ReflectionAnswer questionId={q.id} reading={!editing} />
          <a
            href={`${s.courseSlug === "discover-your-divine-design" ? "/journey" : `/courses/${s.courseSlug}`}?lesson=${encodeURIComponent(q.lessonSlug)}`}
          >
            Return to this lesson
          </a>
        </article>
      ))}
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
      const r = await fetch(
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
        <a
          href={`/field-kit#${sourceSlug === "discover-your-divine-design" ? "artifacts" : `collection-${sourceSlug.startsWith("designid") ? "designid" : sourceSlug.startsWith("designpd") ? "designpd" : sourceSlug.startsWith("spiritual") ? "spiritual-gifts" : "fruitlife-360"}`}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open report collection in another tab
        </a>
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
  };
}

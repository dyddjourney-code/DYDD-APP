"use client";

import { useEffect, useMemo, useState } from "react";

type DesignMapRow = {
  focus: "profile" | "map" | "reveal" | "align" | "commit";
  helper: string;
  id: string;
  label: string;
  lens: string;
  prompts: string[];
  shortLabel: string;
};

type JourneyPhase = {
  anchor: string;
  id: string;
  label: string;
};

export type DesignMapProfile = {
  designId: {
    architect: string;
    artisan: string;
    integrative: string;
    primary: string;
    secondary: string;
    shadow: string;
    shepherd: string;
    steward: string;
  };
  designPd: {
    decideCore: string;
    decideDescriptor: string;
    decideTendency: string;
    doCore: string;
    doDescriptor: string;
    doTendency: string;
    planCore: string;
    planDescriptor: string;
    planTendency: string;
  };
  spiritualGifts: string[];
};

type DraftEntries = Record<string, Record<string, string>>;

const storageKey = "dydd-design-map-prototype-v1";

const rows: DesignMapRow[] = [
  {
    focus: "profile",
    helper:
      "Use this row to notice how capacity, gifts, shadows, history, and lived evidence shape the work before solving anything.",
    id: "design-reflection",
    label: "Design Reflection",
    lens: "DesignID + Spiritual Gifts",
    prompts: [
      "Capacity I can bring here",
      "Shadow I need to watch",
      "Gift that may serve this phase",
      "History or experience that matters",
    ],
    shortLabel: "Reflect",
  },
  {
    focus: "map",
    helper:
      "Name visible behavior. Keep it concrete enough that someone else could watch it happen.",
    id: "behavior",
    label: "Behavior Line",
    lens: "What happens here",
    prompts: [
      "A person chooses the next step",
      "The team names the real problem",
      "Someone takes ownership",
      "The group pauses to confirm alignment",
    ],
    shortLabel: "Behavior",
  },
  {
    focus: "map",
    helper:
      "Identify the people who need to be present, consulted, protected, or aligned in this part of the journey.",
    id: "people",
    label: "Onstage People",
    lens: "Who is involved",
    prompts: [
      "Decision owner",
      "People affected by the outcome",
      "Wise counsel or sponsor",
      "Someone with lived experience",
    ],
    shortLabel: "People",
  },
  {
    focus: "map",
    helper:
      "Name the visible tools, meetings, communication, forms, or processes that help the behavior happen.",
    id: "process",
    label: "Onstage Process",
    lens: "What guides the action",
    prompts: [
      "Discovery conversation",
      "Priority sort",
      "Decision criteria",
      "Review rhythm",
    ],
    shortLabel: "Process",
  },
  {
    focus: "map",
    helper:
      "Capture the backstage needs that make the visible work possible: money, systems, permissions, assets, support, or training.",
    id: "backstage",
    label: "Backstage Needs",
    lens: "What must support it",
    prompts: [
      "Budget or funding",
      "Software or workspace",
      "Permission or leadership approval",
      "Training, volunteer support, or expert help",
    ],
    shortLabel: "Needs",
  },
  {
    focus: "reveal",
    helper:
      "This is the hinge. Look across what you wrote and name the strength, gap, risk, or place where others are needed.",
    id: "strengths-gaps",
    label: "Reveal: Strengths & Gaps",
    lens: "What the map reveals",
    prompts: [
      "This is a strength to steward",
      "This is where I need others",
      "This is a missing resource",
      "This is where pressure may distort my design",
    ],
    shortLabel: "Reveal",
  },
  {
    focus: "align",
    helper:
      "Translate the gap into Plan, Decide, or Do. This keeps the worksheet from becoming notes without movement.",
    id: "plan-decide-do",
    label: "Align: Plan / Decide / Do",
    lens: "What kind of alignment is needed",
    prompts: [
      "PLAN: clarify mission and approach",
      "DECIDE: choose criteria, direction, or owner",
      "DO: take action, build rhythm, or launch",
      "OVERLAP: this needs two movements in order",
    ],
    shortLabel: "Align",
  },
  {
    focus: "commit",
    helper:
      "Turn the map into a faithful next step with ownership, support, a due date, and a ready-to-review or ready-to-launch marker.",
    id: "commit",
    label: "Commit: Next Faithful Step",
    lens: "What will move next",
    prompts: [
      "Owner",
      "First action",
      "Support needed",
      "Due date and ready-to-review date",
    ],
    shortLabel: "Commit",
  },
];

const phases: JourneyPhase[] = [
  {
    anchor: "What is the topic, calling, burden, opportunity, or decision?",
    id: "define",
    label: "Define",
  },
  {
    anchor: "Who is affected, needed, missing, or already carrying part of it?",
    id: "people",
    label: "People",
  },
  {
    anchor: "What must be understood, measured, named, or discerned?",
    id: "clarify",
    label: "Clarify",
  },
  {
    anchor: "What plan, structure, tool, money, or permission has to exist?",
    id: "prepare",
    label: "Prepare",
  },
  {
    anchor: "What small test, experiment, conversation, or prototype proves the path?",
    id: "test",
    label: "Test",
  },
  {
    anchor: "What gets launched, reviewed, handed off, repeated, or completed?",
    id: "launch",
    label: "Launch",
  },
];

const designPdWords = {
  decide: ["Insight", "Valley", "Proof", "Organization"],
  do: ["Reliability", "Energy", "Momentum", "Outcomes"],
  plan: ["Purpose", "Culture", "Motivation", "Assessment"],
};

function emptyEntries() {
  return rows.reduce<DraftEntries>((draft, row) => {
    draft[row.id] = phases.reduce<Record<string, string>>((phaseDraft, phase) => {
      phaseDraft[phase.id] = "";
      return phaseDraft;
    }, {});
    return draft;
  }, {});
}

function safeProfileValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

function strongestDesignId(profile: DesignMapProfile) {
  return safeProfileValue(profile.designId.primary, "DesignID profile");
}

function chipForFocus(row: DesignMapRow, phase: JourneyPhase, profile: DesignMapProfile) {
  const primary = strongestDesignId(profile);
  const topGift = profile.spiritualGifts[0] ?? "your top gift";
  const shadow = profile.designId.shadow || "overusing a good strength";
  const plan = profile.designPd.planTendency || "Plan pattern";
  const decide = profile.designPd.decideTendency || "Decide pattern";
  const doTendency = profile.designPd.doTendency || "Do pattern";

  if (row.focus === "profile") {
    return [
      `${primary} capacity may shape how I enter ${phase.label.toLowerCase()}.`,
      `${topGift} could serve this phase when it stays submitted to love.`,
      `Watch for ${shadow.toLowerCase()} if pressure rises here.`,
    ];
  }

  if (row.focus === "reveal") {
    return [
      `Strength: ${primary} can help bring clarity in ${phase.label.toLowerCase()}.`,
      `Gap: I may need someone different from me to strengthen this phase.`,
      `Question: what would make this phase healthy enough to continue?`,
    ];
  }

  if (row.focus === "align") {
    return [
      `PLAN: ${plan} affects the mission and approach here.`,
      `DECIDE: ${decide} affects criteria, agreement, and ownership here.`,
      `DO: ${doTendency} affects movement, consistency, and follow-through here.`,
    ];
  }

  if (row.focus === "commit") {
    return [
      `First faithful step for ${phase.label.toLowerCase()}:`,
      "Support needed:",
      "Ready-to-review date:",
    ];
  }

  return [
    phase.anchor,
    `${primary} may naturally notice part of this before others do.`,
    `This phase may need ${topGift} expressed with maturity.`,
  ];
}

function profileRows(profile: DesignMapProfile) {
  return [
    ["Primary", safeProfileValue(profile.designId.primary, "Waiting for DesignID")],
    ["Secondary", safeProfileValue(profile.designId.secondary, "Waiting for DesignID")],
    ["Integrative", safeProfileValue(profile.designId.integrative, "Not available yet")],
    ["Shadow watch", safeProfileValue(profile.designId.shadow, "Not available yet")],
    ["Plan", safeProfileValue(profile.designPd.planTendency, "Waiting for DesignPD")],
    ["Decide", safeProfileValue(profile.designPd.decideTendency, "Waiting for DesignPD")],
    ["Do", safeProfileValue(profile.designPd.doTendency, "Waiting for DesignPD")],
    ["Gifts", profile.spiritualGifts.length ? profile.spiritualGifts.join(", ") : "Waiting for Spiritual Gifts"],
  ];
}

export function DesignMapBuilder({ profile }: { profile: DesignMapProfile }) {
  const [activeRowId, setActiveRowId] = useState(rows[1]?.id ?? rows[0].id);
  const [entries, setEntries] = useState<DraftEntries>(() => emptyEntries());
  const [loaded, setLoaded] = useState(false);

  const activeRow = useMemo(
    () => rows.find((row) => row.id === activeRowId) ?? rows[0],
    [activeRowId],
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as DraftEntries;
        setEntries({ ...emptyEntries(), ...parsed });
      }
    } catch {
      setEntries(emptyEntries());
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, loaded]);

  const completedCells = Object.values(entries).reduce(
    (sum, rowEntries) =>
      sum + Object.values(rowEntries).filter((value) => value.trim()).length,
    0,
  );
  const totalCells = rows.length * phases.length;

  function updateEntry(rowId: string, phaseId: string, value: string) {
    setEntries((current) => ({
      ...current,
      [rowId]: {
        ...(current[rowId] ?? {}),
        [phaseId]: value,
      },
    }));
  }

  function appendPhrase(rowId: string, phaseId: string, phrase: string) {
    const currentValue = entries[rowId]?.[phaseId]?.trim();
    updateEntry(rowId, phaseId, currentValue ? `${currentValue}\n${phrase}` : phrase);
  }

  function resetDraft() {
    setEntries(emptyEntries());
  }

  return (
    <section className="design-map-workbench" aria-label="Design Map Workbench">
      <aside className="design-map-profile-panel">
        <div className="design-map-profile-heading">
          <p className="section-label">Attached Profile</p>
          <h2>John's working lens</h2>
          <p>
            These profile signals should eventually follow the signed-in participant,
            couple, team, class, or ministry group.
          </p>
        </div>

        <dl className="design-map-profile-list">
          {profileRows(profile).map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="design-map-pdd-card">
          <span>DesignPD overlay</span>
          <div>
            <strong>Plan</strong>
            <p>{designPdWords.plan.join(", ")}</p>
          </div>
          <div>
            <strong>Decide</strong>
            <p>{designPdWords.decide.join(", ")}</p>
          </div>
          <div>
            <strong>Do</strong>
            <p>{designPdWords.do.join(", ")}</p>
          </div>
        </div>
      </aside>

      <div className="design-map-main-panel">
        <div className="design-map-toolbar">
          <div>
            <p className="section-label">Row-by-row builder</p>
            <h2>{activeRow.label}</h2>
            <p>{activeRow.helper}</p>
          </div>
          <div className="design-map-progress">
            <span>{completedCells} of {totalCells}</span>
            <div>
              <i style={{ width: `${Math.round((completedCells / totalCells) * 100)}%` }} />
            </div>
            <button type="button" onClick={resetDraft}>Clear draft</button>
          </div>
        </div>

        <nav className="design-map-row-tabs" aria-label="Design map rows">
          {rows.map((row) => (
            <button
              aria-pressed={row.id === activeRow.id}
              className={row.id === activeRow.id ? "active" : ""}
              key={row.id}
              onClick={() => setActiveRowId(row.id)}
              type="button"
            >
              <span>{row.shortLabel}</span>
              <small>{row.lens}</small>
            </button>
          ))}
        </nav>

        <div className="design-map-phase-grid">
          {phases.map((phase, index) => {
            const value = entries[activeRow.id]?.[phase.id] ?? "";
            const chips = [...activeRow.prompts, ...chipForFocus(activeRow, phase, profile)];

            return (
              <article className="design-map-phase-card" key={phase.id}>
                <header>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{phase.label}</h3>
                    <p>{phase.anchor}</p>
                  </div>
                </header>

                <textarea
                  aria-label={`${activeRow.label} for ${phase.label}`}
                  onChange={(event) => updateEntry(activeRow.id, phase.id, event.target.value)}
                  placeholder="Write the working language for this part of the map..."
                  value={value}
                />

                <div className="design-map-chip-row" aria-label={`Suggested phrases for ${phase.label}`}>
                  {chips.slice(0, 6).map((chip) => (
                    <button
                      key={chip}
                      onClick={() => appendPhrase(activeRow.id, phase.id, chip)}
                      type="button"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <section className="design-map-slow-run" aria-label="Prototype slow run review">
          <p className="section-label">Slow-run check</p>
          <h2>Likely friction points to solve next</h2>
          <div>
            <article>
              <strong>People may confuse rows with phases.</strong>
              <p>
                The row tabs stay fixed while phases repeat, so the user always
                knows whether they are mapping behavior, people, process, needs,
                gaps, alignment, or commitment.
              </p>
            </article>
            <article>
              <strong>Suggestions can become too generic.</strong>
              <p>
                This draft uses profile-aware chips. The next version should pull
                from the full DesignID Journey Mapping sheet and filter by project type.
              </p>
            </article>
            <article>
              <strong>Groups need agreement, not just notes.</strong>
              <p>
                Corporate and ministry versions should add voting, confidence,
                owner assignment, and disagreement markers before the final commit row.
              </p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}

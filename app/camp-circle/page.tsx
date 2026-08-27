"use client";

import { useState } from "react";
import { PageHelp } from "@/components/page-help";
import {
  facilitatorPlaybookAppendices,
  facilitatorPlaybookHighlights,
  facilitatorPlaybookMeta,
  facilitatorPlaybookStages,
} from "@/lib/journey/facilitator-playbook";

type CircleMember = {
  name: string;
  role: string;
  progress: number;
  current: string;
  assessment: string;
  shared: string;
};

type SampleCircle = {
  slug: string;
  name: string;
  format: string;
  rhythm: string;
  nextMeeting: string;
  currentStage: string;
  leaderNeed: string;
  accessWindow: string;
  seatUse: string;
  members: CircleMember[];
};

const circleTypes = [
  {
    capacity: "Solo",
    detail: "One learner buys one seat, keeps a private workbook record, and moves through DYDD, DesignID, Spiritual Gifts, and Fruit Life at their own pace.",
    label: "Walk solo",
  },
  {
    capacity: "2 people",
    detail: "Two independent learner accounts are paired by invite so each person keeps their own answers while the pair gets shared progress and discussion prompts.",
    label: "Pair or couple",
  },
  {
    capacity: "4-10 people",
    detail: "A host buys seats up front, names the circle, sends invites, and uses the Field Guide, reminders, and progress view to keep the group moving.",
    label: "Small group",
  },
  {
    capacity: "10-25+ people",
    detail: "A church or organization buys a class pack, distributes invite seats, and manages participant pacing without exposing private workbook entries.",
    label: "Class",
  },
];

const accessPackages = [
  {
    name: "Individual Journey",
    seats: "1 seat",
    price: "$97",
    discount: "Baseline",
    perSeat: "$97 per learner",
    detail: "Best for a solo learner who wants the full DYDD Journey with the digitized workbook and assessment connections.",
    includes: ["DYDD Journey", "Digital CARE workbook", "DesignID access", "Spiritual Gifts + Fruit Life"],
  },
  {
    name: "Couple Journey",
    seats: "2 seats included",
    price: "$174",
    discount: "10% pair savings",
    perSeat: "$87 per learner",
    detail: "One person can purchase two seats and invite the other person into a paired dashboard.",
    includes: ["Two private accounts", "Pair progress dashboard", "Shared conversation prompts", "Optional shared notes"],
  },
  {
    name: "Circle Starter",
    seats: "Up to 5 seats",
    price: "$397",
    discount: "18% group savings",
    perSeat: "About $79 per learner",
    detail: "A simple small-group package for a leader who wants to host a few people without a larger church setup.",
    includes: ["Prepaid invite seats", "One leader Field Guide", "Group progress view", "Reminder tools"],
  },
  {
    name: "Circle Standard",
    seats: "Up to 10 seats",
    price: "$697",
    discount: "28% group savings",
    perSeat: "About $70 per learner",
    detail: "The clean fit for Jordan's Thursday Group: enough seats for a normal circle with strong value per person.",
    includes: ["Prepaid invite seats", "One leader Field Guide", "People dashboard", "Journey racetrack"],
  },
  {
    name: "Church Class Pack",
    seats: "Up to 25 seats",
    price: "$1,597",
    discount: "34% class savings",
    perSeat: "About $64 per learner",
    detail: "A church-friendly class package with bulk access and room to organize a full cohort.",
    includes: ["Church admin view", "Class invite seats", "Leader Field Guide", "Multiple circles later"],
  },
];

const accessFlow = [
  "Every person has their own account, seat, assessment record, workbook responses, and progress history.",
  "Pairs, circles, and classes connect separate accounts together by invite instead of sharing a login.",
  "Private CARE, Pathfinder, and assessment answers stay private unless a learner intentionally shares a summary.",
  "Leaders see seat status, readiness, progress, reminders, and Field Guide notes for the circle they are leading.",
];

const sampleCircles: SampleCircle[] = [
  {
    slug: "thursday-group",
    name: "Jordan's Thursday Group",
    format: "Small group",
    rhythm: "Weekly at 7:00 PM",
    nextMeeting: "Identity: Who and Whose",
    currentStage: "Module 3 / Section 3.1 / Lesson 3",
    leaderNeed: "Keep the group moving together while a few people finish DesignID.",
    accessWindow: "Active through June 30, 2027 with archive access after closing.",
    seatUse: "10 of 10 seats used",
    members: [
      { name: "Jordan Reyes", role: "Leader", progress: 41, current: "Identity Overview", assessment: "DesignID connected", shared: "Opened the week with a group summary." },
      { name: "Maya Bennett", role: "Participant", progress: 38, current: "Who Vs. Whose", assessment: "DesignID connected", shared: "Shared one identity sentence." },
      { name: "Caleb Ortiz", role: "Participant", progress: 34, current: "Handiwork", assessment: "Reminder needed", shared: "Added a question for the group." },
      { name: "Nora Whitaker", role: "Participant", progress: 43, current: "DesignID Lens", assessment: "DesignID connected", shared: "Marked CARE complete." },
      { name: "Eli Monroe", role: "Participant", progress: 29, current: "Purpose", assessment: "Pending", shared: "Reading caught up." },
      { name: "Priya Collins", role: "Participant", progress: 45, current: "Identity Among Believers", assessment: "DesignID connected", shared: "Shared a prayer request." },
      { name: "Owen Mercer", role: "Participant", progress: 31, current: "Handiwork", assessment: "Pending", shared: "No shared note yet." },
      { name: "Tessa Grant", role: "Participant", progress: 40, current: "Who Vs. Whose", assessment: "DesignID connected", shared: "Posted a group takeaway." },
      { name: "Marcus Hale", role: "Participant", progress: 35, current: "Who Vs. Whose", assessment: "Connected", shared: "Marked present." },
      { name: "Anika Rhodes", role: "Participant", progress: 27, current: "Purpose", assessment: "Reminder needed", shared: "Needs first check-in." },
    ],
  },
  {
    slug: "couple-walk",
    name: "Jordan + Avery",
    format: "Couple",
    rhythm: "Sunday evening",
    nextMeeting: "Identity and DesignID conversation",
    currentStage: "Module 3 / Section 3.2 / Lesson 1",
    leaderNeed: "Protect private answers while giving the couple a side-by-side conversation lane.",
    accessWindow: "Active through December 31, 2026 with pair archive access after closing.",
    seatUse: "2 of 2 seats used",
    members: [
      { name: "Jordan Reyes", role: "Spouse", progress: 46, current: "Design Reflections and Love", assessment: "Shepherd - Architect", shared: "Shared love-language observation." },
      { name: "Avery Reyes", role: "Spouse", progress: 44, current: "Design Reflections and Love", assessment: "Artisan - Steward", shared: "Opted into couple comparison." },
    ],
  },
  {
    slug: "wednesday-class",
    name: "Jordan's Wednesday Night Class",
    format: "Class cohort",
    rhythm: "Eight-week church class",
    nextMeeting: "Welcome and course rhythm",
    currentStage: "Module 1 / Welcome & Orientation / Lesson 2",
    leaderNeed: "Manage attendance, assessment readiness, and group pacing with a light-touch class view.",
    accessWindow: "Active through March 31, 2027 with 12-month archive access after closing.",
    seatUse: "15 of 25 seats used",
    members: [
      { name: "Amelia Brooks", role: "Participant", progress: 18, current: "Course Outline", assessment: "Invite sent", shared: "Joined circle." },
      { name: "Jonas Pike", role: "Participant", progress: 22, current: "How This Journey Works", assessment: "Invite sent", shared: "Marked present." },
      { name: "Renee Carter", role: "Participant", progress: 20, current: "Course Outline", assessment: "Pending", shared: "No shared note yet." },
      { name: "Theo Ramsey", role: "Participant", progress: 16, current: "Welcome", assessment: "Pending", shared: "Joined circle." },
      { name: "Bianca Flores", role: "Participant", progress: 24, current: "How This Journey Works", assessment: "Connected", shared: "Shared pace preference." },
      { name: "Graham Ellis", role: "Participant", progress: 14, current: "Welcome", assessment: "Invite sent", shared: "Needs reminder." },
      { name: "Sienna Vaughn", role: "Participant", progress: 19, current: "Course Outline", assessment: "Invite sent", shared: "Marked present." },
      { name: "Derek Lane", role: "Participant", progress: 17, current: "Welcome", assessment: "Pending", shared: "No shared note yet." },
      { name: "Naomi Price", role: "Participant", progress: 23, current: "How This Journey Works", assessment: "Connected", shared: "Posted one takeaway." },
      { name: "Silas Reed", role: "Participant", progress: 15, current: "Welcome", assessment: "Invite sent", shared: "Joined circle." },
      { name: "Claire Donovan", role: "Participant", progress: 21, current: "Course Outline", assessment: "Pending", shared: "Marked present." },
      { name: "Malik Turner", role: "Participant", progress: 13, current: "Welcome", assessment: "Pending", shared: "Needs first login." },
      { name: "Elena Marsh", role: "Participant", progress: 25, current: "How This Journey Works", assessment: "Connected", shared: "Shared one question." },
      { name: "Victor Chen", role: "Participant", progress: 18, current: "Course Outline", assessment: "Invite sent", shared: "Joined circle." },
      { name: "Hallie Foster", role: "Participant", progress: 16, current: "Welcome", assessment: "Pending", shared: "No shared note yet." },
    ],
  },
];

const archivedCircles = [
  {
    name: "Spring Men's Circle",
    closed: "Closed May 2026",
    people: "8 people",
    archive: "Read-only summaries, attendance, and shared notes retained.",
  },
  {
    name: "Marriage Foundations Pilot",
    closed: "Closed July 2026",
    people: "4 couples",
    archive: "Pair dashboards archived; private workbook entries stay in learner accounts.",
  },
];

const workspaceTabs = [
  ["Overview", "Pace, meeting, and leader next steps", "circle-overview"],
  ["People", "Progress, assessment status, and reminders", "circle-people"],
  ["Journey Track", "Racetrack view for the circle", "circle-journey-track"],
  ["Field Guide", "Leader notes matched to the course map", "field-guide"],
  ["Next Meeting", "Meeting focus and quick actions", "circle-next-meeting"],
];

const sharedLeaderNotes = [
  {
    label: "Before the lesson",
    text: "Frame the next section, confirm the privacy boundary, and decide which shared question belongs in the room.",
  },
  {
    label: "During the lesson",
    text: "Listen for confusion, repeated language, and places where people need permission to slow down.",
  },
  {
    label: "After CARE",
    text: "Ask for themes, questions, and next steps only. Private workbook answers stay with the learner.",
  },
  {
    label: "Close the circle",
    text: "Name what the group is carrying forward, set the next assignment, and send one simple reminder.",
  },
];

function completionAverage(members: CircleMember[]) {
  return Math.round(members.reduce((total, member) => total + member.progress, 0) / members.length);
}

function connectedAssessments(members: CircleMember[]) {
  return members.filter((member) => member.assessment.toLowerCase().includes("connected")).length;
}

function remindersNeeded(members: CircleMember[]) {
  return members.filter((member) => {
    const assessment = member.assessment.toLowerCase();
    const shared = member.shared.toLowerCase();
    return assessment.includes("pending") || assessment.includes("reminder") || shared.includes("needs");
  }).length;
}

export default function CampCirclePage() {
  const [activeCircleSlug, setActiveCircleSlug] = useState(sampleCircles[0].slug);
  const activeCircle = sampleCircles.find((circle) => circle.slug === activeCircleSlug) ?? sampleCircles[0];

  return (
    <main className="journey-shell hq-standalone-page camp-circle-page">
      <header className="standalone-hero camp-circle-hero">
        <div>
          <p className="eyebrow">Together</p>
          <h1>Camp Circle</h1>
          <p className="lede">
            A parallel leader workspace for people walking through DYDD together.
            The course stays clean for the learner. The circle gives the host
            progress, pacing, shared discussion, and the Field Guide beside the
            Journey without crowding it.
          </p>
        </div>
      </header>

      <PageHelp
        items={[
          "Use the course for the learner experience and Camp Circle for leader control.",
          "Switch between couple, small group, and class examples to test the structure.",
          "Keep private workbook and assessment answers private while tracking shared progress.",
        ]}
        title="Camp Circle help"
      />

      <section className="camp-circle-panel circle-options-panel" aria-label="Camp Circle options">
        <div className="card-heading wide-heading">
          <p className="section-label">Circle formats</p>
          <h2>One access model can support solo, couple, small group, and church class paths.</h2>
          <p>
            Start with one rule: every person gets their own seat. Camp Circle
            simply links those seats into a pair, group, or class dashboard so
            the learner experience stays personal and the leader experience
            stays organized.
          </p>
        </div>
        <div className="circle-pricing-feature">
          <div className="circle-pricing-feature-copy">
            <p className="section-label">Provisional package model</p>
            <h2>Sell access by seats, then let leaders invite people into the right circle.</h2>
            <p>
              These prices are working placeholders so the page can show the
              business model visually. The package includes the DYDD course,
              the digitized workbook experience, DesignID access, Spiritual
              Gifts, and Fruit Life. Paper books are separate.
            </p>
          </div>
          <div className="circle-book-disclaimer" role="note">
            <strong>Books are not included in seat pricing.</strong>
            <p>
              Learners can order the paper book or workbook separately. Current
              planning assumes a $19.99 retail book/workbook reference price.
              Larger classes can request a bulk book quote, but bulk fulfillment
              needs about three weeks of lead time and includes book cost plus
              shipping.
            </p>
          </div>
        </div>
        <div className="circle-package-grid">
          {accessPackages.map((pkg) => (
            <article className="circle-package-card" key={pkg.name}>
              <div className="circle-package-topline">
                <span>{pkg.seats}</span>
                <small>{pkg.discount}</small>
              </div>
              <h3>{pkg.name}</h3>
              <div className="circle-package-price">
                <strong>{pkg.price}</strong>
                <span>{pkg.perSeat}</span>
              </div>
              <p>{pkg.detail}</p>
              <ul>
                {pkg.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <div className="circle-access-flow" aria-label="How invite seats work">
          {accessFlow.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
        <div className="circle-type-grid">
          {circleTypes.map((type) => (
            <article className="camp-circle-panel" key={type.label}>
              <span>{type.capacity}</span>
              <h2>{type.label}</h2>
              <p>{type.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="camp-circle-panel circle-switchboard" aria-label="Jordan current circles">
        <div className="card-heading wide-heading">
          <p className="section-label">Leader workspace</p>
          <h2>Jordan's current circles</h2>
          <p>
            Current circles stay active for a defined season, then move into a
            read-only archive. Longer groups can still move slowly through all
            70 lessons, but the leader always knows which circles are live and
            which ones are finished.
          </p>
        </div>
        <div className="circle-preview-grid">
          {sampleCircles.map((circle) => (
            <article className={`circle-preview-card ${circle.slug === activeCircle.slug ? "selected" : ""}`} key={circle.slug}>
              <div>
                <span>{circle.format}</span>
                <h3>{circle.name}</h3>
                <p>{circle.rhythm}</p>
              </div>
              <div className="circle-preview-stat">
                <strong>{circle.members.length}</strong>
                <small>people</small>
              </div>
              <div className="circle-progress-line" aria-label={`${circle.name} average progress`}>
                <span style={{ width: `${completionAverage(circle.members)}%` }} />
              </div>
              <p>{circle.leaderNeed}</p>
              <small>{circle.seatUse}</small>
              <small>{circle.accessWindow}</small>
              <button className="button secondary" type="button" onClick={() => setActiveCircleSlug(circle.slug)}>
                Open this circle
              </button>
            </article>
          ))}
        </div>
        <details className="circle-archive-drawer">
          <summary>Archived circles</summary>
          <div>
            {archivedCircles.map((circle) => (
              <article key={circle.name}>
                <strong>{circle.name}</strong>
                <span>{circle.closed}</span>
                <p>{circle.people} - {circle.archive}</p>
              </article>
            ))}
          </div>
        </details>
      </section>

      <section className="camp-circle-workspace" id={activeCircle.slug} aria-label="Active circle workspace">
        <aside className="camp-circle-sidebar">
          <div className="card-heading">
            <p className="section-label">Active circle</p>
            <label className="circle-selector" htmlFor="circle-select">
              <span>Choose circle</span>
              <select id="circle-select" value={activeCircle.slug} onChange={(event) => setActiveCircleSlug(event.target.value)}>
                {sampleCircles.map((circle) => (
                  <option key={circle.slug} value={circle.slug}>{circle.name}</option>
                ))}
              </select>
            </label>
            <p>{activeCircle.currentStage}</p>
          </div>
          <nav aria-label="Circle workspace tabs">
            {workspaceTabs.map(([label, detail, anchor], index) => (
              <a className={index === 0 ? "active" : ""} href={`#${anchor}`} key={label}>
                <strong>{label}</strong>
                <span>{detail}</span>
              </a>
            ))}
          </nav>
          <div className="camp-circle-next-card">
            <span>Next meeting</span>
            <strong>{activeCircle.nextMeeting}</strong>
            <p>{activeCircle.leaderNeed}</p>
          </div>
        </aside>

        <div className="camp-circle-main">
          <details className="camp-circle-panel circle-dashboard-band circle-console-panel" id="circle-overview" aria-label="Circle dashboard" open>
            <summary>
              <span>Overview</span>
              <strong>{activeCircle.name}</strong>
            </summary>
            <div className="card-heading wide-heading">
              <p className="section-label">Leader dashboard</p>
              <h2>{activeCircle.currentStage}</h2>
            </div>
            <div className="circle-dashboard-metrics">
              <article>
                <span>{completionAverage(activeCircle.members)}%</span>
                <p>average course progress</p>
              </article>
              <article>
                <span>{connectedAssessments(activeCircle.members)}</span>
                <p>DesignID records connected</p>
              </article>
              <article>
                <span>{remindersNeeded(activeCircle.members)}</span>
                <p>reminders to send</p>
              </article>
              <article>
                <span>{activeCircle.members.length}</span>
                <p>{activeCircle.seatUse}</p>
              </article>
            </div>
            <div className="circle-lifecycle-note">
              <strong>Access window</strong>
              <p>{activeCircle.accessWindow}</p>
            </div>
          </details>

          <details className="camp-circle-panel people-progress-panel circle-console-panel" id="circle-people" aria-label="Participant progress" open>
            <summary>
              <span>People</span>
              <strong>{activeCircle.members.length} people in this circle</strong>
            </summary>
            <div className="card-heading wide-heading">
              <p className="section-label">People</p>
              <h2>Jordan sees readiness and progress without reading private workbook entries.</h2>
            </div>
            <div className="people-progress-list">
              {activeCircle.members.map((member) => (
                <article key={member.name}>
                  <div className="person-line-heading">
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                    <small>{member.progress}%</small>
                  </div>
                  <div className="person-progress-track">
                    <span style={{ width: `${member.progress}%` }} />
                  </div>
                  <div className="person-status-row">
                    <p>{member.current}</p>
                    <p>{member.assessment}</p>
                    <p>{member.shared}</p>
                  </div>
                </article>
              ))}
            </div>
          </details>

          <details className="camp-circle-panel circle-racetrack-panel circle-console-panel" id="circle-journey-track" aria-label="Circle racetrack" open>
            <summary>
              <span>Journey Track</span>
              <strong>{activeCircle.name} racetrack</strong>
            </summary>
            <div className="card-heading wide-heading">
              <p className="section-label">Journey Track</p>
              <h2>A racetrack view for group pacing.</h2>
              <p>
                This is the leader-level picture John described: Jordan can see
                where each person is on the class path while the private CARE
                and Pathfinder answers stay in each learner account.
              </p>
            </div>
            <div className="circle-racetrack">
              {activeCircle.members.map((member) => (
                <div className="circle-racer" key={member.name}>
                  <span>{member.name.split(" ")[0]}</span>
                  <div>
                    <i style={{ left: `${member.progress}%` }} />
                  </div>
                  <small>{member.current}</small>
                </div>
              ))}
            </div>
          </details>

          <details className="camp-circle-panel field-guide-workspace circle-console-panel" id="field-guide" aria-label="Field Guide workspace" open>
            <summary>
              <span>Field Guide</span>
              <strong>{activeCircle.name} leader guide</strong>
            </summary>
            <div className="field-guide-head">
              <div className="host-playbook-icon" aria-hidden="true">
                <svg fill="none" viewBox="0 0 64 64">
                  <path d="M13 12h25a10 10 0 0 1 10 10v30H23a10 10 0 0 1-10-10Z" fill="#fffaf0" stroke="#243f27" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <path d="M22 22h17M22 30h15M22 38h11" stroke="#739d5e" strokeLinecap="round" strokeWidth="3" />
                  <path d="m45 12 7-5 4 8-7 5Z" fill="#d4a451" stroke="#6f4d20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                  <path d="m39 27 10-7" stroke="#6f4d20" strokeLinecap="round" strokeWidth="3" />
                </svg>
              </div>
              <div className="host-playbook-copy">
                <p className="section-label">Field Guide</p>
                <h2>{facilitatorPlaybookMeta.title.replace("Host Playbook", "Field Guide")}</h2>
                <p>{facilitatorPlaybookMeta.value}</p>
                <small>{facilitatorPlaybookMeta.source}</small>
              </div>
            </div>

            <div className="host-playbook-highlights">
              {facilitatorPlaybookHighlights.slice(0, 4).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="leader-moment-grid">
              {sharedLeaderNotes.map((note) => (
                <article key={note.label}>
                  <strong>{note.label}</strong>
                  <p>{note.text}</p>
                </article>
              ))}
            </div>

            <div className="field-guide-course-map">
              {facilitatorPlaybookStages.map((stage) => (
                <details key={stage.slug}>
                  <summary>
                    <span>{stage.session}</span>
                    <strong>{stage.title}</strong>
                  </summary>
                  <div className="field-guide-session-body">
                    <section>
                      <h3>Leader focus</h3>
                      {stage.inTheMoment.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </section>
                    <section>
                      <h3>Prepare next</h3>
                      {stage.prepareNext.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </section>
                    <section>
                      <h3>Touchpoints</h3>
                      {stage.emails.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </section>
                    <a href={`/journey#${stage.slug}`}>Open matching Journey section</a>
                  </div>
                </details>
              ))}
            </div>
          </details>

          <details className="camp-circle-panel next-meeting-panel circle-console-panel" id="circle-next-meeting" aria-label="Next meeting" open>
            <summary>
              <span>Next Meeting</span>
              <strong>{activeCircle.nextMeeting}</strong>
            </summary>
            <div className="card-heading wide-heading">
              <p className="section-label">Next meeting</p>
              <h2>{activeCircle.nextMeeting}</h2>
              <p>{activeCircle.leaderNeed}</p>
            </div>
            <div className="next-meeting-actions">
              <button className="button" type="button">Send reminder</button>
              <button className="button secondary" type="button">Copy invite link</button>
              <button className="button text-button" type="button">Mark meeting complete</button>
            </div>
          </details>
        </div>
      </section>

      <section className="camp-circle-panel playbook-resource-hub" aria-label="Field Guide resource hub">
        <div className="card-heading">
          <p className="section-label">Field Guide library</p>
          <h2>Appendices become usable host tools.</h2>
        </div>
        <div className="playbook-resource-grid">
          {facilitatorPlaybookAppendices.map((resource) => (
            <article key={resource.title}>
              <strong>{resource.title}</strong>
              <p>{resource.detail}</p>
              <div>
                <button className="button secondary" type="button">Open</button>
                <button className="button text-button" type="button">Email to myself</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

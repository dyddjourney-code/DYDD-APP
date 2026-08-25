import Link from "next/link";
import { PageHelp } from "@/components/page-help";
import {
  facilitatorPlaybookAppendices,
  facilitatorPlaybookHighlights,
  facilitatorPlaybookMeta,
  facilitatorPlaybookStages,
} from "@/lib/journey/facilitator-playbook";

const circleTypes = [
  {
    capacity: "2 people",
    detail: "A shared pace for friends, mentor pairs, or a one-to-one discipleship track.",
    label: "Pair",
    privacy: "Private personal trail, shared chapter summaries.",
  },
  {
    capacity: "2 people",
    detail: "Adds a future opt-in side-by-side view for marriage conversations.",
    label: "Couple",
    privacy: "Personal trail stays private unless both people intentionally share.",
  },
  {
    capacity: "4-10 people",
    detail: "Built for a host-led circle where each person contributes to a shared learning thread.",
    label: "Small Group",
    privacy: "Members contribute only summaries, prayers, questions, and next steps.",
  },
  {
    capacity: "10-25+ people",
    detail: "A class format with facilitator notes, pacing, and shared discussion capture.",
    label: "Class",
    privacy: "Facilitator sees participation status, not private workbook entries.",
  },
];

const privacyLanes = [
  {
    title: "Personal Trail",
    text: "Workbook answers, CARE entries, journal notes, Pathfinder drafts, and assessment records remain attached to the individual account.",
  },
  {
    title: "Shared Circle Trail",
    text: "The group receives summaries, shared questions, what-we-learned notes, prayers, and agreed next steps.",
  },
  {
    title: "Host Controls",
    text: "The host manages invitations, pacing, stage openings, shared prompts, and group completion status.",
  },
  {
    title: "Couple View",
    text: "A future opt-in lane can compare DesignID, Spiritual Gifts, CARE areas, and Pathfinder themes side by side.",
  },
];

const journeyTrack = [
  ["Start", "Orient the circle and confirm privacy"],
  ["Identity", "Shared summary: whose we are"],
  ["DesignID", "Personal results, optional group language"],
  ["Expertise", "Skills and capacities we noticed"],
  ["Story", "Formation themes, shared carefully"],
  ["Desire", "Motivations and holy burden"],
  ["Spiritual Gifts", "Gifts language and service patterns"],
  ["Gifts", "Where grace is showing up"],
  ["Niche", "Shared calling themes and next experiments"],
  ["Pathways", "Choose direction and support structure"],
  ["DesignPD", "Practice decisions and accountability"],
  ["FruitLife 360", "Growth mirror and visible fruit"],
];

const sharedPrompts = [
  {
    stage: "End of each chapter",
    prompt: "What did we learn together that should not be lost?",
    type: "Shared summary",
  },
  {
    stage: "CARE reflection",
    prompt: "What did this section invite us to connect, act, reflect, or explore?",
    type: "Group CARE note",
  },
  {
    stage: "Pathfinder",
    prompt: "What patterns are emerging for our shared purpose and support?",
    type: "Purpose thread",
  },
  {
    stage: "Facilitator close",
    prompt: "What is the next faithful step for this circle before we meet again?",
    type: "Next step",
  },
];

const samplePeople = [
  {
    name: "Jordan",
    progress: "Identity complete",
    reflection: "Shepherd - Architect",
    shared: "Shared one Identity summary",
  },
  {
    name: "Taylor",
    progress: "DesignID connected",
    reflection: "Artisan - Steward",
    shared: "Added a question for Expertise",
  },
  {
    name: "Morgan",
    progress: "Spiritual Gifts next",
    reflection: "Awaiting DesignID",
    shared: "Reading with the circle",
  },
  {
    name: "Casey",
    progress: "Invited",
    reflection: "Private",
    shared: "Has not joined yet",
  },
];

const sideBySideRows = [
  ["Reflection", "Shepherd - Architect", "Artisan - Steward"],
  ["DesignID lens", "People care and structure", "Meaning-making and responsibility"],
  ["Spiritual Gifts", "Encouragement, mercy, leadership", "Creative service, wisdom, helps"],
  ["CARE filter", "Reflect + Act themes", "Connect + Explore themes"],
  ["Pathfinder", "Support and shepherding niche", "Creative formation niche"],
];

export default function CampCirclePage() {
  return (
    <main className="journey-shell hq-standalone-page camp-circle-page">
      <nav className="course-nav" aria-label="Camp Circle navigation">
        <Link href="/hq">Back to Base Camp</Link>
        <Link href="/journey">Journey</Link>
        <Link href="/field-kit">Field Kit</Link>
        <Link href="/gear">Gear</Link>
      </nav>

      <header className="standalone-hero camp-circle-hero">
        <div>
          <p className="eyebrow">Camp Circle</p>
          <h1>A parallel journey for people walking together.</h1>
          <p className="lede">
            Camp Circle is the control page for couples, pairs, small groups,
            and classes. It keeps each person&apos;s private DYDD record intact
            while giving the circle a shared trail for summaries, questions,
            group learning, prayer, and next steps.
          </p>
        </div>
        <div className="camp-circle-hero-badges" aria-label="Circle formats">
          <img src="/brand/badges/shepherd-badge.svg" alt="Shepherd badge" />
          <img src="/brand/badges/designid-badge.png" alt="DesignID badge" />
          <img src="/brand/badges/spiritual-gifts-badge.png" alt="Spiritual Gifts badge" />
        </div>
      </header>

      <PageHelp
        items={[
          "Start by choosing the circle format and capacity that matches the group.",
          "Invite people into the shared trail without exposing their private workbook or journal.",
          "Use shared entries for summaries, questions, prayers, next steps, and group memory.",
        ]}
        title="How Camp Circle works"
      />

      <section className="camp-circle-panel host-playbook-feature" id="host-playbook">
        <div className="host-playbook-icon" aria-hidden="true">
          <svg fill="none" viewBox="0 0 64 64">
            <path d="M13 12h25a10 10 0 0 1 10 10v30H23a10 10 0 0 1-10-10Z" fill="#fffaf0" stroke="#243f27" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            <path d="M22 22h17M22 30h15M22 38h11" stroke="#739d5e" strokeLinecap="round" strokeWidth="3" />
            <path d="m45 12 7-5 4 8-7 5Z" fill="#d4a451" stroke="#6f4d20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            <path d="m39 27 10-7" stroke="#6f4d20" strokeLinecap="round" strokeWidth="3" />
          </svg>
        </div>
        <div className="host-playbook-copy">
          <p className="section-label">Optional facilitator resource</p>
          <h2>{facilitatorPlaybookMeta.title}</h2>
          <p>{facilitatorPlaybookMeta.value}</p>
          <small>{facilitatorPlaybookMeta.source}</small>
        </div>
        <div className="host-playbook-highlights">
          {facilitatorPlaybookHighlights.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="camp-circle-control-grid" aria-label="Circle control dashboard">
        <article className="camp-circle-panel circle-builder">
          <div className="card-heading">
            <p className="section-label">Host setup</p>
            <h2>Create the circle.</h2>
          </div>
          <form className="circle-builder-form">
            <label>
              Circle name
              <input name="name" placeholder="Thursday DYDD Study" />
            </label>
            <label>
              Format
              <select name="group_type" defaultValue="small_group">
                <option value="pair">Pair</option>
                <option value="couple">Couple</option>
                <option value="small_group">Small group</option>
                <option value="class_cohort">Class cohort</option>
              </select>
            </label>
            <label>
              Capacity
              <select name="capacity" defaultValue="4-10">
                <option value="2">2 people</option>
                <option value="4-10">4-10 people</option>
                <option value="10-25">10-25 people</option>
                <option value="25-plus">25+ class</option>
              </select>
            </label>
            <label>
              Privacy lane
              <select name="privacy" defaultValue="shared_summaries">
                <option value="shared_summaries">Individual private, shared summaries</option>
                <option value="couple_opt_in">Couple side-by-side opt-in</option>
                <option value="facilitator_summary">Facilitator summary only</option>
              </select>
            </label>
            <button className="button primary" type="button">
              Stage circle
            </button>
            <p className="helper-text">
              Staged for preview. The Supabase structure is ready for live create,
              invite, and shared-entry actions.
            </p>
          </form>
        </article>

        <article className="camp-circle-panel invitation-panel">
          <div className="card-heading">
            <p className="section-label">Invitations</p>
            <h2>Invite people into the shared trail.</h2>
          </div>
          <div className="invite-rail">
            <label>
              Invitee email
              <input name="email" placeholder="person@example.com" />
            </label>
            <label>
              Role
              <select name="role" defaultValue="participant">
                <option value="participant">Participant</option>
                <option value="co_host">Co-host</option>
                <option value="facilitator">Facilitator</option>
              </select>
            </label>
            <button className="button secondary" type="button">
              Prepare invite
            </button>
          </div>
          <div className="privacy-callout">
            <strong>Boundary rule</strong>
            <p>
              Accepting an invitation does not expose personal workbook,
              journal, Pathfinder, or assessment data. It only joins the shared
              circle lane.
            </p>
          </div>
        </article>
      </section>

      <section className="circle-type-grid" aria-label="Circle sizes">
        {circleTypes.map((type) => (
          <article className="camp-circle-panel" key={type.label}>
            <span>{type.capacity}</span>
            <h2>{type.label}</h2>
            <p>{type.detail}</p>
            <small>{type.privacy}</small>
          </article>
        ))}
      </section>

      <section className="camp-circle-panel privacy-lanes" aria-label="Data privacy lanes">
        <div className="card-heading">
          <p className="section-label">Privacy architecture</p>
          <h2>Two journeys run beside each other.</h2>
        </div>
        <div className="privacy-lane-grid">
          {privacyLanes.map((lane) => (
            <article key={lane.title}>
              <strong>{lane.title}</strong>
              <p>{lane.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="camp-circle-panel group-track-panel" aria-label="Group journey track">
        <div className="card-heading">
          <p className="section-label">Shared track</p>
          <h2>The whole journey can be paced together.</h2>
        </div>
        <ol className="group-journey-track">
          {journeyTrack.map(([label, detail], index) => (
            <li key={label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{label}</strong>
              <small>{detail}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="camp-circle-panel facilitator-route-panel" aria-label="Facilitator playbook route">
        <div className="card-heading">
          <p className="section-label">Facilitator route</p>
          <h2>The playbook follows the circle in real time.</h2>
        </div>
        <div className="facilitator-route-grid">
          {facilitatorPlaybookStages.map((stage) => (
            <article key={stage.slug}>
              <span>{stage.session}</span>
              <strong>{stage.title}</strong>
              <p>{stage.inTheMoment[0]}</p>
              <a href={`/journey#${stage.slug}`}>Open in Journey</a>
            </article>
          ))}
        </div>
      </section>

      <section className="camp-circle-two-column">
        <article className="camp-circle-panel shared-workbench">
          <div className="card-heading">
            <p className="section-label">Shared entries</p>
            <h2>Everyone contributes to the group memory.</h2>
          </div>
          {sharedPrompts.map((item) => (
            <section key={item.prompt}>
              <span>{item.type}</span>
              <strong>{item.stage}</strong>
              <p>{item.prompt}</p>
              <textarea rows={3} placeholder="Shared group summary..." />
            </section>
          ))}
        </article>

        <article className="camp-circle-panel member-progress">
          <div className="card-heading">
            <p className="section-label">Host view</p>
            <h2>See progress without reading private entries.</h2>
          </div>
          {samplePeople.map((person) => (
            <section key={person.name}>
              <div>
                <strong>{person.name}</strong>
                <span>{person.reflection}</span>
              </div>
              <p>{person.progress}</p>
              <small>{person.shared}</small>
            </section>
          ))}
        </article>
      </section>

      <section className="camp-circle-panel couple-view-panel" aria-label="Couple view concept">
        <div className="card-heading">
          <p className="section-label">Couple view concept</p>
          <h2>Side by side only when both people choose it.</h2>
        </div>
        <div className="couple-comparison">
          <div className="comparison-header">
            <span>Filter</span>
            <strong>Jordan</strong>
            <strong>Taylor</strong>
          </div>
          {sideBySideRows.map(([filter, first, second]) => (
            <div className="comparison-row" key={filter}>
              <span>{filter}</span>
              <p>{first}</p>
              <p>{second}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="camp-circle-panel playbook-resource-hub" aria-label="Host playbook resource hub">
        <div className="card-heading">
          <p className="section-label">Purchased host library</p>
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

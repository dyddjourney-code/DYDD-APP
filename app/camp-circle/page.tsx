export const dynamic = "force-dynamic";

const circleTypes = [
  {
    capacity: "Solo",
    detail: "One learner buys one seat, keeps a private workbook record, and moves through DYDD, DesignID, Spiritual Gifts, and FruitLife at their own pace.",
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

const accessFlow = [
  "Every person has their own account, seat, assessment record, workbook responses, and progress history.",
  "Pairs, circles, and classes connect separate accounts together by invite instead of sharing a login.",
  "Private CARE, Pathfinder, and assessment answers stay private unless a learner intentionally shares a summary.",
  "Leaders see seat status, readiness, progress, reminders, and Field Guide notes for the circle they are leading.",
];

export default function CampCirclePage() {
  return (
    <main className="journey-shell hq-standalone-page camp-circle-page">
      <header className="standalone-hero camp-circle-hero">
        <div>
          <p className="eyebrow">Together</p>
          <h1>Camp Circles</h1>
          <p className="lede">
            A parallel leader workspace for people walking through DYDD together.
            The course stays clean for the learner. The circle gives the host
            progress, pacing, shared discussion, and the Field Guide beside the
            Journey without crowding it.
          </p>
        </div>
      </header>

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

    </main>
  );
}

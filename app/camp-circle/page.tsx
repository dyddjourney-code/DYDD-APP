import { ReviewAwareLink } from "@/components/review-aware-link";

export const dynamic = "force-dynamic";

const formats = [
  { label: "Couple", note: "Two people. One intentional journey.", detail: "Make room to understand how God has designed each of you. Explore your differences with grace, name your strengths, and practice living out your purpose together." },
  { label: "Small group", note: "Discovery grows through conversation.", detail: "Gather friends, a home group, or a ministry team. Bring your personal discoveries into thoughtful conversation, encourage one another, and take practical next steps." },
  { label: "Class", note: "A shared path, guided by a leader.", detail: "Bring a church or larger group through the journey with a facilitator, a common schedule, and space for each participant to discover and apply their own design." },
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

      <section className="camp-circle-panel circle-story-intro" aria-labelledby="circle-invitation">
        <div className="card-heading wide-heading">
          <p className="section-label">The main journey. Together.</p>
          <h2 id="circle-invitation">Discover your design.<br />Walk it out together.</h2>
          <p>God designed you with purpose. Sometimes the people walking beside you help you see it more clearly. A Camp Circle brings a couple, small group, or class through the full Discover Your Divine Design journey—with room for honest discovery, meaningful conversation, and encouragement to live what you are learning.</p>
        </div>
        <div className="privacy-callout"><strong>Built for the full DYDD journey</strong><p>Camp Circles are for the main Discover Your Divine Design journey, not the standalone short courses. Every participant keeps their own account and active paid journey subscription.</p></div>
        <ReviewAwareLink className="button" href="/camp-circle/my-circles#start-circle">Start a Circle</ReviewAwareLink>
      </section>

      <section className="camp-circle-panel" aria-labelledby="circle-why">
        <div className="card-heading wide-heading"><p className="section-label">Why journey together?</p><h2 id="circle-why">See more. Encourage one another. Put discovery into practice.</h2></div>
        <div className="circle-value-list">
          <article><h3>Recognize what you might overlook</h3><p>Other people can notice the strengths, gifts, and patterns you take for granted. Their perspective can deepen your understanding without defining you.</p></article>
          <article><h3>Keep taking the next step</h3><p>A shared rhythm creates space to reflect, come back to the journey, and encourage each other when life gets busy.</p></article>
          <article><h3>Bring purpose into everyday life</h3><p>Move from “That sounds like me” to “How will I live differently?” Apply your discoveries in faith, marriage, relationships, service, and leadership.</p></article>
        </div>
      </section>

      <section className="camp-circle-panel circle-options-panel" aria-labelledby="circle-formats">
        <div className="card-heading wide-heading"><p className="section-label">Choose your Circle</p><h2 id="circle-formats">Different gatherings. The same purposeful journey.</h2><p>You do not need a large class to begin. Choose the gathering that fits the people you want to walk with.</p></div>
        <div className="circle-format-list">{formats.map((format) => <article key={format.label}><div><span className="section-label">{format.note}</span><h3>{format.label}</h3></div><p>{format.detail}</p></article>)}</div>
      </section>

      <section className="camp-circle-panel camp-circle-two-column" aria-labelledby="circle-receives">
        <div className="card-heading wide-heading"><p className="section-label">Support for the journey</p><h2 id="circle-receives">Personal discovery.<br />Shared direction.</h2><p>Each person follows the main journey in their own account. Your Circle gives that personal work a shared setting for conversation and application.</p><p>The leader’s <strong>Field Guide</strong> brings the Circle Host Playbook alongside the journey: preparation checklists, session guidance, discussion prompts, assessment timing, and reusable email ideas. This is a group-leadership resource, not a standalone short-course extra.</p></div>
        <div className="circle-value-list"><article><h3>Your own journey</h3><p>Personal lessons, assessments, reflections, and progress stay connected to your own account.</p></article><article><h3>A rhythm you choose</h3><p>Plan a start date and weekly, every-other-week, or custom meetings. Keep meeting dates distinct from the sections you aim to complete.</p></article><article><h3>A prepared leader</h3><p>Use the Field Guide to prepare meaningful conversations and help participants put their discoveries into practice.</p></article></div>
      </section>

      <section className="camp-circle-panel" aria-labelledby="circle-how">
        <div className="card-heading wide-heading"><p className="section-label">The Circle experience</p><h2 id="circle-how">Start with your people. Build a shared rhythm.</h2><p>We are preparing the Circle setup and invitation tools around this simple process. You can plan your Circle in My Circles now; invitation delivery, subscription checks, and scheduled emails are the next stage.</p></div>
        <ol className="circle-steps"><li><strong>Name your Circle</strong><p>Choose Couple, Small Group, or Class.</p></li><li><strong>Invite your people</strong><p>Add each participant’s name and email. Their personal invitation provides the link to your Circle; Circles are not open for public joining.</p></li><li><strong>Accept and activate access</strong><p>Already using the app with an active paid journey subscription? Accept the invitation to enter. New participants create an account and subscribe first. Existing users without an active journey subscription activate it before entering.</p></li><li><strong>Begin together</strong><p>Set your start date, meeting time, time zone, and pace. Prepare with the Field Guide and keep encouraging one another along the way.</p></li></ol>
      </section>

      <section className="camp-circle-panel camp-circle-two-column" aria-labelledby="circle-privacy">
        <div className="card-heading wide-heading"><p className="section-label">Personal does not mean alone</p><h2 id="circle-privacy">A shared journey doesn’t mean sharing everything.</h2><p>Your private reflections belong to you. Circle participation is not permission to publish your workbook answers or assessment details. Shared progress should help a leader support the group—not turn personal discovery into comparison.</p></div>
        <div className="privacy-callout"><strong>Invitation-only. Individual accounts. Paid participation.</strong><p>There is no public Circle directory or open “join” path. Invitations connect people; they do not replace an account or bypass the journey subscription. Everyone—including the organizer—needs active paid journey access.</p><p>Chat is not part of the current Circle experience. Automated welcome, before-session, and follow-up emails will be added with scheduling controls in a later stage.</p></div>
      </section>

      <section className="camp-circle-panel circle-closing" aria-labelledby="circle-next"><p className="section-label">Your next step</p><h2 id="circle-next">Who will you walk with?</h2><p>Plan a Circle for the people already on your heart, or return to the Circles you are part of.</p><div className="circle-action-row"><ReviewAwareLink className="button" href="/camp-circle/my-circles#start-circle">Start a Circle</ReviewAwareLink><ReviewAwareLink className="button secondary" href="/camp-circle/my-circles">My Circles</ReviewAwareLink></div><p className="circle-fine-print">Received an invitation? Open the link in your invitation email. There is no separate public sign-up for a Circle.</p></section>
    </main>
  );
}

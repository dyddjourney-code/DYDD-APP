import { ContextualPurchases } from "@/components/contextual-purchases";
import { testBillingEnabled } from "@/lib/commerce/test-billing-config";
import { CirclePageHeader } from "@/components/circle-page-header";
import { ReviewAwareLink } from "@/components/review-aware-link";

export const dynamic = "force-dynamic";

const formats = [
  { label: "Couple · 2 people", detail: "Make time to listen, understand your differences, and see how God has designed each of you. Let what you discover draw you closer as you live out your purpose together." },
  { label: "Small group · 3–19 people", detail: "Gather friends, a home group, or a ministry team. Share what you are learning, pray for one another, and make room for honest conversations about faith and everyday life." },
  { label: "Class · 20–49 people", detail: "Walk through the journey with your church or a larger group. A facilitator helps guide the conversations while each person has room to discover and apply their own design." },
];

export default function CampCirclePage() {
  return (
    <main className="journey-shell hq-standalone-page camp-circle-page camp-circle-overview">
      <CirclePageHeader title="Camp Circles">
        Do life together. A shared place for your next gathering, preparation, and the discoveries you choose to share—while your personal Journey stays yours.
      </CirclePageHeader>

      <section className="circle-overview-intro" aria-labelledby="circle-invitation">
        <h2 id="circle-invitation">Discover your design. Walk it out together.</h2>
        <p>God designed you with purpose. Sometimes the people walking beside you help you see it more clearly. A Camp Circle brings a couple, small group, or class through the full Discover Your Divine Design journey—with room for honest discovery, meaningful conversation, and encouragement to live what you are learning.</p>
        <p className="circle-journey-note">Camp Circles are for the <strong>main DYDD journey</strong>, not the standalone short courses.</p>
      </section>

      <section className="circle-overview-section" aria-labelledby="circle-why">
        <h2 id="circle-why">Do life together.</h2>
        <div className="circle-overview-cards">
          <article className="circle-tile circle-tile-sage"><h3>Recognize what you might overlook</h3><p>Sometimes a friend sees a gift in you before you see it yourself. Listen to one another, share what you notice, and leave room for God to deepen your understanding.</p></article>
          <article className="circle-tile circle-tile-sand"><h3>Keep taking the next step</h3><p>Life gets busy. Having people beside you gives you a reason to return, a place to ask questions, and someone to encourage you when the next step feels hard.</p></article>
          <article className="circle-tile circle-tile-moss"><h3>Bring purpose into everyday life</h3><p>Talk about what your discoveries mean at home, at work, in your church, and in your relationships. Help one another put what you are learning into practice.</p></article>
        </div>
      </section>

      <section className="circle-overview-section" aria-labelledby="circle-formats">
        <h2 id="circle-formats">Start a purposeful journey.</h2>
        <p>Choose the kind of Circle that fits the people you want to walk with. Cohorts of 50 or more need owner approval for that specific Circle and its seat cap; bulk CSV rosters are validated before controlled invitations.</p>
        <div className="circle-overview-cards circle-format-cards">{formats.map((format, i) => <article className={`circle-tile circle-tile-${["sage", "sand", "moss"][i]}`} key={format.label}><h3>{format.label}</h3><p>{format.detail}</p></article>)}</div>
      </section>

      {testBillingEnabled() ? <ContextualPurchases area="circles" /> : null}

      <section className="circle-before-start" aria-labelledby="circle-before-start">
        <div><p className="eyebrow">Thinking about leading?</p><h2 id="circle-before-start">Before you start a Circle</h2><p>You don’t need to arrive with every answer. A Circle leader creates space for people to listen, reflect, and discover how God has shaped their lives for purpose.</p><p>Start with people you care about, a rhythm you can sustain, and a willingness to walk alongside them.</p><div className="circle-preview-sample"><strong>A glimpse inside the Field Guide</strong><p>For your first gathering, begin with grace—not pressure to find an impressive calling. Ask: “What if God has been shaping my life on purpose?” Then give people time to think before they speak.</p></div><div className="circle-action-row"><ReviewAwareLink className="button" href="/camp-circle/my-circles#start-circle">Start a Circle</ReviewAwareLink></div></div>
        <div><details><summary>What am I committing to?</summary><p>An eight-session journey with time for personal learning, reflection, conversation, and prayer. Sessions 7 and 8 stay distinct: bringing your design together, then declarations, commissioning, and next steps. Meet weekly, every other week, or at a pace that fits your people.</p></details><details><summary>What does a leader actually do?</summary><p>Prepare the gathering, welcome people, introduce the main idea, ask thoughtful questions, and make room for each person’s voice. You guide discovery; you don’t assign someone’s purpose or need to interpret everyone’s life.</p></details><details><summary>What should I consider first?</summary><p>Who would you like to invite? Where will you meet? What dates and preparation rhythm can you sustain? Each person—including you—needs their own active journey subscription. Private reflections remain personal unless someone chooses to share.</p></details><details><summary>What support will I have?</summary><p>Inside a started Circle, the Field Guide brings together guided launch preparation, eight distinct session references, and a practical Leader Toolkit. The first full-depth session guide includes preparation, a gathering flow, discussion prompts, and facilitation help. Further sessions will receive the same treatment as the guide grows.</p><p>Teaching-slide PDFs will be added for Circle leaders when supplied. They are not included in this public preview.</p></details></div>
      </section>

      <section className="circle-overview-section" aria-labelledby="circle-receives">
        <h2 id="circle-receives">You don’t have to lead on your own.</h2>
        <div className="circle-support-grid">
          <article className="circle-field-guide"><h3>A Field Guide for your Circle</h3><p>You don’t need to have every answer. Circle leaders receive the <strong>Field Guide</strong>, with help preparing for each gathering, questions to open up conversation, and guidance for walking through the journey together.</p><p>It is there to help you care for your people—not give you one more thing to figure out.</p></article>
          <div className="circle-support-details"><article><h3>Room for each person</h3><p>Everyone works through their lessons, assessments, and reflections in their own account, then brings what they choose to share into the conversation.</p></article><article><h3>A pace that fits your lives</h3><p>Choose a start date and a meeting rhythm that works for your people—weekly, every other week, or a schedule of your own.</p></article></div>
        </div>
      </section>

      <section className="circle-overview-section" aria-labelledby="circle-how">
        <h2 id="circle-how">A journey together.</h2>
        <ol className="circle-overview-cards circle-simple-steps">
          <li className="circle-tile"><span aria-hidden="true">01</span><h3>Name your Circle</h3><p>Give it a name and choose Couple, Small Group, Class, or request an approved Cohort.</p></li>
          <li className="circle-tile"><span aria-hidden="true">02</span><h3>Invite your people</h3><p>Choose who you want to walk with. Each person joins through their own invitation.</p></li>
          <li className="circle-tile"><span aria-hidden="true">03</span><h3>Begin together</h3><p>Choose when to start, make time to gather, and take the journey one step at a time.</p></li>
        </ol>
      </section>

      <section className="circle-overview-privacy" aria-labelledby="circle-privacy">
        <h2 id="circle-privacy">A shared journey doesn’t mean sharing everything.</h2>
        <p>Your private reflections stay yours. Share what you are ready to share; being in a Circle does not open your workbook answers or assessment details to everyone else.</p>
        <div className="circle-privacy-details"><article><h3>Invitation-only</h3><p>Your Circle is for the people you invite. There is no public directory or open joining.</p></article><article><h3>Individual accounts</h3><p>Each person, including the leader, needs their own account and active paid journey subscription. New participants create an account and subscribe before entering.</p></article></div>
      </section>

      <section className="circle-overview-section" aria-labelledby="circle-faq"><h2 id="circle-faq">Circle questions, clearly answered.</h2>
        <details><summary>What does it cost?</summary><p>Each participant and leader keeps a separate Personal membership: $10/month, or $5/month for DC3 Personal members. Circle Leadership is an additional $20/month, reduced at renewal to $10 with 10–19 qualifying paid accepted participants, or $0 with 20+. Personal stays paid; the Leadership waiver does not cancel leadership access. DC3 does not discount Leadership or Couples.</p><p>A Couples Circle is $5 once for one two-person Circle; both people retain Personal memberships. This does not unlock general group creation, a second couple, or extra seats.</p><ReviewAwareLink href="/hq#purchases">Personal membership in Base Camp</ReviewAwareLink></details>
        <details><summary>Do invited participants need to buy Leadership?</summary><p>No. An accepted invitation and your own active Personal membership open participant My Circles. Existing paid subscribers do not buy Personal again. You can participate in several Circles and lead another without exposing one Circle’s activity to another.</p></details>
        <details><summary>Who counts toward a Leadership discount?</summary><p>Distinct current paid, accepted participants across your Circles count once. Your own account, pending invites, trials, free grants and expired paid access do not count. One participant credits one leader at a time. Counts are checked for the next monthly renewal; the price does not churn mid-month.</p></details>
        <details><summary>What happens if I cancel Leadership?</summary><p>Full tools remain through your paid period. At period end, no new Circles, participants or invitations can be added. A 30-day transition allows existing work, renewal or transfer to an accepted subscribed leader. After that, group activity pauses and the Circle is read-only. Records and personal work are preserved; renewal restores operation. The one-time Couples unlock is separate.</p></details>
        <details><summary>How do university or large-cohort invitations work?</summary><p>Request owner approval with your organization, purpose, enrollment and launch plan. Approval is for one Cohort with a specific cap. Preview a CSV roster, correct validation errors and deduplicate, then create controlled email-bound invitations. Each invitee signs in with their intended email and maintains Personal membership. Capacity approval is not free membership or a claim of simultaneous assessment/report processing capacity.</p></details>
        <details><summary>What is shared, and what stays private?</summary><p>Reflections, full reports and discussion reminder notes are private by default. Choose people visibility and insight sharing separately in each Circle. Small Group and Class Callouts share only a question or request you explicitly submit for a particular session, lesson and prompt. Cohorts collect unique-person topic counts only, with no written submissions or leader inbox. Sub-Circle writing is not aggregated into a cohort.</p></details>
        <details><summary>What do Couples see together?</summary><p>When both accepted partners explicitly consent, the shared journey shows saved DesignID capacity overlay and detail, plus Spiritual Gifts. Useful pending states appear while either person is not ready. It does not publish either full private report. DesignPD is not included in the shared Couples journey.</p></details>
        <details><summary>What materials and tools are available?</summary><p>Gathering calendars, location/link, participant preparation, the eight-session Field Guide and leader planning tools support the main DYDD Journey. Teaching slides and founder resources will be advertised as available only after supplied and ready. Social chat and messaging are not part of this release.</p></details>
        <details><summary>Are there creation and invitation limits?</summary><p>Yes. Account-wide creation and invitation budgets protect the shared service; pending invitations reserve seats, and deleting a Circle does not reset creation counters. The organizer occupies one seat. Owners can approve higher account allowances; new Cohorts or increased caps need their own approval.</p></details>
      </section>

      <section className="circle-overview-closing" aria-labelledby="circle-next"><div><h2 id="circle-next">Who will you walk with?</h2><p>Plan a Circle for the people already on your heart, or return to the Circles you are part of.</p></div><div className="circle-action-row"><ReviewAwareLink className="button" href="/camp-circle/my-circles#start-circle">Start a Circle</ReviewAwareLink><ReviewAwareLink className="button secondary" href="/camp-circle/my-circles">My Circles</ReviewAwareLink></div><p className="circle-invitation-note">Already invited? Follow the link in your invitation email.</p></section>
    </main>
  );
}

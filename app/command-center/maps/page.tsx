import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isPrivateOwnerConsole } from "@/lib/private-owner";
import { mapsPhases, type MapsPhaseSlug } from "@/lib/maps-report/content";
import styles from "./maps.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "MAPS | DYDD Command Center",
  description: "Recognize what kind of work the moment requires, then take the next faithful step.",
  robots: { index: false, follow: false },
};

const practice: Record<MapsPhaseSlug, { question: string; invitation: string; prompts: string[]; output: string }> = {
  mission: {
    question: "What are we called to accomplish, and why?",
    invitation: "Begin with the work in front of you, not a blank plan. Name the direction, the people it serves, and why it matters now.",
    prompts: ["What am I moving toward?", "Where does my design fit this work?", "What would faithful progress look like in the next 90 days?"],
    output: "A clear direction statement and an honest picture of where you are.",
  },
  approach: {
    question: "How will we go about it?",
    invitation: "Look honestly at what is present and what is missing. Test assumptions, recognize strengths, and bring the right understanding to the work.",
    prompts: ["What is clear, uncertain, confirmed, or assumed?", "Which strengths can I bring, and where do I need help?", "Which three gaps or friction points matter most?"],
    output: "A prioritized gap list, with the information and support needed next.",
  },
  process: {
    question: "What needs to be organized and carried through?",
    invitation: "Give the direction enough structure to carry it. Make the sequence, resources, decisions, and evidence of progress visible.",
    prompts: ["Plan: What needs to happen first, and what resources are missing?", "Decide: What must be chosen, by whom, and by when?", "Do: Who owns the work, and how will we know it is working?"],
    output: "A one-page plan, open decisions with owners and due dates, and clear readiness criteria.",
  },
  send: {
    question: "How do we release what is ready into action?",
    invitation: "Move the smallest real version into practice. Choose a faithful pace, release what is ready, and return to what you learn.",
    prompts: ["What concrete step can I take within seven days?", "What is ready to launch, and what is not ready yet?", "What date, support, and review rhythm will keep this moving?"],
    output: "A dated next faithful step, a ready-to-launch or ready-to-review date, and a follow-through rhythm.",
  },
};

const labs = [
  { week: "01", title: "Where Are You?", theme: "Perspective before planning.", exercise: "The Where Are You Map", action: "Name your direction, design fit, Plan / Decide / Do needs, gaps, and real constraints. Circle your top three friction points.", outcome: "A current-state map and one possible 90-day target." },
  { week: "02", title: "What Must Be Planned?", theme: "Turn fog into structure.", exercise: "The Planning Board", action: "Work through Purpose, People, Path, Proof, Provision, and Protection. Identify missing resources and make a not-now list.", outcome: "A one-page plan with 3–5 phases and a first resource list." },
  { week: "03", title: "What Must Be Decided?", theme: "Decisions create movement.", exercise: "The Decision Grid", action: "Clarify direction, scope, audience, resources, calendar, accountability, and faith. Define the minimum real version and what ready enough means.", outcome: "A first-version commitment, a launch checklist, and open decisions with owners and due dates." },
  { week: "04", title: "What Must Be Done?", theme: "Leave with movement, dates, and ownership.", exercise: "The Launch Path", action: "Set 7-, 30-, 60-, and 90-day actions. Name support, prayer focus, obstacles, a fallback plan, and the first review date.", outcome: "A dated action plan, a realistic ready-by date, and a weekly follow-through rhythm." },
];

export default function MapsPage() {
  // This foundation is available only inside the pinned, Vercel-authenticated
  // owner deployment. Public sandbox preview credentials cannot enable it.
  if (!isPrivateOwnerConsole()) notFound();

  return (
    <main className={styles.shell}>
      <header className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Command Center / MAPS foundation</p>
          <img className={styles.logo} src="/brand/maps/logo.png" alt="MAPS" width="1252" height="361" />
          <h1>Recognize the work.<br />Take the next faithful step.</h1>
          <p className={styles.lead}>MAPS helps us recognize what kind of work the moment requires.</p>
          <p>Bring one real life, ministry, business, calling, or project direction. Use Mission, Approach, Process, and Send to see what it needs and move it into practice.</p>
          <div className={styles.actions}>
            <a className={styles.primary} href="#mission">Explore the four kinds of work <span aria-hidden="true">↗</span></a>
            <a href="#practice">See the class labs <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <figure className={styles.circle}>
          <img src="/brand/maps/circle.jpg" alt="The MAPS circle: Mission, Approach, Process, and Send around a shared center" width="2048" height="2048" fetchPriority="high" />
          <figcaption>One direction. Different kinds of work.</figcaption>
        </figure>
      </header>

      <nav className={styles.phaseNav} aria-label="MAPS sections">
        {mapsPhases.map((phase, index) => <a key={phase.slug} href={`#${phase.slug}`}>
          <img src={`/brand/maps/${phase.slug}.png`} alt="" width="306" height="307" />
          <span><small>0{index + 1}</small><strong>{phase.name}</strong></span>
        </a>)}
      </nav>

      <section className={styles.orientation} aria-labelledby="maps-orientation">
        <p className={styles.eyebrow}>From insight to movement</p>
        <h2 id="maps-orientation">Reveal. Align. Commit.</h2>
        <div className={styles.rhythm}>
          <p><strong>Reveal</strong><span>Recognize strengths, gaps, and the current reality.</span></p>
          <p><strong>Align</strong><span>Bring Plan, Decide, and Do into agreement.</span></p>
          <p><strong>Commit</strong><span>Choose the next faithful step with a date and ownership.</span></p>
        </div>
        <p className={styles.note}>These are lenses for the work, not a rigid sequence. Return to the kind of work the moment needs.</p>
      </section>

      <div className={styles.phases}>
        {mapsPhases.map((phase, index) => {
          const lab = practice[phase.slug];
          return <section className={`${styles.phase} ${styles[phase.slug]}`} id={phase.slug} key={phase.slug} aria-labelledby={`${phase.slug}-heading`}>
            <div className={styles.phaseIdentity}>
              <div className={styles.phaseTop}><span className={styles.number}>0{index + 1}</span><img src={`/brand/maps/${phase.slug}.png`} alt={`${phase.name} icon`} width="306" height="307" loading="lazy" /></div>
              <h2 id={`${phase.slug}-heading`}>{phase.name}</h2>
              <p className={styles.question}>{lab.question}</p>
              <p>{lab.invitation}</p>
            </div>
            <div className={styles.phaseWork}>
              <div className={styles.terms}>
                {phase.subcategories.map((category) => <div key={category.name}><h3>{category.name}</h3><p>{category.definition}</p></div>)}
              </div>
              <div className={styles.lab}>
                <p className={styles.eyebrow}>Bring it into practice</p>
                <ul>{lab.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>
                <p className={styles.output}><strong>Leave with</strong><span>{lab.output}</span></p>
              </div>
            </div>
          </section>;
        })}
      </div>

      <section id="practice" className={styles.classSection} aria-labelledby="maps-class-heading">
        <div className={styles.classHeading}>
          <div><p className={styles.eyebrow}>Design in Motion / Four-week class foundation</p><h2 id="maps-class-heading">Work on something real.</h2></div>
          <p>Built on the current class’s practical labs: see where you are, plan what matters, make the decisions, and leave with movement. Each week produces something you can use.</p>
        </div>
        <div className={styles.labs}>
          {labs.map((lab) => <details key={lab.week}>
            <summary><span className={styles.week}>Week {lab.week}</span><span><strong>{lab.title}</strong><small>{lab.theme}</small></span><span className={styles.expand} aria-hidden="true">+</span></summary>
            <div className={styles.labDetails}><h3>{lab.exercise}</h3><p>{lab.action}</p><p><strong>Participant output:</strong> {lab.outcome}</p></div>
          </details>)}
        </div>
      </section>

      <section className={styles.nextStep} aria-labelledby="maps-next-heading">
        <p className={styles.eyebrow}>Start here</p>
        <h2 id="maps-next-heading">One direction. One next step.</h2>
        <p>On paper or in your own notes, name what you are moving toward, the kind of work it needs now, and one concrete action you will take within seven days. Give it an owner and a date.</p>
        <a href="#mission">Return to Mission <span aria-hidden="true">↑</span></a>
      </section>

      <footer className={styles.scope}>
        <div><strong>The foundation is here. The workspace comes next.</strong><p>This first page introduces the framework and class labs. Individual maps, team overviews with data and graphs, and an interactive class are future ideas, not connected features on this page. Nothing entered or opened here changes participant records.</p></div>
        <Link href="/command-center">Back to Command Center <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}

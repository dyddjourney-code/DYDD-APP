import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNavIcon } from "@/components/app-sidebar";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ExpeditionPageProps = {
  searchParams?: Promise<{
    key?: string;
    review?: string;
  }>;
};

export const dynamic = "force-dynamic";

const expeditionStages = [
  {
    name: "Basecamp",
    subtitle: "Discovery",
    scripture: "Romans 12:4-8",
    summary:
      "Gather the team, honor what God has placed in each person, and surface gifts, roles, strengths, gaps, and hidden tension before the climb begins.",
  },
  {
    name: "Route Map",
    subtitle: "Alignment",
    scripture: "Amos 3:3",
    summary:
      "Clarify where the team is going, where purpose drift has entered, and whether mission, authority, pace, values, and people are actually moving together.",
  },
  {
    name: "The Ascent",
    subtitle: "Development",
    scripture: "Ephesians 4:11-16",
    summary:
      "Move into the real climb: conflict, trust, leadership formation, MAPS roadmaps, 360 feedback, role clarity, and team development.",
  },
  {
    name: "Summit",
    subtitle: "Impact",
    scripture: "John 15:5-8",
    summary:
      "Name the higher ground the organization is called toward: greater fruit, stronger courage, clearer stewardship, and deeper Kingdom impact.",
  },
  {
    name: "Return",
    subtitle: "Integration",
    scripture: "Joshua 4:4-7",
    summary:
      "Bring back lessons, artifacts, commitments, 30/60/90 checkpoints, annual review rhythms, and changed leaders who know how to lead differently.",
  },
];

const expeditionTools = [
  ["Team Design", "Team dynamics, balance, role clarity, conflict patterns, and strengths/gaps across the group."],
  ["Hiring and Assimilation", "Candidate fit, onboarding guidance, integration reports, and 30/60/90 checkpoints."],
  ["MAPS Roadmaps", "Purpose drift detection, journey mapping, project movement, and practical alignment conversations."],
  ["360 Formation", "Leader, team, FruitLife 360, and annual review rhythms connected to measurable growth."],
  ["Grace Deployment", "DesignID, DesignPD, Spiritual Gifts, and Design Pathways for volunteer or staff placement."],
  ["Retreats and Workshops", "Alignment intensives, leadership formation, MAPS days, and guided expedition experiences."],
];

export default async function ExpeditionPage({ searchParams }: ExpeditionPageProps) {
  const params = await searchParams;
  const isOwnerPreview = isOwnerPreviewRequest(params);
  const serverSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user && !isOwnerPreview) {
    redirect(`/login?next=${encodeURIComponent("/command-center/expedition")}`);
  }

  const isAdmin = isOwnerPreview || isDyddAdminEmail(user?.email);

  if (!isAdmin) {
    redirect("/command-center");
  }

  return (
    <main className="command-center-shell expedition-page-shell">
      <section className="command-center-hero expedition-page-hero">
        <div>
          <p className="section-label">DYDD Command Center / Private Owner Preview</p>
          <h1>Expedition</h1>
          <p>
            A premium team and leadership avenue for Christian organizations that need discovery,
            alignment, formation, and Kingdom-impact follow-through.
          </p>
        </div>
        <div className="command-center-hero-card">
          <AppNavIcon name="hiker" />
          <span>Group access</span>
          <strong>Teams</strong>
          <small>Separate from the individual journey path for now</small>
        </div>
      </section>

      <section className="expedition-command" aria-label="Expedition leadership avenue preview">
        <div className="expedition-command-hero">
          <div className="expedition-command-copy">
            <p className="section-label">Leadership Avenue</p>
            <h2>Expedition</h2>
            <p>
              A guided leadership ascent for Christian teams, churches, ministries,
              mission agencies, and organizations that know they were made for more.
              Expedition helps teams discover their design, align their mission,
              climb toward greater Kingdom impact, and return equipped to lead
              with clarity, courage, and purpose.
            </p>
            <div className="expedition-command-actions" aria-label="Expedition action concepts">
              <a href="#expedition-route">Preview the route</a>
              <a href="#expedition-tools">See team tools</a>
              <Link href="/command-center">Back to Command Center</Link>
            </div>
          </div>
          <div className="expedition-ascent-card" aria-label="Illustrated expedition ascent placeholder">
            <div className="expedition-sky">
              <span className="expedition-sun" />
              <span className="expedition-cloud cloud-one" />
              <span className="expedition-cloud cloud-two" />
            </div>
            <div className="expedition-mountain">
              <span className="expedition-peak peak-one" />
              <span className="expedition-peak peak-two" />
              <span className="expedition-route-line" />
              <span className="expedition-flag" />
              <span className="expedition-camp-dot dot-base">B</span>
              <span className="expedition-camp-dot dot-map">M</span>
              <span className="expedition-camp-dot dot-summit">S</span>
            </div>
            <div className="expedition-card-caption">
              <strong>Your team has a summit.</strong>
              <small>Find it. Climb it. Come back changed.</small>
            </div>
          </div>
        </div>

        <div className="expedition-stage-strip" id="expedition-route">
          {expeditionStages.map((stage, index) => (
            <article key={stage.name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{stage.name}</strong>
              <small>{stage.subtitle}</small>
              <p>{stage.summary}</p>
              <em>{stage.scripture}</em>
            </article>
          ))}
        </div>

        <div className="expedition-dashboard-grid" id="expedition-tools">
          <article className="expedition-panel expedition-operating-model">
            <p className="section-label">Operating model</p>
            <h3>Built for organizations, not solo subscriptions.</h3>
            <p>
              Expedition can live as a premium team avenue inside DYDD: organizations
              buy access for a group, invite leaders or volunteers, and move through
              guided tools, live workshops, reports, and follow-up checkpoints.
            </p>
            <div className="expedition-access-row">
              <div>
                <span>Access</span>
                <strong>Group seats</strong>
                <small>Company, ministry, or church-based purchasing</small>
              </div>
              <div>
                <span>Motion</span>
                <strong>Guided ascent</strong>
                <small>Assessment, conversation, retreat, and integration</small>
              </div>
              <div>
                <span>Outcome</span>
                <strong>Aligned impact</strong>
                <small>Artifacts, decisions, and 30/60/90 follow-through</small>
              </div>
            </div>
          </article>

          <article className="expedition-panel expedition-team-map">
            <p className="section-label">Team map concept</p>
            <h3>From scattered effort to aligned impact.</h3>
            <div className="expedition-team-radar" aria-label="Expedition team alignment placeholder">
              <span className="radar-axis axis-x" />
              <span className="radar-axis axis-y" />
              <b className="radar-member member-one">JD</b>
              <b className="radar-member member-two">MK</b>
              <b className="radar-member member-three">TR</b>
              <b className="radar-member member-four">RC</b>
              <i className="radar-ring ring-one" />
              <i className="radar-ring ring-two" />
            </div>
            <p>
              Placeholder for the future Expedition command map: design balance,
              purpose drift, role alignment, MAPS readiness, and team formation
              pressure points in one executive view.
            </p>
          </article>

          <article className="expedition-panel expedition-tool-list">
            <p className="section-label">Tool modules</p>
            <h3>First-run tool shelf</h3>
            <div>
              {expeditionTools.map(([name, detail]) => (
                <section key={name}>
                  <strong>{name}</strong>
                  <small>{detail}</small>
                </section>
              ))}
            </div>
          </article>

          <article className="expedition-panel expedition-scripture">
            <p className="section-label">Biblical spine</p>
            <h3>Not pasted-on verses. A formation arc.</h3>
            <ul>
              <li><strong>Ephesians 2:10</strong><span>Good works prepared beforehand.</span></li>
              <li><strong>Habakkuk 2:2</strong><span>Write the vision clearly.</span></li>
              <li><strong>Proverbs 27:17</strong><span>People sharpen one another in the climb.</span></li>
              <li><strong>Matthew 5:14-16</strong><span>Visible fruit and Kingdom impact.</span></li>
              <li><strong>Mark 6:30-32</strong><span>Return, report, rest, and integrate.</span></li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}

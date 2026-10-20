"use client";

import type { CSSProperties, ReactNode } from "react";
import { type CirclePlan } from "@/lib/circles/plan";
import { CircleSetupPlanner } from "@/components/circle-setup-planner";

type CircleMember = {
  name: string;
  role: string;
  progress: number;
  current: string;
  assessment: string;
  shared: string;
};

type DemoAssessmentMember = {
  color: string;
  designId: {
    architect: number;
    artisan: number;
    shepherd: number;
    steward: number;
  };
  designPd: {
    decide: number;
    do: number;
    plan: number;
  };
  gifts: string[];
  name: string;
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
  demoAssessments?: DemoAssessmentMember[];
};

const demoColors = ["#4a6239", "#8a5f2d", "#456073", "#735066", "#739d5e", "#b88a43", "#647c9b", "#5a496b", "#6f4d20", "#2f5c49"];
const designIdMaxScore = 60;
const designPdMaxAxisScore = 24;
const designPdTickMarks = [-20, -15, -10, -5, 0, 5, 10, 15, 20];

const thursdayGroupDemoAssessments: DemoAssessmentMember[] = [
  { name: "Jordan Reyes", color: demoColors[0], gifts: ["Teaching", "Leadership", "Wisdom", "Discernment", "Shepherding"], designId: { architect: 42, artisan: 19, shepherd: 48, steward: 27 }, designPd: { plan: -14, decide: 9, do: -6 } },
  { name: "Maya Bennett", color: demoColors[1], gifts: ["Mercy", "Encouragement", "Faith", "Hospitality", "Discernment"], designId: { architect: 24, artisan: 31, shepherd: 46, steward: 29 }, designPd: { plan: -5, decide: -13, do: 7 } },
  { name: "Caleb Ortiz", color: demoColors[2], gifts: ["Service", "Giving", "Helps", "Administration", "Faith"], designId: { architect: 30, artisan: 36, shepherd: 28, steward: 41 }, designPd: { plan: 8, decide: 15, do: -2 } },
  { name: "Nora Whitaker", color: demoColors[3], gifts: ["Discernment", "Wisdom", "Prophecy", "Teaching", "Knowledge"], designId: { architect: 47, artisan: 22, shepherd: 33, steward: 35 }, designPd: { plan: -18, decide: -6, do: 12 } },
  { name: "Eli Monroe", color: demoColors[4], gifts: ["Evangelism", "Faith", "Leadership", "Exhortation", "Teaching"], designId: { architect: 39, artisan: 44, shepherd: 21, steward: 18 }, designPd: { plan: -2, decide: 4, do: 19 } },
  { name: "Priya Collins", color: demoColors[5], gifts: ["Administration", "Leadership", "Service", "Wisdom", "Giving"], designId: { architect: 34, artisan: 27, shepherd: 37, steward: 46 }, designPd: { plan: 16, decide: 11, do: 3 } },
  { name: "Owen Mercer", color: demoColors[6], gifts: ["Hospitality", "Mercy", "Helps", "Service", "Encouragement"], designId: { architect: 18, artisan: 38, shepherd: 43, steward: 24 }, designPd: { plan: -9, decide: -16, do: -14 } },
  { name: "Tessa Grant", color: demoColors[7], gifts: ["Creative Communication", "Teaching", "Encouragement", "Knowledge", "Wisdom"], designId: { architect: 29, artisan: 49, shepherd: 26, steward: 20 }, designPd: { plan: -20, decide: -3, do: 8 } },
  { name: "Marcus Hale", color: demoColors[8], gifts: ["Leadership", "Administration", "Teaching", "Faith", "Discernment"], designId: { architect: 45, artisan: 30, shepherd: 31, steward: 39 }, designPd: { plan: 12, decide: 20, do: 15 } },
  { name: "Anika Rhodes", color: demoColors[9], gifts: ["Prayer", "Mercy", "Discernment", "Hospitality", "Faith"], designId: { architect: 21, artisan: 25, shepherd: 51, steward: 33 }, designPd: { plan: -7, decide: -19, do: -4 } },
];

const jordanAveryDemoAssessments: DemoAssessmentMember[] = [
  { name: "Jordan Reyes", color: demoColors[0], gifts: ["Teaching", "Leadership", "Wisdom", "Discernment", "Shepherding"], designId: { architect: 42, artisan: 19, shepherd: 48, steward: 27 }, designPd: { plan: -14, decide: 9, do: -6 } },
  { name: "Avery Reyes", color: demoColors[1], gifts: ["Mercy", "Hospitality", "Discernment", "Service", "Faith"], designId: { architect: 26, artisan: 41, shepherd: 38, steward: 44 }, designPd: { plan: 4, decide: -12, do: 17 } },
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

function participantInitials(name: string) {
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) || "?").toUpperCase();
}

function signedDesignPdPosition(score: number) {
  return Math.max(0, Math.min(100, 50 + score / designPdMaxAxisScore * 50));
}

function designPdPoles(axis: keyof DemoAssessmentMember["designPd"]) {
  if (axis === "plan") return ["Dreamer", "Doer"];
  if (axis === "decide") return ["Feel It", "Think It"];
  return ["Solo", "Together"];
}

function designPdLabel(axis: keyof DemoAssessmentMember["designPd"]) {
  if (axis === "plan") return "Plan";
  if (axis === "decide") return "Decide";
  return "Do";
}

function designPdTendency(axis: keyof DemoAssessmentMember["designPd"], score: number) {
  const [left, right] = designPdPoles(axis);
  if (score < 0) return left;
  if (score > 0) return right;
  return "Balanced";
}

function designIdReflectionRows(members: DemoAssessmentMember[]) {
  const fields = [
    ["architect", "Architect"],
    ["artisan", "Artisan"],
    ["shepherd", "Shepherd"],
    ["steward", "Steward"],
  ] as const;

  return fields.map(([key, label]) => {
    const values = members.map((member) => member.designId[key]);
    const average = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;

    return {
      average,
      highCount: values.filter((value) => value >= 45).length,
      key,
      label,
    };
  });
}

function giftDistribution(members: DemoAssessmentMember[]) {
  const rows = new Map<string, { count: number; topFiveCount: number }>();

  for (const member of members) {
    member.gifts.forEach((gift, index) => {
      const row = rows.get(gift) ?? { count: 0, topFiveCount: 0 };
      row.topFiveCount += 1;
      if (index === 0) row.count += 1;
      rows.set(gift, row);
    });
  }

  return Array.from(rows.entries())
    .map(([label, values]) => ({ label, ...values }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || b.topFiveCount - a.topFiveCount || a.label.localeCompare(b.label));
}

function primaryReflectionCounts(members: DemoAssessmentMember[]) {
  const rows = new Map<string, number>();

  for (const member of members) {
    const entries = Object.entries(member.designId).sort((a, b) => b[1] - a[1]);
    const primary = entries[0]?.[0];
    if (!primary) continue;
    const label = primary[0].toUpperCase() + primary.slice(1);
    rows.set(label, (rows.get(label) ?? 0) + 1);
  }

  return Array.from(rows.entries())
    .map(([label, count]) => ({ count, label }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function groupDesignPdAxes(members: DemoAssessmentMember[]) {
  return (["plan", "decide", "do"] as const).map((axisKey) => {
    const allMembers = members.map((member) => ({
      color: member.color,
      id: member.name,
      initials: participantInitials(member.name),
      name: member.name,
      position: signedDesignPdPosition(member.designPd[axisKey]),
      signedScore: member.designPd[axisKey],
      stackIndex: 0,
      tendency: designPdTendency(axisKey, member.designPd[axisKey]),
    }));
    const membersByScore = new Map<number, typeof allMembers>();

    for (const member of allMembers) {
      membersByScore.set(member.signedScore, [...(membersByScore.get(member.signedScore) ?? []), member]);
    }

    const visibleMembers: typeof allMembers = [];
    const overflowBuckets: {
      bucket: number;
      count: number;
      members: typeof allMembers;
      position: number;
    }[] = [];

    for (const [bucket, bucketMembers] of membersByScore.entries()) {
      const sortedMembers = bucketMembers.sort((a, b) => a.initials.localeCompare(b.initials));
      sortedMembers.slice(0, 4).forEach((member, stackIndex) => {
        visibleMembers.push({ ...member, stackIndex });
      });

      if (sortedMembers.length > 4) {
        overflowBuckets.push({
          bucket,
          count: sortedMembers.length - 4,
          members: sortedMembers.slice(4),
          position: signedDesignPdPosition(bucket),
        });
      }
    }

    const signedScores = allMembers.map((member) => member.signedScore);
    const maxStack = Math.min(4, Math.max(1, ...Array.from(membersByScore.values()).map((items) => items.length)));
    const spread = signedScores.length ? Math.max(...signedScores) - Math.min(...signedScores) : 0;

    return {
      axisKey,
      label: designPdLabel(axisKey),
      maxStack,
      members: visibleMembers.sort((a, b) => a.position - b.position || a.stackIndex - b.stackIndex),
      overflowBuckets: overflowBuckets.sort((a, b) => a.position - b.position),
      poles: designPdPoles(axisKey),
      spread,
    };
  });
}

function CircleDataDashboard({ circle }: { circle: SampleCircle }) {
  const demoAssessments = circle.demoAssessments ?? [];

  if (!demoAssessments.length) {
    return (
      <div className="circle-data-empty">
        <strong>No assessment dashboard yet</strong>
        <p>This circle shows progress only. Data opens here after the group has Spiritual Gifts, DesignID, or DesignPD records.</p>
      </div>
    );
  }

  return demoAssessments.length === 2
    ? <CoupleDataDashboard members={demoAssessments} />
    : <GroupDataDashboard members={demoAssessments} />;
}

function GroupDataDashboard({ members }: { members: DemoAssessmentMember[] }) {
  const gifts = giftDistribution(members);
  const maxGiftCount = Math.max(...gifts.map((gift) => gift.count), 1);
  const designIdRows = designIdReflectionRows(members);
  const primaryRows = primaryReflectionCounts(members);
  const designPdAxes = groupDesignPdAxes(members);
  const strongestDesignId = [...designIdRows].sort((a, b) => b.average - a.average)[0];
  const widestDesignPdAxis = [...designPdAxes].sort((a, b) => b.spread - a.spread)[0];

  return (
    <section className="circle-data-dashboard" aria-label="Circle assessment data preview">
      <div className="group-interpretation-summary circle-data-summary">
        <article>
          <span>Spiritual Gifts read</span>
          <strong>{gifts[0]?.label ?? "Waiting for gifts"}</strong>
          <small>{gifts[0]?.count ?? 0} people list this as their current #1 gift.</small>
        </article>
        <article>
          <span>DesignID center of gravity</span>
          <strong>{strongestDesignId?.label ?? "Waiting for DesignID"}</strong>
          <small>Highest average reflection score: {strongestDesignId?.average ?? 0}.</small>
        </article>
        <article>
          <span>DesignPD widest spread</span>
          <strong>{widestDesignPdAxis?.label ?? "Waiting for DesignPD"}</strong>
          <small>{widestDesignPdAxis?.spread ?? 0} points from one side of the tendency line to the other.</small>
        </article>
      </div>

      <div className="group-visual-grid circle-data-visual-grid">
        <article className="group-visual-card group-gifts-card">
          <span>Spiritual Gifts current #1 distribution</span>
          <p>Demo view: each bar counts the person&apos;s current top gift and notes how often that gift appears anywhere in the top five.</p>
          <div className="group-horizontal-bars">
            {gifts.slice(0, 12).map((item) => (
              <div className="group-horizontal-bar-row" key={item.label}>
                <small>{item.label}</small>
                <div aria-hidden="true">
                  <i style={{ width: `${Math.max((item.count / maxGiftCount) * 100, 8)}%` }} />
                </div>
                <strong>{item.count}</strong>
                <em>{item.topFiveCount} top 5</em>
              </div>
            ))}
          </div>
        </article>

        <article className="group-visual-card group-designid-card">
          <span>DesignID group capacity bars</span>
          <p>Demo view: average capacity across the four reflections, with high-capacity counts for quick teaching context.</p>
          <div className="group-designid-bars">
            {designIdRows.map((item) => (
              <div className={`group-designid-bar-row ${item.key}`} key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.highCount} people at 45+</small>
                </div>
                <div aria-hidden="true">
                  <i style={{ width: `${Math.max((item.average / designIdMaxScore) * 100, item.average ? 8 : 0)}%` }} />
                </div>
                <b>{item.average}</b>
              </div>
            ))}
          </div>
          <div className="group-primary-strip">
            <strong>Primary reflection count</strong>
            <div>
              {primaryRows.map((item) => (
                <span key={item.label}>{item.label}: {item.count}</span>
              ))}
            </div>
          </div>
        </article>
      </div>

      <DesignPdGroupHeatmap axes={designPdAxes} />
    </section>
  );
}

function DesignPdGroupHeatmap({ axes }: { axes: ReturnType<typeof groupDesignPdAxes> }) {
  return (
    <article className="group-visual-card group-designpd-card">
      <span>DesignPD group tendency map</span>
      <p>Demo view: each bubble is placed at its actual score. Only exact matching scores stack or move into an overflow box.</p>
      <div className="group-designpd-heatmap">
        {axes.map((axis) => (
          <div className="group-designpd-axis" key={axis.axisKey}>
            <div className="group-designpd-axis-title">
              <strong>{axis.label}</strong>
              <small>{axis.spread} point spread</small>
            </div>
            <div className="group-designpd-axis-track">
              <small>{axis.poles[0]}</small>
              <div style={{ minHeight: `${160 + axis.maxStack * 27}px` }}>
                <div className="group-designpd-tick-row" aria-hidden="true">
                  {designPdTickMarks.map((tick) => (
                    <span key={`${axis.axisKey}-${tick}`} style={{ left: `${signedDesignPdPosition(tick)}%` }}>
                      {Math.abs(tick)}
                    </span>
                  ))}
                </div>
                <i />
                {axis.members.map((member) => (
                  <b
                    key={`${axis.axisKey}-${member.id}`}
                    style={{
                      left: `${member.position}%`,
                      top: `${76 + member.stackIndex * 27}px`,
                      "--member-color": member.color,
                    } as CSSProperties}
                    title={`${member.name}: ${member.tendency} (${member.signedScore > 0 ? "+" : ""}${member.signedScore})`}
                  >
                    {member.initials}
                  </b>
                ))}
                {axis.overflowBuckets.map((bucket) => (
                  <div className="group-designpd-overflow" key={`${axis.axisKey}-overflow-${bucket.bucket}`} style={{ left: `${bucket.position}%` }}>
                    <span />
                    <strong>+{bucket.count}</strong>
                    <small>
                      {bucket.members.map((member) => (
                        <b
                          key={`${axis.axisKey}-overflow-${member.id}`}
                          style={{ "--member-color": member.color } as CSSProperties}
                          title={`${member.name}: ${member.tendency} (${member.signedScore > 0 ? "+" : ""}${member.signedScore})`}
                        >
                          {member.initials}
                        </b>
                      ))}
                    </small>
                  </div>
                ))}
              </div>
              <small>{axis.poles[1]}</small>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CoupleDataDashboard({ members }: { members: DemoAssessmentMember[] }) {
  const [first, second] = members;
  const giftRows = Array.from(new Set(members.flatMap((member) => member.gifts)))
    .map((gift) => ({
      gift,
      owners: members
        .map((member, memberIndex) => {
          const rank = member.gifts.indexOf(gift);
          return rank === -1 ? null : {
            color: member.color,
            initials: participantInitials(member.name),
            name: member.name,
            rank: rank + 1,
            memberIndex,
          };
        })
        .filter((owner): owner is { color: string; initials: string; memberIndex: number; name: string; rank: number } => Boolean(owner)),
    }))
    .sort((a, b) => b.owners.length - a.owners.length || Math.min(...a.owners.map((owner) => owner.rank)) - Math.min(...b.owners.map((owner) => owner.rank)) || a.gift.localeCompare(b.gift));
  const designIdRows = [
    ["architect", "Architect"],
    ["artisan", "Artisan"],
    ["shepherd", "Shepherd"],
    ["steward", "Steward"],
  ] as const;
  const designPdAxes = groupDesignPdAxes(members);

  return (
    <section className="circle-data-dashboard couple-circle-data" aria-label="Couple assessment data preview">
      <div className="couple-data-grid">
        <article className="circle-visual-card spiritual-gift-overlap">
          <span>Spiritual Gifts overlap</span>
          <div className="gift-overlap-table">
            {giftRows.map((row) => (
              <div className={row.owners.length > 1 ? "shared" : ""} key={row.gift}>
                <strong>{row.gift}</strong>
                <span className="gift-owner-pills">
                  {row.owners.map((owner) => (
                    <span key={`${row.gift}-${owner.name}`} style={{ "--member-color": owner.color } as CSSProperties}>
                      {owner.initials} #{owner.rank}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="circle-visual-card couple-designid-card">
          <span>DesignID capacity comparison</span>
          <div className="couple-capacity-bars">
            {designIdRows.map(([key, label]) => (
              <div className={`couple-capacity-row ${key}`} key={key}>
                <strong>{label}</strong>
                <div>
                  {members.map((member) => (
                    <span key={`${member.name}-${key}`}>
                      <i style={{ width: `${Math.max((member.designId[key] / designIdMaxScore) * 100, 6)}%`, "--member-color": member.color } as CSSProperties} />
                      <b>{participantInitials(member.name)} {member.designId[key]}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="circle-visual-legend">
            {[first, second].map((member) => (
              <div key={member.name}>
                <i style={{ background: member.color }} />
                <strong>{participantInitials(member.name)}</strong>
                <small>{member.name}</small>
              </div>
            ))}
          </div>
        </article>
      </div>

      <DesignPdGroupHeatmap axes={designPdAxes} />
    </section>
  );
}

export function CircleProgressDashboard({ plan, tab, samples }: { plan: CirclePlan; tab: string; samples: boolean }) {
  const count = Number(plan.expectedPeople);
  const source = plan.format === "Couple" ? jordanAveryDemoAssessments : thursdayGroupDemoAssessments;
  const demo = Array.from({ length: count }, (_, i) => ({ ...source[i % source.length], name: i < source.length ? source[i].name : `Sample participant ${i + 1}`, color: demoColors[i % demoColors.length] }));
  const names = ["You", ...plan.participants.map(p => p.name)];
  const members: CircleMember[] = samples ? demo.map((p, i) => ({ name: p.name, role: i === 0 ? "Organizer · sample" : "Sample participant", progress: 0, current: "Not started", assessment: "Sample assessment", shared: "No activity yet" })) : names.map((name, i) => ({ name, role: i === 0 ? "Organizer" : "Listed · not invited", progress: 0, current: "Not started", assessment: "Not connected", shared: "No activity yet" }));
  const circle: SampleCircle = { slug: "selected-circle", name: plan.name, format: plan.format, rhythm: plan.rhythm, nextMeeting: "", currentStage: "Not started", leaderNeed: "", accessWindow: "", seatUse: "", members, demoAssessments: samples ? demo : [] };
  if (tab === "Data") return <section className="circle-data-panel" aria-label="Selected Circle data"><h3>Group design</h3><p className="circle-fine-print">{samples ? `Sample assessments · ${count} people. These are not participant results.` : "Assessment results will appear when participants connect and share them."}</p><CircleDataDashboard circle={circle} /></section>;
  return <section className="circle-compact-progress" aria-label="Selected Circle progress">
    <div className="card-heading wide-heading"><h3>Racetrack</h3><span>{members.length} {samples ? "sample people" : "people listed"} / {count} planned</span></div>
    <p className="circle-fine-print">{samples ? "Sample names · everyone starts at 0%. No participant activity is being simulated." : "No connected participant progress yet. Listed people have not been invited."}</p>
    <div className="circle-racetrack">{members.map((member, i) => <div className="circle-racer" key={`${member.name}-${i}`}><span>{member.name}</span><div role="progressbar" aria-label={`${member.name} course progress`} aria-valuenow={0} aria-valuemin={0} aria-valuemax={100}><i style={{ left: "0%", background: demoColors[i % demoColors.length] }} /></div><small>0% · Not started</small></div>)}</div>
    <details className="circle-roster-details"><summary>Participant details</summary><div className="people-progress-list">{members.map((member,i) => <article key={`${member.name}-${i}`}><strong>{member.name}</strong><span>{member.role}</span><small>{member.assessment}</small></article>)}</div></details>
  </section>;
}

export default function MyCirclesWorkspace({ profilePreview }: { profilePreview?: ReactNode }) {
  return <main className="journey-shell hq-standalone-page camp-circle-page"><header className="standalone-hero camp-circle-hero"><div><p className="eyebrow">Together</p><h1>My Circles</h1><p className="lede">Your people, your next meeting, and your Journey together.</p></div></header>{profilePreview}<CircleSetupPlanner renderDashboard={(plan, tab, samples) => <CircleProgressDashboard plan={plan} tab={tab} samples={samples} />} /></main>;
}

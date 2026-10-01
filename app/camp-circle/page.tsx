"use client";

import type { CSSProperties } from "react";
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
    demoAssessments: thursdayGroupDemoAssessments,
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
    demoAssessments: jordanAveryDemoAssessments,
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
  ["Progress", "Pace, people, and current meeting movement", "circle-progress"],
  ["Data", "Assessment interpretation for this circle", "circle-data"],
  ["Field Guide", "Leader prompts, actions, and session notes", "field-guide"],
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
          <details className="camp-circle-panel circle-dashboard-band circle-console-panel" id="circle-progress" aria-label="Circle progress" open>
            <summary>
              <span>Progress</span>
              <strong>{activeCircle.name} control view</strong>
            </summary>
            <div className="card-heading wide-heading">
              <p className="section-label">Progress</p>
              <h2>{activeCircle.currentStage}</h2>
              <p>
                Jordan can see pace, attendance readiness, and where each person
                sits in the circle without opening private workbook or assessment
                answers.
              </p>
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

            <div className="circle-progress-split">
              <section className="people-progress-panel" aria-label="Participant progress list">
                <div className="card-heading wide-heading">
                  <p className="section-label">People</p>
                  <h2>{activeCircle.members.length} people in this circle</h2>
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
              </section>

              <section className="circle-racetrack-panel" aria-label="Circle racetrack">
                <div className="card-heading wide-heading">
                  <p className="section-label">Track</p>
                  <h2>Racetrack view</h2>
                  <p>
                    This stays here as the alternate progress view while we decide
                    whether the bar graph or racetrack works better for circle leaders.
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
              </section>
            </div>
          </details>

          <details className="camp-circle-panel circle-data-panel circle-console-panel" id="circle-data" aria-label="Circle data interpretation" open>
            <summary>
              <span>Data</span>
              <strong>{activeCircle.demoAssessments?.length ? "Assessment dashboard preview" : "Assessment dashboard locked"}</strong>
            </summary>
            <div className="card-heading wide-heading">
              <p className="section-label">Data</p>
              <h2>{activeCircle.name} assessment interpretation</h2>
              <p>
                This is the Camp Circle version of the command-center group data:
                Spiritual Gifts distribution, DesignID capacity, and DesignPD
                tendencies when those layers are available.
              </p>
            </div>
            <CircleDataDashboard circle={activeCircle} />
          </details>

          <details className="camp-circle-panel field-guide-workspace circle-console-panel" id="field-guide" aria-label="Field Guide workspace" open>
            <summary>
              <span>Field Guide</span>
              <strong>{activeCircle.nextMeeting}</strong>
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

            <section className="next-meeting-panel circle-next-meeting-inline" aria-label="Next meeting">
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
            </section>

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

            <details className="field-guide-resource-drawer">
              <summary>Appendices and resource tools</summary>
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
            </details>
          </details>
        </div>
      </section>
    </main>
  );
}

export type FacilitatorPlaybookStage = {
  slug: string;
  session: string;
  title: string;
  inTheMoment: string[];
  prepareNext: string[];
  emails: string[];
  resources: string[];
};

export const facilitatorPlaybookMeta = {
  title: "Circle Host Playbook",
  subtitle: "Founder-created guidance for leading the DYDD journey with clarity.",
  source:
    "Built from the Church Implementation Leaders Playbook by John Willoughby.",
  value:
    "A facilitator layer for hosts, class leaders, church teams, and couples who want more than a participant workbook. It gives the leader the setup plan, session notes, discussion flow, assessment timing, email touchpoints, and appendices needed to guide people through DYDD without exposing anyone's private journal or workbook record.",
};

export const facilitatorPlaybookHighlights = [
  "8-session class flow mapped to the digital Journey.",
  "Founder notes for setup, pacing, discussion, and class close.",
  "DesignID and Spiritual Gifts assessment timing and instructions.",
  "Leader preparation checklists, launch timeline, and common mistakes.",
  "Reusable invitation, reminder, follow-up, and assessment email prompts.",
  "Appendices for schedules, table questions, FAQs, promotion, alumni groups, and purpose conversations.",
];

export const facilitatorPlaybookStages: FacilitatorPlaybookStage[] = [
  {
    slug: "welcome",
    session: "Session 1",
    title: "On Purpose, For Purpose",
    inTheMoment: [
      "Frame DYDD around Ephesians 2:10 and the idea that each person is intentionally designed.",
      "Set the culture: honest reflection, no pressure to overshare, and respect for private work.",
      "Explain how the app, workbook, assessments, and Circle summaries work together.",
    ],
    prepareNext: [
      "Make sure every participant can access the Journey and understands the private-versus-shared boundary.",
      "Send the DesignID assessment link early enough for results to be ready during Identity.",
      "Review the first Identity prompts and choose one table question for the circle.",
    ],
    emails: [
      "Welcome to the Circle and what to expect.",
      "DesignID assessment link and completion deadline.",
      "Week one recap with next reading and reflection rhythm.",
    ],
    resources: [
      "Sample class schedules",
      "Leader preparation checklist",
      "Church promotion materials",
    ],
  },
  {
    slug: "identity",
    session: "Session 2",
    title: "Identity and DesignID",
    inTheMoment: [
      "Keep identity grounded in whose we are before moving into what we do.",
      "Use DesignID as a mirror for grace patterns, not a label that defines the person.",
      "Invite shared summaries only; personal DesignID details stay private unless the participant chooses to share.",
    ],
    prepareNext: [
      "Check who has completed DesignID and who needs a reminder.",
      "Prepare a simple explanation of primary, secondary, and integrative reflections.",
      "Preview Expertise so participants begin noticing skills, competencies, and developed wisdom.",
    ],
    emails: [
      "DesignID result reminder for anyone not finished.",
      "Identity recap and personal reflection prompt.",
      "Expertise preview with what to notice this week.",
    ],
    resources: [
      "DesignID assessment instructions",
      "Table discussion questions",
      "Facilitator quick guide",
    ],
  },
  {
    slug: "expertise",
    session: "Session 3",
    title: "Expertise",
    inTheMoment: [
      "Help people separate humility from hiding real skill.",
      "Name expertise as faithful development through practice, pain, opportunity, and service.",
      "Draw out concrete evidence rather than vague strengths.",
    ],
    prepareNext: [
      "Ask participants to list moments, people, places, and seasons that shaped them.",
      "Prepare the circle for Story with care, gentleness, and freedom not to share everything.",
      "Choose discussion prompts that keep Story redemptive without rushing meaning.",
    ],
    emails: [
      "Expertise recap and skill inventory reminder.",
      "Story preparation note with privacy expectations.",
      "Optional mentor/friend question for outside confirmation.",
    ],
    resources: [
      "Weekly teaching outline",
      "Table discussion questions",
      "Common launch mistakes",
    ],
  },
  {
    slug: "story",
    session: "Session 4",
    title: "Story",
    inTheMoment: [
      "Create a careful room where people can name formation without being pushed into exposure.",
      "Help participants see triumphs, wounds, culture, family, work, and church as formation material.",
      "Keep the shared Circle record focused on themes, questions, and learning, not private details.",
    ],
    prepareNext: [
      "Preview Desire as the place where burden, motivation, and longing become clearer.",
      "Ask participants to notice what consistently moves their heart.",
      "Prepare a follow-up note that honors Story without summarizing anyone's personal pain.",
    ],
    emails: [
      "Story recap with a gentle follow-up reflection.",
      "Desire preview: what moves you and what burdens you.",
      "Care note reminding participants they control what they share.",
    ],
    resources: [
      "Purpose conversation guide",
      "Table discussion questions",
      "Facilitator quick guide",
    ],
  },
  {
    slug: "desire",
    session: "Session 5",
    title: "Desire",
    inTheMoment: [
      "Distinguish holy desire from pressure, ego, fear, or preference alone.",
      "Help the circle notice how identity, expertise, and story are beginning to converge.",
      "Keep participants moving toward surrender and faithful action, not just self-analysis.",
    ],
    prepareNext: [
      "Send the Spiritual Gifts assessment link or reminder before the Gifts session.",
      "Prepare examples of gifts as grace for service rather than status.",
      "Review how DesignID and Spiritual Gifts will sit side by side.",
    ],
    emails: [
      "Desire recap with next faithful step.",
      "Spiritual Gifts assessment invitation and completion deadline.",
      "Week five reminder with reading and prayer prompt.",
    ],
    resources: [
      "Spiritual Gifts assessment instructions",
      "Weekly teaching outline",
      "Leader preparation checklist",
    ],
  },
  {
    slug: "gifts",
    session: "Session 6",
    title: "Spiritual Gifts",
    inTheMoment: [
      "Present gifts as Spirit-empowered service for the Body of Christ.",
      "Compare gifts with DesignID and lived confirmation without forcing conclusions.",
      "Encourage people to test gifts through humble service, community confirmation, and fruit.",
    ],
    prepareNext: [
      "Ask participants to review every Pathfinder line created so far.",
      "Prepare the Niche session as synthesis, not a high-pressure final answer.",
      "Identify participants who may need coaching before drafting a declaration.",
    ],
    emails: [
      "Spiritual Gifts result follow-up.",
      "Niche preparation note with all prior lines to review.",
      "Service experiment invitation for the week.",
    ],
    resources: [
      "Assessment instructions",
      "Purpose conversation guide",
      "Table discussion questions",
    ],
  },
  {
    slug: "niche",
    session: "Sessions 7-8",
    title: "Niche, Declaration, and Commissioning",
    inTheMoment: [
      "Help participants synthesize Identity, Expertise, Story, Desire, and Gifts into a working declaration.",
      "Treat the declaration as a faithful draft, not a contract.",
      "Close with encouragement, prayer, next experiments, and a support rhythm.",
    ],
    prepareNext: [
      "Prepare commissioning language and next-step options.",
      "Invite alumni groups, mentoring, service experiments, or a follow-up Circle.",
      "Capture shared themes while preserving each person's private declaration record.",
    ],
    emails: [
      "Niche draft reminder and support-team prompt.",
      "Commissioning recap and next faithful experiment.",
      "Alumni group invitation or next Circle pathway.",
    ],
    resources: [
      "Sample alumni gathering agenda",
      "Launching alumni groups",
      "Leadership implementation timeline",
    ],
  },
];

export const facilitatorPlaybookAppendices = [
  {
    title: "Sample Class Schedules",
    detail: "Eight-week, condensed, and intensive pacing options.",
  },
  {
    title: "Weekly Teaching Outline",
    detail: "Session-by-session leader prompts and teaching anchors.",
  },
  {
    title: "Table Discussion Questions",
    detail: "Questions hosts can pull into circles without rebuilding from scratch.",
  },
  {
    title: "Assessment Instructions",
    detail: "DesignID and Spiritual Gifts timing, links, and participant guidance.",
  },
  {
    title: "Leader Preparation Checklist",
    detail: "A practical pre-session rhythm for materials, prayer, and group flow.",
  },
  {
    title: "Promotion and Invitation Tools",
    detail: "Announcement copy, invite language, and church communication helps.",
  },
  {
    title: "FAQ and Common Launch Mistakes",
    detail: "Clear answers and guardrails for churches and Circle hosts.",
  },
  {
    title: "Alumni and Purpose Conversations",
    detail: "Follow-up gatherings, mentoring prompts, and next-step conversations.",
  },
];

export function getFacilitatorPlaybookStage(slug: string) {
  return facilitatorPlaybookStages.find((stage) => stage.slug === slug);
}

export type MapsPhaseSlug = "mission" | "approach" | "process" | "send";

export type MapsTerm = {
  biblical: string;
  capacity: string;
  definition: string;
  name: string;
  scripture: string;
  scriptureSummary: string;
};

export type MapsSubcategory = {
  applicationUse: string;
  capacityNeed: string;
  demandQuestion: string;
  definition: string;
  name: string;
  primaryReflection: "Architect" | "Artisan" | "Shepherd" | "Steward";
  terms: MapsTerm[];
};

export type MapsPhase = {
  color: string;
  intro: string;
  name: string;
  slug: MapsPhaseSlug;
  subcategories: MapsSubcategory[];
};

export const mapsPhases: MapsPhase[] = [
  {
    color: "#739d5e",
    intro:
      "Mission asks why the work matters before the work begins moving. It tests calling, relational agreement, and life-giving motivation so the project does not become activity without purpose.",
    name: "Mission",
    slug: "mission",
    subcategories: [
      {
        applicationUse: "Niche, message, calling statement, audience promise.",
        capacityNeed: "Purpose clarity before movement.",
        demandQuestion:
          "Is the project anchored in a clear why, next direction, and meaningful fruit?",
        definition:
          "Purpose is the clear why, next direction, and meaningful fruit of a project, role, class, ministry, or season.",
        name: "Purpose",
        primaryReflection: "Architect",
        terms: [
          {
            biblical:
              "A God-given invitation to live and serve according to His workmanship and purpose.",
            capacity:
              "Recognizes the specific contribution this person or group is designed to make.",
            definition:
              "The unique contribution or assignment a person, role, team, or ministry is meant to carry.",
            name: "Calling",
            scripture: "Ephesians 2:10",
            scriptureSummary: "Created in Christ for good works prepared by God.",
          },
          {
            biblical:
              "The ability to walk a wise path by trusting God rather than leaning only on human understanding.",
            capacity: "Clarifies the next faithful path and keeps choices aligned with purpose.",
            definition:
              "A clear sense of where to go and which priorities should guide decisions.",
            name: "Direction",
            scripture: "Proverbs 3:5-6",
            scriptureSummary: "Trust the Lord; He makes the path straight.",
          },
          {
            biblical:
              "A Kingdom-first orientation that seeks fruit beyond personal preference or self-interest.",
            capacity: "Connects activity to Kingdom value, people served, and measurable fruit.",
            definition:
              "The meaningful difference the work is intended to make beyond activity or effort.",
            name: "Kingdom Impact",
            scripture: "Matthew 6:33",
            scriptureSummary: "Seek first the Kingdom and God's righteousness.",
          },
        ],
      },
      {
        applicationUse: "Class culture, team tone, partner fit, community health.",
        capacityNeed: "Relational safety and shared agreement.",
        demandQuestion:
          "Will the project create a place where people can belong, trust, and move together?",
        definition:
          "Culture is the relational atmosphere that lets people belong, trust, and move together.",
        name: "Culture",
        primaryReflection: "Shepherd",
        terms: [
          {
            biblical:
              "Membership in the body of Christ, where each person belongs and has a meaningful part.",
            capacity:
              "Creates a place where people can bring their design without fear of being merely used.",
            definition:
              "A relational environment where people feel known, valued, included, and able to contribute.",
            name: "Belonging",
            scripture: "Romans 12:5",
            scriptureSummary: "Many members belong to one another in Christ.",
          },
          {
            biblical:
              "Reliance on God and trustworthy relationships rooted in faithfulness and truth.",
            capacity: "Builds credibility so people can engage honestly and take the next step.",
            definition: "Confidence built through truth, consistency, integrity, and safe follow-through.",
            name: "Trust",
            scripture: "Psalm 56:3-4",
            scriptureSummary: "When afraid, place trust in God.",
          },
          {
            biblical:
              "The Spirit-shaped bond that holds people together in peace and shared devotion.",
            capacity: "Keeps people moving together instead of scattering into competing agendas.",
            definition:
              "Shared alignment, relational harmony, and coordinated movement toward a common purpose.",
            name: "Unity",
            scripture: "Ephesians 4:3",
            scriptureSummary: "Make every effort to keep unity in peace.",
          },
        ],
      },
      {
        applicationUse: "Participant care, coaching support, growth path, burnout check.",
        capacityNeed: "Sustainable emotional and spiritual energy.",
        demandQuestion:
          "Does the project care for people and energize growth instead of draining them?",
        definition:
          "Motivation names the care, growth, and life-giving energy that keeps the work healthy.",
        name: "Motivation",
        primaryReflection: "Shepherd",
        terms: [
          {
            biblical:
              "Christlike concern that looks to the interests and well-being of others.",
            capacity: "Notices what people need in order to stay healthy, supported, and engaged.",
            definition:
              "Intentional attention to people, needs, burdens, and support required for healthy engagement.",
            name: "Care",
            scripture: "Philippians 2:4",
            scriptureSummary: "Look to the interests of others.",
          },
          {
            biblical:
              "Increasing in grace, knowledge, maturity, and Christlike formation.",
            capacity: "Develops people and work over time rather than settling for static capacity.",
            definition: "Ongoing development of maturity, skill, wisdom, and fruitfulness over time.",
            name: "Growth",
            scripture: "2 Peter 3:18",
            scriptureSummary: "Grow in grace and knowledge of Christ.",
          },
          {
            biblical:
              "Participation in the abundant life Christ gives, bringing vitality rather than depletion.",
            capacity: "Identifies whether the work brings healthy energy, hope, and sustainable engagement.",
            definition: "Work, relationships, and rhythms that energize, encourage, and sustain people.",
            name: "Life-giving",
            scripture: "John 10:10",
            scriptureSummary: "Christ came that His people may have life abundantly.",
          },
        ],
      },
    ],
  },
  {
    color: "#647c9b",
    intro:
      "Approach asks what is true, what needs to be understood, and what should be shaped before the work becomes a full system. It turns inspiration into wise diagnosis.",
    name: "Approach",
    slug: "approach",
    subcategories: [
      {
        applicationUse: "Discovery calls, project audit, readiness review, coaching intake.",
        capacityNeed: "Honest assessment before solution-building.",
        demandQuestion: "What needs to be discerned, understood, and clarified before moving?",
        definition:
          "Assessment is the honest read of what is present, missing, confusing, or ready.",
        name: "Assessment",
        primaryReflection: "Artisan",
        terms: [
          {
            biblical: "Testing and recognizing what is good, true, wise, and from God.",
            capacity: "Recognizes what is really happening before assigning a solution.",
            definition: "The ability to perceive what is present, needed, true, or misaligned.",
            name: "Discern",
            scripture: "1 Thessalonians 5:21",
            scriptureSummary: "Test everything; hold fast to what is good.",
          },
          {
            biblical: "Gaining wisdom and insight so choices are not made in ignorance.",
            capacity: "Reads the person, problem, context, and design pattern with care.",
            definition: "To grasp meaning, context, causes, and implications clearly.",
            name: "Understand",
            scripture: "Proverbs 4:7",
            scriptureSummary: "Though it cost all you have, get understanding.",
          },
          {
            biblical: "Bringing light, order, and truthful speech where things are unclear.",
            capacity: "Names what matters in a way people can actually use.",
            definition: "To make something plain, distinct, and actionable.",
            name: "Clarify",
            scripture: "Habakkuk 2:2",
            scriptureSummary: "Write the vision plainly.",
          },
        ],
      },
      {
        applicationUse: "Language refinement, strategy shaping, coaching interpretation.",
        capacityNeed: "Meaningful interpretation and refinement.",
        demandQuestion: "What needs to be shaped, refined, or adjusted so it fits the real assignment?",
        definition:
          "Insight turns raw information into meaning, language, and practical adjustment.",
        name: "Insight",
        primaryReflection: "Artisan",
        terms: [
          {
            biblical: "Being formed with intention rather than conformed without thought.",
            capacity: "Gives form to what is emerging so the work can be recognized and used.",
            definition: "To give useful form, language, contour, or structure to an idea.",
            name: "Shape",
            scripture: "Romans 12:2",
            scriptureSummary: "Be transformed by the renewing of your mind.",
          },
          {
            biblical: "The faithful removal of what weakens or distracts from fruitfulness.",
            capacity: "Improves the expression without losing the original purpose.",
            definition: "To improve, purify, edit, and strengthen what is already present.",
            name: "Refine",
            scripture: "Proverbs 25:4",
            scriptureSummary: "Remove dross so useful work can emerge.",
          },
          {
            biblical: "Wisdom that changes course when truth, counsel, or timing requires it.",
            capacity: "Responds to reality without abandoning the assignment.",
            definition: "To adapt the next move based on what is being learned.",
            name: "Adjust",
            scripture: "Proverbs 19:20",
            scriptureSummary: "Listen to advice and accept discipline.",
          },
        ],
      },
      {
        applicationUse: "Strategy, offer design, next-step path, development priorities, constraint crossing.",
        capacityNeed: "A clear path through constraint, risk, and reality.",
        demandQuestion: "What must be improved, strengthened, and elevated to cross the valley?",
        definition:
          "Valley turns insight into a tested path, stronger priorities, and a higher-quality expression.",
        name: "Valley",
        primaryReflection: "Architect",
        terms: [
          {
            biblical: "Growing in wisdom, character, and fruit rather than staying static.",
            capacity: "Names the specific change that would make the work better.",
            definition: "To make the current version more useful, fruitful, or effective.",
            name: "Improve",
            scripture: "Colossians 1:10",
            scriptureSummary: "Bear fruit and grow in the knowledge of God.",
          },
          {
            biblical: "Being made firm, mature, and able to stand.",
            capacity: "Builds resilience, quality, and capacity into what matters most.",
            definition: "To reinforce what is weak, thin, unclear, or underdeveloped.",
            name: "Strengthen",
            scripture: "Isaiah 41:10",
            scriptureSummary: "God strengthens and upholds His people.",
          },
          {
            biblical: "Lifting attention toward what is excellent, worthy, and God-honoring.",
            capacity: "Raises the standard without crushing the person.",
            definition: "To lift the work toward a higher, more faithful, more fruitful expression.",
            name: "Elevate",
            scripture: "Philippians 4:8",
            scriptureSummary: "Think on what is excellent and praiseworthy.",
          },
        ],
      },
    ],
  },
  {
    color: "#5a496b",
    intro:
      "Process asks how the work will become visible, organized, and dependable. It is where good ideas either become sustainable practice or become too heavy to carry.",
    name: "Process",
    slug: "process",
    subcategories: [
      {
        applicationUse: "Validation, evidence, report logic, testing, success criteria.",
        capacityNeed: "Visible evidence that the work is real.",
        demandQuestion: "Can progress be observed, measured, and verified?",
        definition: "Proof makes progress visible enough to trust, test, and improve.",
        name: "Proof",
        primaryReflection: "Steward",
        terms: [
          {
            biblical: "Faithfulness that can be observed over time.",
            capacity: "Makes progress visible instead of vague.",
            definition: "Able to be seen, reviewed, and recognized as real progress over time.",
            name: "Observable",
            scripture: "Luke 16:10",
            scriptureSummary: "Faithfulness in little things reveals trustworthiness.",
          },
          {
            biblical: "Wise counting and evaluation that supports faithful stewardship.",
            capacity: "Defines what evidence matters and how it will be read.",
            definition: "Able to be assessed by a meaningful standard or signal.",
            name: "Measurable",
            scripture: "Proverbs 27:23",
            scriptureSummary: "Know well the condition of what is entrusted to you.",
          },
          {
            biblical: "Truth confirmed by witness, fruit, and tested evidence.",
            capacity: "Confirms that the work is doing what it claims to do.",
            definition: "Confirmed as real, accurate, useful, or fruit-bearing.",
            name: "Verified",
            scripture: "2 Corinthians 13:1",
            scriptureSummary: "A matter is established by witness.",
          },
        ],
      },
      {
        applicationUse: "Role clarity, workflow, ownership map, team design.",
        capacityNeed: "Clear ownership and responsibility.",
        demandQuestion: "Are roles, ownership, and responsibilities clear enough to carry the work?",
        definition: "Organization gives the work a shape people can own.",
        name: "Organization",
        primaryReflection: "Steward",
        terms: [
          {
            biblical: "Members knowing their place and contribution in the body.",
            capacity: "Names who does what so contribution is not assumed or confused.",
            definition: "Clear roles, lanes, functions, and contribution areas.",
            name: "Clear Roles",
            scripture: "1 Corinthians 12:18",
            scriptureSummary: "God arranges the members of the body.",
          },
          {
            biblical: "Faithful stewardship of what has been entrusted.",
            capacity: "Places responsibility with a real person or team.",
            definition: "Clear responsibility for carrying, deciding, and moving a piece of the work.",
            name: "Ownership",
            scripture: "1 Peter 4:10",
            scriptureSummary: "Use what you have received as faithful stewards.",
          },
          {
            biblical: "Answerable stewardship before God and others.",
            capacity: "Makes expectations explicit enough to support follow-through.",
            definition: "The duty to carry what has been assigned with clarity and care.",
            name: "Responsibility",
            scripture: "Galatians 6:5",
            scriptureSummary: "Each one should carry their own load.",
          },
        ],
      },
      {
        applicationUse: "Operating rhythm, maintenance, delivery quality, sustainability.",
        capacityNeed: "Dependable follow-through over time.",
        demandQuestion: "Can the work stay consistent, dependable, and sustainable?",
        definition: "Reliability protects the work from becoming a one-time burst that cannot last.",
        name: "Reliability",
        primaryReflection: "Steward",
        terms: [
          {
            biblical: "Steadfastness that remains faithful under pressure.",
            capacity: "Creates repeatable rhythm instead of sporadic effort.",
            definition: "Stable, repeatable, and not dependent on mood or urgency.",
            name: "Consistent",
            scripture: "1 Corinthians 15:58",
            scriptureSummary: "Stand firm and give yourself fully to the work.",
          },
          {
            biblical: "Faithfulness that others can trust.",
            capacity: "Builds confidence through follow-through.",
            definition: "Able to be counted on when the work matters.",
            name: "Dependable",
            scripture: "Matthew 25:21",
            scriptureSummary: "Faithful with what was entrusted.",
          },
          {
            biblical: "Endurance with wisdom, margin, and faithful pacing.",
            capacity: "Protects people and systems from burnout.",
            definition: "Able to continue without draining people or breaking the system.",
            name: "Sustainable",
            scripture: "Galatians 6:9",
            scriptureSummary: "Do not grow weary in doing good.",
          },
        ],
      },
    ],
  },
  {
    color: "#d4a451",
    intro:
      "Send asks how the work moves into the world, gathers momentum, and finishes with real delivery. It is the launch and completion side of MAPS.",
    name: "Send",
    slug: "send",
    subcategories: [
      {
        applicationUse: "Launch energy, first actions, activation plan, owner movement.",
        capacityNeed: "Initial movement and activation.",
        demandQuestion: "What needs to be initiated, activated, and moved now?",
        definition: "Energy turns readiness into activation.",
        name: "Energy",
        primaryReflection: "Architect",
        terms: [
          {
            biblical: "Willing, faithful movement toward what is good.",
            capacity: "Starts movement without waiting for perfect conditions.",
            definition: "The willingness to begin, initiate, or take responsibility for movement.",
            name: "Initiative",
            scripture: "Ecclesiastes 11:4",
            scriptureSummary: "Waiting for perfect conditions prevents sowing.",
          },
          {
            biblical: "Stirring gifts and obedience into faithful use.",
            capacity: "Moves dormant capacity into action.",
            definition: "To turn capacity, calling, or readiness into active use.",
            name: "Activate",
            scripture: "2 Timothy 1:6",
            scriptureSummary: "Fan into flame the gift of God.",
          },
          {
            biblical: "Obedient movement that follows faith with action.",
            capacity: "Turns intent into an actual next step.",
            definition: "To move forward from intention, planning, or discussion into motion.",
            name: "Move Forward",
            scripture: "James 2:17",
            scriptureSummary: "Faith without action is dead.",
          },
        ],
      },
      {
        applicationUse: "Build rhythm, sequence, expansion, traction, class/project cadence.",
        capacityNeed: "Forward traction and expansion.",
        demandQuestion: "How will the work build, advance, and expand without scattering?",
        definition: "Momentum turns first movement into growing traction.",
        name: "Momentum",
        primaryReflection: "Architect",
        terms: [
          {
            biblical: "Constructing faithfully on a worthy foundation.",
            capacity: "Adds the next layer with intention.",
            definition: "To construct, develop, and add capacity over time.",
            name: "Build",
            scripture: "1 Corinthians 3:10",
            scriptureSummary: "Build carefully on the foundation.",
          },
          {
            biblical: "Pressing forward toward the goal with focused effort.",
            capacity: "Keeps movement going in the right direction.",
            definition: "To move forward from the current position toward the next meaningful stage.",
            name: "Advance",
            scripture: "Philippians 3:14",
            scriptureSummary: "Press on toward the goal.",
          },
          {
            biblical: "Fruitfulness that grows beyond the first seed.",
            capacity: "Increases reach, usefulness, and impact without losing the mission.",
            definition: "To multiply reach, capacity, usefulness, or influence without losing the mission.",
            name: "Multiply",
            scripture: "Isaiah 54:2",
            scriptureSummary: "Enlarge the tent and strengthen the stakes.",
          },
        ],
      },
      {
        applicationUse: "Completion, delivery, closeout, deliverables, client/class handoff.",
        capacityNeed: "Completion and delivered fruit.",
        demandQuestion: "What must be completed, delivered, and truly done?",
        definition: "Outcomes bring the work to useful completion.",
        name: "Outcomes",
        primaryReflection: "Steward",
        terms: [
          {
            biblical: "Finishing the assigned work with faithfulness.",
            capacity: "Closes the loop rather than leaving the work almost finished.",
            definition: "To bring the work to a finished state.",
            name: "Complete",
            scripture: "John 17:4",
            scriptureSummary: "Jesus completed the work given to Him.",
          },
          {
            biblical: "Handing over fruit that can serve others.",
            capacity: "Turns work into something usable by the intended person or group.",
            definition: "To place the finished work into the hands of those it is meant to serve.",
            name: "Deliver",
            scripture: "Colossians 3:23",
            scriptureSummary: "Work heartily as for the Lord.",
          },
          {
            biblical: "Faithful completion with integrity, not endless carrying.",
            capacity: "Names the finish line and releases the work appropriately.",
            definition: "Closed, completed, handed off, or brought to a faithful stopping point.",
            name: "Closure",
            scripture: "2 Timothy 4:7",
            scriptureSummary: "Finish the race and keep the faith.",
          },
        ],
      },
    ],
  },
];

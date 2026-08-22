import { fruitLifeFruits } from "./intake";

type FruitLifeSession = {
  id: string;
  observer_completed_count: number;
  observer_goal: number;
  participant_email: string | null;
  participant_name: string | null;
  source_participant_id: string | null;
};

type FruitLifeResponse = {
  answers: {
    fruitRatings?: Record<string, Record<string, number>>;
    reflections?: {
      encouragement?: string;
      growth?: string;
      strength?: string;
    };
  } | null;
  derived_scores: {
    fruitAverages?: Record<string, number>;
  } | null;
  fruit_rank: string[] | null;
  relationship_label: string | null;
  response_type: "self" | "observer";
  reviewer_name: string | null;
  submitted_at: string | null;
};

type SupabaseLike = {
  from: (table: string) => any;
};

const fruitContent: Record<
  string,
  {
    action: string;
    definition: string;
    encouragement: string;
    growthInvitation: string;
    maturity: string;
    prayer: string;
    practice: string;
    pressurePattern: string;
    reflectionQuestion: string;
    scripture: string;
  }
> = {
  faithfulness: {
    action: "Complete one small promise before adding a new one.",
    definition:
      "Faithfulness is reliable devotion to God, people, and entrusted responsibilities over time.",
    encouragement:
      "Faithfulness can become a quiet witness through consistency, repair, and steady follow-through.",
    growthInvitation:
      "Notice where commitments are real but may need clearer rhythms, repair, or boundaries.",
    maturity:
      "Maturity looks like faithfulness becoming dependable when responsibilities are demanding or no one is applauding.",
    prayer: "Lord, make me faithful in the small places where character is formed.",
    practice: "Review one responsibility and name the next faithful step.",
    pressurePattern:
      "Under pressure, faithfulness may slip into overcommitment, rigidity, neglect, or quiet quitting.",
    reflectionQuestion:
      "Where is God inviting a steadier yes, a repaired promise, or a more honest boundary?",
    scripture: "Lamentations 3:22-23; Luke 16:10",
  },
  gentleness: {
    action: "Enter one hard conversation with both clarity and tenderness.",
    definition:
      "Gentleness is humble strength that protects dignity while still telling the truth.",
    encouragement:
      "Gentleness can make strength easier for others to receive without weakening truth.",
    growthInvitation:
      "Notice where strength is forming but may still come out too forcefully or too cautiously.",
    maturity:
      "Maturity looks like gentleness becoming steadier when correction, tension, leadership, or disappointment is present.",
    prayer: "Lord, teach me strength with less force and softness with more courage.",
    practice: "Before a hard conversation, write the truth and the tenderness you want to carry.",
    pressurePattern:
      "Under pressure, gentleness may become harshness, passivity, avoidance, or fear of necessary confrontation.",
    reflectionQuestion:
      "Where do truth and tenderness need to travel together in your next conversation?",
    scripture: "Philippians 4:5; 2 Timothy 2:24-25",
  },
  goodness: {
    action: "Ask where compromise, fatigue, or fear has quieted the good.",
    definition:
      "Goodness is moral clarity and active commitment to what reflects God's character.",
    encouragement:
      "Goodness can strengthen others when courage and humility stay together.",
    growthInvitation:
      "Ask where God is inviting a cleaner yes, a wiser no, or a repaired decision.",
    maturity:
      "Maturity looks like choosing what reflects God's character when compromise, fatigue, or self-interest would be easier.",
    prayer: "Lord, align my motives, choices, and courage with what is good in Your sight.",
    practice: "Name one integrity gap and take one honest repair step.",
    pressurePattern:
      "Under pressure, goodness may become moral superiority, compromise, fatigue, or disengagement from doing good.",
    reflectionQuestion: "Where is goodness asking for courage, not just intention?",
    scripture: "Romans 12:9; Galatians 6:9-10",
  },
  joy: {
    action: "Name three signs of grace each day and share one with someone.",
    definition:
      "Joy is resilient gladness rooted in God's presence, goodness, and promises.",
    encouragement:
      "Joy can become a gift of hope when it stays honest, rooted, and resilient.",
    growthInvitation:
      "Let visible joy become encouragement to others, then ask how to keep it rooted in Christ rather than circumstances.",
    maturity:
      "Maturity looks like stewarding visible joy as a witness to God's goodness without forcing cheerfulness or ignoring sorrow.",
    prayer: "Lord, keep my joy honest, resilient, and anchored in Your presence.",
    practice: "Share one specific sign of grace with someone who needs hope.",
    pressurePattern:
      "Under pressure, joy may flatten into discouragement, distraction, forced positivity, or emotional shutdown.",
    reflectionQuestion: "Where can you practice gratitude without denying grief or pressure?",
    scripture: "John 15:11; Philippians 4:4",
  },
  kindness: {
    action: "Ask who near you needs gentler attention this week.",
    definition:
      "Kindness is tender strength that treats people with dignity, mercy, and practical care.",
    encouragement:
      "Kindness can make the love of God practical, visible, and easier to trust.",
    growthInvitation:
      "Ask who experiences your kindness least easily and what small change love requires.",
    maturity:
      "Maturity looks like noticing people with mercy when efficiency, irritation, or self-protection would move past them.",
    prayer: "Lord, train my eyes to see people as You see them and my hands to serve with warmth.",
    practice: "Offer one intentional word or act of mercy to someone who may not expect it.",
    pressurePattern:
      "Under pressure, kindness may become sharpness, indifference, people-pleasing, or helpfulness with strings attached.",
    reflectionQuestion: "Who needs kindness from you in a more concrete form?",
    scripture: "Ephesians 4:32; Colossians 3:12",
  },
  love: {
    action: "Practice one concrete act of care without needing recognition.",
    definition:
      "Love is Christlike regard that seeks another person's good with patience, truth, and sacrifice.",
    encouragement:
      "Love can become more visible when care is concrete, patient, and free from control.",
    growthInvitation:
      "Notice where love is present but not always easy for others to feel, especially when time or patience is strained.",
    maturity:
      "Maturity looks like love becoming consistent when relationships are inconvenient, complex, or emotionally demanding.",
    prayer: "Lord, form a steadier love in me when I am hurried, disappointed, or misunderstood.",
    practice: "Pause before one relational response and choose care over convenience.",
    pressurePattern:
      "Under pressure, love may withdraw, become transactional, or try to control outcomes instead of serving freely.",
    reflectionQuestion: "Where is love asking to become more concrete this week?",
    scripture: "John 13:34-35; 1 Corinthians 13:4-7",
  },
  patience: {
    action: "Ask God where hurry is replacing trust.",
    definition:
      "Patience is long obedience and gracious endurance when people, process, or timing are slow.",
    encouragement:
      "Patience can create room for trust, mercy, and better timing.",
    growthInvitation:
      "Ask where hurry is replacing trust and where frustration is revealing a formation invitation.",
    maturity:
      "Maturity looks like learning to wait with God instead of rushing, judging, withdrawing, or forcing outcomes.",
    prayer: "Lord, grow endurance in me where impatience has been shaping my responses.",
    practice: "When irritation rises, pause long enough to pray before speaking or deciding.",
    pressurePattern:
      "Under pressure, patience may turn into irritability, rushing, passive resistance, or silent judgment.",
    reflectionQuestion: "Where might waiting with God be more faithful than forcing movement?",
    scripture: "James 1:2-4; Colossians 3:12-13",
  },
  peace: {
    action: "Bring calm to one tense conversation by slowing your response.",
    definition:
      "Peace is Spirit-formed steadiness that rests in God and makes room for wholeness with others.",
    encouragement:
      "Peace can become a gift that helps others breathe without avoiding what is true.",
    growthInvitation:
      "Let visible peace become a gift you steward, especially in tense conversations and uncertain outcomes.",
    maturity:
      "Maturity looks like carrying peace that settles rooms without avoiding truth or absorbing everyone else's anxiety.",
    prayer: "Lord, make my peace courageous, truthful, and grounded in Your nearness.",
    practice: "Bring calm to one tense moment by slowing your words and asking a better question.",
    pressurePattern:
      "Under pressure, peace may give way to anxiety, avoidance, overexplaining, or conflict-smoothing that avoids truth.",
    reflectionQuestion: "Where is God inviting peace that is both calm and truthful?",
    scripture: "John 14:27; Philippians 4:6-7",
  },
  self_control: {
    action: "Choose one boundary that protects love and faithfulness.",
    definition:
      "Self-control is Spirit-led stewardship of desires, habits, attention, and responses.",
    encouragement:
      "Self-control can become ordered freedom when restraint stays surrendered to love.",
    growthInvitation:
      "Let visible self-control become gratitude for grace that trains desires rather than pride in willpower.",
    maturity:
      "Maturity looks like ordered freedom that stays disciplined without becoming rigid, hidden, or controlling.",
    prayer: "Lord, keep my restraint surrendered to love and guided by Your Spirit.",
    practice: "Use one healthy boundary this week to protect love, attention, or follow-through.",
    pressurePattern:
      "Under pressure, self-control may break into impulsiveness, numbing, control of others, or private escape patterns.",
    reflectionQuestion: "Where would one wise boundary protect what matters most?",
    scripture: "Titus 2:11-12; 1 Corinthians 9:25-27",
  },
};

function titleCaseFruit(fruitKey: string) {
  return fruitLifeFruits.find((fruit) => fruit.key === fruitKey)?.label ?? fruitKey;
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function scoreFromResponse(response: FruitLifeResponse, fruitKey: string, key: string) {
  const rating = response.answers?.fruitRatings?.[fruitKey]?.[key];
  return typeof rating === "number" && Number.isFinite(rating) ? rating : 0;
}

function averageFruitScore(responses: FruitLifeResponse[], fruitKey: string, key = "visible") {
  return round(average(responses.map((response) => scoreFromResponse(response, fruitKey, key))));
}

function listLabels(keys: string[]) {
  return keys.map(titleCaseFruit).join(", ");
}

function tierLabel(rankIndex: number) {
  if (rankIndex < 3) return "Most Visible Fruit";
  if (rankIndex < 6) return "Steady Forming Fruit";
  return "Growth Invitation Fruit";
}

function categoryLabel(rankIndex: number, hasObservers: boolean) {
  if (!hasObservers && rankIndex < 3) return "Self-Visible Strength";
  if (!hasObservers && rankIndex > 5) return "Self-Reflection Growth Invitation";
  if (!hasObservers) return "Self-Reflection Forming";
  return tierLabel(rankIndex);
}

function summaryForFruit(fruitName: string, rankIndex: number, hasObservers: boolean) {
  if (rankIndex < 3) {
    return `${fruitName} is one of the most visible fruits in this report, with room for continued formation and greater steadiness.`;
  }
  if (rankIndex < 6) {
    return `${fruitName} appears present and steadily forming, with room for continued growth.`;
  }
  return `${fruitName} is a current formation invitation, with room for greater visibility and steadiness.`;
}

function pressureNote(fruitName: string, selfPressure: number, observerPressure: number, hasObservers: boolean) {
  if (!selfPressure && !observerPressure) return "";
  const pressureScore = hasObservers ? observerPressure || selfPressure : selfPressure;
  if (pressureScore >= 4) {
    return `${fruitName} appears generally steady under pressure in this ${hasObservers ? "360" : "self-reflection"} report.`;
  }
  if (pressureScore >= 3) {
    return `${fruitName} shows mild pressure sensitivity. Notice where strain may change how this fruit is expressed.`;
  }
  return `${fruitName} may need extra support under pressure. Treat this as an invitation to prayer, practice, and trusted conversation.`;
}

function consistencyNote(fruitName: string, hasObservers: boolean) {
  return `${fruitName} is ranked from ${hasObservers ? "self and observer feedback" : "your own reflection"} in this ${hasObservers ? "360" : "self-only"} report. Use it as a prayerful formation signal.`;
}

function buildRank(responses: FruitLifeResponse[]) {
  const selfRank = responses.find((response) => response.response_type === "self")?.fruit_rank ?? [];
  const cleaned = selfRank.filter((key) => fruitLifeFruits.some((fruit) => fruit.key === key));

  if (cleaned.length === fruitLifeFruits.length) return cleaned;

  const used = new Set(cleaned);
  return [
    ...cleaned,
    ...fruitLifeFruits.map((fruit) => fruit.key).filter((key) => !used.has(key)),
  ];
}

function commentList(responses: FruitLifeResponse[], key: "encouragement" | "growth" | "strength") {
  return responses
    .map((response) => response.answers?.reflections?.[key]?.trim())
    .filter(Boolean)
    .join("<br><br>");
}

export function buildFruitLifePayload(session: FruitLifeSession, responses: FruitLifeResponse[]) {
  const selfResponses = responses.filter((response) => response.response_type === "self");
  const observerResponses = responses.filter((response) => response.response_type === "observer");
  const hasObservers = observerResponses.length > 0;
  const rank = buildRank(responses);
  const mostVisible = rank.slice(0, 3);
  const steadyForming = rank.slice(3, 6);
  const growthInvitation = rank.slice(6);
  const selfOverall = round(
    average(fruitLifeFruits.map((fruit) => averageFruitScore(selfResponses, fruit.key))),
  );
  const observerOverall = round(
    average(fruitLifeFruits.map((fruit) => averageFruitScore(observerResponses, fruit.key))),
  );
  const reportMode = hasObservers ? "FULL_360" : "SELF_ONLY";
  const payload: Record<string, string | number> = {
    design_id_cta:
      "If this lens interests you, take the free DesignID assessment next. It can help you understand how God may have designed you to carry purpose, responsibility, creativity, and care.",
    design_id_page_intro:
      "Some people carry fruit through ideas, some through creative action, some through relational care, and some through faithful structure. The fruit is the Spirit's work; the expression often carries the shape of your design.",
    design_id_page_title: "How Fruit May Express Through Your Design",
    design_id_primary: "",
    design_id_secondary: "",
    growth_invitation_fruit_list: listLabels(growthInvitation),
    growth_invitation_tier_description:
      "These are the fruit least visible in this current report. Treat them as invitations, not accusations. Low visibility may reflect season, stress, role, or missed opportunities.",
    growth_invitations: `${listLabels(growthInvitation)} may be current formation invitations. Treat these as places for prayer, practice, and trusted conversation rather than as accusations or fixed labels.`,
    most_visible_fruit: `${hasObservers ? "Observers especially highlight" : "Your self-reflection especially highlights"} ${listLabels(mostVisible)} as visible fruit in this season.`,
    most_visible_fruit_list: listLabels(mostVisible),
    most_visible_tier_description:
      "These are the fruit most clearly visible in this current report. Begin here with gratitude, because these scores may point to places where the Spirit's work is already becoming evident.",
    observer_count: observerResponses.length,
    observer_encouragement_comments: commentList(observerResponses, "encouragement"),
    observer_growth_comments: commentList(observerResponses, "growth"),
    observer_overall: observerOverall,
    observer_strength_comments: commentList(observerResponses, "strength"),
    overall_gap: round(observerOverall - selfOverall),
    overview_note: hasObservers
      ? "This report uses self-reflection and observer feedback to identify visible fruit, pressure patterns, and current formation invitations."
      : "This self-only report uses the participant's own responses to identify visible fruit, pressure patterns, and current formation invitations.",
    participant_email: session.participant_email ?? "",
    participant_id: session.source_participant_id ?? session.id,
    participant_name: session.participant_name ?? "",
    pressure_vulnerabilities:
      "Pressure notes identify where fruit may need extra attention under strain. Receive them as formation invitations, not labels.",
    report_date: new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date()),
    report_mode: reportMode,
    response_count: responses.length,
    reviewer_mix: hasObservers
      ? `${selfResponses.length} self response and ${observerResponses.length} observer response${observerResponses.length === 1 ? "" : "s"} are included.`
      : `${session.participant_name ?? "The participant"} completed this as a self-reflection report with no observer responses.`,
    self_final_reflection: commentList(selfResponses, "growth") || "no",
    self_overall: selfOverall,
    spiritual_gifts_cta:
      "The Spiritual Gifts assessment can add another layer by helping you notice how the Spirit may work through you to strengthen others and serve the body of Christ.",
    steady_forming_fruit_list: listLabels(steadyForming),
    steady_forming_tier_description:
      "These fruit appear present and developing, but may be more situational or less visible under stress. They are worth noticing without overinterpreting.",
  };

  const designLenses = {
    architect_fruit_lens:
      "Architect energy may express fruit by clarifying truth, building frameworks, asking better questions, and helping others see what matters. Mature fruit keeps that clarity loving, patient, and peaceable.",
    artisan_fruit_lens:
      "Artisan energy may express fruit through creativity, responsiveness, courage, and beauty in action. Mature fruit helps that energy become kind, faithful, and self-controlled without losing aliveness.",
    shepherd_fruit_lens:
      "Shepherd energy may express fruit through presence, empathy, encouragement, and protection of people. Mature fruit helps that care stay truthful, resilient, and grounded in God rather than approval.",
    steward_fruit_lens:
      "Steward energy may express fruit through consistency, service, order, follow-through, and practical support. Mature fruit helps that reliability stay joyful, gentle, and free from resentment.",
  };
  Object.assign(payload, designLenses);

  for (const fruit of fruitLifeFruits) {
    const rankIndex = rank.indexOf(fruit.key);
    const fruitName = fruit.label;
    const content = fruitContent[fruit.key];
    const selfVisible = averageFruitScore(selfResponses, fruit.key, "visible");
    const observerVisible = averageFruitScore(observerResponses, fruit.key, "visible");
    const selfPressure = averageFruitScore(selfResponses, fruit.key, "pressure");
    const observerPressure = averageFruitScore(observerResponses, fruit.key, "pressure");

    Object.assign(payload, {
      [`${fruit.key}_category`]: categoryLabel(rankIndex, hasObservers),
      [`${fruit.key}_consistency_note`]: consistencyNote(fruitName, hasObservers),
      [`${fruit.key}_definition`]: content.definition,
      [`${fruit.key}_encouragement`]: content.encouragement,
      [`${fruit.key}_growth_invitation`]: content.growthInvitation,
      [`${fruit.key}_maturity`]: content.maturity,
      [`${fruit.key}_observer`]: observerVisible || selfVisible,
      [`${fruit.key}_observer_pressure`]: observerPressure || selfPressure,
      [`${fruit.key}_practice`]: content.practice,
      [`${fruit.key}_prayer_prompt`]: content.prayer,
      [`${fruit.key}_pressure_note`]: pressureNote(fruitName, selfPressure, observerPressure, hasObservers),
      [`${fruit.key}_pressure_pattern`]: content.pressurePattern,
      [`${fruit.key}_rank`]: rankIndex + 1,
      [`${fruit.key}_reflection_question`]: content.reflectionQuestion,
      [`${fruit.key}_scripture`]: content.scripture,
      [`${fruit.key}_self`]: selfVisible,
      [`${fruit.key}_self_pressure`]: selfPressure,
      [`${fruit.key}_summary`]: summaryForFruit(fruitName, rankIndex, hasObservers),
      [`${fruit.key}_tier_action`]: content.action,
      [`${fruit.key}_tier_description`]: `${fruitName} is currently showing as ${tierLabel(rankIndex).toLowerCase()}.`,
      [`${fruit.key}_tier_label`]: tierLabel(rankIndex),
    });
  }

  return payload;
}

export async function buildFruitLifePayloadForSession(supabase: SupabaseLike, sessionId: string) {
  const { data: session, error: sessionError } = await supabase
    .from("fruitlife_360_sessions")
    .select(
      "id,source_participant_id,participant_name,participant_email,observer_goal,observer_completed_count",
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "FruitLife session was not found.");
  }

  const { data: responses, error: responsesError } = await supabase
    .from("fruitlife_360_responses")
    .select(
      "response_type,reviewer_name,relationship_label,submitted_at,answers,fruit_rank,derived_scores",
    )
    .eq("session_id", sessionId)
    .order("submitted_at", { ascending: true });

  if (responsesError) {
    throw new Error(responsesError.message);
  }

  return buildFruitLifePayload(
    session as FruitLifeSession,
    ((responses ?? []) as FruitLifeResponse[]),
  );
}

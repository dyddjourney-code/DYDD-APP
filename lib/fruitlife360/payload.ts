import { fruitLifeFruits, fruitLifeInstrumentVersion } from "./intake";
import { buildFruitLifePayload as buildLegacyFruitLifePayload } from "./legacy-payload";
import source from "./source-libraries.json";

type FruitLifeSession = {
  id: string;
  observer_completed_count: number;
  observer_goal: number;
  participant_email: string | null;
  participant_name: string | null;
  source_participant_id: string | null;
  designIdPrimary?: string;
  designIdSecondary?: string;
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

// Source libraries are copied verbatim; the workbook remains the scoring/language oracle.
const fruitKeyForLabel = (label: string) => label.toLowerCase().replace(/[- ]/g, "_");
const fruitContent = Object.fromEntries(source.libraries.Fruit_Content_Library.slice(1).map(row => [fruitKeyForLabel(row[0]), {
  scripture: row[1], definition: row[2], maturity: row[3], pressurePattern: row[4], growthInvitation: row[5],
  practice: row[6], reflectionQuestion: row[7], prayer: row[8], encouragement: row[9],
}]));
function tierContent(fruitKey: string, rankIndex: number) {
  const label = tierLabel(rankIndex);
  const formation = source.libraries.Fruit_Tier_Formation_360.slice(1).find(row => fruitKeyForLabel(row[0]) === fruitKey && row[1] === label)!;
  const detail = source.libraries.Fruit_Report_Content_360.slice(1).find(row => fruitKeyForLabel(String(row[0])) === fruitKey && row[3] === label)!;
  return { ...fruitContent[fruitKey], maturity: formation[2], growthInvitation: formation[3], practice: formation[4], prayer: formation[5],
    // Both legacy reflection/prayer fields intentionally map to the approved tier prayer.
    reflectionQuestion: formation[5], description: String(detail[5]), action: String(detail[7]) };
}
function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function titleCaseFruit(fruitKey: string) {
  return fruitKey === "self_control" ? "Self-control" : fruitLifeFruits.find((fruit) => fruit.key === fruitKey)?.label ?? fruitKey;
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
  return average(responses.map((response) => scoreFromResponse(response, fruitKey, key)));
}

function listLabels(keys: string[]) {
  return keys.map(titleCaseFruit).join(", ");
}

function naturalList(keys: string[]) {
  const names = keys.map(titleCaseFruit);
  return names.length < 2 ? names.join("") : names.length === 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

function tierLabel(rankIndex: number) {
  if (rankIndex < 3) return "Most Visible Fruit";
  if (rankIndex < 6) return "Steady Forming Fruit";
  return "Growth Invitation Fruit";
}

function categoryLabel(self: number, observer: number, hasObservers: boolean) {
  if (!hasObservers) return self >= 4 ? "Self-Visible Strength" : self < 3 ? "Self-Reflection Growth Invitation" : "Self-Reflection Forming";
  const gap = observer - self;
  return self >= 4 && observer >= 4 ? "Shared Strength" : gap >= 1 ? "Encouragement Others See" : gap <= -1 ? "Growth Invitation" : self < 3 && observer < 3 ? "Aligned Developing" : "Steady Developing";
}
function summaryForFruit(name: string, rankIndex: number, category: string) {
  if (rankIndex < 3) return category === "Shared Strength" ? `${name} is one of the most visible fruits in this report and is consistently affirmed by both self and observers.`
    : category === "Encouragement Others See" ? `${name} is one of the most visible fruits in this report and may be even more visible to observers than the participant realizes.`
    : category === "Growth Invitation" ? `${name} is one of the most visible fruits in this report, while the score pattern still points to a meaningful formation invitation.`
    : `${name} is one of the most visible fruits in this report, with room for continued formation and greater steadiness.`;
  if (rankIndex < 6) return category === "Shared Strength" ? `${name} appears steady and consistently visible to both self and observers.`
    : category === "Encouragement Others See" ? `${name} appears steadily forming and may be more visible to observers than the participant realizes.`
    : category === "Growth Invitation" ? `${name} appears present, but the score pattern points to a helpful formation conversation.`
    : `${name} appears present and steadily forming, with room for continued growth.`;
  return category === "Shared Strength" ? `${name} is affirmed in the score pattern, even though it sits lower in the current fruit ranking and may need intentional cultivation.`
    : category === "Encouragement Others See" ? `${name} may be more visible to observers than expected, even though it sits lower in the current fruit ranking.`
    : category === "Growth Invitation" ? `${name} is a current growth invitation for reflection, prayer, and practice.`
    : `${name} is a current formation invitation, with room for greater visibility and steadiness.`;
}
function consistencyNote(key: string, name: string, self: number, observer: number, hasObservers: boolean) {
  if (!hasObservers) return `${name} is ranked from your own reflection in this self-only report. Use it as a prayerful formation signal.`;
  const gap = Math.abs(observer - self);
  const band = gap < .5 ? "ALIGNED" : gap < 1 ? "LIGHT_DIFFERENCE" : gap < 1.5 ? "MEANINGFUL_GAP" : "SIGNIFICANT_CONVERSATION";
  return source.libraries.Fruit_Gap_Language_360.find(row => row[1] === key && row[2] === "Consistency" && row[3] === band)?.[8] ?? "";
}
function pressureNote(key: string, name: string, self: number, observer: number, selfPressure: number, observerPressure: number, hasObservers: boolean) {
  const drop = Math.max(0, self - selfPressure, observer - observerPressure);
  const band = drop < .5 ? "STEADY" : drop < 1 ? "MILD_SENSITIVITY" : drop < 1.5 ? "NOTICEABLE_DROP" : "MAJOR_VULNERABILITY";
  if (hasObservers) return source.libraries.Fruit_Gap_Language_360.find(row => row[1] === key && row[2] === "Pressure" && row[3] === band)?.[8] ?? "";
  return band === "STEADY" ? `${name} appears generally steady under pressure in your self-reflection.`
    : band === "MILD_SENSITIVITY" ? `${name} shows mild pressure sensitivity in your self-reflection. Notice where strain may change how this fruit is expressed.`
    : band === "NOTICEABLE_DROP" ? `${name} shows a noticeable pressure drop in your self-reflection. This may point to a practical growth edge when stress rises.`
    : `${name} shows a major pressure vulnerability in your self-reflection. This is an important formation area for prayer, support, and practice before pressure rises.`;
}

function fruitCssClass(fruitKey: string) {
  return fruitKey === "self_control" ? "selfcontrol" : fruitKey;
}

function formationCardHtml(fruitKey: string, rankIndex: number) {
  const fruitName = titleCaseFruit(fruitKey);
  const content = tierContent(fruitKey, rankIndex);

  if (!content) {
    return "";
  }

  return [
    `<div class="formation-card">`,
    `<div class="formation-head fruit-${fruitCssClass(fruitKey)}">`,
    `<div class="formation-name"><span class="formation-rank">#${rankIndex + 1}</span>${fruitName}</div>`,
    `<div class="formation-tier">${tierLabel(rankIndex)}</div>`,
    `</div>`,
    `<div class="formation-body">`,
    `<p><strong>Scripture:</strong> ${content.scripture}</p>`,
    `<p>${content.definition}</p>`,
    `<div class="formation-cols">`,
    `<div class="formation-col"><div class="mini-label">Maturity looks like</div><p>${content.maturity}</p><div class="mini-label">Practice</div><p>${content.practice}</p></div>`,
    `<div class="formation-col"><div class="mini-label">Growth invitation</div><p>${content.growthInvitation}</p><div class="mini-label">Prayer</div><p>${content.reflectionQuestion}</p></div>`,
    `</div>`,
    `</div>`,
    `</div>`,
  ].join("");
}

function formationCardsHtml(rank: string[], start: number, end: number) {
  return rank
    .slice(start, end)
    .map((fruitKey, offset) => formationCardHtml(fruitKey, start + offset))
    .filter(Boolean)
    .join("");
}

function buildRank(selfResponses: FruitLifeResponse[], observerResponses: FruitLifeResponse[]) {
  // Original Display_Rank: observer consistency first, then self consistency, then canonical fruit order.
  // Self-only reports use self consistency in both columns; the separate forced rank is retained, not substituted.
  const ranked = fruitLifeFruits.map((fruit, index) => ({ key: fruit.key, index,
    self: averageFruitScore(selfResponses, fruit.key),
    observer: averageFruitScore(observerResponses.length ? observerResponses : selfResponses, fruit.key),
  }));
  return ranked.sort((a, b) => b.observer - a.observer || b.self - a.self || a.index - b.index).map(fruit => fruit.key);
}

function commentList(responses: FruitLifeResponse[], key: "encouragement" | "growth" | "strength") {
  return responses
    .map((response) => response.answers?.reflections?.[key]?.trim())
    .filter((value): value is string => Boolean(value))
    .map(value => escapeHtml(value))
    .join("<br><br>");
}

export function buildFruitLifePayload(session: FruitLifeSession, responses: FruitLifeResponse[]) {
  const selfResponses = responses.filter((response) => response.response_type === "self");
  const observerResponses = responses.filter((response) => response.response_type === "observer");
  const hasObservers = observerResponses.length > 0;
  const rank = buildRank(selfResponses, observerResponses);
  const mostVisible = rank.slice(0, 3);
  const steadyForming = rank.slice(3, 6);
  const growthInvitation = rank.slice(6);
  const selfOverall = average(fruitLifeFruits.map(fruit => averageFruitScore(selfResponses, fruit.key)));
  const observerOverall = average(fruitLifeFruits.map(fruit => averageFruitScore(hasObservers ? observerResponses : selfResponses, fruit.key)));
  const reportMode = hasObservers ? "360" : "SELF_ONLY";
  const payload: Record<string, string | number> = {
    design_id_cta:
      "If this lens interests you, take the free DesignID assessment next. It can help you understand how God may have designed you to carry purpose, responsibility, creativity, and care.",
    design_id_page_intro:
      "Some people carry fruit through ideas, some through creative action, some through relational care, and some through faithful structure. The fruit is the Spirit's work; the expression often carries the shape of your design.",
    design_id_page_title: "How Fruit May Express Through Your Design",
    design_id_primary: session.designIdPrimary ?? "",
    design_id_secondary: session.designIdSecondary ?? "",
    growth_invitation_fruit_list: listLabels(growthInvitation),
    growth_invitation_formation_cards: formationCardsHtml(rank, 6, 9),
    growth_invitation_tier_description:
      "These are the fruit least visible in this current report. Treat them as invitations, not accusations. Low visibility may reflect season, stress, role, or missed opportunities.",
    growth_invitations: `${listLabels(growthInvitation)} ${hasObservers ? "appear to be current growth invitations" : "may be current self-reflection growth invitations"}. Treat these as places for prayer, practice, and trusted conversation rather than as accusations or fixed labels.`,
    most_visible_fruit: `${hasObservers ? "Observers are especially affirming" : "Your self-reflection especially highlights"} ${naturalList(mostVisible)} as visible fruit in this season.`,
    encouragement_others_see: `${hasObservers ? "Observers are especially affirming" : "Your self-reflection especially highlights"} ${naturalList(mostVisible)} as visible fruit in this season.`,
    most_visible_formation_cards: formationCardsHtml(rank, 0, 3),
    most_visible_fruit_list: listLabels(mostVisible),
    most_visible_tier_description:
      "These are the fruit most clearly visible in this current report. Begin here with gratitude, because these scores may point to places where the Spirit's work is already becoming evident.",
    observer_count: observerResponses.length,
    observer_encouragement_comments: commentList(observerResponses, "encouragement"),
    observer_growth_comments: commentList(observerResponses, "growth"),
    observer_overall: observerOverall,
    observer_strength_comments: commentList(observerResponses, "strength"),
    overall_gap: observerOverall - selfOverall,
    overview_note: hasObservers
      ? "This report compares the participant self-reflection with observer reflections to identify visible fruit, encouragement others see, growth invitations, and pressure patterns."
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
      ? `${session.participant_name ?? "The participant"} has ${responses.length} total responses: 1 self and ${observerResponses.length} observer responses.`
      : `${session.participant_name ?? "The participant"} completed this as a self-reflection report with no observer responses.`,
    self_final_reflection: commentList(selfResponses, "growth"),
    self_overall: selfOverall,
    spiritual_gifts_cta:
      "The Spiritual Gifts assessment can add another layer by helping you notice how the Spirit may work through you to strengthen others and serve the body of Christ.",
    steady_forming_formation_cards: formationCardsHtml(rank, 3, 6),
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
    const fruitName = fruit.key === "self_control" ? "Self-control" : fruit.label;
    const content = tierContent(fruit.key, rankIndex);
    const selfVisible = averageFruitScore(selfResponses, fruit.key, "visible");
    const observerVisible = averageFruitScore(hasObservers ? observerResponses : selfResponses, fruit.key, "visible");
    const selfPressure = averageFruitScore(selfResponses, fruit.key, "pressure");
    const observerPressure = averageFruitScore(hasObservers ? observerResponses : selfResponses, fruit.key, "pressure");

    Object.assign(payload, {
      [`${fruit.key}_category`]: categoryLabel(selfVisible, observerVisible, hasObservers),
      [`${fruit.key}_consistency_note`]: consistencyNote(fruit.key, fruitName, selfVisible, observerVisible, hasObservers),
      [`${fruit.key}_definition`]: content.definition,
      [`${fruit.key}_encouragement`]: content.encouragement,
      [`${fruit.key}_growth_invitation`]: content.growthInvitation,
      [`${fruit.key}_maturity`]: content.maturity,
      [`${fruit.key}_observer`]: observerVisible || selfVisible,
      [`${fruit.key}_observer_pressure`]: observerPressure || selfPressure,
      [`${fruit.key}_practice`]: content.practice,
      [`${fruit.key}_prayer_prompt`]: content.prayer,
      [`${fruit.key}_pressure_note`]: pressureNote(fruit.key, fruitName, selfVisible, observerVisible, selfPressure, observerPressure, hasObservers),
      [`${fruit.key}_pressure_pattern`]: content.pressurePattern,
      [`${fruit.key}_rank`]: rankIndex + 1,
      [`${fruit.key}_reflection_question`]: content.reflectionQuestion,
      [`${fruit.key}_scripture`]: content.scripture,
      [`${fruit.key}_self`]: selfVisible,
      [`${fruit.key}_self_pressure`]: selfPressure,
      [`${fruit.key}_summary`]: summaryForFruit(fruitName, rankIndex, categoryLabel(selfVisible, observerVisible, hasObservers)),
      [`${fruit.key}_tier_action`]: content.action,
      [`${fruit.key}_tier_description`]: content.description,
      [`${fruit.key}_tier_label`]: tierLabel(rankIndex),
    });
  }

  const pressureFruits = rank.filter(key => averageFruitScore(selfResponses, key) - averageFruitScore(selfResponses, key, "pressure") >= .5);
  payload.pressure_vulnerabilities = pressureFruits.length ? hasObservers
    ? `${listLabels(pressureFruits)} may need extra attention under pressure. These are helpful places to slow down, invite accountability, and practice Spirit-led responses before stress rises.`
    : `Pressure change noted for ${listLabels(pressureFruits)}: these fruit remain visible, but show a pressure drop under strain based on your self-reflection. Notice where stress may slightly change how these fruit are expressed.`
    : hasObservers ? "No major pressure vulnerability stands out sharply in this feedback set; continue watching how each fruit shows up when life feels strained or hurried."
    : "No major pressure vulnerability stands out in your self-reflection; continue noticing how each fruit shows up when life feels strained or hurried.";
  return payload;
}

export async function buildFruitLifePayloadForSession(supabase: SupabaseLike, sessionId: string) {
  const { data: session, error: sessionError } = await supabase
    .from("fruitlife_360_sessions")
    .select(
      "id,participant_id,metadata,source_participant_id,participant_name,participant_email,observer_goal,observer_completed_count",
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

  if (session.metadata?.instrumentVersion !== fruitLifeInstrumentVersion) return buildLegacyFruitLifePayload(session, responses ?? []);

  const { data: designId } = await supabase.from("assessment_snapshots").select("scores")
    .eq("participant_id", session.participant_id).eq("assessment_type", "designid")
    .order("source_submitted_at", { ascending: false }).limit(1).maybeSingle();
  const summary = designId?.scores?.summary ?? {};
  return buildFruitLifePayload(
    { ...session, designIdPrimary: String(summary.Primary ?? ""), designIdSecondary: String(summary.Secondary ?? "") } as FruitLifeSession,
    ((responses ?? []) as FruitLifeResponse[]),
  );
}

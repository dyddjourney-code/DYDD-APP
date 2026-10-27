import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CircleDataMember = {
  id: string;
  name: string;
  role: "Host" | "Member";
  designId: { architect: number; artisan: number; shepherd: number; steward: number } | null;
  primary: string | null;
  /** Signed percentage points: positive Dreamer / Feel It / Solo. */
  designPd: { plan: number; decide: number; do: number } | null;
  gifts: string[];
};
export type CircleData = {
  circleId: string;
  preview: boolean;
  members: CircleDataMember[];
  counts: { members: number; designId: number; designPd: number; gifts: number };
};
type Json = Record<string, unknown>;
type Snapshot = { id: string; user_id: string | null; participant_id: string | null; assessment_type: string; scores: unknown; created_at: string; source_submitted_at: string | null };
type Db = ReturnType<typeof createSupabaseAdminClient>;
const object = (value: unknown): Json => value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const reflections = ["Architect", "Artisan", "Shepherd", "Steward"] as const;
function sections(scores: unknown) {
  const root = object(scores), nested = object(root.scores);
  return [nested, object(nested.scores), object(root.summary), object(root.profileLanguage), object(root.reportPayload), root];
}
function first(sources: Json[], key: string) {
  return sources.map(source => source[key]).find(value => value !== null && value !== undefined && value !== "");
}

/** Read saved report points, never percentages or normalized legacy scores. */
export function savedDesignId(scores: unknown): Pick<CircleDataMember, "designId" | "primary"> {
  const sources = sections(scores);
  const points = reflections.map(name => number(first(sources, `${name}_Pts`)));
  const root = object(scores);
  const allocation = root.scoringVersion === "designid-allocation-5x20-v1";
  const total = points.reduce<number>((sum, point) => sum + (point ?? 0), 0);
  const valid = points.every(point => point !== null && point >= 0) && total > 0 &&
    (!allocation || (total === 100 && points.every(point => Number.isInteger(point) && point! <= 60)));
  const primary = text(first(sources, "Primary"));
  return {
    designId: valid ? { architect: points[0]!, artisan: points[1]!, shepherd: points[2]!, steward: points[3]! } : null,
    primary: reflections.includes(primary as typeof reflections[number]) ? primary : null,
  };
}

/** Only a saved DesignPD snapshot is passed here; no DesignID derivation. */
export function savedDesignPd(scores: unknown): CircleDataMember["designPd"] {
  const root = object(scores), movement = object(root.movement), sources = sections(scores);
  const keys = ["Move_DreamerMinusDoer", "Move_Feel_ItMinusThink_It", "Move_SoloMinusTogether"];
  const payloadKeys = ["move_dreamer_minus_doer", "move_feel_it_minus_think_it", "move_solo_minus_together"];
  const axes = ["plan", "decide", "do"] as const;
  const values = axes.map((axis, i) => {
    const raw = movement[axis] ?? first(sources, keys[i]) ?? first(sources, payloadKeys[i]);
    // Imported Sheets and reportPayload can store formatted percentages.
    const percent = typeof raw === "string" && /^[-+]?\d+(?:\.\d+)?%$/.test(raw.trim());
    const value = number(percent ? raw.trim().slice(0, -1) : raw);
    if (value === null || Math.abs(value) > (percent ? 50 : 0.5)) return null;
    return Number((value * (percent ? 1 : 100)).toFixed(10));
  });
  return values.some(value => value === null) ? null : {plan: values[0]!, decide: values[1]!, do: values[2]!};
}
export function savedGifts(scores: unknown): string[] {
  const root = object(scores), sources = sections(scores);
  const native = Array.isArray(root.topGifts) ? root.topGifts.map(gift => text(object(gift).label)) : [];
  const saved = native.some(Boolean) ? native : Array.from({length: 5}, (_, i) => text(first(sources, `Top${i + 1}_Name`)));
  return [...new Set(saved.filter(Boolean))].slice(0, 5);
}
function completed(snapshot: Snapshot) {
  // assessment_snapshots is the submitted-results table, not the draft table.
  // Explicit incomplete/import markers must not be displayed as completed results.
  const root = object(snapshot.scores);
  return !["draft", "pending", "in_progress", "incomplete"].includes(text(root.status).toLowerCase()) && root.completed !== false;
}
export function circleDataResponse(circleId: string, members: CircleDataMember[], preview = false): CircleData {
  return {circleId, preview, members, counts: {
    members: members.length,
    designId: members.filter(member => member.designId !== null).length,
    designPd: members.filter(member => member.designPd !== null).length,
    gifts: members.filter(member => member.gifts.length > 0).length,
  }};
}
function checked<T>(result: {data: T | null; error: unknown}): T {
  if (result.error || result.data === null) throw new Error("Circle data unavailable");
  return result.data;
}

/** Avoid silently losing older assessment types at the Data API row limit. */
async function allRows<T>(query: (offset: number) => PromiseLike<{data: T[] | null; error: unknown}>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const page = checked(await query(offset));
    rows.push(...page);
    if (page.length < 500) return rows;
  }
}

/** Call only after circleActor/circleQuery authorize the exact creator-owned plan.
 * Roster email is used ONLY to intersect already accepted memberships, never to
 * discover accounts or attach participants. All result lookups use confirmed IDs.
 */
export async function loadCircleData(circleId: string, creatorId: string, plan: unknown, db: Db = createSupabaseAdminClient()): Promise<CircleData> {
  const roster = object(plan).participants;
  const rosterEmails = new Set((Array.isArray(roster) ? roster : []).map(person => text(object(person).email).toLowerCase()).filter(Boolean));
  const memberships = await allRows(offset => db.from("dydd_circle_memberships")
    .select("id,user_id,email,display_name").eq("circle_id", circleId).eq("status", "accepted").order("id").range(offset, offset + 499));
  const eligible = new Map<string, {name: string; role: "Host" | "Member"}>([[creatorId, {name: "Circle host", role: "Host"}]]);
  for (const member of memberships) {
    if (member.user_id && member.user_id !== creatorId && rosterEmails.has(text(member.email).toLowerCase()))
      eligible.set(member.user_id, {name: text(member.display_name) || "Circle member", role: "Member"});
  }
  const userIds = [...eligible.keys()];
  const participants = checked(await db.from("assessment_participants").select("id,user_id,display_name").in("user_id", userIds));
  const participantOwners = new Map<string, string>();
  for (const participant of participants) {
    if (!participant.user_id || !eligible.has(participant.user_id)) continue;
    participantOwners.set(participant.id, participant.user_id);
    if (participant.user_id === creatorId && text(participant.display_name)) eligible.get(creatorId)!.name = text(participant.display_name);
  }
  // Do not resolve host identity through email or auth-admin account listings.
  const profiles = checked(await db.from("school_profiles").select("id,full_name").eq("id", creatorId));
  if (text(profiles[0]?.full_name)) eligible.get(creatorId)!.name = text(profiles[0].full_name);
  const select = "id,user_id,participant_id,assessment_type,scores,created_at,source_submitted_at";
  const direct = await allRows(offset => db.from("assessment_snapshots").select(select).in("user_id", userIds).in("assessment_type", ["designid", "designpd", "spiritual_gifts"]).order("id").range(offset, offset + 499)) as Snapshot[];
  const linked = participantOwners.size ? await allRows(offset => db.from("assessment_snapshots").select(select).in("participant_id", [...participantOwners.keys()]).in("assessment_type", ["designid", "designpd", "spiritual_gifts"]).order("id").range(offset, offset + 499)) as Snapshot[] : [];
  const snapshots = [...new Map([...direct, ...linked].map(row => [row.id, row])).values()]
    .filter(completed).sort((a, b) => (Date.parse(b.source_submitted_at || b.created_at) - Date.parse(a.source_submitted_at || a.created_at)) || (Date.parse(b.created_at) - Date.parse(a.created_at)) || b.id.localeCompare(a.id));
  const latest = new Map<string, Snapshot>();
  for (const snapshot of snapshots) {
    // A participant-linked row MUST have verified ownership; conflicting direct
    // user_id/participant_id records are excluded, even for another eligible user.
    const participantOwner = snapshot.participant_id ? participantOwners.get(snapshot.participant_id) : null;
    if (snapshot.participant_id && (!participantOwner || snapshot.user_id && snapshot.user_id !== participantOwner)) continue;
    const userId = snapshot.user_id || participantOwner;
    if (!userId || !eligible.has(userId)) continue;
    const key = `${userId}:${snapshot.assessment_type}`;
    if (!latest.has(key)) latest.set(key, snapshot);
  }
  const members = [...eligible].map(([id, identity]): CircleDataMember => {
    const designId = latest.get(`${id}:designid`), pd = latest.get(`${id}:designpd`), gifts = latest.get(`${id}:spiritual_gifts`);
    return {id, ...identity, ...(designId ? savedDesignId(designId.scores) : {designId: null, primary: null}),
      designPd: pd ? savedDesignPd(pd.scores) : null, gifts: gifts ? savedGifts(gifts.scores) : []};
  });
  return circleDataResponse(circleId, members);
}

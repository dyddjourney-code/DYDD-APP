import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { getCircleBillingState } from "@/lib/commerce/circle-billing";

export class CircleOperationError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type OperationActor = { userId: string; email: string; owner: boolean };
type Row = Record<string, any>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const operationLimits = { daily: 30, monthly: 60, burst: 5, burstWindowMinutes: 10, inviteDaily: 1000, inviteBurst: 100 };
export async function operationActor(): Promise<OperationActor | null> {
  const s = await createSupabaseServerClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user?.email || !user.email_confirmed_at) return null;
  const ids = (process.env.DYDD_CIRCLES_OWNER_USER_IDS || "").split(",").map(s => s.trim());
  return { userId: user.id, email: user.email.toLowerCase(), owner: ids.includes(user.id) || isDyddAdminEmail(user.email) };
}
function checked<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw new CircleOperationError("Circle records could not be checked. Please retry.", 503);
  return result.data;
}
/** RFC4180-style quoted fields, including quoted newlines. Invalid rows never enter invitations. */
export function parseCircleRoster(csv: string) {
  if (typeof csv !== "string" || csv.length > 200000) throw new CircleOperationError("Upload a CSV under 200 KB.");
  const records: string[][] = []; let row: string[] = [], field = "", quoted = false, afterQuote = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (quoted) { if (ch === '"') { if (csv[i + 1] === '"') { field += '"'; i++; } else { quoted = false; afterQuote = true; } } else field += ch; continue; }
    if (ch === '"') { if (field || afterQuote) throw new CircleOperationError("CSV quote must start a field."); quoted = true; }
    else if (ch === ',') { row.push(field); field = ""; afterQuote = false; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && csv[i + 1] === '\n') i++; row.push(field); if (row.some(s => s.trim())) records.push(row); row = []; field = ""; afterQuote = false; }
    else { if (afterQuote && ch.trim()) throw new CircleOperationError("Unexpected text after a quoted CSV field."); if (!afterQuote) field += ch; }
  }
  if (quoted) throw new CircleOperationError("Close the quoted CSV field.");
  row.push(field); if (row.some(s => s.trim())) records.push(row);
  const headers = records.shift()?.map(s => s.replace(/^\uFEFF/, "").trim().toLowerCase()) || [];
  if (headers.length !== 2 || new Set(headers).size !== 2 || !headers.includes("name") || !headers.includes("email")) throw new CircleOperationError("CSV needs exactly name,email headers.");
  if (records.length < 1 || records.length > 1000) throw new CircleOperationError("Preview 1–1000 people at a time.");
  const rows: { name: string; email: string }[] = [], errors: { row: number; error: string }[] = [], duplicates: number[] = [], seen = new Set<string>();
  records.forEach((record, i) => {
    const name = (record[headers.indexOf("name")] || "").trim(), email = (record[headers.indexOf("email")] || "").trim().toLowerCase();
    if (record.length !== 2 || !name || name.length > 160 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(name)) { errors.push({ row: i + 2, error: "Provide a valid name and email." }); return; }
    if (seen.has(email)) { duplicates.push(i + 2); return; } seen.add(email); rows.push({ name, email });
  });
  return { rows, errors, duplicates, canInvite: errors.length === 0 && rows.length > 0 };
}
const sharedPlanFields = ["name", "format", "startDate", "time", "timezone", "rhythm", "customDays", "target", "customGoal", "meetingMode", "location", "paceMode", "meetingCount", "finishDate", "meetingMinutes", "breaks", "movedDates", "assignments", "curriculum"];
export function participantCircleProjection(circle: Row) {
  const plan = Object.fromEntries(sharedPlanFields.filter(key => key in (circle.plan || {})).map(key => [key, circle.plan[key]]));
  return { id: circle.id, status: circle.status, plan, revision: circle.revision, updated_at: circle.updated_at };
}
/** Never return individual cohort signals/text; no sub-Circle aggregation. */
export function projectCallouts(rows: Row[], actorId: string, creator: boolean, cohort: boolean, acceptedIds: Set<string>) {
  const counts = new Map<string, { session: string; lesson: string; prompt: string; people: Set<string> }>();
  const visible = rows.filter(r => acceptedIds.has(r.user_id));
  for (const row of visible) if (row.marked) {
    const key = JSON.stringify([row.session, row.lesson, row.prompt]);
    const group = counts.get(key) || { session: row.session, lesson: row.lesson, prompt: row.prompt, people: new Set<string>() };
    group.people.add(row.user_id); counts.set(key, group);
  }
  return {
    counts: Array.from(counts.values(), ({ people, ...group }) => ({ ...group, count: people.size, total: acceptedIds.size })),
    submissions: cohort ? [] : visible.filter(r => r.user_id === actorId || (r.share_text && (creator || r.audience === "circle"))).map(r => ({ session: r.session, lesson: r.lesson, prompt: r.prompt, marked: r.marked, text: r.share_text ? r.body : "", audience: r.audience, own: r.user_id === actorId })),
    // The person may edit/withdraw their own count without exposing others' identities.
    own: visible.filter(r => r.user_id === actorId).map(r => ({ session: r.session, lesson: r.lesson, prompt: r.prompt, marked: r.marked, text: !cohort && r.share_text ? r.body : "", shareText: !cohort && r.share_text, audience: r.audience })),
  };
}
export async function loadCircleOperationDetail(actor: OperationActor, id: string) {
  if (!uuid.test(id)) throw new CircleOperationError("Choose a valid Circle.");
  const db = createSupabaseAdminClient();
  const circle = checked(await db.from("journey_circle_plans").select("id,user_id,status,plan,revision,updated_at").eq("id", id).maybeSingle()) as Row | null;
  if (!circle) throw new CircleOperationError("Circle not found.", 404);
  const creator = circle.user_id === actor.userId;
  // Authorize before reading any other member's records.
  const own = checked(await db.from("dydd_circle_memberships").select("id,status,role").eq("circle_id", id).eq("user_id", actor.userId).eq("status", "accepted").maybeSingle()) as Row | null;
  if (!creator && !own) throw new CircleOperationError("This Circle is not available to your account.", 403);
  const members = checked(await db.from("dydd_circle_memberships").select("id,user_id,email,display_name,status,role,expires_at").eq("circle_id", id)) as Row[];
  const consent = checked(await db.from("dydd_circle_consents").select("user_id,people,insights").eq("circle_id", id)) as Row[];
  const callouts = checked(await db.from("dydd_circle_callouts").select("user_id,session,lesson,prompt,marked,share_text,body,audience").eq("circle_id", id)) as Row[];
  const lifecycle = await getCircleBillingState(circle.user_id, id, circle.plan.format);
  const acceptedIds = new Set<string>(members.filter(m => m.status === "accepted" && m.user_id).map(m => m.user_id));
  acceptedIds.add(circle.user_id);
  const visibleMembers = creator ? members : members.filter(m => m.status === "accepted" && (m.user_id === actor.userId || consent.some(c => c.user_id === m.user_id && c.people))).map(m => ({ id: m.id, name: m.display_name, role: m.role, self: m.user_id === actor.userId }));
  const result: Row = {
    circle: creator ? circle : participantCircleProjection(circle), role: creator ? "leader" : own?.role || "participant", lifecycle,
    members: visibleMembers,
    counts: { accepted: members.filter(m => m.status === "accepted").length + 1, pending: members.filter(m => m.status === "invited" && Date.parse(m.expires_at) > Date.now()).length },
    consents: consent.filter(c => c.user_id === actor.userId).map(({ people, insights }) => ({ people, insights })),
    callouts: projectCallouts(callouts, actor.userId, creator, circle.plan.format === "Cohort", acceptedIds),
  };
  if (creator) {
    result.rosterPreviews = checked(await db.from("dydd_circle_roster_previews").select("id,rows,errors,created_at,consumed_at").eq("circle_id", id).order("created_at", { ascending: false }).limit(10));
    result.outbox = checked(await db.from("dydd_circle_held_outbox").select("id,kind,recipient,payload,status,created_at").eq("circle_id", id).order("created_at", { ascending: false }).limit(100));
    result.approvals = checked(await db.from("dydd_circle_cohort_requests").select("*").eq("circle_id", id));
  }
  return result;
}
export async function listCircleOperations(actor: OperationActor) {
  const db = createSupabaseAdminClient();
  const owned = checked(await db.from("journey_circle_plans").select("id,status,plan,revision,updated_at").eq("user_id", actor.userId).order("updated_at", { ascending: false }).limit(200)) as Row[];
  const memberships = checked(await db.from("dydd_circle_memberships").select("circle_id,role").eq("user_id", actor.userId).eq("status", "accepted")) as Row[];
  const memberIds = [...new Set(memberships.map(m => m.circle_id))].filter(id => !owned.some(c => c.id === id));
  const joined = memberIds.length ? checked(await db.from("journey_circle_plans").select("id,status,plan,revision,updated_at").in("id", memberIds).order("updated_at", { ascending: false }).limit(200)) as Row[] : [];
  const limits = checked(await db.from("dydd_circle_operation_limits").select("*").eq("user_id", actor.userId).maybeSingle());
  const approvals = actor.owner ? checked(await db.from("dydd_circle_cohort_requests").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(200)) : [];
  return { circles: [...owned.map(c => ({ ...c, role: "leader" })), ...joined.map(c => ({ ...participantCircleProjection(c), role: memberships.find(m => m.circle_id === c.id)?.role || "participant" }))], approvals, limits: limits || operationLimits, owner: actor.owner };
}
const actions = new Set(["set_report_limits", "set_limits", "request_cohort", "approve_cohort", "preview_roster", "invite_roster", "invite", "accept_invite", "decline_invite", "leave", "revoke_invite", "consent", "callout", "withdraw_callout", "transfer", "set_role"]);
export async function operateCircle(actor: OperationActor, input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new CircleOperationError("Choose a Circle action.");
  const body = { ...(input as Row), _actorEmail: actor.email } as Row;
  if (!actions.has(body.action)) throw new CircleOperationError("Choose a supported Circle action.");
  if (["approve_cohort", "set_limits", "set_report_limits"].includes(body.action) && !actor.owner) throw new CircleOperationError("Owner approval required.", 403);
  if (!["set_report_limits", "set_limits", "approve_cohort", "accept_invite", "decline_invite"].includes(body.action) && !uuid.test(body.circleId || "")) throw new CircleOperationError("Choose a valid Circle.");
  if (["accept_invite", "decline_invite"].includes(body.action) && !/^[a-f0-9]{64}$/.test(body.token || "")) throw new CircleOperationError("Choose a valid invitation.");
  if (body.action === "set_role" && !["participant", "facilitator"].includes(body.role)) throw new CircleOperationError("Choose participant or facilitator.");
  if (["callout", "withdraw_callout"].includes(body.action)) {
    if ([body.session, body.lesson, body.prompt].some(v => typeof v !== "string" || !v.trim() || v.length > 200)) throw new CircleOperationError("Choose session, lesson and prompt.");
    if (body.action === "callout" && (typeof body.marked !== "boolean" || typeof body.shareText !== "boolean" || !["leader", "circle"].includes(body.audience) || (body.text !== undefined && (typeof body.text !== "string" || body.text.length > 4000)))) throw new CircleOperationError("Confirm callout signal, explicit text sharing and audience.");
  }
  if (body.action === "consent" && (typeof body.people !== "boolean" || typeof body.insights !== "boolean")) throw new CircleOperationError("Choose your sharing permissions.");
  if (body.action === "preview_roster") {
    // Existing validated message-roster workflow submits rows rather than a CSV file.
    // Round-trip through the same parser so public callers cannot bypass validation.
    let csv = body.csv;
    if (csv === undefined && Array.isArray(body.rows) && body.rows.length <= 1000) {
      if (body.rows.some((r: Row) => !r || typeof r.name !== "string" || typeof r.email !== "string")) throw new CircleOperationError("Provide valid roster rows.");
      const quote = (s: string) => '"' + s.replaceAll('"', '""') + '"';
      csv = "name,email\n" + body.rows.map((r: Row) => quote(r.name) + "," + quote(r.email)).join("\n");
    }
    const parsed = parseCircleRoster(csv); body.rows = parsed.rows; body.errors = parsed.errors; body.duplicates = parsed.duplicates; delete body.csv;
  }
  if (body.action === "request_cohort") {
    if (![body.organization, body.purpose, body.details, body.launchDate].every(v => typeof v === "string" && v.trim()) || !Number.isInteger(body.enrollment) || body.enrollment < 50 || body.enrollment > 100000) throw new CircleOperationError("Provide organization, purpose, enrollment, launch date and operating details.");
    body.ownerEmail = process.env.DYDD_CIRCLES_APPROVAL_EMAIL || "dyddjourney@gmail.com";
  }
  if (body.action === "set_limits") {
    if (!uuid.test(body.userId || "") || ["daily", "monthly", "burst", "inviteDaily", "inviteBurst"].some(k => !Number.isInteger(body[k]) || body[k] < 1)) throw new CircleOperationError("Provide account and positive whole-number limits.");
  }
  if (body.action === "approve_cohort" && (!uuid.test(body.requestId || "") || !Number.isInteger(body.seatCap) || body.seatCap < 50 || body.seatCap > 100000)) throw new CircleOperationError("Choose a request and specific approved seat cap.");
  if (body.action === "set_report_limits") {
    if (!uuid.test(body.userId || "") || [body.reportDaily,body.reportMonthly,body.reportBurst].some(v=>!Number.isInteger(v)||v<1)) throw new CircleOperationError("Provide an account and positive whole-number PDF allowances.");
    const saved=await createSupabaseAdminClient().rpc("dydd_circle_set_report_limits",{p_user:body.userId,p_daily:body.reportDaily,p_monthly:body.reportMonthly,p_burst:body.reportBurst});
    if(saved.error)throw new CircleOperationError("Check the account and PDF allowance bounds.",409);
    return {saved:true};
  }
  // Never forward an untrusted owner flag or actor identity from request JSON.
  const { data, error } = await createSupabaseAdminClient().rpc("dydd_circle_operate", { actor: actor.userId, payload: body, owner_actor: actor.owner });
  if (error) {
    if (["P0001", "23514", "22P02", "22007", "22008"].includes(error.code)) throw new CircleOperationError(error.code === "P0001" ? error.message : "Check the Circle action details.", 409);
    throw new CircleOperationError("Your Circle action could not be saved. Please retry.", 503);
  }
  return body.action === "preview_roster" ? { ...data, duplicates: body.duplicates, canInvite: data.canInvite && body.rows.length > 0 } : data;
}

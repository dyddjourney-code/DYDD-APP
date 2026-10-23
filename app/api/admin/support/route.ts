import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { supportAdmin } from "@/lib/support/auth";
import { readInput, reply, sameOrigin } from "@/lib/support/http";
export const dynamic = "force-dynamic";
const statuses = ["new", "in_progress", "resolved"];
const columns = "id,name,email,subject,message,status,created_at,updated_at,revision";
export async function GET(request: Request) {
  if (!await supportAdmin()) return reply({ error: "Administrator sign-in required." }, 403);
  const params = new URL(request.url).searchParams;
  const status = params.get("status") || "new", page = Number(params.get("page") || 0);
  if (!statuses.includes(status) || !Number.isInteger(page) || page < 0 || page > 10000) return reply({ error: "Invalid queue filter." }, 400);
  try {
    const { data, error } = await createSupabaseAdminClient().from("support_requests").select(columns).eq("status", status).order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * 25, page * 25 + 25);
    if (error) return reply({ error: "The support queue could not be loaded." }, 503);
    return reply({ requests: (data ?? []).slice(0,25), hasMore: (data?.length ?? 0) > 25 });
  } catch { return reply({ error: "The support queue is unavailable." }, 503); }
}
export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return reply({ error: "Open the support queue to update a request." }, 403);
  const user = await supportAdmin();
  if (!user) return reply({ error: "Administrator sign-in required." }, 403);
  const input = await readInput(request);
  if (!input || typeof input.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id) || typeof input.status !== "string" || !statuses.includes(input.status) || !Number.isSafeInteger(input.revision) || Number(input.revision) < 0) return reply({ error: "Invalid support update." }, 400);
  try {
    const { data, error } = await createSupabaseAdminClient().from("support_requests").update({ status: input.status, revision: Number(input.revision) + 1, updated_at: new Date().toISOString(), updated_by: user.id }).eq("id", input.id).eq("revision", input.revision).select(columns).maybeSingle();
    if (error) return reply({ error: "The request could not be updated." }, 503);
    if (!data) return reply({ error: "This request changed in another tab. Reload the queue and try again." }, 409);
    return reply({ request: data });
  } catch { return reply({ error: "The request could not be updated." }, 503); }
}

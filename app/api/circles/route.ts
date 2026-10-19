import { isDeepStrictEqual } from "node:util";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { circleActor, circleQuery, sameOrigin } from "@/lib/circles/server";
import { validatePlan } from "@/lib/circles/plan";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(request: Request) {
  const actor = await circleActor(request);
  if (!actor)
    return reply(
      { error: "Sign in to open your Circles.", signedIn: false },
      401,
    );
  const { data, error } = await circleQuery(actor)
    .order("updated_at", { ascending: false })
    .limit(200);
  return error
    ? reply(
        { error: "Your Circles could not be loaded. Please try again." },
        503,
      )
    : reply({ circles: data, preview: Boolean(actor.previewScope) });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return reply({ error: "Open your Circle page to save changes." }, 403);
  const actor = await circleActor(request);
  if (!actor)
    return reply({ error: "Sign in to save or create your Circle." }, 401);
  const raw = await request.text();
  if (raw.length > 250000)
    return reply({ error: "This Circle plan is too large." }, 413);
  let b;
  try {
    b = JSON.parse(raw);
  } catch {
    return reply({ error: "Check your Circle details." }, 400);
  }
  if (
    !b ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      b.id,
    ) ||
    !["draft", "active", "archived"].includes(b.status) ||
    !Number.isInteger(b.revision) ||
    b.revision < 0
  )
    return reply({ error: "Choose a valid Circle." }, 400);
  const invalid = validatePlan(b.plan, b.status === "active");
  if (invalid) return reply({ error: invalid }, 400);
  const db = createSupabaseAdminClient();
  if (b.revision === 0) {
    const { data, error } = await db
      .from("journey_circle_plans")
      .insert({
        id: b.id,
        user_id: actor.userId,
        preview_scope: actor.previewScope,
        status: b.status,
        plan: b.plan,
      })
      .select("id,status,plan,revision,updated_at")
      .single();
    if (error) {
      // Retrying a timed-out create must not create a second Circle.
      if (error.code === "23505") {
        const existing = await circleQuery(actor).eq("id", b.id).maybeSingle();
        if (
          existing.data &&
          existing.data.status === b.status &&
          isDeepStrictEqual(existing.data.plan, b.plan)
        )
          return reply({ circle: existing.data });
        if (existing.data)
          return reply(
            {
              error:
                "Your earlier save succeeded. Reopen this Circle before saving new changes.",
            },
            409,
          );
      }
      return reply(
        {
          error:
            "Your Circle could not be saved. Your changes are still here; try again.",
        },
        503,
      );
    }
    return reply({ circle: data });
  }
  let query = db
    .from("journey_circle_plans")
    .update({
      status: b.status,
      plan: b.plan,
      revision: b.revision + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", b.id)
    .eq("revision", b.revision);
  query = actor.userId
    ? query.eq("user_id", actor.userId)
    : query.eq("preview_scope", actor.previewScope!);
  const { data, error } = await query
    .select("id,status,plan,revision,updated_at")
    .maybeSingle();
  if (error)
    return reply(
      { error: "Your changes could not be saved. Please try again." },
      503,
    );
  if (!data)
    return reply(
      {
        error:
          "This Circle changed in another tab. Reopen it before saving; your current changes are still here.",
      },
      409,
    );
  return reply({ circle: data });
}

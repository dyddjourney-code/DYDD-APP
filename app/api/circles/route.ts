import { testBillingEnabled } from "@/lib/commerce/test-billing-config";
import { requireCircleBillingAction } from "@/lib/commerce/circle-billing";
import { operationActor, listCircleOperations } from "@/lib/circles/operations";
import { hasTestEntitlement } from "@/lib/commerce/test-entitlements";
import { hasLifetimePersonalAccess } from "@/lib/commerce/personal-access";
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
  if (actor.userId && testBillingEnabled()) {
    try {
      const verified = await operationActor();
      if (!verified) return reply({error:"Verify your email before opening My Circles."},401);
      return reply({...await listCircleOperations(verified),preview:false});
    } catch { return reply({error:"Your Circles could not be loaded. Please try again."},503); }
  }
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
  // Commercial access never grants ownership. The DB independently enforces lifecycle,
  // reserved seats and immutable rolling account budgets on every write path.
  if (testBillingEnabled() && actor.userId) {
    try {
      const verified = await operationActor();
      if (!verified || verified.userId !== actor.userId) return reply({error:"Verify your email before saving a Circle."},401);
      if (b.revision === 0) {
        const personal = await hasLifetimePersonalAccess(actor.userId) || await hasTestEntitlement(actor.userId,"personal");
        if (!personal) return reply({error:"Your own Personal membership is required. Activate it in Base Camp.",checkoutUrl:"/hq#purchases"},402);
        // A single bound Couple draft must exist before its scoped one-time checkout.
        if (!(b.plan.format === "Couple" && b.status === "draft"))
          await requireCircleBillingAction(actor.userId,null,b.plan.format,"create");
      } else {
        const prior = await circleQuery(actor).eq("id",b.id).maybeSingle();
        if (prior.error) return reply({error:"Your Circle could not be checked."},503);
        if (!prior.data) return reply({error:"Circle creator permission required."},403);
        if (!(b.status === "draft" && prior.data.status === "draft" && b.plan.format === "Couple"))
          await requireCircleBillingAction(actor.userId,b.id,prior.data.plan.format,"operate");
      }
    } catch(error) { return reply({error:error instanceof Error ? error.message : "Your Circle access could not be checked.",checkoutUrl:"/camp-circle/my-circles"},402); }
  }
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
      if (error.code === "P0001") return reply({error:error.message},409);
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
  const prior = await circleQuery(actor).eq("id", b.id).maybeSingle();
  if (prior.error) return reply({error:"Your Circle could not be checked. Try again."},503);
  if (prior.data && prior.data.revision === b.revision && prior.data.status === b.status && isDeepStrictEqual(prior.data.plan,b.plan))
    return reply({circle:prior.data});
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
  if (error?.code === "P0001") return reply({error:error.message},409);
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

import { testBillingEnabled as circleReadBillingEnabled } from "@/lib/commerce/test-billing-config";
import { hasTestCircleTools } from "@/lib/commerce/test-entitlements";
import "server-only";
import { testBillingEnabled } from "@/lib/commerce/test-billing-config";
import { hasLifetimePersonalAccess } from "@/lib/commerce/personal-access";
import { hasTestEntitlement } from "@/lib/commerce/test-entitlements";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { circleActor, circleQuery } from "@/lib/circles/server";
import content from "@/lib/circles/field-guide-content.json";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" },
});
export async function GET(request: Request) {
  try {
    const actor = await circleActor(request);
    if (!actor) return reply({ error: "Sign in to open your Circle’s Field Guide." }, 401);
    const id = new URL(request.url).searchParams.get("circle");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      return reply({ error: "Choose a started Circle to open its Field Guide." }, 400);
    // The existing query scopes by the authenticated owner or validated preview scope.
    // Never accept a client-provided role, status, or plan as proof of access.
    const { data, error } = await circleQuery(actor).eq("id", id).eq("status", "active").maybeSingle();
    if (error) return reply({ error: "Your Field Guide could not be loaded. Please try again." }, 503);
    if (!data && actor.userId && testBillingEnabled()) {
      const db = createSupabaseAdminClient();
      const membership = await db.from("dydd_circle_memberships").select("id").eq("circle_id", id).eq("user_id", actor.userId).eq("status", "accepted").maybeSingle();
      if (membership.error) throw Error("Membership unavailable");
      if (membership.data) {
        if (!await hasLifetimePersonalAccess(actor.userId) && !await hasTestEntitlement(actor.userId, "personal"))
          return reply({error:"Your own Personal membership is needed for participant preparation.",checkoutUrl:"/hq#purchases"},402);
        const participantSession = (session: typeof content.sessionTwo) => ({prepare:session.prepare,readings:session.readings,questions:session.questions.map(q=>({question:q.question,followup:q.followup})),followThrough:session.followThrough});
        return reply({participant:true,content:{sessionOne:content.sessionOne,sessionTwo:participantSession(content.sessionTwo),sessions:Object.fromEntries(Object.entries(content.sessions).map(([key,session])=>[key,participantSession(session)]))}});
      }
    }
    if (!data) return reply({ error: "The full Field Guide is available to the organizer of a started Circle. Open or start your own Circle first." }, 404);
    if (!circleReadBillingEnabled() && !await hasTestCircleTools(actor.userId,id,data.plan?.format)) return reply({error:"Your Circle tools need an active membership or this couple’s unlock.",checkoutUrl:"/camp-circle/my-circles"},402);
    return reply({ content });
  } catch {
    return reply({ error: "Your Field Guide could not be loaded. Please try again." }, 503);
  }
}

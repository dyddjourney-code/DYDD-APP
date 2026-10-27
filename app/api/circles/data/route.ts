import "server-only";
import { NextResponse } from "next/server";
import { circleActor, circleQuery } from "@/lib/circles/server";
import { circleDataResponse, loadCircleData } from "@/lib/circles/data";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: {"Cache-Control": "private, no-store", "Vary": "Cookie"},
});
export async function GET(request: Request) {
  try {
    const actor = await circleActor(request);
    if (!actor) return reply({error: "Sign in to open your Circle’s data."}, 401);
    const id = new URL(request.url).searchParams.get("circleId");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      return reply({error: "Choose a valid Circle."}, 400);
    const {data, error} = await circleQuery(actor).eq("id", id).maybeSingle();
    if (error) return reply({error: "Your Circle’s data could not be loaded. Please try again."}, 503);
    if (!data) return reply({error: "Circle data is available only to this Circle’s creator."}, 404);
    // Validated explicit preview scopes never read real memberships or reports.
    if (!actor.userId) return reply(circleDataResponse(id, [], true));
    return reply(await loadCircleData(id, actor.userId, data.plan));
  } catch {
    // Never log or return participant PII, scores, or raw database exceptions.
    return reply({error: "Your Circle’s data could not be loaded. Please try again."}, 503);
  }
}

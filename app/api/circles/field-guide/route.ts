import "server-only";
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
    if (!data) return reply({ error: "The full Field Guide is available to the organizer of a started Circle. Open or start your own Circle first." }, 404);
    return reply({ content });
  } catch {
    return reply({ error: "Your Field Guide could not be loaded. Please try again." }, 503);
  }
}

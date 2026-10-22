import { NextResponse } from "next/server";
import { isSandbox } from "@/lib/environment";

// Same established John preview entry as /base-camp, fixed to teaching only.
export function GET(request: Request) {
  const token = process.env.DYDD_REVIEW_TOKEN;
  if (!isSandbox() || !token) return new NextResponse("Not found", { status: 404 });
  const destination = new URL("/trailheads", request.url);
  destination.searchParams.set("review", "new");
  destination.searchParams.set("key", token);
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

import { NextResponse } from "next/server";

/** Original owner operations live behind ALL-deployment Vercel Authentication.
 * Never issue the public teaching-preview credential for live owner access. */
export function GET() {
  const response = NextResponse.redirect("https://dydd-private-owner-console.vercel.app/command-center");
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

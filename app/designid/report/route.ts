import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GET as artifactReport } from "@/app/api/artifacts/[snapshotId]/download/route";
export const runtime = "nodejs";
export const maxDuration = 120;
export async function GET(request: NextRequest) {
  const snapshotId = request.nextUrl.searchParams.get("snapshot") ?? "";
  if (!snapshotId)
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const url = new URL(request.url);
  url.pathname = `/api/artifacts/${encodeURIComponent(snapshotId)}/download`;
  url.searchParams.delete("snapshot");
  const response = await artifactReport(new NextRequest(url, { headers: request.headers }), {
    params: Promise.resolve({ snapshotId }),
  });
  // Emailed links intentionally are not bearer credentials. An email browser may
  // have no school session, even when the report and its private PDF exist.
  // Keep the resolver's ownership checks, but let this learner-facing entry point
  // resume the exact issued link after sign-in instead of reporting a missing PDF.
  if (response.status === 404) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const login = new URL("/login", request.nextUrl.origin);
      login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      login.searchParams.set("message", "Sign in with the account that completed DesignID to open your saved report.");
      return NextResponse.redirect(login, {
        headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
      });
    }
  }
  return response;
}

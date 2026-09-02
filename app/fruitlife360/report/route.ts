import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session") ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "Missing FruitLife session." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: artifact } = await supabase
    .from("fruitlife_360_report_artifacts")
    .select("external_url")
    .eq("session_id", sessionId)
    .eq("artifact_type", "pdf")
    .eq("artifact_status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!artifact?.external_url) {
    return NextResponse.json({ error: "FruitLife report is not ready yet." }, { status: 404 });
  }

  return NextResponse.redirect(artifact.external_url);
}

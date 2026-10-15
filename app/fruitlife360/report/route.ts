import { NextResponse, type NextRequest } from "next/server";
import { getPdfMonkeyDocument } from "@/lib/pdfmonkey/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { normalizeEmail } from "@/lib/identity/email";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session") ?? "";

  if (!sessionId) {
    return NextResponse.json({ error: "Missing FruitLife session." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const server = await createSupabaseServerClient();
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/fruitlife360/report?session=${sessionId}`)}`, request.url));
  const { data: session } = await supabase.from("fruitlife_360_sessions").select("created_by_user_id,participant_email").eq("id", sessionId).maybeSingle();
  if (!session || !(session.created_by_user_id === user.id || normalizeEmail(session.participant_email) === normalizeEmail(user.email) || isDyddAdminEmail(user.email))) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  const { data: artifact } = await supabase
    .from("fruitlife_360_report_artifacts")
    .select("external_url,metadata,provider,provider_document_id,report_job_id")
    .eq("session_id", sessionId)
    .eq("artifact_type", "pdf")
    .eq("artifact_status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!artifact?.external_url) {
    return NextResponse.json({ error: "FruitLife report is not ready yet." }, { status: 404 });
  }

  if (artifact.provider === "pdfmonkey" && artifact.provider_document_id) {
    const document = await getPdfMonkeyDocument(artifact.provider_document_id);
    const freshUrl = document.public_share_link ?? document.download_url ?? document.preview_url ?? "";

    if (freshUrl) {
      if (freshUrl !== artifact.external_url) {
        await supabase
          .from("fruitlife_360_report_artifacts")
          .update({
            external_url: freshUrl,
            metadata: {
              ...((artifact.metadata ?? {}) as Record<string, unknown>),
              refreshedAt: new Date().toISOString(),
              refreshedFrom: "fruitlife_report_route",
            },
          })
          .eq("session_id", sessionId)
          .eq("artifact_type", "pdf")
          .eq("provider_document_id", artifact.provider_document_id);

        await supabase
          .from("fruitlife_360_sessions")
          .update({ report_url: freshUrl })
          .eq("id", sessionId);
      }

      return NextResponse.redirect(freshUrl);
    }
  }

  return NextResponse.redirect(artifact.external_url);
}

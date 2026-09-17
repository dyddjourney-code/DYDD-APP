import { NextResponse, type NextRequest } from "next/server";
import { getPdfMonkeyDocument } from "@/lib/pdfmonkey/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const snapshotId = request.nextUrl.searchParams.get("snapshot") ?? "";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !snapshotId) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const { data: snapshot } = await supabase
    .from("assessment_snapshots")
    .select("id,scores,user_id,assessment_participants(user_id)")
    .eq("id", snapshotId)
    .eq("assessment_type", "designpd")
    .maybeSingle();

  const participant = Array.isArray(snapshot?.assessment_participants)
    ? snapshot?.assessment_participants[0]
    : snapshot?.assessment_participants;
  const authorized = snapshot?.user_id === user.id || participant?.user_id === user.id;

  if (!snapshot || !authorized) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const pdfMonkey = (snapshot.scores as { pdfMonkey?: { documentId?: string; providerUrl?: string } })?.pdfMonkey;
  const documentId = pdfMonkey?.documentId;

  if (!documentId) {
    return NextResponse.json({ error: "PDF document is not ready yet." }, { status: 409 });
  }

  const document = await getPdfMonkeyDocument(documentId);
  const url = document.public_share_link ?? document.download_url ?? document.preview_url ?? pdfMonkey?.providerUrl;

  if (!url) {
    return NextResponse.json({ error: "PDF document is not ready yet." }, { status: 409 });
  }

  return NextResponse.redirect(url);
}

import { NextResponse, type NextRequest } from "next/server";
import {
  assessmentLabels,
  displayDate,
  snapshotHighlights,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { getPdfMonkeyDocument } from "@/lib/pdfmonkey/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ReportSnapshot = AssessmentSnapshotSummary & {
  user_id?: string | null;
  assessment_participants?: { user_id: string | null } | { user_id: string | null }[] | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function snapshotPreview(snapshot: AssessmentSnapshotSummary) {
  const label = assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;
  const completedAt = displayDate(snapshot.source_submitted_at ?? snapshot.created_at);
  const highlights = snapshotHighlights(snapshot);
  const rows = highlights.length
    ? highlights
        .map(
          (item) =>
            `<tr><th>${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2">No compact highlights are available for this snapshot yet.</td></tr>`;

  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(label)} Report Preview</title>
  <style>
    body { background: #f7f7f3; color: #24301d; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    main { background: white; border: 1px solid #e3e1d4; border-radius: 18px; margin: 0 auto; max-width: 760px; padding: 28px; }
    .label { color: #4a6239; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 8px 0 8px; }
    p { line-height: 1.6; }
    table { border-collapse: collapse; margin-top: 22px; width: 100%; }
    th, td { border-top: 1px solid #e7e5d8; padding: 12px; text-align: left; vertical-align: top; }
    th { color: #4a6239; width: 34%; }
  </style>
</head>
<body>
  <main>
    <div class="label">Discover Your Divine Design</div>
    <h1>${escapeHtml(label)} Report Preview</h1>
    <p>Completed: ${escapeHtml(completedAt)}</p>
    <p>This is the saved app snapshot for this result. A generated PDF can be connected later when the report artifact is available.</p>
    <table>${rows}</table>
  </main>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: NextRequest) {
  const snapshotId = request.nextUrl.searchParams.get("snapshot") ?? "";
  const reviewParams = {
    key: request.nextUrl.searchParams.get("key"),
    review: request.nextUrl.searchParams.get("review"),
  };

  if (!snapshotId) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  let snapshot: ReportSnapshot | null = null;

  if (isOwnerPreviewRequest(reviewParams)) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data } = await supabaseAdmin
      .from("assessment_snapshots")
      .select("id,assessment_type,created_at,scores,source,source_submitted_at,user_id,assessment_participants(user_id)")
      .eq("id", snapshotId)
      .eq("assessment_type", "designid")
      .maybeSingle();
    snapshot = data as ReportSnapshot | null;
  } else {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const { data } = await supabase
      .from("assessment_snapshots")
      .select("id,assessment_type,created_at,scores,source,source_submitted_at,user_id,assessment_participants(user_id)")
      .eq("id", snapshotId)
      .eq("assessment_type", "designid")
      .maybeSingle();

    const participant = Array.isArray(data?.assessment_participants)
      ? data?.assessment_participants[0]
      : data?.assessment_participants;
    const authorized = data?.user_id === user.id || participant?.user_id === user.id;

    if (authorized) {
      snapshot = data as ReportSnapshot | null;
    }
  }

  if (!snapshot) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const pdfMonkey = (snapshot.scores as { pdfMonkey?: { documentId?: string; providerUrl?: string } })?.pdfMonkey;
  const documentId = pdfMonkey?.documentId;

  if (!documentId) {
    return snapshotPreview(snapshot);
  }

  const document = await getPdfMonkeyDocument(documentId);
  const url = document.public_share_link ?? document.download_url ?? document.preview_url ?? pdfMonkey?.providerUrl;

  if (!url) {
    return snapshotPreview(snapshot);
  }

  return NextResponse.redirect(url);
}

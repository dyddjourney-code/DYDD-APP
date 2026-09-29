import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
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

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

type SpiritualGiftsPdfMetadata = {
  documentId?: string;
  providerUrl?: string;
};

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
  <title>${escapeHtml(label)} Saved Snapshot</title>
  <style>
    body { background: #f7f7f3; color: #24301d; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    main { background: white; border: 1px solid #e3e1d4; border-radius: 18px; margin: 0 auto; max-width: 820px; padding: 30px; }
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
    <h1>${escapeHtml(label)} Saved Snapshot</h1>
    <p>Completed: ${escapeHtml(completedAt)}</p>
    <p>This result was saved from an older or synced Spiritual Gifts record. A full generated PDF was not attached to this snapshot, but the saved result data is available here for owner review.</p>
    <table>${rows}</table>
  </main>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function getAuthorizedSnapshot(request: NextRequest, snapshotId: string) {
  const reviewParams = {
    key: request.nextUrl.searchParams.get("key"),
    review: request.nextUrl.searchParams.get("review"),
  };

  if (isOwnerPreviewRequest(reviewParams)) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data } = await supabaseAdmin
      .from("assessment_snapshots")
      .select("id,assessment_type,created_at,scores,source,source_submitted_at,user_id,assessment_participants(user_id)")
      .eq("id", snapshotId)
      .eq("assessment_type", "spiritual_gifts")
      .maybeSingle();

    return data as ReportSnapshot | null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("assessment_snapshots")
    .select("id,assessment_type,created_at,scores,source,source_submitted_at,user_id,assessment_participants(user_id)")
    .eq("id", snapshotId)
    .eq("assessment_type", "spiritual_gifts")
    .maybeSingle();

  const participant = Array.isArray(data?.assessment_participants)
    ? data?.assessment_participants[0]
    : data?.assessment_participants;
  const authorized = data?.user_id === user.id || participant?.user_id === user.id;

  return authorized ? (data as ReportSnapshot | null) : null;
}

export async function GET(request: NextRequest) {
  const snapshotId = request.nextUrl.searchParams.get("snapshot") ?? "";
  const sessionId = request.nextUrl.searchParams.get("session") ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (snapshotId) {
    const snapshot = await getAuthorizedSnapshot(request, snapshotId);

    if (!snapshot) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const pdfMonkey = (snapshot.scores as { pdfMonkey?: SpiritualGiftsPdfMetadata })?.pdfMonkey;
    const documentId = pdfMonkey?.documentId;

    if (documentId) {
      const document = await getPdfMonkeyDocument(documentId);
      const url =
        document.public_share_link ??
        document.download_url ??
        document.preview_url ??
        pdfMonkey?.providerUrl;

      if (url) {
        return NextResponse.redirect(url);
      }
    }

    if (pdfMonkey?.providerUrl) {
      return NextResponse.redirect(pdfMonkey.providerUrl);
    }

    return snapshotPreview(snapshot);
  }

  if (!sessionId || !token) {
    return NextResponse.json({ error: "Missing Spiritual Gifts report token." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: session } = await supabase
    .from("spiritual_gifts_sessions")
    .select("id,intake_token_hash,metadata")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session || session.intake_token_hash !== hashToken(token)) {
    return NextResponse.json({ error: "This Spiritual Gifts report link is not valid." }, { status: 404 });
  }

  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const pdfMonkey = (metadata.pdfMonkey ?? {}) as SpiritualGiftsPdfMetadata;

  if (!pdfMonkey.providerUrl && !pdfMonkey.documentId) {
    return NextResponse.json({ error: "The Spiritual Gifts PDF report is not ready yet." }, { status: 404 });
  }

  if (pdfMonkey.documentId) {
    const document = await getPdfMonkeyDocument(pdfMonkey.documentId);
    const freshUrl = document.public_share_link ?? document.download_url ?? document.preview_url ?? "";

    if (freshUrl) {
      if (freshUrl !== pdfMonkey.providerUrl) {
        await supabase
          .from("spiritual_gifts_sessions")
          .update({
            metadata: {
              ...metadata,
              pdfMonkey: {
                ...pdfMonkey,
                providerUrl: freshUrl,
                refreshedAt: new Date().toISOString(),
                status: document.status ?? null,
              },
            },
          })
          .eq("id", sessionId);
      }

      return NextResponse.redirect(freshUrl);
    }
  }

  return NextResponse.redirect(String(pdfMonkey.providerUrl));
}

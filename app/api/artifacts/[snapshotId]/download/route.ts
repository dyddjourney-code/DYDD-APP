import { NextResponse, type NextRequest } from "next/server";
import {
  assessmentLabels,
  displayDate,
  getAssessmentSnapshotsForUser,
  getAssessmentSnapshotsForEmail,
  snapshotHighlights,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  isHeatherReviewRequest,
} from "@/lib/review/heather";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function compactValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
}

function scoreObject(snapshot: AssessmentSnapshotSummary, key: string) {
  const value = snapshot.scores?.[key];
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function snapshotSections(snapshot: AssessmentSnapshotSummary) {
  return [
    scoreObject(snapshot, "summary"),
    scoreObject(snapshot, "profileLanguage"),
    scoreObject(snapshot, "scores"),
    snapshot.scores ?? {},
  ];
}

function firstSnapshotValue(snapshot: AssessmentSnapshotSummary, keys: string[]) {
  for (const key of keys) {
    for (const section of snapshotSections(snapshot)) {
      const value = compactValue(section[key]);
      if (value) return value;
    }
  }

  return "";
}

function spiritualGiftRank(snapshot: AssessmentSnapshotSummary, rank: number) {
  const topGifts = snapshot.scores?.topGifts;
  const gift = Array.isArray(topGifts) ? topGifts[rank - 1] : null;

  if (typeof gift === "object" && gift !== null) {
    const data = gift as Record<string, unknown>;
    const label = compactValue(data.label) || compactValue(data.name);
    const score = compactValue(data.score) || compactValue(data.value);

    if (label) return { label, score };
  }

  const label = firstSnapshotValue(snapshot, [
    `Top${rank}_Name`,
    `Top_${rank}_Name`,
    `Top${rank}`,
  ]);
  const score = firstSnapshotValue(snapshot, [
    `Top${rank}_Score`,
    `Top_${rank}_Score`,
    `Top${rank}_Pct`,
    `Top_${rank}_Pct`,
  ]);

  return label ? { label, score } : null;
}

function snapshotReportHref(snapshot: AssessmentSnapshotSummary) {
  const direct = compactValue(snapshot.scores?.reportAccessUrl);
  if (direct) return direct;

  const pdfMonkey = scoreObject(snapshot, "pdfMonkey");
  const providerUrl = compactValue(pdfMonkey.providerUrl);
  if (providerUrl) return providerUrl;

  if (snapshot.assessment_type === "designid") {
    return `/designid/report?snapshot=${encodeURIComponent(snapshot.id)}`;
  }

  if (snapshot.assessment_type === "designpd") {
    return `/designpd/report?snapshot=${encodeURIComponent(snapshot.id)}`;
  }

  if (snapshot.assessment_type === "spiritual_gifts") {
    return `/spiritual-gifts/report?snapshot=${encodeURIComponent(snapshot.id)}`;
  }

  return "";
}

function visualArtifact(snapshot: AssessmentSnapshotSummary) {
  const label =
    assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;
  const completedAt = displayDate(
    snapshot.source_submitted_at ?? snapshot.created_at,
  );
  const highlights = snapshotHighlights(snapshot);
  const reportHref = snapshotReportHref(snapshot);
  const giftRows =
    snapshot.assessment_type === "spiritual_gifts"
      ? [1, 2, 3, 4, 5]
          .map((rank) => {
            const gift = spiritualGiftRank(snapshot, rank);
            if (!gift) return "";
            const score = Number(gift.score);
            const width = Number.isFinite(score)
              ? Math.max(8, Math.min(100, (score / 100) * 100))
              : 20;

            return `<div class="gift-row">
              <div><strong>${rank}. ${escapeHtml(gift.label)}</strong><small>${escapeHtml(gift.score || "Saved")}</small></div>
              <span aria-hidden="true"><i style="width:${width}%"></i></span>
            </div>`;
          })
          .join("")
      : "";
  const highlightRows = highlights.length
    ? highlights
        .map(
          (item) =>
            `<tr><th>${escapeHtml(item.label)}</th><td>${escapeHtml(item.value)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2">No compact highlights are available for this snapshot yet.</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(label)} Snapshot</title>
  <style>
    :root { color-scheme: light; --ink:#172116; --muted:#667263; --paper:#fbfaf4; --line:#e4dccb; --green:#476b42; --dark:#243f27; --gold:#b88a43; }
    body { margin:0; background:linear-gradient(180deg,#fbfaf4,#f4f1e8); color:var(--ink); font-family:Aptos,Segoe UI,Arial,sans-serif; padding:34px; }
    main { max-width:920px; margin:0 auto; background:white; border:1px solid var(--line); box-shadow:0 24px 70px rgba(70,58,35,.12); }
    header { background:linear-gradient(135deg,var(--dark),var(--green)); color:#fffaf0; padding:30px; }
    .label { color:#f6d36d; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
    h1 { margin:8px 0 8px; font-size:38px; line-height:1; }
    header p { margin:0; color:rgba(255,250,240,.86); }
    section { padding:26px 30px; border-top:1px solid var(--line); }
    .meta { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
    .meta div { background:#fbfaf4; border:1px solid var(--line); padding:14px; }
    .meta small, .gift-row small { display:block; color:var(--muted); font-weight:800; margin-top:4px; }
    h2 { color:var(--dark); margin:0 0 16px; font-size:22px; }
    .gift-list { display:grid; gap:10px; }
    .gift-row { display:grid; grid-template-columns:minmax(0,1fr) minmax(160px,280px); gap:18px; align-items:center; padding:12px 0; border-top:1px solid rgba(36,63,39,.1); }
    .gift-row:first-child { border-top:0; }
    .gift-row span { display:block; height:12px; background:#edf1e8; border-radius:999px; overflow:hidden; }
    .gift-row i { display:block; height:100%; background:linear-gradient(90deg,var(--green),var(--gold)); border-radius:999px; }
    table { width:100%; border-collapse:collapse; }
    th,td { border-top:1px solid rgba(36,63,39,.12); padding:12px; text-align:left; vertical-align:top; }
    th { color:var(--green); width:34%; }
    a { color:var(--dark); font-weight:900; }
    @media print { body { background:white; padding:0; } main { box-shadow:none; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="label">Discover Your Divine Design</div>
      <h1>${escapeHtml(label)} Snapshot</h1>
      <p>Owner-ready summary for quick review, group comparison, and participant support.</p>
    </header>
    <section class="meta">
      <div><strong>Completed</strong><small>${escapeHtml(completedAt)}</small></div>
      <div><strong>Source</strong><small>${escapeHtml(snapshot.source ?? "DYDD source")}</small></div>
      <div><strong>Snapshot ID</strong><small>${escapeHtml(snapshot.id.slice(0, 8))}</small></div>
    </section>
    ${
      giftRows
        ? `<section><h2>Top Spiritual Gifts</h2><div class="gift-list">${giftRows}</div></section>`
        : ""
    }
    <section>
      <h2>Saved Highlights</h2>
      <table>${highlightRows}</table>
    </section>
    ${
      reportHref
        ? `<section><h2>Full Report Link</h2><p><a href="${escapeHtml(reportHref)}">${escapeHtml(reportHref)}</a></p></section>`
        : ""
    }
  </main>
</body>
</html>`;
}

function downloadResponse(snapshot: AssessmentSnapshotSummary) {
  const label =
    assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;
  const filename = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-snapshot-${snapshot.id.slice(0, 8)}.html`;

  return new NextResponse(visualArtifact(snapshot), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

async function findAuthorizedSnapshot(
  request: NextRequest,
  snapshotId: string,
) {
  const reviewParams = {
    key: request.nextUrl.searchParams.get("key") ?? undefined,
    review: request.nextUrl.searchParams.get("review") ?? undefined,
  };

  if (isHeatherReviewRequest(reviewParams)) {
    const report = await getHeatherReviewReport(reviewParams);
    return report?.all.find((snapshot) => snapshot.id === snapshotId) ?? null;
  }

  if (isOwnerPreviewRequest(reviewParams)) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data } = await supabaseAdmin
      .from("assessment_snapshots")
      .select("id,assessment_type,created_at,scores,source,source_submitted_at")
      .eq("id", snapshotId)
      .maybeSingle();

    return data as AssessmentSnapshotSummary | null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const report = await getAssessmentSnapshotsForUser(
    user.id,
    normalizeEmail(user.email),
  );

  return report.all.find((snapshot) => snapshot.id === snapshotId) ?? null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> },
) {
  const params = (await context.params) as { snapshotId?: string };
  const snapshotId = params.snapshotId ?? "";
  const snapshot = await findAuthorizedSnapshot(request, snapshotId);

  if (!snapshot) {
    return NextResponse.json({ error: "Artifact not found." }, { status: 404 });
  }

  return downloadResponse(snapshot);
}

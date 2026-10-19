import { NextResponse, type NextRequest } from "next/server";
import { nativeDesignPdRecoveryPayload } from "@/lib/assessments/native-designpd-recovery";
import {
  assessmentLabels,
  displayDate,
  getAssessmentSnapshotsForUser,
  snapshotHighlights,
  type AssessmentSnapshotSummary,
} from "@/lib/assessments/student-context";
import {
  createPdfMonkeyDocument,
  getPdfMonkeyDocument,
} from "@/lib/pdfmonkey/client";
import { normalizeEmail } from "@/lib/identity/email";
import {
  getHeatherReviewReport,
  getNewReviewReport,
  isNewReviewRequest,
  isHeatherReviewRequest,
} from "@/lib/review/heather";
import { isOwnerPreviewRequest } from "@/lib/owner-preview";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveReportPdf,
  storedReportUrl,
  type StoredReport,
  reportBucket,
} from "@/lib/assessments/report-storage";
import {
  object,
  hasFullReport,
  recoveryReport,
  sourceShadow,
} from "@/lib/assessments/report-recovery";
export const runtime = "nodejs";
export const maxDuration = 120;
const headers = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "same-origin",
};
const html = (v: unknown) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function value(snapshot: AssessmentSnapshotSummary, ...keys: string[]) {
  for (const key of keys)
    for (const section of [
      object(snapshot.scores.summary),
      object(snapshot.scores.profileLanguage),
      object(snapshot.scores.scores),
      object(snapshot.scores.reportPayload),
      snapshot.scores,
    ]) {
      const v = section[key] ?? section[key.toLowerCase()];
      if (v !== undefined && v !== null && v !== "") return String(v);
    }
  return "";
}
function layout(title: string, content: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${html(title)}</title><style>
  *{box-sizing:border-box}body{margin:0;padding:24px;background:#f8f6ee;color:#243f27;font:17px/1.5 system-ui,sans-serif}main{max-width:900px;margin:auto;background:#fff;border:1px solid #ded8c8;border-radius:12px;overflow:hidden}header{padding:28px;background:#243f27;color:#fff9ed}header p{margin:4px 0}h1{font-size:clamp(25px,5vw,38px);margin:6px 0}h2{font-size:23px}section{padding:24px;border-top:1px solid #e5decc}a,button{display:inline-block;color:#243f27;font:inherit;font-weight:700;margin:6px 10px 6px 0}button{cursor:pointer;padding:12px 18px;background:#eeeadd;border:1px solid #c6c0af;border-radius:6px}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.card{padding:16px;background:#f8f6ee;border:1px solid #e5decc}.card small{display:block;color:#64715d}.card strong{font-size:20px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:12px;border-bottom:1px solid #e5decc;overflow-wrap:anywhere}.gift{padding:15px 0;border-bottom:1px solid #e5decc}.gift p{margin:6px 0}form{display:inline}.notice{background:#faf7e8}@media(max-width:480px){body{padding:10px}section,header{padding:18px}td,th{padding:8px}.summary{grid-template-columns:1fr 1fr}}@media print{body{padding:0;background:white}.actions{display:none}main{border:0}header{color:#243f27;background:white}}
  </style></head><body><main><header><p>Discover Your Divine Design</p><h1>${html(title)}</h1></header>${content}</main></body></html>`;
}
function snapshotHtml(snapshot: AssessmentSnapshotSummary, url: URL) {
  const type = snapshot.assessment_type,
    label = assessmentLabels[type] ?? type;
  let content = "";
  if (type === "designid") {
    const strip = [
      ["Primary", value(snapshot, "Primary")],
      ["Secondary", value(snapshot, "Secondary")],
      ["Integrative", value(snapshot, "Integrative_Reflection")],
      ["Shadow", sourceShadow(snapshot)],
    ]
      .filter(([, v]) => v)
      .map(
        ([k, v]) =>
          `<div class="card"><small>${html(k)}</small><strong>${html(v)}</strong></div>`,
      )
      .join("");
    const rows = ["Architect", "Artisan", "Shepherd", "Steward"]
      .map((r) => {
        const points = value(snapshot, `${r}_Pts`, `${r}_Points`);
        return `<tr><th>${r}</th><td>${points && Number.isFinite(Number(points)) ? Math.round(Number(points)) : "—"}</td><td>${html(value(snapshot, `Band_${r}`))}</td></tr>`;
      })
      .join("");
    content = `<section><div class="summary">${strip}</div><h2>Your reflections</h2><table><thead><tr><th>Reflection</th><th>Score</th><th>Capacity</th></tr></thead><tbody>${rows}</tbody></table></section>`;
  } else if (type === "spiritual_gifts") {
    const top = snapshot.scores.topGifts;
    const gifts = [1, 2, 3, 4, 5]
      .map((rank) => {
        const gift = Array.isArray(top) ? object(top[rank - 1]) : {};
        const name = gift.label ?? value(snapshot, `Top${rank}_Name`);
        const definition =
          gift.definition ?? value(snapshot, `Top${rank}_Definition`);
        return name
          ? `<div class="gift"><strong>${rank}. ${html(name)}</strong>${definition ? `<p>${html(definition)}</p>` : ""}</div>`
          : "";
      })
      .join("");
    content = `<section><h2>Top five spiritual gifts</h2>${gifts}</section>`;
  } else if (type === "designpd") {
    content = `<section><h2>How you plan, decide, and act</h2>${["Plan", "Decide", "Do"].map((axis) => `<div class="gift"><h3>${axis}</h3><strong>${html(value(snapshot, `${axis}_Tendency`)).replaceAll("_", " ")}</strong><p>Score: <strong>${html(value(snapshot, `${axis}_Score`) || (object(snapshot.scores.axisScores)[axis.toLowerCase()] ?? "Not retained"))}</strong></p><p>${html(value(snapshot, `${axis}_Descriptor`, `${axis.toLowerCase()}_descriptor`, `${axis}_Overview_Sentence`))}</p></div>`).join("")}</section>`;
  } else
    content = `<section><h2>Saved highlights</h2><table>${snapshotHighlights(
      snapshot,
    )
      .map((x) => `<tr><th>${html(x.label)}</th><td>${html(x.value)}</td></tr>`)
      .join("")}</table></section>`;
  const pdfUrl = new URL(url);
  pdfUrl.searchParams.delete("view");
  pdfUrl.searchParams.set("download", "1");
  return layout(
    `${label} Snapshot`,
    `<section><p>Completed ${html(displayDate(snapshot.source_submitted_at ?? snapshot.created_at))}</p><p>This is a quick summary of your saved assessment, not your full PDF report.</p><div class="actions">${hasFullReport(snapshot) ? `<a href="${html(pdfUrl.pathname + pdfUrl.search)}" target="_blank" rel="noopener noreferrer">Download PDF</a>` : `<p>Snapshot only — original PDF unavailable. Complete report data was not retained for this historical record.</p>`}</div></section>${content}`,
  );
}
function recoveryHtml(
  snapshot: AssessmentSnapshotSummary,
  url: URL,
  message = "",
  autoStart = false,
) {
  const label =
    assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;
  const view = new URL(url);
  view.searchParams.set("view", "snapshot");
  const canRecover = Boolean(recoveryReport(snapshot));
  return layout(
    `${label} PDF Report`,
    `<section><p role="status">${html(message || (canRecover ? "Preparing your PDF from this assessment’s saved report data…" : "The original PDF is not available for this historical record."))}</p>${canRecover ? `<p>Your saved scores will not change. No email will be sent.</p><form method="post" action="${html(url.pathname + url.search)}"><button type="submit">${message ? "Retry download" : "Download PDF"}</button></form>${autoStart && !message ? `<script>const form=document.querySelector('form');form.querySelector('button').textContent='Preparing PDF…';form.querySelector('button').disabled=true;form.requestSubmit();</script><noscript>Select Download PDF to continue.</noscript>` : ""}` : `<p>Snapshot only — original PDF unavailable. Complete source data was not retained, so we cannot recreate this report accurately.</p>`}<p><a href="${html(view.pathname + view.search)}" target="_blank" rel="noopener noreferrer">View snapshot</a></p></section>`,
  );
}
async function findSnapshot(
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
  if (isNewReviewRequest(reviewParams)) {
    const report = await getNewReviewReport(reviewParams);
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
/** Supplement legacy FruitLife snapshots with their owned session’s retained PDF. */
async function findAuthorizedSnapshot(request: NextRequest, snapshotId: string) {
  const snapshot = await findSnapshot(request, snapshotId);
  if (!snapshot) return null;
  const admin = createSupabaseAdminClient();
  if (snapshot.assessment_type === "designpd" && snapshot.scores.channel === "native_app" &&
      !snapshot.scores.reportArtifact && !Object.keys(object(snapshot.scores.reportPayload)).length &&
      typeof snapshot.scores.designIdSnapshotId === "string") {
    const { data: linked } = await admin.from("assessment_snapshots")
      .select("id,participant_id,assessment_type,created_at,scores,source,source_submitted_at")
      .in("id", [snapshot.id, snapshot.scores.designIdSnapshotId]);
    const destination = linked?.find(row => row.id === snapshot.id);
    const source = linked?.find(row => row.id === snapshot.scores.designIdSnapshotId);
    // A saved foreign source reference must never read another participant’s result.
    if (source && destination?.participant_id && destination.participant_id === source.participant_id) {
      const payload = nativeDesignPdRecoveryPayload(snapshot, source);
      if (payload) return { ...snapshot, scores: { ...snapshot.scores,
        reportPayload: payload, reportPayloadFormat: "template-v1" } };
    }
  }
  if (snapshot.assessment_type !== "fruit_360") return snapshot;
  const { data: session } = await admin.from("fruitlife_360_sessions")
    .select("id").eq("report_snapshot_id", snapshot.id).maybeSingle();
  if (!session) return snapshot;
  const { data: artifact } = await admin.from("fruitlife_360_report_artifacts")
    .select("external_url,metadata,provider_document_id")
    .eq("session_id", session.id).eq("artifact_type", "pdf").eq("artifact_status", "ready")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!artifact) return snapshot;
  const saved = object(snapshot.scores.pdfMonkey);
  return { ...snapshot, scores: { ...snapshot.scores, pdfMonkey: {
    ...saved,
    storage: saved.storage ?? object(artifact.metadata).storage,
    documentId: saved.documentId || artifact.provider_document_id,
    providerUrl: saved.providerUrl || artifact.external_url,
  } } };
}
async function persist(
  snapshot: AssessmentSnapshotSummary,
  update: Record<string, unknown>,
) {
  const s = createSupabaseAdminClient();
  const { data, error } = await s
    .from("assessment_snapshots")
    .select("scores")
    .eq("id", snapshot.id)
    .single();
  if (error) throw Error("Could not read the saved report record.");
  const result = await s
    .from("assessment_snapshots")
    .update({ scores: { ...data.scores, ...update } })
    .eq("id", snapshot.id);
  if (result.error) throw Error("Could not attach the report to Field Kit.");
}
async function pdfResponse(
  snapshot: AssessmentSnapshotSummary,
  request: NextRequest,
) {
  const stored = object(
    snapshot.scores.reportArtifact ?? object(snapshot.scores.pdfMonkey).storage,
  );
  if (stored.path === `${snapshot.assessment_type}/${snapshot.id}/report.pdf`) {
    const url = await storedReportUrl(
      stored as StoredReport,
      request.nextUrl.searchParams.get("download") === "1",
    );
    if (url) return NextResponse.redirect(url, { headers });
  }
  const pdf = object(snapshot.scores.pdfMonkey);
  let providerUrl = String(pdf.providerUrl ?? "");
  if (pdf.documentId)
    try {
      const doc = await getPdfMonkeyDocument(pdf.documentId);
      providerUrl = doc.download_url ?? doc.public_share_link ?? providerUrl;
    } catch {
      /* Try the saved provider link, then show honest recovery. */
    }
  if (providerUrl)
    try {
      const reportArtifact = await archiveReportPdf(
        providerUrl,
        `${snapshot.assessment_type}/${snapshot.id}`,
        String(pdf.filename ?? `${snapshot.assessment_type}-report.pdf`),
      );
      await persist(snapshot, { reportArtifact });
      const url = await storedReportUrl(
        reportArtifact,
        request.nextUrl.searchParams.get("download") === "1",
      );
      if (url) return NextResponse.redirect(url, { headers });
    } catch {
      /* An expired provider URL must not be called a working report. */
    }
  return new NextResponse(recoveryHtml(snapshot, request.nextUrl, "", true), {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      snapshotId?: string;
    }>;
  },
) {
  const { snapshotId = "" } = await context.params;
  const snapshot = await findAuthorizedSnapshot(request, snapshotId);
  if (!snapshot)
    return NextResponse.json(
      { error: "Artifact not found." },
      { status: 404, headers },
    );
  if (request.nextUrl.searchParams.get("view") === "snapshot")
    return new NextResponse(snapshotHtml(snapshot, request.nextUrl), {
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  return pdfResponse(snapshot, request);
}
export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      snapshotId?: string;
    }>;
  },
) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Open this report from your Field Kit." },
      { status: 403, headers },
    );
  const { snapshotId = "" } = await context.params;
  const snapshot = await findAuthorizedSnapshot(request, snapshotId);
  if (!snapshot)
    return NextResponse.json(
      { error: "Artifact not found." },
      { status: 404, headers },
    );
  const archived = object(snapshot.scores.reportArtifact ?? object(snapshot.scores.pdfMonkey).storage);
  if (archived.path === `${snapshot.assessment_type}/${snapshot.id}/report.pdf`) {
    const url = await storedReportUrl(archived as StoredReport, true);
    if (url) return NextResponse.redirect(url, { status: 303, headers });
  }
  const report = recoveryReport(snapshot);
  if (report) {
    const { data: identity } = await createSupabaseAdminClient()
      .from("assessment_snapshots")
      .select("assessment_participants(display_name,normalized_email)")
      .eq("id", snapshot.id)
      .single();
    const participant = Array.isArray(identity?.assessment_participants)
      ? identity.assessment_participants[0]
      : identity?.assessment_participants;
    const name = participant?.display_name ?? "",
      email = participant?.normalized_email ?? "";
    if (snapshot.assessment_type === "designid") {
      report.payload.Name ||= name;
      report.payload.Email ||= email;
    }
    if (snapshot.assessment_type === "spiritual_gifts") {
      report.payload.Full_Name ||= name;
      report.payload.Email_Address ||= email;
    }
    if (snapshot.assessment_type === "designpd") {
      report.payload.name ||= name;
      report.payload.email ||= email;
    }
  }
  if (!report)
    return new NextResponse(recoveryHtml(snapshot, request.nextUrl), {
      status: 422,
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  const s = createSupabaseAdminClient(),
    lockPath = `locks/${snapshot.id}.json`;
  // Storage's create-if-absent prevents simultaneous clicks creating duplicate PDFs.
  const lease = await s.storage
    .from(reportBucket)
    .upload(
      lockPath,
      Buffer.from(JSON.stringify({ startedAt: new Date().toISOString() })),
      { contentType: "application/json", upsert: false },
    );
  if (lease.error)
    return new NextResponse(
      recoveryHtml(
        snapshot,
        request.nextUrl,
        "This report is already being prepared. Wait a moment, then reload this page.",
      ),
      {
        status: 409,
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      },
    );
  try {
    let documentId = String(
      object(snapshot.scores.pdfRecovery).documentId ?? "",
    );
    let document = documentId
      ? await getPdfMonkeyDocument(documentId).catch(() => null)
      : null;
    if (!document || document.status === "failure" || document.status === "failed") {
      document = await createPdfMonkeyDocument({
        templateId: report.templateId,
        payload: report.payload,
        filename: `${assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type} Report.pdf`,
      });
      documentId = document.id;
      await persist(snapshot, {
        pdfRecovery: { documentId, startedAt: new Date().toISOString() },
      });
    }
    for (
      let i = 0;
      i < 45 &&
      ["pending", "generating", "draft"].includes(String(document.status));
      i++
    ) {
      await new Promise((r) => setTimeout(r, 1500));
      document = await getPdfMonkeyDocument(documentId);
    }
    const url = document.download_url ?? document.public_share_link;
    if (!url || !["ready", "success"].includes(String(document.status)))
      throw Error(
        "The PDF provider has not finished preparing this report. Please try again shortly.",
      );
    const reportArtifact = await archiveReportPdf(
      url,
      `${snapshot.assessment_type}/${snapshot.id}`,
      `${assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type} Report.pdf`,
    );
    await persist(snapshot, {
      reportArtifact,
      pdfMonkey: {
        ...object(snapshot.scores.pdfMonkey),
        documentId,
        providerUrl: url,
        status: document.status,
      },
      pdfRecovery: {
        documentId,
        completedAt: new Date().toISOString(),
        source: "saved-assessment-report-data",
      },
    });
    const target = new URL(request.url);
    target.searchParams.delete("view");
    target.searchParams.set("download", "1");
    return NextResponse.redirect(target, { status: 303, headers });
  } catch (error) {
    return new NextResponse(
      recoveryHtml(
        snapshot,
        request.nextUrl,
        error instanceof Error
          ? error.message
          : "Could not prepare this report. Your saved assessment is safe.",
      ),
      {
        status: 502,
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      },
    );
  } finally {
    await s.storage.from(reportBucket).remove([lockPath]);
  }
}

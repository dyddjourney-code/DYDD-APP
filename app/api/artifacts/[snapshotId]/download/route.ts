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
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function plainTextArtifact(snapshot: AssessmentSnapshotSummary) {
  const label =
    assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;
  const completedAt = displayDate(
    snapshot.source_submitted_at ?? snapshot.created_at,
  );
  const highlights = snapshotHighlights(snapshot);
  const lines = [
    `${label} Report`,
    `Completed: ${completedAt}`,
    `Source: ${snapshot.source ?? "DYDD source"}`,
    "",
    "Preview download",
    "This staged file represents the completed artifact download slot. The final production version should stream the generated PDF/report file for this assessment.",
    "",
    "Highlights",
    ...(highlights.length
      ? highlights.map((item) => `- ${item.label}: ${item.value}`)
      : ["- No compact highlights are available for this snapshot."]),
    "",
  ];

  return lines.join("\n");
}

function downloadResponse(snapshot: AssessmentSnapshotSummary) {
  const label =
    assessmentLabels[snapshot.assessment_type] ?? snapshot.assessment_type;
  const filename = `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report-preview.txt`;

  return new NextResponse(plainTextArtifact(snapshot), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/plain; charset=utf-8",
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

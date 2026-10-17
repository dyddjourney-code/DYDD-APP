import { NextRequest, NextResponse } from "next/server";
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
  return artifactReport(new NextRequest(url, { headers: request.headers }), {
    params: Promise.resolve({ snapshotId }),
  });
}

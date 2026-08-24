import { NextResponse, type NextRequest } from "next/server";
import { processFruitLifeReportJobs } from "@/lib/fruitlife360/report-worker";

export const runtime = "nodejs";
export const maxDuration = 300;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice("bearer ".length).trim();
}

function isAuthorized(request: NextRequest) {
  const token = getBearerToken(request);
  const cronSecret = process.env.CRON_SECRET;
  const syncSecret = process.env.DYDD_ASSESSMENT_SYNC_SECRET;

  return Boolean(token && (token === cronSecret || token === syncSecret));
}

function parseLimit(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");
  if (!rawLimit) return 3;

  const limit = Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 1 || limit > 10) {
    throw new Error("limit must be between 1 and 10.");
  }

  return limit;
}

async function handleReportWorker(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processFruitLifeReportJobs({
      dryRun: request.nextUrl.searchParams.get("dryRun") === "1",
      limit: parseLimit(request),
    });

    return NextResponse.json({
      ...result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown FruitLife report worker error.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleReportWorker(request);
}

export async function POST(request: NextRequest) {
  return handleReportWorker(request);
}

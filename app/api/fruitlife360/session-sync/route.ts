import { NextResponse, type NextRequest } from "next/server";

import { syncFruitLifeSessionsFromSnapshots } from "@/lib/fruitlife360/session-sync";

export const runtime = "nodejs";

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
  if (!rawLimit) return 100;

  const limit = Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 1 || limit > 1000) {
    throw new Error("limit must be a number from 1 to 1000.");
  }

  return limit;
}

async function handleSessionSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let limit: number;

  try {
    limit = parseLimit(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid sync request." },
      { status: 400 },
    );
  }

  const apply = request.nextUrl.searchParams.get("dryRun") !== "1";

  try {
    const result = await syncFruitLifeSessionsFromSnapshots({ apply, limit });
    return NextResponse.json(result, { status: result.errors.length > 0 ? 207 : 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown FruitLife session sync error.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSessionSync(request);
}

export async function POST(request: NextRequest) {
  return handleSessionSync(request);
}

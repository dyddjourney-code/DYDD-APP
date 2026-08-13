import { NextResponse, type NextRequest } from "next/server";

import { ingestAssessmentSnapshot } from "@/lib/assessments/snapshot-ingest";
import {
  assessmentSourceConfigs,
  buildSourcePayloads,
  type AssessmentSourceName,
  type AssessmentSyncResult,
} from "@/lib/assessments/sheet-sync";

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

function parseSources(request: NextRequest): AssessmentSourceName[] {
  const sourceParam = request.nextUrl.searchParams.get("source");
  const defaultSources = Object.keys(assessmentSourceConfigs) as AssessmentSourceName[];

  if (!sourceParam) return defaultSources;

  const requested = sourceParam
    .split(",")
    .map((source) => source.trim())
    .filter(Boolean);

  const invalid = requested.filter(
    (source) => !assessmentSourceConfigs[source as AssessmentSourceName],
  );

  if (invalid.length > 0) {
    throw new Error(`Unknown source: ${invalid.join(", ")}`);
  }

  return requested as AssessmentSourceName[];
}

function parseLimit(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");
  if (!rawLimit) return Number.POSITIVE_INFINITY;

  const limit = Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error("limit must be a positive number.");
  }

  return limit;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sources: AssessmentSourceName[];
  let limit: number;

  try {
    sources = parseSources(request);
    limit = parseLimit(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid sync request." },
      { status: 400 },
    );
  }

  const apply = request.nextUrl.searchParams.get("dryRun") !== "1";
  const syncBatchId = `cron-${new Date().toISOString()}`;
  const results: AssessmentSyncResult[] = [];

  for (const source of sources) {
    const errors: AssessmentSyncResult["errors"] = [];

    try {
      const { payloads, rawRows } = await buildSourcePayloads({
        limit,
        source,
        syncBatchId,
      });

      if (apply) {
        for (const payload of payloads) {
          try {
            await ingestAssessmentSnapshot(payload);
          } catch (error) {
            errors.push({
              message: error instanceof Error ? error.message : "Unknown ingest error.",
              source,
              sourceResponseId: payload.sourceResponseId,
            });
          }
        }
      }

      results.push({
        applied: apply,
        errors,
        payloads: payloads.length,
        rawRows,
        source,
      });
    } catch (error) {
      results.push({
        applied: apply,
        errors: [
          {
            message: error instanceof Error ? error.message : "Unknown source sync error.",
            source,
          },
        ],
        payloads: 0,
        rawRows: 0,
        source,
      });
    }
  }

  const errorCount = results.reduce((total, result) => total + result.errors.length, 0);

  return NextResponse.json(
    {
      errorCount,
      generatedAt: new Date().toISOString(),
      results,
      syncBatchId,
    },
    { status: errorCount > 0 ? 207 : 200 },
  );
}

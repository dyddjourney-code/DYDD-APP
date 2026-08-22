import { NextResponse, type NextRequest } from "next/server";
import { buildFruitLifePayloadForSession } from "@/lib/fruitlife360/payload";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

async function handlePayloadBuild(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId")?.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const supabase = createSupabaseAdminClient();

  try {
    const payload = await buildFruitLifePayloadForSession(supabase, sessionId);

    if (!dryRun) {
      const { data: job, error: jobError } = await supabase
        .from("fruitlife_360_report_jobs")
        .insert({
          job_status: "queued",
          job_type: "fruitlife_360_payload",
          metadata: { trigger: "protected_payload_endpoint" },
          payload,
          session_id: sessionId,
        })
        .select("id")
        .single();

      if (jobError) {
        return NextResponse.json({ error: jobError.message }, { status: 500 });
      }

      await supabase.from("fruitlife_360_report_artifacts").insert({
        artifact_status: "ready",
        artifact_type: "payload",
        metadata: {
          fieldCount: Object.keys(payload).length,
          source: "protected_payload_endpoint",
        },
        provider: "vercel",
        report_job_id: job.id,
        session_id: sessionId,
      });
    }

    return NextResponse.json({
      dryRun,
      fieldCount: Object.keys(payload).length,
      payload,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown FruitLife payload generation error.",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handlePayloadBuild(request);
}

export async function POST(request: NextRequest) {
  return handlePayloadBuild(request);
}

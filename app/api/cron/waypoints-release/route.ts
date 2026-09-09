import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  return Boolean(token && token === cronSecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: releases, error: releaseError } = await supabase
    .from("dydd_waypoint_releases")
    .select("id, waypoint_id, subscriber_channels, dydd_waypoints!inner(status)")
    .eq("status", "scheduled")
    .eq("dydd_waypoints.status", "published")
    .lte("release_at", now);

  if (releaseError) {
    return NextResponse.json({ error: releaseError.message }, { status: 500 });
  }

  if (!releases || releases.length === 0) {
    return NextResponse.json({
      generatedAt: now,
      queuedJobs: 0,
      releases: 0,
    });
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("dydd_waypoint_subscriptions")
    .select("id")
    .eq("status", "active");

  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  const activeSubscriptions = subscriptions ?? [];
  const jobs = releases.flatMap((release) => {
    const channels =
      Array.isArray(release.subscriber_channels) &&
      release.subscriber_channels.length > 0
        ? release.subscriber_channels
        : ["email", "app"];

    return activeSubscriptions.flatMap((subscription) =>
      channels.map((deliveryChannel) => ({
        delivery_channel: deliveryChannel,
        release_id: release.id,
        subscription_id: subscription.id,
      })),
    );
  });

  if (jobs.length > 0) {
    const { error: jobError } = await supabase
      .from("dydd_waypoint_delivery_jobs")
      .upsert(jobs, {
        ignoreDuplicates: true,
        onConflict: "release_id,subscription_id,delivery_channel",
      });

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
  }

  const { error: updateError } = await supabase
    .from("dydd_waypoint_releases")
    .update({
      released_at: now,
      status: "released",
    })
    .in(
      "id",
      releases.map((release) => release.id),
    );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    generatedAt: now,
    queuedJobs: jobs.length,
    releases: releases.length,
    subscriptions: activeSubscriptions.length,
  });
}

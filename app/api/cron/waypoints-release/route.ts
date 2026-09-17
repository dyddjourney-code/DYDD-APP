import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { sendResendEmail } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

type DueRelease = {
  id: string;
  release_at: string;
  subscriber_channels: string[];
  dydd_waypoints: {
    base_content: string;
    base_reflection_prompt: string | null;
    category: string;
    scripture_reference: string | null;
    slug: string;
    status: string;
    title: string;
  };
};

type ActiveSubscription = {
  email: string;
  id: string;
};

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

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppBaseUrl() {
  const configured =
    process.env.DYDD_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "https://dydd-online-school.vercel.app";
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: releases, error: releaseError } = await supabase
    .from("dydd_waypoint_releases")
    .select(
      "id, release_at, subscriber_channels, dydd_waypoints!inner(slug,title,category,scripture_reference,base_content,base_reflection_prompt,status)",
    )
    .eq("status", "scheduled")
    .eq("dydd_waypoints.status", "published")
    .lte("release_at", now)
    .returns<DueRelease[]>();

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
    .select("id,email")
    .eq("status", "active");

  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  const activeSubscriptions = (subscriptions ?? []) as ActiveSubscription[];
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

  let sentEmails = 0;
  let skippedEmails = 0;
  let erroredEmails = 0;

  for (const release of releases) {
    const waypoint = release.dydd_waypoints;
    const channels =
      Array.isArray(release.subscriber_channels) &&
      release.subscriber_channels.length > 0
        ? release.subscriber_channels
        : ["email", "app"];

    if (!channels.includes("email")) {
      continue;
    }

    for (const subscription of activeSubscriptions) {
      const unsubscribeToken = randomBytes(32).toString("hex");
      const unsubscribeUrl = `${getAppBaseUrl()}/api/waypoints/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
      const { error: tokenError } = await supabase
        .from("dydd_waypoint_subscriptions")
        .update({
          unsubscribe_token_hash: hashToken(unsubscribeToken),
        })
        .eq("id", subscription.id);

      if (tokenError) {
        erroredEmails += 1;
        await supabase
          .from("dydd_waypoint_delivery_jobs")
          .update({
            error_message: tokenError.message,
            status: "error",
          })
          .eq("release_id", release.id)
          .eq("subscription_id", subscription.id)
          .eq("delivery_channel", "email");
        continue;
      }

      const text = [
        waypoint.title,
        waypoint.scripture_reference ?? "",
        "",
        waypoint.base_content,
        "",
        waypoint.base_reflection_prompt
          ? `Reflection: ${waypoint.base_reflection_prompt}`
          : "",
        "",
        "You are receiving this because you subscribed to DYDD Waypoints.",
        `Unsubscribe: ${unsubscribeUrl}`,
      ]
        .filter(Boolean)
        .join("\n");
      const html = `
        <h1>${waypoint.title}</h1>
        ${waypoint.scripture_reference ? `<p><strong>${waypoint.scripture_reference}</strong></p>` : ""}
        ${waypoint.base_content
          .split(/\n{2,}/)
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join("")}
        ${
          waypoint.base_reflection_prompt
            ? `<p><strong>Reflection:</strong> ${waypoint.base_reflection_prompt}</p>`
            : ""
        }
        <p style="color:#667085;font-size:13px;">You are receiving this because you subscribed to DYDD Waypoints.</p>
        <p style="color:#667085;font-size:13px;"><a href="${unsubscribeUrl}">Unsubscribe from DYDD Waypoints</a></p>
      `;

      const result = await sendResendEmail({
        from: process.env.DYDD_WAYPOINTS_EMAIL_FROM ?? "DYDD Waypoints <support@discoverdivine.design>",
        html,
        subject: `DYDD Waypoint: ${waypoint.title}`,
        text,
        to: subscription.email,
      });

      if (result.sent) {
        sentEmails += 1;
        await supabase
          .from("dydd_waypoint_delivery_jobs")
          .update({
            sent_at: now,
            status: "sent",
          })
          .eq("release_id", release.id)
          .eq("subscription_id", subscription.id)
          .eq("delivery_channel", "email");
      } else if (result.skipped) {
        skippedEmails += 1;
      } else {
        erroredEmails += 1;
        await supabase
          .from("dydd_waypoint_delivery_jobs")
          .update({
            error_message: result.message ?? "Email send failed.",
            status: "error",
          })
          .eq("release_id", release.id)
          .eq("subscription_id", subscription.id)
          .eq("delivery_channel", "email");
      }
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
    erroredEmails,
    queuedJobs: jobs.length,
    releases: releases.length,
    sentEmails,
    skippedEmails,
    subscriptions: activeSubscriptions.length,
  });
}

import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as {
    email?: string;
    source?: string;
  };
  const email = normalizeEmail(payload.email ?? "");

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { message: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  const supabase = createSupabaseAdminClient();
  const unsubscribeToken = randomBytes(32).toString("hex");

  const { error } = await supabase.from("dydd_waypoint_subscriptions").upsert(
    {
      confirmed_at: new Date().toISOString(),
      email,
      metadata: {
        last_subscribed_from: payload.source ?? "fireside_waypoints",
      },
      preferences: {
        delivery_day: "Friday",
        delivery_time: "8:00 AM Eastern",
      },
      source: payload.source ?? "fireside_waypoints",
      status: "active",
      unsubscribe_token_hash: hashToken(unsubscribeToken),
      user_id: user?.id ?? null,
    },
    { onConflict: "email" },
  );

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "You're subscribed. The weekly Waypoint releases Friday mornings at 8:00 AM Eastern.",
  });
}

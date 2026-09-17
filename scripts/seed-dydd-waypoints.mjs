import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const data = JSON.parse(
  await fs.readFile(path.join(root, "lib/waypoints/waypoints.json"), "utf8"),
);

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  process.env.SUPABASE_PROJECT_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase URL or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

for (const waypoint of data) {
  const { data: waypointRow, error: waypointError } = await supabase
    .from("dydd_waypoints")
    .upsert(
      {
        base_content: waypoint.body.join("\n\n"),
        base_reflection_prompt: waypoint.reflection,
        category: waypoint.category,
        metadata: {
          display_date: waypoint.date,
          excerpt: waypoint.excerpt,
        },
        public_cta: "Pause, pray, and carry one faithful step into the week.",
        scripture_reference: waypoint.scripture,
        slug: waypoint.id,
        source: "DYDD Waypoints app archive",
        status: "published",
        tags: waypoint.tags,
        title: waypoint.title,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (waypointError) {
    throw new Error(`${waypoint.id}: ${waypointError.message}`);
  }

  const { error: releaseError } = await supabase
    .from("dydd_waypoint_releases")
    .upsert(
      {
        metadata: {
          display_date: waypoint.date,
        },
        public_channels: ["website"],
        release_at: waypoint.releaseAt,
        release_timezone: "America/New_York",
        status: "scheduled",
        subscriber_channels: ["email", "app"],
        waypoint_id: waypointRow.id,
      },
      { onConflict: "waypoint_id,release_at" },
    );

  if (releaseError) {
    throw new Error(`${waypoint.id} release: ${releaseError.message}`);
  }

  console.log(`seeded ${waypoint.date} ${waypoint.title}`);
}

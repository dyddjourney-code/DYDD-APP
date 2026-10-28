import { getSavedWaypointPrimary } from "@/lib/waypoints/user-context";
import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { FruitLifeMiniFooter } from "@/components/fruitlife-mini-footer";
import { WaypointExplorer } from "@/components/waypoint-explorer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  currentWaypoint as scheduledCurrentWaypoint,
  previousWaypoint as scheduledPreviousWaypoint,
  waypointCategories as scheduledWaypointCategories,
  getReleasedWaypoints,
  personalizeWaypoint,
} from "@/lib/waypoints/waypoint-data";
import { reviewQuery, type ReviewSearchParams } from "@/lib/review/heather";

export const dynamic = "force-dynamic";

type WaypointsPageProps = { searchParams?: Promise<ReviewSearchParams & { lane?: string }> };

async function getWaypointSubscriptionState() {
  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";

  if (!user || !email) {
    return {
      savedPrimary: "",
      initialSubscribeEmail: "",
      initialSubscribeMessage:
        "Receive the weekly DYDD Waypoint every Friday at 8:00 AM Eastern.",
      initialSubscribeState: "idle" as const,
    };
  }

  const savedPrimary = await getSavedWaypointPrimary(user.id, email);
  const supabase = createSupabaseAdminClient();
  const { data: userSubscription } = await supabase
    .from("dydd_waypoint_subscriptions")
    .select("id,email,status,user_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (userSubscription) {
    return {
      savedPrimary,
      initialSubscribeEmail: userSubscription.email ?? email,
      initialSubscribeMessage:
        "You're subscribed to weekly DYDD Waypoint emails.",
      initialSubscribeState: "success" as const,
    };
  }

  const { data: emailSubscription } = await supabase
    .from("dydd_waypoint_subscriptions")
    .select("id,email,status,user_id")
    .eq("email", email)
    .eq("status", "active")
    .maybeSingle();

  if (emailSubscription) {
    if (!emailSubscription.user_id) {
      await supabase
        .from("dydd_waypoint_subscriptions")
        .update({ user_id: user.id })
        .eq("id", emailSubscription.id);
    }

    return {
      savedPrimary,
      initialSubscribeEmail: emailSubscription.email ?? email,
      initialSubscribeMessage:
        "You're subscribed to weekly DYDD Waypoint emails.",
      initialSubscribeState: "success" as const,
    };
  }

  return {
    savedPrimary,
    initialSubscribeEmail: email,
    initialSubscribeMessage:
      "Receive the weekly DYDD Waypoint every Friday at 8:00 AM Eastern.",
    initialSubscribeState: "idle" as const,
  };
}

export default async function WaypointsPage({ searchParams }: WaypointsPageProps) {
  const params = await searchParams;
  const fruitLifeLane = params?.lane === "fruitlife";
  const fruitLifeReviewQuery = reviewQuery(params);
  const releasedScheduledWaypoints = getReleasedWaypoints();
  const releasedWaypointArchive = releasedScheduledWaypoints;
  const activeCurrentWaypoint =
    releasedWaypointArchive[0] ?? scheduledCurrentWaypoint;
  const activePreviousWaypoint =
    releasedWaypointArchive[1] ?? scheduledPreviousWaypoint;
  const { savedPrimary, ...waypointSubscriptionState } = await getWaypointSubscriptionState();
  const personalizedWaypoints = releasedWaypointArchive.map(waypoint => personalizeWaypoint(waypoint, savedPrimary));

  return (
    <main className={`journey-shell hq-standalone-page fireside-page${fruitLifeLane ? " fruitlife-release-shell" : ""}`}>
      {fruitLifeLane ? <FruitLifeMiniNav reviewQuery={fruitLifeReviewQuery} /> : null}
      <section
        className="fireside-waypoints-feature"
        id="waypoints"
        aria-label="DYDD Waypoints trail banner"
      >
        <div className="fireside-image-header">
          <img
            alt="Illustrated DYDD Waypoints trail through a forest with natural places to pause"
            src="/brand/dydd-waypoints-banner.png"
          />
          <div className="fireside-image-title waypoints-title">
            <p>DYDD Waypoints</p>
          </div>
          <div className="fireside-image-title waypoints-tagline">
            <span>Pause, breathe, and keep walking.</span>
          </div>
        </div>
      </section>

      <section
        className="waypoints-section"
        aria-label="DYDD Waypoints library"
      >
        <WaypointExplorer
          categories={scheduledWaypointCategories}
          currentId={activeCurrentWaypoint.id}
          {...waypointSubscriptionState}
          previousId={activePreviousWaypoint.id}
          waypoints={personalizedWaypoints}
        />
      </section>

      {fruitLifeLane ? <FruitLifeMiniFooter /> : null}
    </main>
  );
}

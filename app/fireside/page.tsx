import { FruitLifeMiniNav } from "@/components/fruitlife-mini-nav";
import { FruitLifeMiniFooter } from "@/components/fruitlife-mini-footer";
import { PageHelp } from "@/components/page-help";
import { WaypointExplorer } from "@/components/waypoint-explorer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  currentWaypoint as scheduledCurrentWaypoint,
  previousWaypoint as scheduledPreviousWaypoint,
  waypointCategories as scheduledWaypointCategories,
  getReleasedWaypoints,
} from "@/lib/waypoints/waypoint-data";
import { reviewQuery, type ReviewSearchParams } from "@/lib/review/heather";

export const dynamic = "force-dynamic";

const liveGatherings = [
  {
    format: "Virtual",
    type: "DYDD Overview",
    title: "Discover Your Divine Design Intro Night",
    date: "Coming soon",
    price: "Free preview",
    description:
      "A simple live introduction to the full DYDD journey, the assessments, and the course path.",
  },
  {
    format: "Virtual",
    type: "DesignID",
    title: "Understanding Your DesignID Results",
    date: "Coming soon",
    price: "Included with DesignID",
    description:
      "A focused walkthrough for people who have completed DesignID and want help applying the report.",
  },
  {
    format: "Live",
    type: "Workshop",
    title: "Purpose & Calling Workshop",
    date: "Coming soon",
    price: "Paid seat",
    description:
      "A deeper guided session for groups, churches, or teams who want to explore purpose together.",
  },
];

const liveTypes = [
  "DYDD overviews",
  "DesignID sessions",
  "Spiritual Gifts sessions",
  "Workshops",
  "Virtual classes",
  "Live gatherings",
];

const podcastNameIdeas = [
  "The DYDD Fireside",
  "Waypoints with John",
  "On Purpose, For Purpose",
  "The Divine Design Table",
  "Along the Way",
];

type FiresidePageProps = {
  searchParams?: Promise<ReviewSearchParams & {
    lane?: string;
  }>;
};

async function getWaypointSubscriptionState() {
  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();
  const email = user?.email?.trim().toLowerCase() ?? "";

  if (!user || !email) {
    return {
      initialSubscribeEmail: "",
      initialSubscribeMessage:
        "Receive the weekly DYDD Waypoint every Friday at 8:00 AM Eastern.",
      initialSubscribeState: "idle" as const,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: userSubscription } = await supabase
    .from("dydd_waypoint_subscriptions")
    .select("id,email,status,user_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (userSubscription) {
    return {
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
      initialSubscribeEmail: emailSubscription.email ?? email,
      initialSubscribeMessage:
        "You're subscribed to weekly DYDD Waypoint emails.",
      initialSubscribeState: "success" as const,
    };
  }

  return {
    initialSubscribeEmail: email,
    initialSubscribeMessage:
      "Receive the weekly DYDD Waypoint every Friday at 8:00 AM Eastern.",
    initialSubscribeState: "idle" as const,
  };
}

export default async function FiresidePage({
  searchParams,
}: FiresidePageProps) {
  const params = await searchParams;
  const fruitLifeLane = params?.lane === "fruitlife";
  const fruitLifeReviewQuery = reviewQuery(params);
  const releasedScheduledWaypoints = getReleasedWaypoints();
  const releasedWaypointArchive = releasedScheduledWaypoints;
  const activeCurrentWaypoint =
    releasedWaypointArchive[0] ?? scheduledCurrentWaypoint;
  const activePreviousWaypoint =
    releasedWaypointArchive[1] ?? scheduledPreviousWaypoint;
  const waypointSubscriptionState = await getWaypointSubscriptionState();

  if (fruitLifeLane) {
    return (
      <main className="journey-shell hq-standalone-page fireside-page fruitlife-release-shell">
        <FruitLifeMiniNav reviewQuery={fruitLifeReviewQuery} />

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
            waypoints={releasedWaypointArchive}
          />
        </section>
        <FruitLifeMiniFooter />
      </main>
    );
  }

  return (
    <main className="journey-shell hq-standalone-page fireside-page">
      <header className="standalone-hero fireside-page-hero">
        <div>
          <p className="eyebrow">Fireside</p>
          <h1>Connection for the journey.</h1>
          <p className="lede">
            Scripture, devotion, teaching, conversation, and live moments can
            gather here so people keep walking with encouragement.
          </p>
        </div>
      </header>

      <div className="fireside-help">
        <PageHelp
          title="Fireside Help"
          items={[
            "Use Fireside for Scripture, devotion, teaching, podcast, video, and live event connections.",
            "Keep relational content here so Base Camp and the Journey stay focused.",
            "Future subscriptions can support weekly DYDD Waypoints and Fireside updates.",
          ]}
        />
      </div>

      <section className="fireside-author-strip" aria-label="Who we are">
        <div className="fireside-author-photo">
          <img
            alt="John Willoughby in Discover Your Divine Design cartoon style"
            src="/brand/john-author-cartoon-dydd-style.png"
          />
        </div>
        <div className="fireside-author-copy">
          <p className="section-label">Who We Are</p>
          <h2>A journey rooted in purpose.</h2>
          <p>
            Discover Your Divine Design was created by John Willoughby, a
            leader, coach, and devoted follower of Christ who believes every
            person has been created by God with purpose, on purpose.
          </p>
          <p>
            Drawing from leadership development, biblical teaching, and personal
            growth, John built a Scripture-rooted process that helps people
            explore identity, expertise, story, desires, spiritual gifts, and
            niche within the Body of Christ.
          </p>
        </div>
      </section>

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
          waypoints={releasedWaypointArchive}
        />
      </section>

      <section
        className="fireside-live-section"
        id="live"
        aria-label="Live Fireside"
      >
        <div className="fireside-image-header live-fireside-header">
          <img
            alt="Illustrated Live Fireside gathering around a campfire"
            src="/brand/dydd-live-fireside-banner-concept.png"
          />
          <div className="fireside-image-title live-title">
            <p>Live Fireside</p>
            <span>Gatherings, teaching, and conversations.</span>
          </div>
        </div>

        <div
          className="fireside-live-type-row"
          aria-label="Live Fireside categories"
        >
          {liveTypes.map((type) => (
            <span key={type}>{type}</span>
          ))}
        </div>

        <div className="fireside-live-layout">
          <section
            className="fireside-event-board"
            aria-label="Upcoming live gatherings"
          >
            <div className="fireside-board-heading">
              <div>
                <p className="section-label">Event Calendar</p>
                <h3>Coming Up</h3>
              </div>
              <span>Enrollment coming soon</span>
            </div>

            <div className="fireside-event-list">
              {liveGatherings.map((event) => (
                <article className="fireside-event-card" key={event.title}>
                  <div className="fireside-event-meta">
                    <span>{event.format}</span>
                    <span>{event.type}</span>
                  </div>
                  <h4>{event.title}</h4>
                  <p>{event.description}</p>
                  <div className="fireside-event-footer">
                    <span>{event.date}</span>
                    <strong>{event.price}</strong>
                  </div>
                  <button className="button secondary" type="button">
                    Save my spot
                  </button>
                </article>
              ))}
            </div>
          </section>

          <aside
            className="fireside-podcast-panel"
            aria-label="Podcast direction"
          >
            <p className="section-label">Podcast & Teaching</p>
            <h3>A listening path for the journey.</h3>
            <p>
              Podcast episodes, short teachings, video clips, sermons, and
              replay content can sit here once the rhythm is ready.
            </p>
            <div
              className="fireside-podcast-name-grid"
              aria-label="Podcast name ideas"
            >
              {podcastNameIdeas.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
            <p>
              My favorite direction right now is{" "}
              <strong>The DYDD Fireside</strong> because it matches this page
              and gives room for teaching, interviews, stories, and
              devotion-style episodes.
            </p>
          </aside>
        </div>

        <div className="fireside-live-note">
          <p>
            Later this can connect to real event registration, payment, calendar
            reminders, replay access, and subscriber invitations.
          </p>
        </div>
      </section>
    </main>
  );
}

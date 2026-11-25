// Source inventory: existing ranger-relief-map; positions adapted to current relief artwork.
type MapPoint = {
  body: string;
  bullets: string[];
  cta: string;
  href: string;
  id: string;
  image: string;
  imageAlt: string;
  imageLabel?: string;
  label: string;
  left: string;
  title: string;
  top: string;
  type: "place" | "trail";
};

export const mapPoints: MapPoint[] = [
  {
    body:
      "Start here by treating the map as an ecosystem, not a checklist. Notice what each place is for, choose the next faithful step, and come back whenever you need fresh orientation.",
    bullets: ["Begin at Base Camp when you need your bearings", "Use Trailheads for courses, assessments, and guided paths", "Return to Ranger Station when you want help choosing what comes next"],
    cta: "Go to Base Camp",
    href: "/base-camp",
    id: "start-here",
    image: "/brand/dydd-park-map-concept.png",
    imageAlt: "Illustrated Discover Your Divine Design ecosystem map",
    label: "Start Here",
    left: "13.5%",
    title: "How to approach the map",
    top: "61.2%",
    type: "place",
  },
  {
    body:
      "Base Camp is the quiet landing place where a person can arrive, get their bearings, and see the next faithful step without feeling buried in the whole system at once.",
    bullets: ["Personal passport and earned badges", "Account basics and current progress", "A simple handoff into Ranger Station"],
    cta: "Return to Base Camp",
    href: "/base-camp",
    id: "base-camp",
    image: "/brand/dydd-cabin-hut-only.png",
    imageAlt: "DYDD Base Camp cabin with welcome sign",
    label: "Base Camp",
    left: "67.2%",
    title: "Your personal starting place",
    top: "95.8%",
    type: "place",
  },
  {
    body:
      "Ranger Station is the orientation room for the whole DYDD park. It helps someone understand what is available, what is already unlocked, and where to begin.",
    bullets: ["Ask at the orientation desk", "See the whole journey map", "Choose the next trail with context"],
    cta: "Ask at the desk",
    href: "#ranger-desk",
    id: "ranger-station",
    image: "/brand/dydd-ranger-station-header.png",
    imageAlt: "Discover Your Divine Design Ranger Station sign",
    label: "Ranger Station",
    left: "66.9%",
    title: "The guided orientation room",
    top: "80.8%",
    type: "place",
  },
  {
    body:
      "Trailheads are the launch points for the courses, assessments, and guided pathways. They should make the next step feel clear before someone commits to a trail.",
    bullets: ["Starting points gathered in one place", "Time, effort, and access expectations", "Clear routes for open or locked paths"],
    cta: "Open Trailheads",
    href: "/trailheads",
    id: "trailheads",
    image: "/brand/dydd-courses-forest-banner.webp",
    imageAlt: "Forest trailhead banner from the DYDD Trailheads page",
    label: "Trailheads",
    left: "48%",
    title: "Choose the route",
    top: "38%",
    type: "place",
  },
  {
    body:
      "Fireside is the teaching and encouragement stop. It gives people a place to slow down, receive a word for the road, and keep the journey connected to Scripture and real life.",
    bullets: ["Teaching moments and live gatherings", "Scripture-rooted encouragement", "A warmer entry point for people not ready to start a course"],
    cta: "Visit Fireside",
    href: "/fireside",
    id: "fireside",
    image: "/brand/dydd-fireside-campfire-banner.png",
    imageAlt: "DYDD Fireside campfire teaching banner",
    label: "Fireside",
    left: "15%",
    title: "A teaching stop along the way",
    top: "28%",
    type: "place",
  },
  {
    body:
      "Camp Circles are the shared journey spaces for people walking together. They can support cohorts, classes, marriages, leadership groups, and facilitated conversations.",
    bullets: ["Group progress and shared rhythm", "Leader or facilitator support", "Space for couples, classes, cohorts, and teams"],
    cta: "Preview Camp Circles",
    href: "/camp-circle",
    id: "camp-circles",
    image: "/brand/dydd-camp-circle-campfire-banner.png",
    imageAlt: "DYDD Camp Circles campfire banner",
    label: "Camp Circles",
    left: "88.8%",
    title: "Walk together",
    top: "67.8%",
    type: "place",
  },
  {
    body:
      "Waypoints are shorter pauses along the road. They give people timely teaching, reflection, and encouragement they can revisit between bigger course or assessment steps.",
    bullets: ["Short teachings and reflections", "Podcast, video, and written prompts", "A growing library of places to revisit"],
    cta: "Find Waypoints",
    href: "/waypoints",
    id: "waypoints",
    image: "/brand/dydd-waypoints-banner.png",
    imageAlt: "Illustrated DYDD Waypoints trail banner",
    label: "Waypoints",
    left: "43.6%",
    title: "Places to pause",
    top: "7.2%",
    type: "place",
  },
  {
    body:
      "The main DYDD Journey is the guided road through discovery. It connects the deeper questions of identity, expertise, story, desire, gifts, and niche into one discipleship-shaped process.",
    bullets: ["The core Discover Your Divine Design path", "DESIGN language organized into a journey", "Assessment insights pulled in as they become available"],
    cta: "Open the Journey",
    href: "/journey",
    id: "dydd-journey",
    image: "/brand/dydd-journey-road-waymarkers.png",
    imageAlt: "DYDD journey road with waymarkers",
    label: "DYDD Journey",
    left: "53%",
    title: "The main route",
    top: "85%",
    type: "trail",
  },
  {
    body:
      "Spiritual Gifts is an open starting trail for noticing how grace is showing up in service, maturity, and the body of Christ. It is a confirmation tool, not a label.",
    bullets: ["Free first assessment trail", "Names grace for service and maturity", "Connects into course support and future journey personalization"],
    cta: "Start Spiritual Gifts",
    href: "/trailheads#spiritual-gifts",
    id: "spiritual-gifts",
    image: "/brand/trailheads/spiritual-gifts-signpost.png",
    imageAlt: "Spiritual Gifts trailhead signpost",
    label: "Spiritual Gifts",
    left: "65.8%",
    title: "Grace expressed in service",
    top: "49%",
    type: "trail",
  },
  {
    body:
      "Fruitful Life 360 helps a person see visible spiritual fruit through self-reflection and trusted observer feedback. It is designed for formation, encouragement, and honest growth conversations.",
    bullets: ["Self and observer reflection", "A formation mirror, not a grade", "Helpful for growth, leadership, marriage, and discipleship conversations"],
    cta: "Start Fruitful Life 360",
    href: "/trailheads#fruitlife-360",
    id: "fruitlife-360",
    image: "/brand/trailheads/fruitlife-360-signpost.png",
    imageAlt: "Fruitful Life 360 trailhead signpost",
    label: "Fruitful Life 360",
    left: "59.6%",
    title: "Formation and visible fruit",
    top: "34.7%",
    type: "trail",
  },
  {
    body:
      "DesignPD helps someone understand how their design tends to move through planning, deciding, and doing. It is the practical trail where DesignID language becomes clearer movement in relationships, leadership, pressure, collaboration, and everyday follow-through.",
    bullets: ["Built from DesignID", "Names Plan, Decide, and Do tendencies", "Turns design insight into practical movement"],
    cta: "Open DesignPD",
    href: "/trailheads#designpd",
    id: "designpd",
    image: "/brand/trailheads/designpd-signpost.png",
    imageAlt: "DesignPD trailhead signpost",
    label: "DesignPD",
    left: "90%",
    title: "Plan. Decide. Do.",
    top: "18%",
    type: "trail",
  },
  {
    body:
      "DesignID gives a person language for the way they naturally reflect, engage, and contribute. It creates the design vocabulary that later supports DesignPD and the larger DYDD Journey.",
    bullets: ["Core design reflection language", "A foundation for DesignPD", "Personalizes future lessons, reports, and companion guidance"],
    cta: "Start DesignID",
    href: "/trailheads#designid",
    id: "designid",
    image: "/brand/trailheads/designid-signpost.png",
    imageAlt: "DesignID trailhead signpost",
    label: "DesignID Trail",
    left: "41%",
    title: "Reflection and design language",
    top: "52%",
    type: "trail",
  },
];


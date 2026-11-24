import { ReviewAwareLink } from "@/components/review-aware-link";
import type { ReactNode } from "react";

/** Presentation only: the original route remains mounted, with all its state and actions. */
type Environment = {
  key: "ranger" | "trails" | "archive" | "fireside" | "journey";
  title: string;
  description: string;
  invitation: string;
  contentTitle: string;
  contentDescription: string;
  objects: { href: string; title: string; description: string; x:number; y:number }[];
};

function environmentFor(pathname: string): Environment | null {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (path === "/ranger-station") return {
    key: "ranger",
    title: "Ranger Station",
    description: "Step inside. Get to know the landscape, ask your questions, and find a good place to begin.",
    invitation: "Find your bearings",
    contentTitle: "A little direction for the journey.",
    contentDescription: "Explore the map, then bring your questions to the ranger desk.",
    objects: [
      { href: "#ecosystem-map", title: "The map table", description: "Explore how the journey fits together",x:44,y:56 },
      { href: "#ranger-desk", title: "The ranger desk", description: "Ask Dydi about your next step",x:85,y:61 },
    ],
  };
  if (path === "/trailheads") return {
    key: "trails",
    title: "Trailheads",
    description: "The forest opens here. Walk the full journey, or choose a focused path for the season you are in.",
    invitation: "Choose your trail",
    contentTitle: "Every trail begins with a step.",
    contentDescription: "Your courses, assessments, and next steps are gathered below. Start where you are.",
    objects: [
      {href:"/journey",title:"DYDD Journey",description:"The complete guided path",x:50,y:30},
      {href:"#designid",title:"DesignID",description:"Understand your design",x:27,y:48},
      {href:"#spiritual-gifts",title:"Spiritual Gifts",description:"Discover grace for service",x:76,y:48},
      {href:"#fruitlife-360",title:"Fruitful Life 360",description:"Reflect on visible growth",x:28,y:67},
      {href:"#designpd",title:"DesignPD",description:"Plan, decide and do",x:77,y:68},
    ],
  };
  if (path === "/field-kit" || path.startsWith("/field-kit/")) return {
    key: "archive",
    title: path === "/field-kit" ? "Your Field Kit" : "The reflection archive",
    description: "A place for what you have discovered. Keep your reports close, return to your reflections, and carry what matters into the next step.",
    invitation: path === "/field-kit" ? "Open your collection" : "Return to your reflections",
    contentTitle: path === "/field-kit" ? "Your discoveries, within reach." : "Make room for what you are learning.",
    contentDescription: path === "/field-kit" ? "Find your assessment reports, saved reflections, and resources in your collection." : "Your original questions and saved responses are here, ready when you are.",
    objects: [
      {href:"#destination-content",title:"Your collection",description:"Reports and saved reflections",x:79,y:46},
      {href:"/field-kit/reflections/discover-your-divine-design",title:"The workbook",description:"Open your Journey reflections",x:47,y:67},
    ],
  };
  if(path === "/gear") return {
    key:"archive",title:"Gear for the trail",description:"Stop at the outfitter’s desk. Find the books and resources that support the path you are walking.",invitation:"Explore the collection",contentTitle:"Travel with what matters.",contentDescription:"Your existing resources and book links are gathered here.",
    objects:[{href:"#destination-content",title:"The equipment trunk",description:"Browse the resource collection",x:18,y:65},{href:"/trailheads",title:"Back to the trail",description:"Choose your next course",x:79,y:45}],
  };
  if(path === "/command-center" || path.startsWith("/command-center/")) return {
    key:"ranger",title:"The planning room",description:"Lay out the discoveries, see how the pieces connect, and decide what to carry into the next step.",invitation:"Open your workspace",contentTitle:"A place to bring the pieces together.",contentDescription:"Your connected workspace and its existing tools continue below.",
    objects:[{href:"#destination-content",title:"The planning desk",description:"Open your connected workspace",x:44,y:56},{href:"/ranger-station",title:"Find your bearings",description:"Return to the ranger’s guidance",x:85,y:61}],
  };
  if(path === "/waypoints") return {
    key:"trails",title:"Waypoints",description:"A pause along the forest path. Take a short reflection with you, then return to the road with fresh perspective.",invitation:"Find a place to pause",contentTitle:"A word for the road.",contentDescription:"Explore the existing Scripture, teaching and reflection collection below.",
    objects:[{href:"#destination-content",title:"Pause on the path",description:"Explore short teachings and reflections",x:50,y:38},{href:"/fireside",title:"Down to the riverside",description:"Return to Fireside",x:76,y:62}],
  };
  if (path === "/fireside" || path === "/waypoints" || path === "/live" || path === "/camp-circle" || path.startsWith("/camp-circle/")) return {
    key: "fireside",
    title: path === "/waypoints" ? "Waypoints" : path === "/live" ? "Live Fireside" : path.startsWith("/camp-circle") ? "Camp Circles" : "Fireside",
    description: "Come down to the river. There is room to pause, find encouragement, and walk alongside others.",
    invitation: "Take a place by the fire",
    contentTitle: "You do not have to walk alone.",
    contentDescription: "Make space for Scripture, conversation, and connection along the way.",
    objects: [
      {href:"#destination-content",title:"By the fire",description:"Teaching and encouragement",x:49,y:61},
      {href:"/waypoints",title:"Waypoints",description:"A short pause for the road",x:24,y:43},
      {href:"/live",title:"Live gatherings",description:"Make space for conversation",x:80,y:45},
    ],
  };
  if (path === "/journey" || path.startsWith("/journey/") || path.startsWith("/courses/") || path.startsWith("/learn/")) return {
    key: "journey",
    title: "Room to reflect.",
    description: "Settle into a quieter corner of the journey. Take your time with the teaching, listen to your companions, and put your discoveries into words.",
    invitation: "Open your course",
    contentTitle: "One faithful step at a time.",
    contentDescription: "Your course, audio companions, and reflections continue below.",
    objects: [{ href: "#destination-content", title: "The reading desk", description: "Return to the teaching and your reflections",x:76,y:56 }],
  };
  return null;
}

export function EnvironmentRoute({ pathname, children }: { pathname: string; children: ReactNode }) {
  const environment = environmentFor(pathname);
  if (!environment) return <>{children}</>;

  const courseSlug = pathname.match(/^\/(?:courses|learn)\/([^/?]+)/)?.[1] ?? "discover-your-divine-design";
  if (environment.key === "journey") return (
    <div className="environment-route environment-route--journey course-cabin">
      <div className="course-cabin-art" aria-hidden="true" />
      <header className="course-cabin-arrival"><ReviewAwareLink href="/trailheads">← Trailheads</ReviewAwareLink><span>{pathname === "/journey" ? "Learning Center · Journey classroom" : "The reading room"}</span><ReviewAwareLink href={`/field-kit/reflections/${courseSlug}`}>Field Kit ↗</ReviewAwareLink></header>
      <div className="environment-destination" id="destination-content" tabIndex={-1}><div className="environment-original-content">{children}</div></div>
    </div>
  );

  return (
    <div className={`environment-route environment-route--${environment.key}`}>
      <section className="environment-scene" aria-labelledby="environment-title">
        <div className="environment-scene-art" aria-hidden="true" />
        <div className="environment-scene-copy">
          <h1 id="environment-title">{environment.title}</h1>
          <p>{environment.description}</p>
          <a className="environment-enter" href={environment.key === "ranger" ? "#ecosystem-map" : "#destination-content"}>
            {environment.invitation}<span aria-hidden="true">↓</span>
          </a>
        </div>
        <nav className="environment-objects" aria-label={`${environment.title} places`}>
          {environment.objects.map(object => (
            <ReviewAwareLink className={`environment-object ${object.x>65?"environment-object-right":""}`} style={{left:`${object.x}%`,top:`${object.y}%`}} href={object.href} key={object.href}>
              <span className="environment-marker" aria-hidden="true">+</span><span className="environment-object-label"><span className="environment-object-title">{object.title}</span><span className="environment-object-description">{object.description}</span></span>
            </ReviewAwareLink>
          ))}
        </nav>
      </section>
      <div className="environment-destination" id="destination-content" tabIndex={-1}>
        <header className="environment-passage">
          <h2>{environment.contentTitle}</h2>
          <p>{environment.contentDescription}</p>
        </header>
        <div className="environment-original-content">{children}</div>
      </div>
    </div>
  );
}

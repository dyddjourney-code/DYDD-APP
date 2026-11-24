"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ReviewAwareLink } from "@/components/review-aware-link";

type Place = "map" | "ranger" | "trails" | "passport" | "kit" | "fireside" | "profile";
const places: { key: Place; label: string; icon: string }[] = [
  {key:"map",label:"Camp Map",icon:"compass"},
  {key:"ranger",label:"Ranger Station",icon:"camp"},
  {key:"trails",label:"Trailheads",icon:"trail"},
  {key:"passport",label:"Passport",icon:"passport"},
  {key:"kit",label:"Field Kit",icon:"kit"},
  {key:"fireside",label:"Fireside",icon:"fire"},
];
const guide: Record<Place,{title:string;lead:string;links?:{title:string;copy:string;href?:string;panel?:Place}[]}> = {
 map:{title:"Your field guide",lead:"Every place has a purpose. Choose where you would like to go next.",links:[
  {title:"Ranger Station",copy:"Find your bearings and meet Dydi.",panel:"ranger"},
  {title:"Trailheads",copy:"Explore courses and assessments.",panel:"trails"},
  {title:"Passport Book",copy:"Your milestones and discoveries.",panel:"passport"},
  {title:"Field Kit",copy:"Keep your saved resources close.",panel:"kit"},
  {title:"Fireside",copy:"Encouragement and community.",panel:"fireside"},
  {title:"Traveler profile",copy:"Your story, account and access.",panel:"profile"}]},
 ranger:{title:"Ranger Station",lead:"Find your bearings. Let Dydi help you discover the next faithful step.",links:[
  {title:"Meet your ranger",copy:"Get oriented with Dydi and the real camp guide.",href:"/ranger-station"},
  {title:"Explore the map",copy:"Get to know the places in your journey.",panel:"map"},
  {title:"Choose a trail",copy:"Find a course or assessment to begin.",panel:"trails"}]},
 trails:{title:"Trailheads",lead:"Explore the full journey or begin with a focused path. There is room to start where you are.",links:[
  {title:"DYDD Journey",copy:"A guided path through identity, design, gifting and calling.",href:"/journey"},
  {title:"DesignID",copy:"Explore how you are designed to contribute.",href:"/trailheads#designid"},
  {title:"Spiritual Gifts",copy:"Discover gifts to explore through service and community.",href:"/trailheads#spiritual-gifts"},
  {title:"Fruitful Life 360",copy:"Reflect on growth and invite meaningful feedback.",href:"/trailheads#fruitlife-360"},
  {title:"DesignPD",copy:"Build on your DesignID insight and put it into action.",href:"/trailheads#designpd"}]},
 passport:{title:"Passport Book",lead:"A place to look back on the milestones and discoveries that mark your journey."},
 kit:{title:"Field Kit",lead:"Keep the tools you need close at hand as you explore.",links:[
  {title:"Open your Field Kit",copy:"Your saved reflections, reports and assessment results.",href:"/field-kit"},
  {title:"Journey workbook",copy:"Return to your authored course reflections.",href:"/field-kit/reflections/discover-your-divine-design"},
  {title:"Gear",copy:"Resources for the trail.",href:"/gear"},
  {title:"Your design",copy:"Bring your discoveries together in the Command Center.",href:"/command-center"}]},
 fireside:{title:"Fireside",lead:"A place for encouragement, conversation, and walking alongside others.",links:[
  {title:"Fireside",copy:"Gather around the campfire.",href:"/fireside"},
  {title:"Waypoints",copy:"Pause for a short encouragement.",href:"/waypoints"},
  {title:"Live",copy:"Gather for an upcoming experience.",href:"/live"},
  {title:"Camp Circles",copy:"Explore community with others.",href:"/camp-circle"},
  {title:"My Circles",copy:"Return to the circles you belong to.",href:"/camp-circle/my-circles"}]},
 profile:{title:"Traveler profile",lead:"Your story, account details and purchased access stay connected here."}
};
export function ForestIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    passport: <><path d="M5 3h14v18H5V3ZM8 3v18M11 8h5M11 12h5M11 16h3"/></>,
    camp: <><path d="m3 20 9-15 9 15H3Z"/><path d="m8 20 4-7 4 7M12 5v8"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15 8-2 6-4 2 2-6 4-2ZM12 1v2M12 21v2M1 12h2M21 12h2"/></>,
    trail: <><path d="M12 3v19M4 5h12l4 3-4 3H4V5ZM8 14h12v5H8l-4-2.5L8 14Z"/></>,
    journey: <><path d="M5 21c-3-6 10-3 9-9S7 9 11 3M15 3h5v5M20 3l-6 6"/></>,
    kit: <><path d="M8 7V5a4 4 0 0 1 8 0v2M5 7h14v15H5V7ZM5 12h14M10 12v3h4v-3"/></>,
    fire: <><path d="M12 2c2 5 0 5 4 8 1-2 1-3 1-4 6 7 4 13-5 14-8-1-10-7-5-12 0 3 1 4 2 5 3-3 3-6 3-11ZM5 23l14-3M5 20l14 3"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.compass}</svg>;
}

export function ForestNavigation({children}:{children:ReactNode}) {
  const pathname = usePathname();
  const atCamp = pathname === "/hq" || pathname === "/base-camp" || pathname === "/";
  const [place,setPlace] = useState<Place|null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement|null>(null);
  const panelScroll = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const current = place ? guide[place] : null;
  function close() { dialog.current?.close();setPlace(null);previousFocus.current?.focus(); }
  function open(key:Place) {
    if (!dialog.current?.open) previousFocus.current=document.activeElement as HTMLElement;
    setPlace(key);
    if (!dialog.current?.open) dialog.current?.showModal();
    panelScroll.current?.scrollTo(0,0);
  }
  useEffect(()=>{ dialog.current?.close();setPlace(null); },[pathname]);
  useEffect(()=>{
    if(!place)return;
    closeButton.current?.focus();
    const before=document.body.style.overflow;document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=before;};
  },[place]);
  useEffect(()=>{
    function hash(){if(location.hash==="#passport")open("passport");else if(location.hash==="#your-profile"||location.hash==="#purchases")open("profile");}
    hash();window.addEventListener("hashchange",hash);return ()=>window.removeEventListener("hashchange",hash);
  },[pathname]);
  const profileAccount=place==="profile"||place==="passport";
  return <div className={`game-world ${atCamp?"game-at-camp":"game-on-trail"}`}>
    <a className="forest-skip" href="#forest-content">Skip to content</a>
    <header className="game-top">
      <ReviewAwareLink href="/base-camp" className="game-mark" aria-label="DYDD Base Camp"><ForestIcon name="compass"/><span>DYDD<small>DISCOVER YOUR DIVINE DESIGN</small></span></ReviewAwareLink>
      <div className="game-location"><ForestIcon name={atCamp?"camp":"journey"}/><span>{atCamp?"Base Camp":"On the trail"}</span></div>
      <button className="game-profile" onClick={()=>open("profile")}>Traveler profile</button>
    </header>
    {atCamp ? <main id="forest-content" className="game-scene" tabIndex={-1}>
      <div className="game-intro"><h1>Welcome to<br/>Base Camp.</h1><p>A place to find your bearings, reflect on your story, and take the next step on your journey.</p>
      <button className="game-next" onClick={()=>open("ranger")}><ForestIcon name="compass"/><span>Visit the Ranger Station</span><span aria-hidden="true">→</span></button></div>
    </main> : <div className="game-route" id="forest-content" tabIndex={-1}>
      <ReviewAwareLink className="game-return" href="/base-camp">← Return to Base Camp</ReviewAwareLink>
      <div className="game-reading">{children}</div>
      <footer className="game-support"><ReviewAwareLink href="/contact">Contact</ReviewAwareLink><ReviewAwareLink href="/privacy">Privacy</ReviewAwareLink><ReviewAwareLink href="/terms">Terms</ReviewAwareLink></footer>
    </div>}
    <footer className="game-bottom"><div className="game-caption">Your journey begins here<span>Choose a destination from your field guide.</span></div>
      <nav className="forest-dock game-dock" aria-label="Camp navigation">{places.map(item=><button className={item.key==="map"?"forest-menu":undefined} key={item.key} aria-haspopup="dialog" aria-expanded={place===item.key} aria-current={place===item.key?"true":undefined} onClick={()=>open(item.key)}><ForestIcon name={item.icon}/><span>{item.label}</span></button>)}</nav>
    </footer>
    <dialog ref={dialog} className="game-overlay forest-map" aria-modal="true" aria-labelledby="game-panel-title" onCancel={e=>{if(e.target===e.currentTarget)setPlace(null);}} onClose={e=>{if(e.target===e.currentTarget)setPlace(null);}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div ref={panelScroll} className="game-panel" data-place={place}>
        <div className="game-panel-top"><ReviewAwareLink href="/base-camp" onClick={close}>DYDD · Field guide</ReviewAwareLink><button ref={closeButton} className="game-close forest-close" onClick={close} aria-label="Close panel">×</button></div>
        {current&&<><h2 id="game-panel-title">{current.title}</h2><p className="game-lead">{current.lead}</p>
          {current.links&&<div className={`game-tiles ${place==="trails"?"game-trails":""}`}>{current.links.map((item,i)=>item.panel?<button key={item.title} className="game-tile" onClick={()=>open(item.panel!)}><ForestIcon name={places.find(p=>p.key===item.panel)?.icon||"compass"}/><strong>{item.title}</strong><span>{item.copy}</span></button>:<ReviewAwareLink key={item.title} className="game-tile" href={item.href!} onClick={close}>{place==="trails"?<span className="game-trail-number">0{i+1}</span>:<ForestIcon name="journey"/>}<strong>{item.title}</strong><span>{item.copy}</span><b aria-hidden="true">→</b></ReviewAwareLink>)}</div>}
          {profileAccount && !atCamp && <ReviewAwareLink className="game-tile" href={place==="passport"?"/base-camp#passport":"/base-camp#your-profile"} onClick={close}><strong>{place==="passport"?"Open your Passport Book":"Open account & profile"}</strong><span>Return to your connected Base Camp record.</span><b aria-hidden="true">→</b></ReviewAwareLink>}
        </>}
        {atCamp&&<div className="game-account-content" hidden={!profileAccount} data-account-view={place}>{children}</div>}
        <button className="game-back" onClick={close}>← {atCamp?"Return to Base Camp":"Return to the trail"}</button>
        <div className="game-panel-support"><ReviewAwareLink href="/login" onClick={close}>Sign in</ReviewAwareLink><ReviewAwareLink href="/contact" onClick={close}>Contact</ReviewAwareLink><ReviewAwareLink href="/privacy" onClick={close}>Privacy</ReviewAwareLink><ReviewAwareLink href="/terms" onClick={close}>Terms</ReviewAwareLink></div>
      </div>
    </dialog>
  </div>;
}

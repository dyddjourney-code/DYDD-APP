"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DydiAdventure, type SceneRequest } from "@/components/dydi-adventure";
import { DestinationRoom } from "@/components/destination-room";
import { EnvironmentRoute } from "@/components/environment-route";
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
  const [sceneRequest,setSceneRequest]=useState<SceneRequest|null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement|null>(null);
  const panelScroll = useRef<HTMLDivElement>(null);

  function close() { dialog.current?.close();setPlace(null);previousFocus.current?.focus(); }
  function open(key:Place) {
    if(atCamp&&(key==="map"||key==="ranger")){dialog.current?.close();setPlace(null);setSceneRequest(previous=>({stop:key==="map"?"relief":"station",serial:(previous?.serial??0)+1}));return;}
    if (!dialog.current?.open) previousFocus.current=document.activeElement as HTMLElement;
    setPlace(key);
    if (!dialog.current?.open) dialog.current?.showModal();
    panelScroll.current?.scrollTo(0,0);
  }
  useEffect(()=>{ dialog.current?.close();setPlace(null); },[pathname]);
  useEffect(()=>{
    if(!place)return;
    dialog.current?.querySelector<HTMLButtonElement>(".destination-return")?.focus();
    const before=document.body.style.overflow;document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=before;};
  },[place]);
  useEffect(()=>{
    function hash(){if(location.hash==="#passport")open("passport");else if(location.hash==="#your-profile"||location.hash==="#purchases")open("profile");}
    hash();window.addEventListener("hashchange",hash);return ()=>window.removeEventListener("hashchange",hash);
  },[pathname]);
  return <div className={`game-world ${atCamp?"game-at-camp":"game-on-trail"}`}>
    <a className="forest-skip" href="#forest-content">Skip to content</a>
    <header className="game-top">
      <ReviewAwareLink href="/base-camp" className="game-mark" aria-label="DYDD Base Camp"><img src="/brand/dydd-logo-white-correct.png" width={2500} height={785} alt="Discover Your Divine Design"/></ReviewAwareLink>
      <div className="game-location"><ForestIcon name={atCamp?"camp":"journey"}/><span>{atCamp?"Base Camp":"On the trail"}</span></div>
      <button className="game-profile" onClick={()=>open("profile")}>Traveler profile</button>
    </header>
    {atCamp ? <main id="forest-content" className="adventure-main" tabIndex={-1}><DydiAdventure request={sceneRequest} onPassport={()=>open("passport")}/></main> : <EnvironmentRoute pathname={pathname}><div className="game-route" id="forest-content" tabIndex={-1}>
      <ReviewAwareLink className="game-return" href="/base-camp">← Return to Base Camp</ReviewAwareLink>
      <div className="game-reading">{children}</div>
      <footer className="game-support"><ReviewAwareLink href="/contact">Contact</ReviewAwareLink><ReviewAwareLink href="/privacy">Privacy</ReviewAwareLink><ReviewAwareLink href="/terms">Terms</ReviewAwareLink></footer>
    </div></EnvironmentRoute>}
    <footer className="game-bottom">
      <nav className="forest-dock game-dock" aria-label="Camp navigation">{places.map(item=><button className={item.key==="map"?"forest-menu":undefined} key={item.key} aria-haspopup={atCamp&&(item.key==="map"||item.key==="ranger")?undefined:"dialog"} aria-expanded={atCamp&&(item.key==="map"||item.key==="ranger")?undefined:place===item.key} aria-current={place===item.key?"true":undefined} onClick={()=>open(item.key)}><ForestIcon name={item.icon}/><span>{item.label}</span></button>)}</nav>
    </footer>
    <dialog ref={dialog} className="game-overlay" aria-modal="true" aria-labelledby="game-panel-title" onCancel={e=>{if(e.target===e.currentTarget)setPlace(null);}} onClose={e=>{if(e.target===e.currentTarget)setPlace(null);}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
      <div ref={panelScroll} className="game-panel destination-room" data-place={place}>
        {place&&<DestinationRoom key={place} place={place} onClose={close} onPlace={open} atCamp={atCamp}>{children}</DestinationRoom>}
      </div>
    </dialog>
  </div>;
}

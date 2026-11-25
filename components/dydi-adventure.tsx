"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrivalReliefMap } from "@/components/arrival-relief-map";
import { RangerDesk } from "@/components/ranger-desk";
import { ReviewAwareLink } from "@/components/review-aware-link";
import styles from "./dydi-adventure.module.css";

type Stop = "camp" | "trail" | "desk" | "relief" | "doorway" | "classroom";
type Detail = "desk" | "passport" | null;
const stops: Stop[] = ["camp", "trail", "desk", "relief", "doorway", "classroom"];
const scenes: Record<Stop, { place: string; title: string; subtitle: string; caption: string; cta: string }> = {
  camp: {place:"Base Camp", title:"A little wonder.\nA faithful next step.", subtitle:"An invitation to discover what God has been forming in you.", caption:"Welcome to Base Camp. There’s no race here. The forest trail leads to the Ranger Station, a place to find your bearings and choose a faithful next step.", cta:"Follow the forest trail"},
  trail: {place:"The forest trail",title:"Many trails.\nOne unfolding story.",subtitle:"The full Journey connects the pieces. Focused trails let you explore one discovery at a time.",caption:"Take a look at the trails ahead. The full Journey brings the pieces together. The shorter paths let you explore one part of your design at a time.",cta:"Enter the Ranger Station"},
  desk: {place:"Ranger Station · The desk",title:"Come in.\nFind your bearings.",subtitle:"A place for your questions, before you choose your path.",caption:"Come on in. This is the Ranger Station. Bring your questions to the desk, or approach the relief table to see how the journey fits together.",cta:"Walk to the relief table"},
  relief: {place:"Ranger Station · Relief table",title:"See the landscape.\nChoose with purpose.",subtitle:"See the whole park. Trace a trail, then look closer.",caption:"Look across the whole landscape, pan along its trails, and select a place to see what waits there.",cta:"Find the Learning Center"},
  doorway: {place:"Ranger Station · Learning Center doorway",title:"There’s room\nto learn here.",subtitle:"Just past the desk and relief table. The next doorway leads into your classroom.",caption:"Just past the map table is the Learning Center. This is the doorway into your classroom. Step inside and settle in for the Journey.",cta:"Step into the Learning Center"},
  classroom: {place:"Learning Center · Journey classroom",title:"Settle in.\nYour Journey awaits.",subtitle:"The familiar course. A quieter place to read, listen and reflect.",caption:"Welcome to the Learning Center. Your course follows the familiar modules and lessons on the left. Read, listen to your companions, then make room to reflect. Your existing lessons and saved work are still here.",cta:"Open the Journey course"},
};
const passportCaption="Your Passport records real milestones from your journey. We don’t hand out points for looking around. As you complete the existing missions and assessments, your earned badges tell the story.";

/** A presentation-only arrival. No account/progress API calls or synthetic awards. */
export function DydiAdventure({ onPassport }: { onPassport: () => void }) {
  const [stop,setStop]=useState<Stop>("camp");
  const [destination,setDestination]=useState<Stop|null>(null);
  const [walking,setWalking]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(false);
  const [motionPaused,setMotionPaused]=useState(false);
  const [detail,setDetail]=useState<Detail>(null);
  const [intent,setIntent]=useState<"explore"|"begin"|null>(null);
  const [ready,setReady]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const stage=useRef<HTMLElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const opener=useRef<HTMLElement|null>(null);
  const pendingArrivalFocus=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const s=scenes[stop];
  const quiet=reducedMotion||motionPaused;

  useEffect(()=>{
    const m=matchMedia("(prefers-reduced-motion: reduce)");
    const change=()=>setReducedMotion(m.matches);
    change();m.addEventListener("change",change);setReady(true);
    for (const src of ["/brand/environments/ranger.webp", "/brand/environments/archive.webp", "/brand/adventure/relief-landscape.webp"]) { const image = new Image(); image.src = src; }
    return()=>{m.removeEventListener("change",change);if(timer.current)clearTimeout(timer.current);};
  },[]);
  useEffect(()=>{
    if(!detail)return;
    dialog.current?.showModal();
    const before=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{dialog.current?.close();document.body.style.overflow=before;};
  },[detail]);
  useEffect(()=>{
    if(quiet&&destination)arrive(destination);
  },[quiet,destination]);
  useLayoutEffect(()=>{
    if(!walking&&pendingArrivalFocus.current){
      heading.current?.focus({preventScroll:true});
      pendingArrivalFocus.current=false;
    }
  },[stop,walking]);
  function arrive(next:Stop){
    if(timer.current)clearTimeout(timer.current);
    pendingArrivalFocus.current=true;
    setStop(next);setDestination(null);setWalking(false);
  }
  function travel(next:Stop){
    if(walking||next===stop)return;
    setDestination(next);setWalking(true);
    setDetail(null);
    if(quiet){arrive(next);return;}
    timer.current=setTimeout(()=>arrive(next),4200);
  }
  function openDetail(next:Detail){opener.current=document.activeElement as HTMLElement;setDetail(next);}
  function closeDetail(){setDetail(null);requestAnimationFrame(()=>opener.current?.focus({preventScroll:true}));}
  const interior=stop==="desk"||stop==="relief"||stop==="doorway";
  return <section ref={stage} className={`${styles.adventure} ${quiet?styles.quiet:""} ${walking?styles.travelling:""} ${interior?styles.interior:""}`} data-stop={stop} data-destination={destination??""} data-motion={quiet?"reduced":"full"} aria-labelledby="adventure-title">
    <div className={styles.world} aria-hidden="true">
      <div key={interior?"station":stop==="classroom"?"classroom":"forest"} className={`${styles.art} ${interior?styles.station:stop==="classroom"?styles.classroom:styles.forest}`} />
      <div className={styles.sunlight}/><div className={styles.atmosphere}/>
      {!interior&&stop!=="classroom"&&<svg className={styles.trailLine} viewBox="0 0 1000 600" preserveAspectRatio="none"><path d="M680 610 Q440 470 560 380 T640 230"/></svg>}
    </div>
    <header className={styles.sceneHeader}>
      <span className={styles.eyebrow}>Discover Your Divine Design</span>
      <nav aria-label="Your route" className={styles.route}>
        <button disabled={walking||!ready} onClick={()=>travel("camp")} aria-current={stop==="camp"||stop==="trail"?"step":undefined}>Base Camp</button><span aria-hidden="true">—</span>
        <button disabled={walking||!ready} onClick={()=>travel("desk")} aria-current={interior?"step":undefined}>Ranger Station</button><span aria-hidden="true">—</span>
        <button disabled={walking||!ready} onClick={()=>travel("doorway")} aria-current={stop==="doorway"||stop==="classroom"?"step":undefined}>Learning Center</button>
      </nav>
    </header>
    <div className={styles.copy} key={stop}>
      <p className={styles.place}>{s.place}</p>
      <h1 ref={heading} tabIndex={-1} id="adventure-title">{s.title.split("\n").map((line,i)=><span key={line}>{i>0&&<br/>}{line}</span>)}</h1>
      <p className={styles.subtitle}>{s.subtitle}</p>
    </div>
    {interior&&<button className={`${styles.door} ${stop==="doorway"?styles.doorActive:""}`} disabled={walking||!ready} onClick={()=>travel(stop==="doorway"?"classroom":"doorway")} aria-label="Learning Center doorway: enter the classroom"><span>LEARNING CENTER</span><small>Journey classroom <b aria-hidden="true">↗</b></small></button>}
    {stop==="desk"&&!walking&&<div className={styles.sceneObjects} aria-label="Objects in the Ranger Station"><button onClick={()=>travel("relief")} className={styles.mapObject}><span aria-hidden="true">01</span> Explore the relief map</button><button onClick={()=>openDetail("desk")} className={styles.deskObject}><span aria-hidden="true">02</span> Ask at the ranger desk</button></div>}
    {stop==="trail"&&!walking&&<div className={styles.signpost} aria-label="Trail choices"><span>The trails ahead</span><button onClick={()=>{setIntent("explore");travel("desk");}}>Help me see the whole picture <b>→</b></button><button onClick={()=>{setIntent("begin");travel("doorway");}}>I’m ready for the Journey <b>→</b></button><ReviewAwareLink href="/trailheads">Explore a focused trail <b>↗</b></ReviewAwareLink></div>}
    {stop==="relief"&&<div inert={walking}><ArrivalReliefMap reducedMotion={quiet} onOrient={travel}/></div>}
    <div className={styles.bottom}>
      <div className={styles.guideVoice}>
        <div className={styles.voiceHeader}><span className={styles.voiceName}>{walking?"On the trail":s.place}</span><div className={styles.voiceControls}><button onClick={()=>{if(destination&&!quiet)arrive(destination);setMotionPaused(!motionPaused);}} disabled={!ready||reducedMotion} aria-pressed={quiet} aria-label={reducedMotion?"Reduced motion is enabled on your device":quiet?"Enable scene motion":"Pause scene motion"}>{reducedMotion?"Reduced motion":quiet?"Motion off":"Motion on"}</button></div></div>
        <p className={styles.caption} aria-live="polite" aria-atomic="true">{walking?"Follow the path. The next place is just ahead.":s.caption}</p>
      </div>
      <div className={styles.actions}>
        {walking?<><span className={styles.walkingLabel}>Travelling to {destination?scenes[destination].place:"the next stop"}…</span><button className={styles.primary} onClick={()=>destination&&arrive(destination)}>Arrive now <span>→</span></button></>:<>
          {stop==="classroom"?<ReviewAwareLink className={styles.primary} href="/journey">{s.cta}<span aria-hidden="true">→</span></ReviewAwareLink>:<button className={styles.primary} disabled={!ready} aria-busy={!ready} onClick={()=>travel(stops[stops.indexOf(stop)+1])}>{s.cta}<span aria-hidden="true">→</span></button>}
          <div className={styles.secondary}>
            {stop!=="camp"&&<button onClick={()=>travel(stops[stops.indexOf(stop)-1])}>← Previous stop</button>}
            {stop==="camp"&&<button onClick={()=>openDetail("passport")}>What goes in my Passport?</button>}
            {stop==="desk"&&<button onClick={()=>openDetail("desk")}>I have a question</button>}

            {stop==="classroom"&&<button onClick={()=>openDetail("passport")}>How milestones work</button>}
          </div>
        </>}
      </div>
    </div>
    <p className={styles.stopNumber} aria-label={`Stop ${stops.indexOf(stop)+1} of ${stops.length}`}>{String(stops.indexOf(stop)+1).padStart(2,"0")} <span>/ {String(stops.length).padStart(2,"0")}</span>{intent&&<small>{intent==="explore"?"Taking the scenic route":"Ready to begin"}</small>}</p>
    <dialog ref={dialog} className={styles.detail} aria-labelledby="adventure-detail-title" onCancel={e=>{if(e.target===e.currentTarget){e.preventDefault();closeDetail();}}} onClick={e=>{if(e.target===e.currentTarget)closeDetail();}}>
      <div className={styles.detailInner}>
        <header><h2 id="adventure-detail-title">{detail==="desk"?"At the ranger desk":"Your story, not a score"}</h2><button onClick={closeDetail} aria-label="Close exploration">×</button></header>
        {detail==="desk"&&<RangerDesk unhosted/>}
        {detail==="passport"&&<div className={styles.passport}><img src="/brand/badges/identity-badge.png" alt="Identity milestone badge"/><p>{passportCaption}</p><button className={styles.primary} onClick={()=>{closeDetail();onPassport();}}>Open my real Passport <span>→</span></button></div>}
        <button className={styles.return} onClick={closeDetail}>Return to the trail</button>
      </div>
    </dialog>
  </section>;
}

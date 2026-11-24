"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { DydiCharacter } from "@/components/dydi-character";
import { RangerReliefMap } from "@/components/ranger-relief-map";
import { RangerDesk } from "@/components/ranger-desk";
import { ReviewAwareLink } from "@/components/review-aware-link";
import styles from "./dydi-adventure.module.css";

type Stop = "camp" | "trail" | "desk" | "relief" | "doorway" | "classroom";
type Detail = "map" | "desk" | "passport" | null;
const stops: Stop[] = ["camp", "trail", "desk", "relief", "doorway", "classroom"];
const scenes: Record<Stop, { place: string; title: string; subtitle: string; caption: string; cta: string; x: number; y: number; scale: number }> = {
  camp: {place:"Base Camp", title:"A little wonder.\nA faithful next step.", subtitle:"An invitation to discover what God has been forming in you.", caption:"Welcome to Base Camp. I’m Dydi. There’s no race here. Walk with me to the Ranger Station, and we’ll find a good place for your journey to begin.", cta:"Walk with Dydi", x:68, y:80, scale:1},
  trail: {place:"The forest trail",title:"Many trails.\nOne unfolding story.",subtitle:"The full Journey connects the pieces. Focused trails let you explore one discovery at a time.",caption:"Take a look at the trails ahead. The full Journey brings the pieces together. The shorter paths let you explore one part of your design at a time.",cta:"Enter the Ranger Station",x:53,y:80,scale:.86},
  desk: {place:"Ranger Station · The desk",title:"Come in.\nFind your bearings.",subtitle:"A place for your questions, before you choose your path.",caption:"Come on in. This is the Ranger Station. Bring your questions to the desk, or join me at the relief table to see how the journey fits together.",cta:"Walk to the relief table",x:73,y:80,scale:.98},
  relief: {place:"Ranger Station · Relief table",title:"See the landscape.\nChoose with purpose.",subtitle:"Explore the working map. Every place has a part to play.",caption:"This is our working map. Base Camp is where you return. Trailheads open the courses. Your Field Kit holds discoveries. And Fireside makes room to walk with others. Choose a place on the map and take a closer look.",cta:"Find the Learning Center",x:57,y:80,scale:.9},
  doorway: {place:"Ranger Station · Learning Center doorway",title:"There’s room\nto learn here.",subtitle:"Just past the desk and relief table. The next doorway leads into your classroom.",caption:"Just past the map table is the Learning Center. This is the doorway into your classroom. Come through with me, and we’ll settle in for the Journey.",cta:"Step into the Learning Center",x:66,y:77,scale:.65},
  classroom: {place:"Learning Center · Journey classroom",title:"Settle in.\nYour Journey awaits.",subtitle:"The familiar course. A quieter place to read, listen and reflect.",caption:"Welcome to the Learning Center. Your course follows the familiar modules and lessons on the left. Read, listen to your companions, then make room to reflect. Your existing lessons and saved work are still here.",cta:"Open the Journey course",x:75,y:80,scale:.93},
};
const passportCaption="Your Passport records real milestones from your journey. We don’t hand out points for looking around. As you complete the existing missions and assessments, your earned badges tell the story.";

/** A presentation-only arrival. No account/progress API calls or synthetic awards. */
export function DydiAdventure({ onPassport }: { onPassport: () => void }) {
  const [stop,setStop]=useState<Stop>("camp");
  const [destination,setDestination]=useState<Stop|null>(null);
  const [walking,setWalking]=useState(false);
  const [sound,setSound]=useState(false);
  const [captions,setCaptions]=useState(true);
  const [speaking,setSpeaking]=useState(false);
  const [cue,setCue]=useState("");
  const [audioError,setAudioError]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(false);
  const [motionPaused,setMotionPaused]=useState(false);
  const [detail,setDetail]=useState<Detail>(null);
  const [intent,setIntent]=useState<"explore"|"begin"|null>(null);
  const [ready,setReady]=useState(false);
  const dialog=useRef<HTMLDialogElement>(null);
  const audio=useRef<HTMLAudioElement>(null);
  const stage=useRef<HTMLElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const opener=useRef<HTMLElement|null>(null);
  const guide=useRef<HTMLDivElement>(null);
  const travelFrom=useRef<string|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const s=scenes[stop];
  const quiet=reducedMotion||motionPaused;
  const track=detail==="passport"?"passport":stop;

  useEffect(()=>{
    const m=matchMedia("(prefers-reduced-motion: reduce)");
    const change=()=>setReducedMotion(m.matches);
    change();m.addEventListener("change",change);setReady(true);
    for (const src of ["/brand/environments/ranger.webp", "/brand/environments/archive.webp", "/brand/adventure/ranger-table-mask.png", "/brand/adventure/archive-table-mask.png"]) { const image = new Image(); image.src = src; }
    return()=>{m.removeEventListener("change",change);if(timer.current)clearTimeout(timer.current);};
  },[]);
  useEffect(()=>{
    const el=stage.current;if(!el)return;
    const resize=()=>{el.style.setProperty("--stage-w",`${el.clientWidth}px`);el.style.setProperty("--stage-h",`${el.clientHeight}px`);};
    resize();const observer=new ResizeObserver(resize);observer.observe(el);return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const a=audio.current;if(!a)return;
    a.pause();setSpeaking(false);setCue("");setAudioError(false);
    if(sound&&!walking){a.load();void a.play().catch(()=>setAudioError(true));}
    return()=>a.pause();
  },[sound,walking,track]);
  useEffect(()=>{
    if(!detail)return;
    dialog.current?.showModal();
    const before=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{dialog.current?.close();document.body.style.overflow=before;};
  },[detail]);
  useLayoutEffect(()=>{
    const el=guide.current;
    if(!el||!walking||quiet||!travelFrom.current)return;
    // Snapshot both endpoints explicitly: unregistered custom-property updates
    // can otherwise resolve to the destination before a CSS transition starts.
    const animation=el.animate([{transform:travelFrom.current},{transform:getComputedStyle(el).transform}],{duration:4200,easing:"cubic-bezier(.37,0,.22,1)"});
    return()=>animation.cancel();
  },[walking,destination,quiet]);
  function arrive(next:Stop){
    if(timer.current)clearTimeout(timer.current);
    setStop(next);setDestination(null);setWalking(false);
    requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));
  }
  function travel(next:Stop){
    if(walking||next===stop)return;
    travelFrom.current=guide.current?getComputedStyle(guide.current).transform:null;
    audio.current?.pause();setSpeaking(false);setDestination(next);setWalking(true);
    setDetail(null);
    if(quiet){arrive(next);return;}
    timer.current=setTimeout(()=>arrive(next),4200);
  }
  function openDetail(next:Detail){opener.current=document.activeElement as HTMLElement;setDetail(next);}
  function closeDetail(){setDetail(null);requestAnimationFrame(()=>opener.current?.focus({preventScroll:true}));}
  function onCueChange(){
    const active=audio.current?.textTracks[0]?.activeCues;
    if(active?.length)setCue((active[0] as VTTCue).text);
  }
  const inDoorway=walking&&stop==="doorway"&&destination==="classroom";
  const toStation=walking&&stop==="trail"&&destination==="desk";
  const pose=inDoorway?{x:69,y:56,scale:.36}:toStation?{x:65,y:65,scale:.5}:walking&&destination?scenes[destination]:s;
  const mobilePose=inDoorway?{x:69,y:46,scale:.36}:toStation?{x:68,y:53,scale:.5}:(destination??stop)==="relief"?{x:40,y:65,scale:.76}:(destination??stop)==="doorway"?{x:68,y:63,scale:.65}:(destination??stop)==="trail"?{x:78,y:67,scale:.82}:{x:70,y:67,scale:.86};
  const characterStyle={"--guide-x":pose.x/100,"--guide-y":pose.y/100,"--guide-scale":pose.scale,"--phone-guide-x":mobilePose.x/100,"--phone-guide-y":mobilePose.y/100,"--phone-guide-scale":mobilePose.scale} as CSSProperties;
  const interior=stop==="desk"||stop==="relief"||stop==="doorway";
  return <section ref={stage} className={`${styles.adventure} ${quiet?styles.quiet:""} ${walking?styles.travelling:""} ${interior?styles.interior:""}`} data-stop={stop} data-destination={destination??""} data-motion={quiet?"reduced":"full"} aria-labelledby="adventure-title">
    <div className={styles.world} aria-hidden="true">
      <div key={interior?"station":stop==="classroom"?"classroom":"forest"} className={`${styles.art} ${interior?styles.station:stop==="classroom"?styles.classroom:styles.forest}`} />
      <div ref={guide} className={styles.character} style={characterStyle} data-walking={walking}>
        <div className={styles.groundShadow}/><DydiCharacter walking={walking&&!quiet} talking={speaking&&!quiet} pointing={!walking&&(stop==="relief"||stop==="doorway"||stop==="trail")} reducedMotion={quiet}/>
      </div>
      {(interior||stop==="classroom")&&<div className={styles.foreground} style={{"--scene-mask":`url("/brand/adventure/${interior?"ranger":"archive"}-table-mask.png")`} as CSSProperties}><div className={`${styles.art} ${interior?styles.station:styles.classroom}`}/></div>}
      <div className={styles.sunlight}/><div className={styles.atmosphere}/>
      {!interior&&stop!=="classroom"&&<svg className={styles.trailLine} viewBox="0 0 1000 600" preserveAspectRatio="none"><path d="M680 610 Q440 470 560 380 T640 230"/></svg>}
    </div>
    <header className={styles.sceneHeader}>
      <span className={styles.eyebrow}>A guided arrival with Dydi</span>
      <nav aria-label="Your route" className={styles.route}>
        <button disabled={walking||!ready} onClick={()=>travel("camp")} aria-current={stop==="camp"||stop==="trail"?"step":undefined}>Base Camp</button><span aria-hidden="true">—</span>
        <button disabled={walking||!ready} onClick={()=>travel("desk")} aria-current={interior?"step":undefined}>Ranger Station</button><span aria-hidden="true">—</span>
        <button disabled={walking||!ready} onClick={()=>travel("doorway")} aria-current={stop==="classroom"?"step":undefined}>Learning Center</button>
      </nav>
    </header>
    <div className={styles.copy} key={stop}>
      <p className={styles.place}>{s.place}</p>
      <h1 ref={heading} tabIndex={-1} id="adventure-title">{s.title.split("\n").map((line,i)=><span key={line}>{i>0&&<br/>}{line}</span>)}</h1>
      <p className={styles.subtitle}>{s.subtitle}</p>
    </div>
    {interior&&<button className={`${styles.door} ${stop==="doorway"?styles.doorActive:""}`} disabled={walking||!ready} onClick={()=>travel(stop==="doorway"?"classroom":"doorway")} aria-label="Learning Center doorway: enter the classroom"><span>LEARNING CENTER</span><small>Journey classroom <b aria-hidden="true">↗</b></small></button>}
    {(stop==="desk"||stop==="relief")&&!walking&&<div className={styles.sceneObjects} aria-label="Objects in the Ranger Station"><button onClick={()=>openDetail("map")} className={styles.mapObject}><span aria-hidden="true">01</span> Explore the relief map</button><button onClick={()=>openDetail("desk")} className={styles.deskObject}><span aria-hidden="true">02</span> Ask at Dydi’s desk</button></div>}
    {stop==="trail"&&!walking&&<div className={styles.signpost} aria-label="Trail choices"><span>The trails ahead</span><button onClick={()=>{setIntent("explore");travel("desk");}}>Help me see the whole picture <b>→</b></button><button onClick={()=>{setIntent("begin");travel("doorway");}}>I’m ready for the Journey <b>→</b></button><ReviewAwareLink href="/trailheads">Explore a focused trail <b>↗</b></ReviewAwareLink></div>}
    <div className={styles.bottom}>
      <div className={styles.guideVoice}>
        <div className={styles.voiceHeader}><span className={styles.voiceName}>Dydi <small>Your trail guide</small></span><div className={styles.voiceControls}><button disabled={!ready} onClick={()=>setSound(!sound)} aria-pressed={sound} aria-label={sound?"Mute Dydi’s voice":"Turn on Dydi’s voice"}>{sound?"Voice on":"Voice off"}</button><button onClick={()=>setCaptions(!captions)} aria-pressed={captions} aria-label="Toggle Dydi captions">CC</button><button onClick={()=>{if(destination&&!quiet)arrive(destination);setMotionPaused(!motionPaused);}} disabled={!ready||reducedMotion} aria-pressed={quiet} aria-label={reducedMotion?"Reduced motion is enabled on your device":quiet?"Enable scene motion":"Pause scene motion"}>{reducedMotion?"Reduced motion":quiet?"Motion off":"Motion on"}</button></div></div>
        {captions&&<p className={styles.caption} aria-live="polite" aria-atomic="true">{walking?"I’m with you. Let’s take the next step together.":(cue||s.caption)}</p>}
        {audioError&&<p className={styles.audioError} role="status">Voice couldn’t play. Captions are still available. <button onClick={()=>{setAudioError(false);void audio.current?.play().catch(()=>setAudioError(true));}}>Retry voice</button></p>}
        {!captions&&<span className={styles.captionsOff}>Captions off. You can turn them back on with CC.</span>}
      </div>
      <div className={styles.actions}>
        {walking?<><span className={styles.walkingLabel}>Walking to {destination?scenes[destination].place:"the next stop"}…</span><button className={styles.primary} onClick={()=>destination&&arrive(destination)}>Arrive now <span>→</span></button></>:<>
          {stop==="classroom"?<ReviewAwareLink className={styles.primary} href="/journey">{s.cta}<span aria-hidden="true">→</span></ReviewAwareLink>:<button className={styles.primary} disabled={!ready} aria-busy={!ready} onClick={()=>travel(stops[stops.indexOf(stop)+1])}>{s.cta}<span aria-hidden="true">→</span></button>}
          <div className={styles.secondary}>
            {stop!=="camp"&&<button onClick={()=>travel(stops[stops.indexOf(stop)-1])}>← Previous stop</button>}
            {stop==="camp"&&<button onClick={()=>openDetail("passport")}>What goes in my Passport?</button>}
            {stop==="desk"&&<button onClick={()=>openDetail("desk")}>I have a question</button>}
            {stop==="relief"&&<button onClick={()=>openDetail("map")}>Unfold the working map</button>}
            {stop==="classroom"&&<button onClick={()=>openDetail("passport")}>How milestones work</button>}
          </div>
        </>}
      </div>
    </div>
    <p className={styles.stopNumber} aria-label={`Stop ${stops.indexOf(stop)+1} of ${stops.length}`}>{String(stops.indexOf(stop)+1).padStart(2,"0")} <span>/ {String(stops.length).padStart(2,"0")}</span>{intent&&<small>{intent==="explore"?"Taking the scenic route":"Ready to begin"}</small>}</p>
    <audio ref={audio} preload="none" onTimeUpdate={onCueChange} onLoadedMetadata={()=>{if(audio.current?.textTracks[0])audio.current.textTracks[0].mode="hidden";}} onPlay={()=>setSpeaking(true)} onPause={()=>setSpeaking(false)} onEnded={()=>{setSpeaking(false);setCue("");}} onError={()=>{if(sound)setAudioError(true);}}>
      <source src={`/audio/dydi-adventure/${track}.mp3`} type="audio/mpeg"/>
      <track key={track} kind="captions" src={`/audio/dydi-adventure/${track}.vtt`} srcLang="en" label="Dydi — English" default/>
    </audio>
    <dialog ref={dialog} className={styles.detail} aria-labelledby="adventure-detail-title" onCancel={e=>{if(e.target===e.currentTarget){e.preventDefault();closeDetail();}}} onClick={e=>{if(e.target===e.currentTarget)closeDetail();}}>
      <div className={styles.detailInner}>
        <header><h2 id="adventure-detail-title">{detail==="map"?"The working relief map":detail==="desk"?"At Dydi’s desk":"Your story, not a score"}</h2><button onClick={closeDetail} aria-label="Close exploration">×</button></header>
        {detail==="map"&&<RangerReliefMap/>}{detail==="desk"&&<RangerDesk/>}
        {detail==="passport"&&<div className={styles.passport}><img src="/brand/badges/identity-badge.png" alt="Identity milestone badge"/><p>{passportCaption}</p><button className={styles.primary} onClick={()=>{closeDetail();onPassport();}}>Open my real Passport <span>→</span></button></div>}
        <button className={styles.return} onClick={closeDetail}>Return to Dydi’s walkthrough</button>
      </div>
    </dialog>
  </section>;
}

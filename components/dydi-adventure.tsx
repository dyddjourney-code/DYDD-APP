"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrivalReliefMap } from "@/components/arrival-relief-map";
import { RangerDesk } from "@/components/ranger-desk";
import { CourseBook, type CourseBookSummary } from "@/components/course-book";
import styles from "./dydi-adventure.module.css";
import { BaseCampNature } from "./base-camp-nature";

export type SceneStop = "camp" | "station" | "desk" | "relief" | "classroom";
export type SceneRequest = { stop: SceneStop; serial: number };
type Camera = "rest" | "steps" | "hallway" | "desk" | "map" | "book" | "depart";
const titles: Record<SceneStop,string> = {camp:"Welcome to Base Camp",station:"Ranger Station",desk:"Ranger Desk",relief:"Camp Map",classroom:"Learning Center"};
const art = {camp:"/brand/sandbox2-jungle.webp",station:"/brand/environments/ranger.webp",classroom:"/brand/environments/archive-closed-divine-design-20261125.webp"};
// Coordinates are percentages of the approved 1672 × 941 artwork, not the viewport.
const lanterns = {camp:[[65.4,39.8],[69.2,39],[70.8,42.1],[81,36.8],[86.3,38.7]],station:[[49.8,16.1],[21.5,30.5],[37.2,25.5],[61.5,25.5],[89.8,50.5],[11.3,13.5]],classroom:[[64,14.5],[55,23.8],[49.2,33.2],[63.8,33.2],[81.2,18],[41,45]]};

/** Presentation only: camera crops of approved art; no account/progress writes. */
export function DydiAdventure({onPassport,onProfile,dock,request,onScene,courses}:{dock?:React.ReactNode;onProfile:()=>void;courses:readonly CourseBookSummary[];onPassport:()=>void;request?:SceneRequest|null;onScene?:(stop:SceneStop)=>void}) {
  const [stop,setStop]=useState<SceneStop>("camp");
  const [camera,setCamera]=useState<Camera>("rest");
  const [destination,setDestination]=useState<SceneStop|null>(null);
  const [reduced,setReduced]=useState(false);
  const [ready,setReady]=useState(false);
  const [book,setBook]=useState(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const opener=useRef<HTMLElement|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const version=useRef(0);
  const reducedRef=useRef(false);
  const current=useRef<SceneStop>("camp");
  const pendingFocus=useRef(false);
  const requestSeen=useRef(0);
  const target=useRef<SceneStop|null>(null);
  const scene=stop==="camp"?"camp":stop==="classroom"?"classroom":"station";
  const walking=destination!==null;
  function cancel(){version.current++;if(timer.current)clearTimeout(timer.current);}
  function arrive(next:SceneStop){
    cancel();target.current=null;current.current=next;pendingFocus.current=true;
    setStop(next);setCamera(next==="desk"?"desk":"rest");setDestination(null);onScene?.(next);
  }
  function schedule(fn:()=>void,ms:number,run:number){timer.current=setTimeout(()=>{if(version.current===run)fn();},ms);}
  function cameraFrames(fn:()=>void,run:number){
    // Give the committed source plane a paint before starting its 480ms clock.
    // Otherwise a cold compositor can consume the timer before frame one.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(version.current===run)schedule(fn,480,run);}));
  }
  function travel(next:SceneStop){
    cancel();setBook(false);target.current=next;
    if(reducedRef.current||next===current.current){arrive(next);return;}
    const run=version.current;
    setDestination(next);
    // Twelve deliberate camera frames, one 480ms trip regardless of origin.
    setCamera(current.current==="camp"?"steps":next==="classroom"?"hallway":next==="desk"?"desk":next==="relief"?"map":next==="station"&&current.current==="desk"?"rest":"depart");
    cameraFrames(()=>arrive(next),run);
  }

  useEffect(()=>{
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{reducedRef.current=media.matches;setReduced(media.matches);if(media.matches&&target.current)arrive(target.current);};
    update();media.addEventListener("change",update);setReady(true);
    for(const src of Object.values(art)){const img=new Image();img.src=src;}
    return()=>{media.removeEventListener("change",update);cancel();};
  },[]);
  useEffect(()=>{if(request&&request.serial!==requestSeen.current){requestSeen.current=request.serial;travel(request.stop);}},[request]);
  useLayoutEffect(()=>{if(!walking&&pendingFocus.current){heading.current?.focus({preventScroll:true});pendingFocus.current=false;}},[stop,walking]);
  function openBook(){
    opener.current=document.activeElement as HTMLElement;cancel();
    if(reducedRef.current){setBook(true);return;}
    setCamera("book");const run=version.current;cameraFrames(()=>setBook(true),run);
  }
  function closeBook(){cancel();setBook(false);setCamera("rest");requestAnimationFrame(()=>opener.current?.focus({preventScroll:true}));}
  return <section className={`${styles.adventure} ${reduced?styles.quiet:""}`} data-stop={stop} data-destination={destination??""} data-motion={reduced?"reduced":"full"} data-camera={camera} aria-labelledby="adventure-title">
    <header className={styles.sceneHeader}>
      <nav aria-label="Your route" className={styles.route}>
        <button disabled={!ready} onClick={()=>travel("camp")} aria-current={stop==="camp"?"page":undefined}>Base Camp</button>
        <button disabled={!ready} onClick={onProfile}>Traveler Profile</button>
        <button disabled={!ready} onClick={()=>travel("station")} aria-current={scene==="station"?"page":undefined}>Ranger Station</button>
        <button disabled={!ready} onClick={()=>travel("classroom")} aria-current={stop==="classroom"?"page":undefined}>Learning Center</button>
      </nav>
    </header>
    {stop==="relief"?<div className={styles.mapScene}>
      <h1 ref={heading} tabIndex={-1} id="adventure-title" className={styles.mapTitle}>Camp Map</h1>
      <ArrivalReliefMap reducedMotion={reduced} onOrient={place=>travel(place==="desk"?"station":"camp")} onPassport={onPassport}/>
      <div className={styles.destinationDock}>{dock}</div>
    </div>:<>
      <div className={styles.sceneFrame} data-scene-frame>
        <div key={scene} className={styles.camera} data-scene-plane data-art={scene}>
          <img className={styles.art} data-source-book={scene==="classroom"?"closed":undefined} src={art[scene]} alt={scene==="camp"?"Forest walkway leading to the Ranger Station steps":scene==="station"?"Ranger Station with a relief map table, hallway ahead and ranger desk on the right":"Learning Center with a closed Discover Your Divine Design book on the reading desk"} width={1672} height={941} fetchPriority="high" draggable={false}/>
          <div className={styles.daylight} data-daylight={scene} aria-hidden="true"/>
          {scene==="camp"&&<BaseCampNature/>}
          {scene!=="camp"&&<div className={styles.emission} data-lamp-emission aria-hidden="true">{lanterns[scene].map(([x,y],i)=><img key={i} src={`/brand/lighting/${scene==="station"?"ranger":"archive"}-${i+1}.webp`} alt="" draggable={false} style={{left:`${x}%`,top:`${y}%`,width:`${2*(scene==="station"&&i===5?1.6:scene==="classroom"&&i===5?.8:i===0?.8:.5)}%`,height:`${2*(scene==="station"&&i===5?.32:scene==="classroom"&&i===5?.3:i===0?1.8:1.1)}%`,animationDelay:`${-i*.39}s`}}/>)}</div>}
          <div className={styles.lanterns} aria-hidden="true" data-lanterns>{lanterns[scene].map(([x,y],i)=><i key={`${scene}-${i}`} data-candlelight={`${scene}-${i+1}`} data-light-kind={scene==="station"&&i===5?"wall-bar":"lantern"} style={{left:`${x}%`,top:`${y}%`,animationDelay:`${-i*1.7}s`}}/>)}</div>
          {!walking&&stop==="classroom"&&<button className={styles.bookObject} data-explore-courses disabled={camera==="book"} aria-haspopup="dialog" onClick={openBook}>Explore Courses</button>}
        </div>
        <div className={styles.shade} aria-hidden="true"/>
        <h1 ref={heading} tabIndex={-1} id="adventure-title" className={styles.title}>{titles[stop]}</h1>

        {!walking&&(stop==="station"||stop==="desk")&&<nav className={`${styles.objects} ${stop==="desk"?styles.atDesk:""}`} aria-label="Ranger Station actions">
          <button className={styles.mapObject} onClick={()=>travel("relief")}>Camp Map</button>
          <button className={styles.deskObject} aria-current={stop==="desk"?"location":undefined} onClick={()=>travel("desk")}>Ranger Desk</button>
          <button className={styles.hallObject} onClick={()=>travel("classroom")}>Learning Center <span aria-hidden="true">→</span></button>
        </nav>}
        {walking&&<div className={styles.arrival} role="status">{destination==="camp"?"Returning to Base Camp":destination==="station"?"Entering Ranger Station":destination==="classroom"?"Entering Learning Center":destination==="desk"?"Approaching Ranger Desk":"Approaching Camp Map"}<button onClick={()=>arrive(destination!)}>Skip movement</button></div>}
        <div className={styles.destinationDock}>{dock}</div>
      </div>
      {stop==="desk"&&!walking&&<div className={styles.deskReturn}><button onClick={()=>travel("station")}>← Back to Ranger Station</button><details className={styles.deskGuide}><summary>Ranger guide</summary><RangerDesk unhosted/></details></div>}
    </>}
    {book&&<CourseBook courses={courses} onClose={closeBook}/>}
  </section>;
}

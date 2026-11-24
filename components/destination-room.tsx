"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReviewAwareLink } from "@/components/review-aware-link";
import { RangerReliefMap } from "@/components/ranger-relief-map";
import { RangerDesk } from "@/components/ranger-desk";

type Place = "map" | "ranger" | "trails" | "passport" | "kit" | "fireside" | "profile";
type ObjectLink = {label:string; copy:string; x:number; y:number; href?:string; action?:string};
const rooms:Record<Place,{title:string;copy:string;art:string;objects:ObjectLink[]}> = {
 ranger:{title:"Ranger Station",copy:"Come inside. Unfold the map, stop at the ranger’s desk, or step out onto a trail.",art:"ranger",objects:[
  {label:"Unfold the relief map",copy:"Explore every place and trail",x:44,y:56,action:"map"},
  {label:"Ask Dydi",copy:"Guidance at the ranger’s desk",x:85,y:61,action:"desk"},
  {label:"Find your route",copy:"Choose where to begin",x:11,y:35,action:"paths"}]},
 map:{title:"The map room",copy:"Trace a path through the whole journey. Select a named place to find out what waits there.",art:"ranger",objects:[
  {label:"Explore the relief map",copy:"Open the camp’s working map",x:44,y:56,action:"map"},
  {label:"Visit the ranger’s desk",copy:"Get help finding your bearings",x:85,y:61,action:"desk"}]},
 trails:{title:"Trailheads",copy:"The forest opens here. Take the full Journey, or choose a focused trail.",art:"trails",objects:[
  {label:"DYDD Journey",copy:"The complete guided path",x:50,y:32,href:"/journey"},
  {label:"DesignID",copy:"Understand your design",x:24,y:48,href:"/trailheads#designid"},
  {label:"Spiritual Gifts",copy:"Discover grace for service",x:73,y:48,href:"/trailheads#spiritual-gifts"},
  {label:"Fruitful Life 360",copy:"Reflect on visible growth",x:28,y:67,href:"/trailheads#fruitlife-360"},
  {label:"DesignPD",copy:"Plan, decide and do",x:75,y:68,href:"/trailheads#designpd"}]},
 passport:{title:"Your Passport Book",copy:"Open your record of the journey. Every milestone belongs to your real account.",art:"archive",objects:[]},
 profile:{title:"Traveler profile",copy:"A quiet place to look after your story, account and purchased access.",art:"archive",objects:[]},
 kit:{title:"Field Kit",copy:"Everything you bring back from the trail has a place here.",art:"archive",objects:[
  {label:"Open your workbook",copy:"Your saved Journey reflections",x:47,y:68,href:"/field-kit/reflections/discover-your-divine-design"},
  {label:"Results & reports",copy:"Open your personal Field Kit",x:77,y:47,href:"/field-kit"},
  {label:"Explore your design",copy:"Bring your discoveries together",x:48,y:35,href:"/command-center"},
  {label:"Gear for the trail",copy:"Resources to take with you",x:16,y:65,href:"/gear"}]},
 fireside:{title:"Fireside",copy:"Stay a while. Make room for encouragement, conversation, and others on the road.",art:"fireside",objects:[
  {label:"Around the fire",copy:"Teaching and encouragement",x:49,y:61,href:"/fireside"},
  {label:"Waypoints",copy:"A short pause for the road",x:25,y:43,href:"/waypoints"},
  {label:"Camp Circles",copy:"Find people to walk with",x:77,y:48,href:"/camp-circle"},
  {label:"My Circles",copy:"Return to your community",x:77,y:75,href:"/camp-circle/my-circles"},
  {label:"Live gatherings",copy:"See what is coming up",x:49,y:31,href:"/live"}]}
};
export function DestinationRoom({place,onClose,onPlace,children,atCamp}:{place:Place;onClose:()=>void;onPlace:(place:Place)=>void;children:ReactNode;atCamp:boolean}) {
 const [detail,setDetail]=useState<string|null>(null);
 const room=rooms[place],account=place==="profile"||place==="passport";
 const activeDetail=detail;
 const detailDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  if(!detail)return;
  const dialog=detailDialog.current;
  dialog?.showModal();
  return ()=>dialog?.close();
 },[detail]);
 return <section className={`destination-interior interior-${room.art} ${account?"interior-account":""}`} aria-label={room.title}>
   <img className="destination-art" src={`/brand/environments/${room.art}.webp`} alt="" fetchPriority="high"/>
   <div className="destination-shade"/>
   <header className="destination-top"><button className="destination-return" onClick={onClose}>← Return to {atCamp?"Base Camp":"the trail"}</button><span>DYDD</span><button className="game-close" onClick={onClose} aria-label="Close destination">×</button></header>
   <div className="destination-intro"><h2 id="game-panel-title">{room.title}</h2><p>{room.copy}</p>{place==="ranger"&&<ReviewAwareLink className="destination-text-link" href="/ranger-station" onClick={onClose}>Explore the full Ranger Station →</ReviewAwareLink>}{place==="trails"&&<ReviewAwareLink className="destination-text-link" href="/trailheads" onClick={onClose}>View course details & access →</ReviewAwareLink>}</div>
   {!account&&<nav className="destination-objects" aria-label={`Explore ${room.title}`}>{room.objects.map((object)=>(object.href?<ReviewAwareLink key={object.label} className={`scene-object ${object.x>65?"object-right":""}`} href={object.href} onClick={onClose} style={{left:`${object.x}%`,top:`${object.y}%`}}><span className="object-marker" aria-hidden="true">+</span><span><strong>{object.label}</strong><small>{object.copy}</small></span></ReviewAwareLink>:<button key={object.label} className={`scene-object ${object.x>65?"object-right":""}`} style={{left:`${object.x}%`,top:`${object.y}%`}} onClick={()=>setDetail(object.action!)} aria-haspopup="dialog"><span className="object-marker" aria-hidden="true">+</span><span><strong>{object.label}</strong><small>{object.copy}</small></span></button>))}</nav>}
   {account&&<div className="destination-account"><div className="game-account-content" data-account-view={place}>{atCamp?children:<ReviewAwareLink className="destination-text-link" href={place==="passport"?"/base-camp#passport":"/base-camp#your-profile"} onClick={onClose}>Open your connected {place==="passport"?"Passport Book":"profile"} →</ReviewAwareLink>}</div></div>}
   <nav className="destination-switch" aria-label="Go to another destination">{([['ranger','Ranger Station'],['trails','Trailheads'],['passport','Passport'],['kit','Field Kit'],['fireside','Fireside']] as [Place,string][]).filter(([key])=>key!==place).map(([key,label])=><button key={key} onClick={()=>{setDetail(null);onPlace(key);}}>{label} <span aria-hidden="true">↗</span></button>)}</nav>
   {activeDetail&&<dialog ref={detailDialog} onCancel={e=>{if(e.target!==e.currentTarget)return;e.preventDefault();e.stopPropagation();setDetail(null);}} className={`destination-detail detail-${activeDetail}`} aria-label={activeDetail==="map"?"Relief map":activeDetail==="desk"?"Ranger desk":"Choose your route"}>
    <header><button onClick={()=>setDetail(null)}>← Back to the room</button><button aria-label="Close object" onClick={()=>setDetail(null)}>×</button></header>
    {activeDetail==="map"?<><h3>The camp relief map</h3><RangerReliefMap/></>:activeDetail==="desk"?<RangerDesk/>:<><h3>Where will you begin?</h3><p>Walk the complete Journey for the whole picture, or take a focused path into one area of discovery.</p><ReviewAwareLink className="room-action" href="/journey" onClick={onClose}>Begin the DYDD Journey →</ReviewAwareLink><button className="room-action" onClick={()=>{setDetail(null);onPlace("trails");}}>Explore all five trails →</button><ReviewAwareLink className="room-action" href="/ranger-station#ranger-desk" onClick={onClose}>Read the ranger’s guidance →</ReviewAwareLink></>}
   </dialog>}
 </section>;
}

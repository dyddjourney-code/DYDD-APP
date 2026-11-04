"use client";
import {useEffect,useState} from "react";
import styles from "./circle-operations.module.css";
type Article={title:string;paragraphs:string[]};
type Session={prepare?:Article[];readings?:Article[];questions?:{question:string;followup:string}[];followThrough?:Article[]};
type Content={sessionOne:Session;sessionTwo:Session;sessions:Record<string,Session>};
const stages=["expertise","story","desire","spiritual-gifts","niche-preparation","declarations-commissioning"];
export function CircleParticipantGuide({circleId,session}:{circleId:string;session:number}){
 const [content,setContent]=useState<Content|null>(null),[error,setError]=useState(""),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setContent(null);setError("");fetch("/api/circles/field-guide?circle="+encodeURIComponent(circleId),{cache:"no-store",signal:controller.signal}).then(async r=>{const value=await r.json();if(!r.ok)throw Error(value.error||"Preparation could not be loaded.");if(value.participant!==true)throw Error("Participant preparation is unavailable for this role.");if(!controller.signal.aborted)setContent(value.content);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[circleId,retry]);
 const guide=content?(session===1?content.sessionOne:session===2?content.sessionTwo:content.sessions[stages[Math.min(session-3,stages.length-1)]]):null;
 return <section className={styles.panel}><h2>Your participant Field Guide</h2><p className={styles.muted}>Shared preparation and discussion prompts only. Your leader’s facilitation notes, administration, and other people’s individual progress are not included.</p>{!content&&!error&&<div className={styles.skeleton} role="status" aria-label="Loading shared preparation"/>}{error&&<p role="alert" className={styles.error}>{error} <button className={`${styles.button} ${styles.secondary}`} onClick={()=>setRetry(v=>v+1)}>Try again</button></p>}{guide&&<><h3>Prepare for session {session}</h3>{(guide.prepare||[]).map((a,i)=><article key={i}><h4>{a.title}</h4>{a.paragraphs.map((p,j)=><p key={j}>{p}</p>)}</article>)}{guide.questions?.length? <details className={styles.details}><summary>Discussion prompts to bring</summary><ol>{guide.questions.map((q,i)=><li key={i}><p>{q.question}</p><p className={styles.small}>{q.followup}</p></li>)}</ol></details>:null}{(guide.followThrough||[]).map((a,i)=><details className={styles.details} key={i}><summary>{a.title}</summary>{a.paragraphs.map((p,j)=><p key={j}>{p}</p>)}</details>)}</>}</section>;
}

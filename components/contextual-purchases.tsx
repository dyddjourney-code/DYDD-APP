"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {TestCheckoutButton} from "@/app/memberships/checkout-button";
type Access = {renewalReview:boolean;personal:boolean;lifetime:boolean;leadership:boolean;count:number;couples:boolean;verified:boolean};
export function ContextualPurchases({area,circleId,format,preview=false}:{area:"personal"|"circles";circleId?:string;format?:string;preview?:boolean}) {
 const params=useSearchParams(),[access,setAccess]=useState<Access|null>(null),[state,setState]=useState("loading"),[error,setError]=useState("");
 const reviewing=preview||Boolean(params.get("review"));
 useEffect(()=>{
  let live=true;setAccess(null);setError("");setState("loading");
  if(reviewing){setState("preview");return;}
  fetch("/api/stripe/test-purchase-options"+(circleId?"?circleId="+encodeURIComponent(circleId):""),{cache:"no-store"}).then(async r=>{
   const body=await r.json();if(!live)return;
   if(r.status===401){setState("signin");return;}
   if(!r.ok)throw Error(body.error||"Your access could not be checked.");
   setAccess(body);setState("ready");
  }).catch(e=>{if(live){setError(e.message);setState("error");}});
  return()=>{live=false;};
 },[circleId,reviewing]);
 const destination=area==="personal"?"/hq#purchases":"/camp-circle/my-circles"+(circleId?"?circle="+circleId:"");
 const canBuy=state==="ready"&&access?.verified;
 const needsIdentity=state==="signin"||state==="preview";
 const personal=<>{access?.personal?<p>{access.lifetime?"Lifetime personal all-access is included. No payment needed.":"Your personal TEST membership is active."}</p>:<><p>Your own personal membership · $10/month. Separate from Circle leadership and add-ons.</p>{canBuy&&<TestCheckoutButton capability="personal" label="Start personal membership · $10/month"/>}</> }</>;
 return <section className="contextual-purchases" aria-label={area==="personal"?"Personal membership purchase":"Circle purchase options"}>
  <p className="section-label">Sandbox · Stripe TEST payments · No real charges</p>
  {area==="personal"?<><h3>Personal membership · $10/month</h3>{personal}</>:<>
   <h3>{format==="Couple"?"This Couples Circle":"Circle access"}</h3>
   {!access?.personal&&personal}
   {(!format||format!=="Couple")&&<><p><strong>Circle Leadership · additional $20/month</strong></p><p>$10/month at 10 qualifying paid participants; $0/month at 20. Eligibility is rechecked at renewal. Personal membership stays separate.</p>{access&&<p>{access.count} qualifying paid participants · current renewal price ${access.count>=20?0:access.count>=10?10:20}/month.</p>}{access?.leadership?<p>Circle Leadership is active in TEST mode.</p>:canBuy&&access?.personal?<TestCheckoutButton capability="circle_leadership" label="Start Circle Leadership · $20/month before qualifying discounts"/>:null}</>}
   {(!format||format==="Couple")&&<><p><strong>Couples Circle · $5 once per saved couple</strong></p><p>Both people need their own personal membership. This unlock covers only the selected Circle.</p>{access?.couples?<p>This Couples Circle is unlocked in TEST mode.</p>:circleId&&canBuy&&access?.personal?<TestCheckoutButton capability="couples_circle" scopeId={circleId} label="Unlock this Couples Circle · $5 once"/>:<p>{circleId?"Activate your personal membership first.":"Save a Couples Circle draft, then open it in My Circles to unlock that couple."}</p>}</>}
  </>}
  {access?.renewalReview&&<p role="alert">A TEST leadership renewal needs billing review because its invoice was finalized before eligibility could be applied. Your personal membership is unchanged.</p>}
  {state==="loading"&&<p role="status">Checking your current access…</p>}
  {needsIdentity&&<p>Preview shows prices without creating a purchasing identity. <Link href={"/login?next="+encodeURIComponent(destination)}>Sign in to your sandbox account to purchase</Link>.</p>}
  {access&&!access.verified&&<p>Verify your sandbox account email before purchasing.</p>}
  {error&&<p role="alert">{error}</p>}
  {params.get("checkout")==="returned"&&<p role="status">You returned from Stripe. Access is confirmed only by the verified payment notification. <a href={destination}>Refresh access</a>.</p>}
  {params.get("checkout")==="cancelled"&&<p role="status">Checkout cancelled. No new access was granted.</p>}
 </section>;
}

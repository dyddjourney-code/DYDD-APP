"use client";
import {useEffect,useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {ReviewAwareLink} from "@/components/review-aware-link";
import {TestSubscriptionControls} from "@/components/test-subscription-controls";
import {TestCheckoutButton} from "@/app/memberships/checkout-button";
type Access = {renewalReview:boolean;personal:boolean;lifetime:boolean;leadership:boolean;count:number;couples:boolean;verified:boolean};
export function ContextualPurchases({area,circleId,format,preview=false}:{area:"personal"|"circles"|"designpd";circleId?:string;format?:string;preview?:boolean}) {
 const params=useSearchParams(),[access,setAccess]=useState<Access|null>(null),[state,setState]=useState(preview?"preview":"loading"),[error,setError]=useState("");
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
 const destination=area==="personal"?"/hq#purchases":area==="designpd"?"/designpd":"/camp-circle/my-circles"+(circleId?"?circle="+circleId:"");
 const canBuy=state==="ready"&&access?.verified;
 const signin=(label:string)=><Link className="button primary" href={"/login?next="+encodeURIComponent(destination)}>{label}</Link>;
 const startPersonal=canBuy?<TestCheckoutButton capability="personal" label="Start personal membership"/>:state==="preview"||state==="signin"?signin("Start personal membership"):null;
 const personal=<article className="purchase-offer personal-membership-offer"><p className="section-label">Your personal journey</p><h3>Personal membership</h3><p className="purchase-price">$10 <span>/ month</span></p><p>Discover how God has uniquely designed you—and take practical steps to live with greater purpose in your relationships, work, and service.</p><ul><li>Discover Your Divine Design (DYDD) Journey</li><li>DesignID assessment and class</li><li>Fruitful Life 360 assessment and class</li><li>Spiritual Gifts assessment and class</li><li>Waypoints</li><li>Free seats for eligible live virtual events identified as included with Personal membership</li></ul><p className="purchase-fine-print">Check each live virtual event’s listing for membership inclusion. Not all events are included.</p>{access?.personal?<p className="purchase-active">{access.lifetime?"Included in your lifetime personal all-access. No payment needed.":"Your personal membership is active."}</p>:<>{startPersonal}</>}</article>;
 return <section className="contextual-purchases" aria-label={area==="personal"?"Personal membership purchase":area==="designpd"?"DesignPD purchase":"Circle purchase options"}>
  {area==="circles"&&!access?.personal&&<p className="purchase-prerequisite"><strong>A Personal membership is required to continue.</strong> <ReviewAwareLink href="/hq#purchases">Go to Base Camp Purchases</ReviewAwareLink>.</p>}
  <div className="purchase-offer-grid">
  {area==="personal"?personal:area==="designpd"?<article className="purchase-offer"><p className="section-label">Plan · Decide · Do</p><h3>DesignPD report + supporting course</h3><p className="purchase-price">$15 <span>/ saved DesignID result · one time</span></p><ul><li>Your practical Plan, Decide, Do report</li><li>The supporting DesignPD course</li><li>Reopen and download your purchased report</li></ul><p>Complete DesignID first. Each new DesignID result can be unlocked separately.</p>{reviewing?signin("Unlock DesignPD report"): <ReviewAwareLink className="button primary" href="/designid">Start DesignID</ReviewAwareLink>}</article>:<>
   {(!format||format!=="Couple")&&<article className="purchase-offer"><p className="section-label">Lead a Small Group or Class</p><h3>Circle Leadership</h3><p className="purchase-price">$20 <span>/ month · additional</span></p><ul><li>Lead your own Small Group or Class Circle</li><li>$10/month at 10 qualifying paid participants</li><li>$0/month at 20 qualifying paid participants</li></ul><p className="purchase-fine-print">Discounts are rechecked at renewal. Your personal membership stays separate.</p>{access&&<p>{access.count} qualifying paid participants · next renewal estimate ${access.count>=20?0:access.count>=10?10:20}/month.</p>}{access?.leadership?<p className="purchase-active">Circle Leadership is active.</p>:canBuy&&access?.personal?<TestCheckoutButton capability="circle_leadership" label="Start Circle Leadership"/>:state==="preview"||state==="signin"?signin("Start Circle Leadership"):<ReviewAwareLink className="button secondary" href="/hq#purchases">Go to Base Camp Purchases</ReviewAwareLink>}</article>}
   {(!format||format==="Couple")&&<article className="purchase-offer"><p className="section-label">Journey as a couple</p><h3>Couples Circle</h3><p className="purchase-price">$5 <span>/ saved couple · one time</span></p><ul><li>Unlock the selected Couples Circle</li><li>Both people use their own personal memberships</li></ul><p className="purchase-fine-print">This unlock applies only to this couple, not every Circle.</p>{access?.couples?<p className="purchase-active">This Couples Circle is unlocked.</p>:circleId&&canBuy&&access?.personal?<TestCheckoutButton capability="couples_circle" scopeId={circleId} label="Unlock this Couples Circle"/>:!circleId?<ReviewAwareLink className="button secondary" href="/camp-circle/my-circles#start-circle">Set up a Couples Circle</ReviewAwareLink>:state==="preview"||state==="signin"?signin("Unlock this Couples Circle"):<ReviewAwareLink className="button secondary" href="/hq#purchases">Go to Base Camp Purchases</ReviewAwareLink>}</article>}
  </>}
  </div>
  {area!=="personal"&&state==="preview"&&<p className="purchase-fine-print">Sign in with your own account to continue to checkout.</p>}
  {access?.renewalReview&&<p role="alert">Your leadership renewal needs billing review. Your personal membership is unchanged.</p>}
  {state==="loading"&&<p role="status">Checking your current access…</p>}
  {access&&!access.verified&&<p>Verify your account email before purchasing. <Link href="/login">Return to sign in</Link>.</p>}
  {error&&<p role="alert">{error} <button type="button" className="button secondary" onClick={()=>window.location.reload()}>Try again</button></p>}
  {params.get("checkout")==="returned"&&<p role="status">Your payment is being confirmed. <a href={destination}>Refresh access</a>.</p>}
  {params.get("checkout")==="cancelled"&&<p role="status">Checkout cancelled. No new access was granted.</p>}
  {!reviewing&&<TestSubscriptionControls area={area}/>}
  {area!=="personal"&&<small className="purchase-test-note">Sandbox test payments · No real charges</small>}
 </section>;
}

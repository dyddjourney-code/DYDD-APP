"use client";
import {useState} from "react";
export function TestCheckoutButton({capability,scopeId,label}:{capability:string;scopeId?:string;label:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function checkout(){setBusy(true);setError("");try{
 const response=await fetch("/api/stripe/test-checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({capability,scopeId})});
 const result=await response.json();if(!response.ok||!result.url)throw Error(result.error||"Checkout could not be opened.");
 const url=new URL(result.url);if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com")throw Error("Checkout URL could not be verified.");
 window.location.assign(url.toString());
 }catch(e){setError((e as Error).message);setBusy(false);}}
 return <><button className="button primary" disabled={busy} onClick={checkout}>{busy?"Opening secure test checkout…":label}</button>{error?<p role="alert">{error}</p>:null}</>;
}

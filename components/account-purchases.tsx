"use client";
import {useEffect,useState} from 'react';
import {TestSubscriptionControls} from '@/components/test-subscription-controls';
type Purchase={id:string;capability:string;scopeId:string;status:string;purchasedAt:string;recurring:boolean};
const labels:Record<string,string>={fruitlife_360:'Fruitful Life 360 assessment + report',personal:'Personal membership',circle_leadership:'Circle Leadership',couples_circle:'Couples Circle unlock',designpd:'DesignPD report + course'};
export function AccountPurchases({preview=false,lifetime=false}:{preview?:boolean;lifetime?:boolean}){
 const [purchases,setPurchases]=useState<Purchase[]>([]),[state,setState]=useState(preview?'preview':'loading'),[error,setError]=useState('');
 useEffect(()=>{if(preview)return;let live=true;fetch('/api/commerce/purchases',{cache:'no-store'}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||'Purchase records could not be checked.');if(live){setPurchases(b.purchases);setState('ready');}}).catch(e=>{if(live){setError(e.message);setState('error');}});return()=>{live=false;};},[preview]);
 return <div className="account-purchases"><h3>Purchases &amp; history</h3>
 {lifetime&&<p>Lifetime personal all-access · No expiry · No renewal charge.</p>}
 {state==='loading'&&<p role="status">Loading your purchase records…</p>}
 {preview?<p>Sign in with your own account to see your purchase history and subscription details.</p>:<>{state==='ready'&&!purchases.length&&<p>No completed purchases on this account yet.</p>}
 {purchases.length>0&&<ul className="account-purchase-history">{purchases.map(p=><li key={p.id}><strong>{labels[p.capability]||p.capability}</strong><span>{new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(p.purchasedAt))} · {p.status==='paid'?'Recorded purchase':p.status} · {p.recurring?'subscription':'one-time purchase'}</span>{!p.recurring&&<small>{p.capability==='designpd'?'Linked to your purchased DesignID result.':p.capability==='fruitlife_360'?'Linked to your purchased assessment session.':'Linked to your saved Couples Circle.'} Original purchase scope retained.</small>}</li>)}</ul>}
 {error&&<p role="alert">{error}</p>}
 <TestSubscriptionControls area="personal"/></>}
 </div>;
}

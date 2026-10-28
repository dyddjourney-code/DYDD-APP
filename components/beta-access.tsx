'use client';
import {useState, type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export function BetaAccess({active:initialActive,verified}:{active:boolean;verified:boolean}) {
 const [active,setActive]=useState(initialActive),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');const router=useRouter();
 async function redeem(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);setMessage('');try{const r=await fetch('/api/beta-access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const b=await r.json();setMessage(b.message||b.error);if(r.ok&&b.active){setActive(true);setCode('');router.refresh();}}catch{setMessage('Your code could not be redeemed. Please try again.');}finally{setBusy(false);}}
 return <div id="beta-access" style={{marginTop:'1.5rem',maxWidth:'36rem'}}>
  <h3>{active?'Lifetime personal all-access':'Redeem beta access code'}</h3>
  {active?<p>Your free lifetime personal all-access is active on this account. It does not expire. No payment or card is needed.</p>:<><p>Have an invitation code? Activate free lifetime access to your personal tools, reports, and courses.</p>
  {!verified?<p>Verify your account email before redeeming your code.</p>:<form onSubmit={redeem} style={{display:'grid',gap:'.75rem'}}>
   <label htmlFor="beta-code">Beta access code</label>
   <input id="beta-code" name="beta-code" value={code} onChange={e=>setCode(e.target.value)} maxLength={128} autoComplete="off" autoCapitalize="characters" spellCheck={false} required style={{width:'100%',minWidth:0,boxSizing:'border-box',padding:'.75rem',font:'inherit'}} />
   <button type="submit" className="button primary" disabled={busy}>{busy?'Redeeming…':'Redeem code'}</button>
  </form>}</>}
  <p style={{fontSize:'.9rem'}}>Personal access only; Circle seats for other people are not included. Assessment and course prerequisites still apply.</p>
  <p role="status" aria-live="polite">{message}</p>
 </div>;
}

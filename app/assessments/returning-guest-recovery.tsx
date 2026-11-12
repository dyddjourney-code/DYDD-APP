import Link from 'next/link';
import styles from './public-assessments.module.css';
import {cookies} from 'next/headers';
import {requireGuest} from '@/lib/public-assessments/guest';
import {guestSessionPath} from '@/lib/public-assessments/guest-capability';
import type {RecoveryProduct} from '@/lib/public-assessments/guest-recovery';
import {GuestRecoveryForm} from './guest-recovery-form';
/** Identity is resolved ONLY from the existing private capability, never typed email. */
export async function ReturningGuestRecovery({product}:{product:RecoveryProduct}) {
 let path:string|undefined;
 const jar=await cookies(),current=jar.get('dydd_guest_current')?.value;
 // Original issued report links set a session cookie but may predate the current pointer.
 const candidates=[...new Set([current,...jar.getAll().filter(c=>/^dydd_guest_[0-9a-f-]{36}$/.test(c.name)).map(c=>c.name.slice('dydd_guest_'.length))].filter((id):id is string=>!!id))].slice(0,10);
 for(const id of candidates)try {
  const {session}=await requireGuest(id);
  path=guestSessionPath(session.id)+'?product='+product;
  break;
 }catch{/* Invalid/expired private capabilities disclose nothing. */}
 return <section aria-label="Return to a guest assessment" style={{padding:'1.25rem',margin:'1.25rem 0',border:'1px solid #cbd5ce',borderRadius:12}}>
  <h3>Already purchased or completed DesignID?</h3>
  <p>Return to your original guest purchase and saved DesignID. You do not need to take it again to continue with DesignPD.</p>
  {path&&<p><Link className={styles.primary} href={path}>Continue with my saved guest assessment →</Link></p>}
  <details open={product==='designpd' && !path}><summary>{path?'Need access from another browser?':'Recover my guest purchase'}</summary>
   <p>Use your existing private email link, or request a fresh link below. We never display purchase details from an email address entered here.</p>
   <GuestRecoveryForm product={product}/>
  </details>
  <p>Purchased while signed in? <Link href={'/login?next='+encodeURIComponent('/assessments/'+product)}>Sign in to your account</Link>.</p>
 </section>;
}

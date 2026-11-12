import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { linkGuestAssessmentAccount } from './claim-actions';
import styles from './public-assessments.module.css';
/** Parent renders this only inside the capability-protected guest session page. */
export async function GuestAccountLink({sessionId}:{sessionId:string}) {
 const {data:{user}}=await (await createSupabaseServerClient()).auth.getUser();
 const next=guestSessionPath(sessionId);
 return <section className={styles.discoveryInvitation} aria-labelledby="guest-account-heading">
  <div className={styles.discoveryCopy}>
   <p className={styles.eyebrow}>An optional next step</p>
   <h2 id="guest-account-heading">Your discovery can go further.</h2>
   <p>Congratulations on taking a step toward understanding your design. When you’re ready, explore more with the Discover Your Divine Design app.</p>
   <ul><li>Revisit these reports from your account after you choose to connect them.</li><li>Explore Trailheads: assessment-connected courses with practical teaching and personal reflection.</li></ul>
   <p className={styles.helper}>A standalone report does not include the DesignID or DesignPD courses. Course access is separate. No account is needed to keep downloading your reports here.</p>
  </div>
  <div className={styles.discoveryAccount}>
   <h3>Make it part of your next step</h3>
   {user?.email_confirmed_at && !user.is_anonymous ? <form action={linkGuestAssessmentAccount}>
    <input type="hidden" name="sessionId" value={sessionId}/>
    <p className={styles.connectionIdentity}>Signed in as <strong>{user.email}</strong></p>
    <button className={styles.primary} type="submit">Connect these results to my account</button>
   </form> : <div className={styles.invitationActions}>
    <Link className={styles.primary} href={'/login?'+new URLSearchParams({mode:'signup',next})}>Create a verified account</Link>
    <Link className={styles.secondary} href={'/login?'+new URLSearchParams({next})}>Sign in</Link>
   </div>}
   <p className={styles.helper}>Connecting is your choice. Sign in to a verified account, then return to this private link and choose to connect. Your original contact details, purchases and results stay unchanged. A connection cannot be moved to another account.</p>
  </div>
  <div className={styles.discoveryGifts}><span>Another way to explore</span><a href="https://www.discoverdivine.design/reflections-gifts" target="_blank" rel="noopener noreferrer">Explore Spiritual Gifts (opens in a new tab)</a></div>
 </section>;
}

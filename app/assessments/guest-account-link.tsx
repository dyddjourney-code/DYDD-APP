import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { guestSessionPath } from '@/lib/public-assessments/guest-capability';
import { linkGuestAssessmentAccount } from './claim-actions';
/** Parent renders this only inside the capability-protected guest session page. */
export async function GuestAccountLink({sessionId}:{sessionId:string}) {
 const {data:{user}}=await (await createSupabaseServerClient()).auth.getUser();
 const next=guestSessionPath(sessionId);
 return <section aria-labelledby="guest-account-heading"><h2 id="guest-account-heading">Keep your results in the app</h2>
 <p>Optional: connect this private assessment session to your verified account. Your original contact details, purchases and results stay unchanged. This connection cannot be moved to another account.</p>
 {user?.email_confirmed_at && !user.is_anonymous ? <form action={linkGuestAssessmentAccount}>
 <input type="hidden" name="sessionId" value={sessionId}/><p>Connect to {user.email}</p><button type="submit">Connect these results to my account</button>
 </form> : <Link href={'/login?'+new URLSearchParams({next})}>Sign in or create a verified account</Link>}
 </section>;
}

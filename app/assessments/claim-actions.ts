'use server';
import { redirect } from 'next/navigation';
import { linkCurrentGuestToAccount } from '@/lib/public-assessments/guest-account';
import { guestSessionId, guestSessionPath } from '@/lib/public-assessments/guest-capability';
export async function linkGuestAssessmentAccount(form:FormData) {
 const sessionId=guestSessionId(String(form.get('sessionId')||''));
 let linked=false;
 try {await linkCurrentGuestToAccount(sessionId);linked=true;}catch {/* No raw database errors or contact data in redirects. */}
 if(!linked)redirect(guestSessionPath(sessionId)+'?message='+encodeURIComponent('Your results could not be connected. Sign in to a verified account and open your private link again. If they are already connected elsewhere, contact support.'));
 redirect('/assessments/account?linked=1');
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { hasLifetimePersonalAccess } from '@/lib/commerce/personal-access';
import { isFreeBeta } from '@/lib/environment';

export const dynamic = 'force-dynamic';
export default async function RenewMembership() {
 const db = await createSupabaseServerClient();
 const { data: { user }, error } = await db.auth.getUser();
 if (error || !user) redirect('/login?next=%2Frenew');
 const lifetime = await hasLifetimePersonalAccess(user.id);
 return <main className="hq-shell membership-renewal-shell"><div className="hq-content"><section className="basecamp-account-card">
  <p className="section-label">Your existing account</p><h1>Keep your journey together.</h1>
  <p>Signed in as {user.email}. Your account, results, report history, saved workbook and purchase records are retained.</p>
  {lifetime ? <p>Your free lifetime Personal access is active. It has no expiry, and no renewal payment is required.</p> : isFreeBeta() ? <p>Your Personal access is included during the free beta. You do not need to buy another subscription to return to your journey.</p> : <p>Paid membership renewal is not enabled here. Contact support while signed in to this account; do not create a replacement account.</p>}
  <div className="membership-dialog-actions"><Link className="button primary" href="/hq">Return to Base Camp</Link><Link className="button secondary" href="/contact">Membership support</Link></div>
 </section></div></main>;
}

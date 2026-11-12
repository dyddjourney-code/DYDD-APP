import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { claimPublicSpiritualGifts } from './claim-actions';
/** Render only after the enclosing page validates the exact session capability. */
export async function PublicGiftsAccountLink({sessionId, token}: {sessionId: string; token: string}) {
  const { data: { user } } = await (await createSupabaseServerClient()).auth.getUser();
  const next = '/spiritual-gifts/thanks?' + new URLSearchParams({session: sessionId, token});
  return <section className="spiritual-gifts-thanks-cta">
    <h2>Keep this result in your account</h2>
    <p>Optional: connect this assessment to your verified DYDD account. Your original contact details and results stay unchanged. This connection cannot be moved to another account.</p>
    {user?.email_confirmed_at && !user.is_anonymous ? <form action={claimPublicSpiritualGifts}>
      <input type="hidden" name="session" value={sessionId}/><input type="hidden" name="token" value={token}/>
      <p>Connect to {user.email}</p><button type="submit" className="button primary">Connect this result to my account</button>
    </form> : <Link href={'/login?' + new URLSearchParams({next})}>Sign in or create a verified account</Link>}
  </section>;
}

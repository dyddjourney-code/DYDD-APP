import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPersonalSubscription } from '@/lib/commerce/personal-subscription';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
 const db = await createSupabaseServerClient();
 const { data: { user }, error } = await db.auth.getUser();
 const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
 if (error || !user || !user.email_confirmed_at || user.is_anonymous) return Response.json({ error: 'Sign in to view your membership.' }, { status: 401, headers });
 const summary = await getPersonalSubscription(user.id);
 return Response.json({ summary }, { status: summary.state === 'unavailable' ? 503 : 200, headers });
}

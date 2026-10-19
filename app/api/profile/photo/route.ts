import { createSupabaseServerClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return new Response(null, { status: 401, headers });
  const { data: profile } = await db.from('basecamp_profiles').select('photo_path').eq('user_id', user.id).maybeSingle();
  if (!profile?.photo_path) return new Response(null, { status: 404, headers });
  const { data, error } = await db.storage.from('basecamp-photos').download(profile.photo_path);
  if (error || !data) return new Response(null, { status: 503, headers });
  return new Response(data, { headers: { ...headers, 'Content-Type': data.type, 'Content-Disposition': 'inline' } });
}

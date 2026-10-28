import { sandboxProfileRequest, sandboxProfileGet, sandboxProfileSave } from '@/lib/profile/sandbox-preview';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const columns = 'display_name,bio,fun_facts,photo_path,revision';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
function publicProfile(row: Record<string, unknown>) {
  return { display_name: row.display_name, bio: row.bio, fun_facts: row.fun_facts, has_photo: Boolean(row.photo_path), revision: row.revision };
}
export async function GET(request: Request) {
  if (sandboxProfileRequest(request)) return sandboxProfileGet();
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return reply({ error: 'Sign in to open your profile.' }, 401);
  const { data, error } = await db.from('basecamp_profiles').select(columns).eq('user_id', user.id).maybeSingle();
  if (error) return reply({ error: 'Your profile could not be loaded. Please try again.' }, 503);
  return reply({ profile: data ? publicProfile(data) : { display_name: '', bio: '', fun_facts: [], has_photo: false, revision: 0 } });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'Open Base Camp to save your profile.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data')) return reply({ error: 'Check your profile details.' }, 415);
  if (sandboxProfileRequest(request)) return sandboxProfileSave(request);
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return reply({ error: 'Sign in to save your profile.' }, 401);
  if (Number(request.headers.get('content-length')) > 1200000) return reply({ error: 'Choose a smaller photo.' }, 413);
  let form: FormData;
  try { form = await request.formData(); } catch { return reply({ error: 'Check your profile details.' }, 400); }
  let input;
  try { input = JSON.parse(String(form.get('profile'))); } catch { return reply({ error: 'Check your profile details.' }, 400); }
  if (!input || typeof input.display_name !== 'string' || !input.display_name.trim() || input.display_name.length > 80 || typeof input.bio !== 'string' || input.bio.length > 600 || !Array.isArray(input.fun_facts) || input.fun_facts.length > 3 || input.fun_facts.some((v: unknown) => typeof v !== 'string' || v.length > 120) || !Number.isInteger(input.revision) || input.revision < 0 || typeof input.remove_photo !== 'boolean') return reply({ error: 'Add a display name (up to 80 characters), a bio (up to 600), and up to three fun facts (120 each).' }, 400);
  const { data: current, error: readError } = await db.from('basecamp_profiles').select(columns).eq('user_id', user.id).maybeSingle();
  if (readError) return reply({ error: 'Your profile could not be loaded. Please try again.' }, 503);
  if ((current?.revision ?? 0) !== input.revision) return reply({ error: 'Your profile changed in another tab. Reload before saving; your edits are still here.' }, 409);
  const file = form.get('photo');
  let path = input.remove_photo ? null : current?.photo_path ?? null;
  let uploaded: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (file.size > 1048576) return reply({ error: 'Your prepared photo must be under 1 MB.' }, 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    const format = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? ['image/jpeg','jpg'] : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? ['image/png','png'] : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? ['image/webp','webp'] : null;
    if (!format || file.type !== format[0]) return reply({ error: 'Choose a valid JPEG, PNG or WebP photo.' }, 400);
    path = `${user.id}/${randomUUID()}.${format[1]}`;
    const { error } = await db.storage.from('basecamp-photos').upload(path, bytes, { contentType: format[0], upsert: false });
    if (error) return reply({ error: 'Your photo could not be uploaded. Your edits are still here; try again.' }, 503);
    uploaded = path;
  }
  const changes = { display_name: input.display_name.trim(), bio: input.bio.trim(), fun_facts: input.fun_facts.map((v: string) => v.trim()).filter(Boolean), photo_path: path, revision: input.revision + 1, updated_at: new Date().toISOString() };
  const query = current ? db.from('basecamp_profiles').update(changes).eq('user_id', user.id).eq('revision', input.revision) : db.from('basecamp_profiles').insert({ ...changes, user_id: user.id });
  const { data, error } = await query.select(columns).maybeSingle();
  if (error || !data) {
    if (uploaded) await db.storage.from('basecamp-photos').remove([uploaded]);
    return reply({ error: error?.code === '23505' || (!error && !data) ? 'Your profile changed in another tab. Reload before saving; your edits are still here.' : 'Your profile could not be saved. Your edits are still here; try again.' }, error?.code === '23505' || (!error && !data) ? 409 : 503);
  }
  if (current?.photo_path && current.photo_path !== path) await db.storage.from('basecamp-photos').remove([current.photo_path]);
  return reply({ profile: publicProfile(data) });
}

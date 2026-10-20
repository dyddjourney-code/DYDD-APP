import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSandbox } from '@/lib/environment';
import { isNewReviewRequest } from '@/lib/review/heather';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { reportBucket } from '@/lib/assessments/report-storage';
import { emptyProfile, type BaseCampProfile } from './types';

const path = 'sandbox-profiles/jordan.json';
const lock = 'sandbox-profiles/jordan.lock';
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
type Saved = { profile: BaseCampProfile; photo: { type: string; bytes: string } | null };
export function sandboxProfileRequest(request: Request) {
  const u = new URL(request.url);
  return isSandbox() && isNewReviewRequest({ review: u.searchParams.get('review') ?? undefined, key: u.searchParams.get('key') ?? undefined });
}
async function load(): Promise<Saved> {
  const { data, error } = await createSupabaseAdminClient().storage.from(reportBucket).download(path, { cacheNonce: randomUUID() }, { cache: 'no-store' });
  if (error) {
    if (String(error.statusCode) === '404' || String(error.statusCode) === '400' && /not found/i.test(error.message)) return { profile: { ...emptyProfile, display_name: 'Jordan Preview' }, photo: null };
    throw Error('Your sandbox profile could not be loaded. Please try again.');
  }
  return JSON.parse(await data.text());
}
export async function sandboxProfileGet(photo = false) {
  try {
    const saved = await load();
    if (!photo) return reply({ profile: saved.profile });
    if (!saved.photo) return new Response(null, { status: 404, headers });
    return new Response(Buffer.from(saved.photo.bytes, 'base64'), { headers: { ...headers, 'Content-Type': saved.photo.type, 'Content-Disposition': 'inline' } });
  } catch { return reply({ error: 'Your sandbox profile could not be loaded. Please try again.' }, 503); }
}
export async function sandboxProfileSave(request: Request) {
  if (Number(request.headers.get('content-length')) > 1200000) return reply({ error: 'Choose a smaller photo.' }, 413);
  let form: FormData, input;
  try { form = await request.formData(); input = JSON.parse(String(form.get('profile'))); } catch { return reply({ error: 'Check your profile details.' }, 400); }
  if (!input || typeof input.display_name !== 'string' || !input.display_name.trim() || input.display_name.length > 80 || typeof input.bio !== 'string' || input.bio.length > 600 || !Array.isArray(input.fun_facts) || input.fun_facts.length > 3 || input.fun_facts.some((v: unknown) => typeof v !== 'string' || v.length > 120) || !Number.isSafeInteger(input.revision) || input.revision < 0 || typeof input.remove_photo !== 'boolean') return reply({ error: 'Check your display name, bio and three fun facts.' }, 400);
  const bucket = createSupabaseAdminClient().storage.from(reportBucket);
  const leased = await bucket.upload(lock, Buffer.from('{}'), { contentType: 'application/json', upsert: false });
  if (leased.error) return reply({ error: 'Another save is in progress. Your edits are still here; try again.' }, 409);
  try {
    const saved = await load();
    if (saved.profile.revision !== input.revision) return reply({ error: 'Your profile changed in another tab. Reload before saving; your edits are still here.' }, 409);
    let photo = input.remove_photo ? null : saved.photo;
    const file = form.get('photo');
    if (file instanceof File && file.size > 0) {
      if (file.size > 1048576) return reply({ error: 'Your prepared photo must be under 1 MB.' }, 413);
      const bytes = Buffer.from(await file.arrayBuffer());
      const type = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? 'image/jpeg' : bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' ? 'image/webp' : null;
      if (!type || type !== file.type) return reply({ error: 'Choose a valid JPEG, PNG or WebP photo.' }, 400);
      photo = { type, bytes: bytes.toString('base64') };
    }
    const profile: BaseCampProfile = { display_name: input.display_name.trim(), bio: input.bio.trim(), fun_facts: input.fun_facts.map((v: string) => v.trim()).filter(Boolean), revision: input.revision + 1, has_photo: Boolean(photo) };
    const { error } = await bucket.upload(path, Buffer.from(JSON.stringify({ profile, photo })), { contentType: 'application/json', cacheControl: '0', upsert: true });
    if (error) throw Error('Save failed');
    return reply({ profile });
  } catch { return reply({ error: 'Your sandbox profile could not be saved. Your edits are still here; try again.' }, 503); }
  finally { await bucket.remove([lock]); }
}

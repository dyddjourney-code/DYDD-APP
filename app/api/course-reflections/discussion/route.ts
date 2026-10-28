import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isSandbox } from '@/lib/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { reportBucket } from '@/lib/assessments/report-storage';
import { previewParams, previewReflectionData } from '@/lib/reflections/preview';
import { careDiscussionIds, discussionCourse, type DiscussionReminder } from '@/lib/reflections/discussion-catalog';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function handle(request: Request) {
  const url = new URL(request.url);
  if (request.method === 'POST' && (request.headers.get('origin') && request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site')) return reply({ error: 'Open this reminder from your workbook.' }, 403);
  const preview = previewParams(url);
  const supabase = await createSupabaseServerClient();
  const user = preview ? null : (await supabase.auth.getUser()).data.user;
  if (!preview && !user) return reply({ error: 'Sign in to use discussion reminders.' }, 401);
  const body = request.method === 'POST' ? await request.json().catch(() => null) : null;
  const slug = request.method === 'GET' ? url.searchParams.get('courseSlug') : body?.courseSlug;
  if (slug !== discussionCourse) return reply({ error: 'Discussion reminders are only available for Journey CARE reflections.' }, 400);
  // The identity and object path are derived on the server, never accepted from a client.
  const identity = preview ? `preview-${preview.review}` : `user-${user!.id}`;
  const path = `private-discussion-reminders/${identity}.json`;
  const bucket = createSupabaseAdminClient().storage.from(reportBucket);
  const read = async (): Promise<DiscussionReminder[]> => {
    const r = await bucket.download(path, { cacheNonce: randomUUID() }, { cache: 'no-store' });
    if (r.error) {
      if (String(r.error.statusCode) === '404' || String(r.error.statusCode) === '400' && /not found/i.test(r.error.message)) return [];
      throw Error('Could not load your private reminders. Try again.');
    }
    return JSON.parse(await r.data.text());
  };
  if (request.method === 'GET') return reply({ reminders: await read() });
  if (!body || typeof body.roundId !== 'string' || !careDiscussionIds.has(body.questionId) || typeof body.marked !== 'boolean' || typeof body.note !== 'string' || body.note.length > 1000 || !Number.isSafeInteger(body.expectedRevision) || body.expectedRevision < 0) return reply({ error: 'Invalid reminder. Notes may contain up to 1,000 characters.' }, 400);
  const rounds = preview ? (await previewReflectionData(preview, slug)).rounds : (await supabase.from('reflection_rounds').select('id,questions').eq('user_id', user!.id).eq('course_slug', slug).order('started_at', { ascending: false }).order('id', { ascending: false })).data;
  const round = rounds?.find(r => r.id === body.roundId);
  if (!round) return reply({ error: 'Workbook not found.' }, 404);
  if (rounds?.[0]?.id !== round.id) return reply({ error: 'Previous walkthroughs are read-only.' }, 403);
  if (!round.questions.some((q: { id: string }) => q.id === body.questionId)) return reply({ error: 'Unknown CARE reflection.' }, 400);
  const lock = `private-discussion-reminders/${identity}.lock`;
  const lease = await bucket.upload(lock, Buffer.from('{}'), { contentType: 'application/json', upsert: false });
  if (lease.error) return reply({ error: 'Another reminder is saving. Your note is still here; try again.' }, 409);
  try {
    const reminders = await read();
    const index = reminders.findIndex(r => r.round_id === body.roundId && r.question_id === body.questionId);
    const previous = reminders[index];
    if ((previous?.revision ?? 0) !== body.expectedRevision) return reply({ error: 'This reminder changed in another tab. Your note is still here. Copy it and reload before saving.' }, 409);
    const reminder: DiscussionReminder = { round_id: body.roundId, question_id: body.questionId, marked: body.marked, note: body.note, revision: (previous?.revision ?? 0) + 1, updated_at: new Date().toISOString() };
    if (index === -1) reminders.push(reminder); else reminders[index] = reminder;
    const saved = await bucket.upload(path, Buffer.from(JSON.stringify(reminders)), { contentType: 'application/json', upsert: true, cacheControl: '0' });
    if (saved.error) throw Error('Could not save your reminder. Your note is still here; try again.');
    return reply({ reminder });
  } finally { await bucket.remove([lock]); }
}
export async function GET(request: Request) { try { return await handle(request); } catch (e) { return reply({ error: e instanceof Error ? e.message : 'Could not load reminders.' }, 503); } }
export async function POST(request: Request) { try { return await handle(request); } catch (e) { return reply({ error: e instanceof Error ? e.message : 'Could not save reminder.' }, 503); } }

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cancelPersonalSubscription } from '@/lib/commerce/personal-subscription';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
export async function POST(request: Request) {
 if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'Open your account to change your membership.' }, 403);
 if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return reply({ error: 'JSON required.' }, 415);
 const db = await createSupabaseServerClient();
 const { data: { user }, error } = await db.auth.getUser();
 if (error || !user || !user.email_confirmed_at || user.is_anonymous) return reply({ error: 'Sign in to change your membership.' }, 401);
 let body;
 try { const text = await request.text(); if (text.length > 512) return reply({ error: 'Invalid request.' }, 400); body = JSON.parse(text); } catch { return reply({ error: 'Invalid request.' }, 400); }
 if (body?.confirm !== 'cancel_at_period_end' || typeof body.paidThrough !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(body.paidThrough) || Object.keys(body).some(k => !['confirm', 'paidThrough'].includes(k))) return reply({ error: 'Confirm cancellation using current membership details.' }, 400);
 try { return reply({ summary: await cancelPersonalSubscription(user.id, body.paidThrough) }); }
 catch { return reply({ error: 'Your membership change could not be verified. Reload your details before trying again.' }, 409); }
}

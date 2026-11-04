import { createHash } from 'node:crypto';
import { sandboxRecipientAllowed } from '@/lib/email/sandbox-policy';
import { verifyEmailWebhook } from '@/lib/email/webhook-signature';
import { sendResendEmail } from '@/lib/email/resend';

const base = 'https://dydd-online-school-sandbox.vercel.app';
const actions = new Map([
  ['signup', ['Confirm your sandbox account', 'Confirm account']],
  ['recovery', ['Reset your sandbox password', 'Choose a new password']],
  ['magiclink', ['Sign in to your sandbox account', 'Sign in']],
  ['invite', ['Your sandbox account invitation', 'Accept invitation']],
  ['email', ['Confirm your sandbox email', 'Confirm email']],
]);

/** Signed Supabase Send Email Hook. Never uses SMTP's unrestricted recipient path. */
export async function handleSandboxAuthEmail(request: Request) {
  const secret = process.env.DYDD_SANDBOX_AUTH_HOOK_SECRET || '';
  if (process.env.DYDD_SANDBOX_AUTH_EMAIL_ENABLED !== 'true' || !secret || !sandboxRecipientAllowed('dyddjourney@gmail.com')) {
    return Response.json({ error: { http_code: 503, message: 'Sandbox authentication mail is not configured.' } }, { status: 503 });
  }
  const raw = await request.text();
  if (raw.length > 24000) return new Response(null, { status: 413 });
  const signed = new Headers();
  for (const name of ['id', 'timestamp', 'signature']) signed.set('svix-' + name, request.headers.get('webhook-' + name) || '');
  if (!verifyEmailWebhook(raw, signed, secret)) return new Response(null, { status: 401 });
  let data;
  try { data = JSON.parse(raw); } catch { return new Response(null, { status: 400 }); }
  const email = data?.user?.email;
  const event = data?.email_data;
  // Email-change is intentionally unsupported: never send either half to a new, unapproved address.
  const copy = actions.get(event?.email_action_type);
  if (typeof email !== 'string' || !sandboxRecipientAllowed(email) || !copy || data.user.new_email) {
    return Response.json({ error: { http_code: 403, message: 'Authentication mail is restricted to the sandbox owner allowlist.' } }, { status: 403 });
  }
  if (typeof event.token_hash !== 'string' || !/^[A-Za-z0-9_-]{16,256}$/.test(event.token_hash)) return new Response(null, { status: 400 });
  let next = '/hq';
  try {
    const redirect = new URL(event.redirect_to || base);
    if (redirect.origin !== base || (event.site_url && new URL(event.site_url).origin !== base)) throw new Error('Invalid sandbox origin');
    const requested = redirect.pathname === '/auth/callback' ? redirect.searchParams.get('next') : redirect.pathname + redirect.search;
    if (requested?.startsWith('/') && new URL(requested, base).origin === base) next = requested;
  } catch { return new Response(null, { status: 400 }); }
  if (event.email_action_type === 'recovery' && !next.startsWith('/reset-password')) next = '/reset-password?next=' + encodeURIComponent(next);
  const type = event.email_action_type === 'magiclink' ? 'email' : event.email_action_type;
  const link = base + '/auth/confirm?' + new URLSearchParams({ token_hash: event.token_hash, token_type: type, next });
  const text = `${copy[0]}\n\n${copy[1]}: ${link}\n\nThis link is for the separate DYDD sandbox only. Opening its preview does not use the link; continue on the confirmation page. If you did not request this, ignore this message. Your live school account is unchanged.`;
  const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const result = await sendResendEmail({ to: email, subject: copy[0], text,
    html: `<div style="font:16px Arial;line-height:1.6;max-width:640px;margin:auto"><h1>${copy[0]}</h1><p><a href="${escape(link)}">${copy[1]}</a></p><p>This link is for the separate DYDD sandbox only. Opening its preview does not use the link; continue on the confirmation page.</p><p>If you did not request this, ignore this message. Your live school account is unchanged.</p></div>`,
    // Stable across HTTP retries even when Supabase changes its webhook request ID.
    idempotencyKey: 'sandbox-auth-' + createHash('sha256').update(email.toLowerCase() + ':' + event.email_action_type + ':' + event.token_hash).digest('hex'),
  });
  // Neither the token nor provider errors containing sensitive request data are logged/returned.
  return result.sent ? Response.json({}) : Response.json({ error: { http_code: 503, message: 'Authentication mail could not be accepted. Try again later.' } }, { status: 503 });
}

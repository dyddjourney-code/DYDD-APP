import 'server-only';
import { createHmac } from 'node:crypto';
import { guestSessionId } from './guest-capability';

export const guestPassTimeZone = 'America/New_York';
/** Inclusive Eastern calendar-day deadline, including DST (never the server timezone). */
export function individualGuestDeadline(date: string, now = Date.now()) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Choose an expiry date.');
 const day = new Date(date + 'T00:00:00Z');
 if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== date || day.getUTCFullYear()<2000 || day.getUTCFullYear()>9998) throw Error('Choose a valid expiry date.');
 day.setUTCDate(day.getUTCDate() + 1);
 const wall = day.getTime();
 let instant = wall;
 const format = new Intl.DateTimeFormat('en-CA', { timeZone: guestPassTimeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
 for (let i = 0; i < 3; i++) {
  const p = Object.fromEntries(format.formatToParts(new Date(instant)).map(x => [x.type, x.value]));
  instant += wall - Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second));
 }
 const expires = instant - 1;
 if (expires <= now) throw Error('Choose a future expiry date.');
 return new Date(expires).toISOString();
}
export function formatGuestDeadline(expiresAt: string) {
 return new Intl.DateTimeFormat('en-US', { timeZone: guestPassTimeZone, month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(expiresAt)) + ' at 11:59 p.m. Eastern Time';
}
/** A scoped HMAC makes individual links retrievable without persisting raw capabilities. */
export function individualGuestToken(grantId: string) {
 const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!secret) throw Error('Individual access link configuration is unavailable.');
 return createHmac('sha256', secret).update('dydd-individual-guest-pass-v1:' + guestSessionId(grantId)).digest('base64url');
}
export function guestGrantLink(token: string) {
 const fallback=process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'?'https://dydd-online-school-sandbox.vercel.app':'https://dydd-online-school.vercel.app';
 const origin = new URL(process.env.DYDD_APP_URL || (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT==='sandbox'?process.env.DYDD_PUBLIC_ASSESSMENT_TEST_ORIGIN:process.env.DYDD_PUBLIC_ASSESSMENT_LIVE_ORIGIN) || fallback);
 if (origin.protocol !== 'https:' || origin.username || origin.password) throw Error('Guest access origin is unavailable.');
 return origin.origin + '/assessments/group?' + new URLSearchParams({ key: token });
}
export function validateIndividualRecipient(email: string, name = '') {
 const recipient_email = email.trim().toLowerCase(), recipient_name = name.trim() || null;
 if (recipient_email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient_email)) throw Error('Enter the recipient’s valid email address.');
 if (recipient_name && (recipient_name.length > 120 || /[\r\n]/.test(recipient_name))) throw Error('Recipient name must be at most 120 characters on one line.');
 return { recipient_email, recipient_name };
}

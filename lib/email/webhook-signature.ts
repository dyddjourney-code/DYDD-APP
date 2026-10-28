import { createHmac, timingSafeEqual } from 'node:crypto';
/** Resend uses Standard Webhooks (Svix). Verify exact raw bytes before parsing. */
export function verifyEmailWebhook(raw: string, headers: Headers, secret: string, now = Date.now()) {
  const id = headers.get('svix-id') ?? '';
  const timestamp = headers.get('svix-timestamp') ?? '';
  const signature = headers.get('svix-signature') ?? '';
  if (!id || id.length > 256 || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  if (!/^whsec_[A-Za-z0-9+/=]+$/.test(secret)) return false;
  const expected = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`${id}.${timestamp}.${raw}`).digest();
  return signature.split(' ').some(part => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const candidate = Buffer.from(value, 'base64');
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

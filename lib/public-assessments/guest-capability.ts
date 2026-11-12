import { createHash, randomBytes } from 'node:crypto';
export const guestCapabilityLifetime = 365 * 24 * 60 * 60;
export function newGuestCapability() { return randomBytes(32).toString('base64url'); }
export function guestCapabilityHash(token: string) {
 if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw Error('Invalid recovery link.');
 return createHash('sha256').update(token).digest('hex');
}
export function guestSessionId(value: string) {
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) throw Error('Invalid assessment session.');
 return value;
}
export function guestCookie(id: string) { return 'dydd_guest_' + guestSessionId(id); }
export function guestSessionPath(id: string) { return '/assessments/session/' + guestSessionId(id); }
export function guestRecoveryPath(id: string, token: string) {
 guestCapabilityHash(token);
 return '/assessments/recover?' + new URLSearchParams({session: guestSessionId(id), key: token});
}

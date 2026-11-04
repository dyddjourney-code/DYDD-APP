/** Sandbox transport is opt-in and exact-address only. Never redirects customer mail. */
export function sandboxRecipientAllowed(email: string) {
  if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT !== 'sandbox') return false;
  if (process.env.DYDD_SANDBOX_EMAIL_ENABLED !== 'true' || process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF !== 'atemrshtshxoqnuevvqu') return false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://atemrshtshxoqnuevvqu.supabase.co') return false;
  const allowed = (process.env.DYDD_SANDBOX_EMAIL_ALLOWLIST || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  // No wildcards, domains, plus-address normalization, or configurable catch-all.
  return allowed.length <= 10 && allowed.includes(email.trim().toLowerCase());
}
export function sandboxTransportBlocked(email: string) {
  return process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === 'sandbox' && !sandboxRecipientAllowed(email);
}

/** Activation never replays the previous sandbox queue. */
export function sandboxJobTransportBlocked(email: string, createdAt: string) {
  if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT !== 'sandbox') return false;
  const cutoff = Date.parse(process.env.DYDD_SANDBOX_EMAIL_ACTIVATED_AT || '');
  return sandboxTransportBlocked(email) || !Number.isFinite(cutoff) || Date.parse(createdAt) < cutoff || !Number.isFinite(Date.parse(createdAt));
}

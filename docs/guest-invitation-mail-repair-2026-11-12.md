# Guest invitation production mail repair — 2026-11-12

## Root cause
Private owner Vercel production `DYDD_RESEND_API_KEY`, `FRUITLIFE_EMAIL_FROM`, and `DYDD_EMAIL_FROM` contained base64 Vercel ciphertext envelopes (decoded JSON keys `v,c,k`) instead of usable decrypted runtime values. The original owner-requested invitation failed its first provider submission with HTTP 401. This was not a queue or recipient problem.

All three owner Production variables were corrected from the canonical school project's individually decrypted environment API values, then individually read back. No other runtime variables changed. The owner project must be redeployed to activate them; changing Vercel variables does not change an existing deployment.

## Exact, bounded recovery
- Grant: `f13a1632-a69c-4e0f-8425-44a71877b3c8`.
- Original invitation request: `6961b958-0b42-49fe-afdd-ba80832a7b2f`.
- Job: `739968e4-d959-4914-9d28-60e71a7247ab`.
- Original send intent and definitive HTTP 401 were verified. No provider ID existed; original message was pending and inside its 23-hour idempotency window.
- The existing full lifecycle eligibility check passed before recovery. The malformed sender's original payload hash was conditionally replaced **only for this pending HTTP-401 intent**, and only this failed job was conditionally reopened. The exact recipient, rendered assessment content, link, request ID, and original idempotency key were retained.
- The existing application-mail pipeline then submitted only that original invitation. It is now `accepted`, attempts 2, provider ID `01a1d111-f64a-79b3-8517-c60f7d032e87`, accepted at `2026-11-12T18:42:57.925Z`. Grant invitation metadata also reads accepted.
- **Acceptance is confirmed; inbox delivery is not.** Provider retrieval is unavailable to both available send-only API keys (401 restricted-to-send), and no matching webhook event was observed at final verification. Do not resend to prove delivery.

## Code hardening
`lib/lifecycle/mail-runtime.ts` checks the actual provider key precedence (`RESEND_API_KEY` then `DYDD_RESEND_API_KEY`) and sender precedence before submission. Invalid/missing key or malformed sender leaves durable intent retryable, avoiding a permanent provider rejection for encrypted runtime configuration. Immediate delivery checks before taking a claim; worker checks before the send authorization fence. Sandbox behavior remains unchanged.

Verification: TypeScript PASS; seven individual guest-access/invitation tests PASS; runtime configuration precedence/encrypted-envelope tests PASS. No broad lifecycle/Waypoints worker invocation, test pass creation, commit, push, or deployment.

## Deployment handoff
Deploy the reviewed owner branch to existing private owner project `prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq` after including the mail hardening files. Keep existing owner authentication/deployment protection. Do not invoke cron as a smoke test: it can release unrelated jobs. No school redeployment or new scheduler is required for this immediate invitation fix; owner crons intentionally remain empty.

Evidence: `/home/openclaw/.openclaw/workspace/outputs/dydd-guest-pass-quality-2026-11-12/mail/`. Runtime credentials remain only in protected secret files outside Git; evidence contains no raw invitation capability or provider key.

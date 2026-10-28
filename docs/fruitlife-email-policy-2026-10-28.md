# FruitLife360 participant email policy — requirement 4

Local implementation only; no commit, push, deployment, database changes or real mail.

- No participant assessment-start/self invitation email in either self-only or observer-assisted cycles. The existing in-app self-reflection link and tokens remain unchanged.
- No participant manual, automatic day-five, or pending-observer/status reminder. Disabled participant sends do not create delivery failures or synthetic email artifacts.
- Observers retain their initial invitation, manual reminders and existing automatic day-five reminder, with the same stable delivery keys and send-time completion/cancellation checks.
- Actual participant report delivery and report-ready/use-results follow-up remain unchanged.
- New application sends are rejected before enqueue by recipient-purpose context or legacy B04 self/status template ID. The worker applies the same permanent eligibility stop to old queued/retry self messages, including jobs already claimable for submission. Existing accepted history is not deleted or resent.
- `fruitlife_self_completed` events are still consumed, without queuing a participant chase message. No migration or historical-row cleanup is required.

## Isolated verification

All service/database/provider calls in these tests use in-memory fixtures/mocks:

```
node tests/fruitlife-email-policy.cjs
node scripts/verify-fruitlife-lifecycle.cjs
node scripts/verify-fruitlife-worker.cjs
node tests/email-sender.cjs
node tests/email-foundation.cjs
node tests/lifecycle-templates.cjs
npm run typecheck
```

The new policy test covers both modes, template/context-only suppression, queued/retry/submitting eligibility, old job processing, preserved observer reminder timing/keys, final-report delivery and B05 follow-up scheduling. The action regression covers self-only setup/reminder, an incomplete self with pending observers, normal observer reminders/completion/cancellation, and truthful invitation-delivery flags. The worker regression checks report email retry, PDF reuse and sent-email deduplication. Inbox delivery is not tested or claimed.

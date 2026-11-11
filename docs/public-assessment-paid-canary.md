# Production paid assessment canary (default disabled)

Base: `1936e85ef58c82dd6d73ac264b8ff54a4c9582b2`.
This patch is local preparation only: no deploy, provider/DB/Auth/environment writes,
account creation, messages, or real payments have been performed.

## Trust boundary / caller audit

- `app/assessments/actions.ts::beginAssessmentCheckout` is the ONLY application
  caller of `createPublicAssessmentCheckout` (both DesignID and DesignPD).
- Its `identity()` calls server `auth.getUser()` and requires `email_confirmed_at`.
  Form fields cannot select user ownership or confirmation. The verified Auth
  user is passed through checkout -> configuration -> runtime, all server-only.
- The exception requires explicit `NEXT_PUBLIC_DYDD_ENVIRONMENT=production`, live
  mode, existing ledger/database policy readiness, production payment switch,
  canonical exact UUID membership, and confirmed Auth user. Invalid UUID entries
  disable the whole list. Unset/empty list disables the exception.
- The ordinary `DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED=true` path is unchanged.
  The exception applies only to checkout, never webhooks, rights or roles.
- Before checkout the action still checks included/admin/existing rights, retake
  eligibility, owned valid DesignID prerequisites and saved matching DesignPD.
  Do NOT bypass these to force a charge: use a fresh ordinary account.
- The only other runtime callers are fulfillment and the webhook route, both
  using `webhook` purpose with no user exception. No other application caller of
  `publicPaymentConfiguration` exists. Tests have synthetic callers only.
- No UI, scoring, course access, entitlement, webhook/refund, price or source
  validation code changes. Allowlisting grants checkout permission, NOT access.

## Verification

Run serially, using synthetic fixtures and intercepted transports:

```sh
node --test --test-concurrency=1 tests/public-assessment-paid-canary.cjs tests/public-assessment-production-prep.cjs tests/public-assessment-runtime-catalog.cjs tests/public-assessment-recovery-policy.cjs tests/public-assessment-course-capability.cjs
```

27 tests pass. Covers fresh verified allowlisted user, nonallowlisted, anonymous,
unconfirmed, forged form identity/confirmation, malformed/absent allowlist,
sandbox/unknown environment, included/retake precedence, actual checkout identity
propagation, source constraints, ordinary public sales, independent webhooks,
strict catalog, payment evidence/reversal and course-capability regressions.
`git diff --check` passes. No heavy local build; remote build/typecheck and real
browser/payment verification remain pending.

## Next steps (parent/release owner; not executed here)

1. Keep the parallel operator release at its exact `1936e85` with paused flags.
   Do not mix this patch into that ongoing deploy or claim it contains the gate.
2. Review this separate commit; incorporate it into a NEW explicit release and
   remote build from that exact reviewed SHA. Verify READY/source SHA/project and
   canonical alias before any canary configuration is activated.
3. Choose a fresh ordinary account backed by a human-controlled inbox. Use normal
   sign-up and email confirmation, not admin/owner/demo preview or synthetic
   mailbox. Obtain its exact Auth UUID read-only from the trusted server/Auth
   record, verify confirmation and no included/lifetime/grandfathered rights,
   prior purchase, assessment result or retake restriction. Do not revoke rights.
4. Keep `DYDD_PUBLIC_ASSESSMENT_PAYMENTS_ENABLED=false`. After separately approved
   production policy/inventory readiness, the existing required settings remain:
   `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_LEDGER_ENABLED=true`,
   `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_ACCESS_POLICY=grandfathered-v1`,
   `DYDD_PUBLIC_ASSESSMENT_GRANDFATHER_INVENTORY_READY=true`,
   matching production Supabase URLs, `DYDD_PUBLIC_ASSESSMENT_STRIPE_MODE=live`,
   `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_PAYMENTS_ENABLED=true`,
   `DYDD_PUBLIC_ASSESSMENT_WEBHOOKS_ENABLED=true`, correct existing live key,
   origin, approved USD 19.99 product/price tuples and signing secret.
   Do not activate policy/inventory flags merely to make this gate pass.
5. Set SERVER-ONLY `DYDD_PUBLIC_ASSESSMENT_PRODUCTION_CANARY_USER_IDS` to the
   selected canonical lower-case UUID (no `NEXT_PUBLIC_` prefix, email or wildcard).
   Redeploy the same reviewed SHA for environment changes to take effect. No UUID
   has been selected or hardcoded; the variable remains absent/default disabled.
6. Verify logged-out/nonallowlisted direct checkout attempts cannot create an
   order/session. Then the selected confirmed ordinary account can use the normal
   offer button; no special badge or secret route. Parent/human owns real payment
   authorization and checks signed paid webhook, exactly one entitlement, return,
   assessment save/report and owner-controlled inbox delivery. If testing DesignPD,
   preserve the same account's valid owned DesignID source and normal source rules.
7. Remove the canary variable and redeploy to close checkout for everyone while
   sales remain false. Keep valid paid rights/webhooks/recovery functioning; do not
   delete orders/entitlements or reset access policy. Reverify nonallowlisted denial.

Ordinary entry (canonical origin from existing app configuration; not live-verified
by this patch): https://dydd-online-school.vercel.app/assessments/designid

Normal login: https://dydd-online-school.vercel.app/login?next=%2Fassessments%2Fdesignid
Use that page's ordinary account-creation flow. No owner bypass is introduced.

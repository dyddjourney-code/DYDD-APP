/* Run from repository root: node content/assessment-report-templates/verify-preview.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const load = require('../../scripts/fruitlife-test-load.cjs');
const output = '/home/openclaw/.openclaw/workspace/outputs/dydd-public-assessments-2026-11-10';
fs.mkdirSync(output, { recursive: true });
const state = { user: { id: 'owner-user', email: ' OWNER@Example.test ', email_confirmed_at: '2026-11-10T00:00:00Z' }, snapshot: null, authCalls: 0, reads: [] };
const mocks = {
  '@/lib/commerce/account-artifact-access': { membershipArtifactExpired: async () => false },
  '@/lib/commerce/account-access': { personalRenewalPath: () => '/renew' },
  '@/lib/supabase/admin': {},
  '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ auth: { getUser: async () => { state.authCalls++; return { data: { user: state.user }, error: null }; } } }) },
  '@/lib/assessments/artifact-access': { getOwnedArtifactSnapshot: async (...args) => { state.reads.push(args); return state.snapshot; } },
};
const { renderSavedReportPreview, reportPreviewHeaders } = load('lib/public-assessments/report-preview.ts', mocks);
const { GET } = load('app/assessments/report/[snapshotId]/route.ts', mocks);
const id = '11111111-1111-4111-8111-111111111111';
const snapshot = (type, payload) => ({ id, assessment_type: type, created_at: '2026-11-10T00:00:00Z', source: 'native_app', source_submitted_at: null, scores: { channel: 'native_app', reportPayloadFormat: 'template-v1', reportPayload: payload } });
const request = new Request('https://sandbox.example.test/assessments/report/' + id + '?email=foreign@example.test&key=not-authorization');
const context = { params: Promise.resolve({ snapshotId: id }) };
(async () => {
  const cases = [];
  for (const kind of ['designid', 'designpd']) {
    const source = JSON.parse(fs.readFileSync(path.join('content/assessment-report-templates', kind + '.json')));
    assert.equal(crypto.createHash('sha256').update(source.body).digest('hex'), source.bodySha256);
    assert.equal(crypto.createHash('sha256').update(source.css).digest('hex'), source.cssSha256);
    assert(!('auth_token' in source));
    for (const [persona, primary, secondary] of [['a', 'Architect', 'Artisan'], ['b', 'Steward', 'Shepherd']]) {
      const fields = [...source.body.matchAll(/{{\s*([A-Za-z_]\w*)/g)].map(m => m[1]);
      const payload = Object.fromEntries(fields.map(key => [key, `${persona} retained ${key}`]));
      Object.assign(payload, { Name: `<script>alert('x')</script> ${persona}`, name: `<img src="https://unexpected.example/x"> ${persona}`, email: persona + '@example.test', Primary: primary, Secondary: secondary, primary, secondary, Integrative_Reflection: 'Visionary', integrative_reflection: 'Visionary', Learning_Strategies: 'One\nTwo', Contributions: 'First\nSecond' });
      for (const [i, reflection] of ['Architect', 'Artisan', 'Shepherd', 'Steward'].entries()) {
        payload[reflection + '_Pts'] = persona === 'a' ? [40,30,20,10][i] : [10,20,30,40][i];
        payload[reflection + '_Pct'] = persona === 'a' ? [0.4,0.3,0.2,0.1][i] : [0.1,0.2,0.3,0.4][i];
        payload['Band_' + reflection] = i === 0 ? 'Abundant' : 'Steady';
      }
      const saved = snapshot(kind, payload), before = JSON.stringify(saved);
      const html = await renderSavedReportPreview(saved);
      assert(html && html.includes('Sandbox preview — full source report HTML'));
      assert(!/\{[{%]/.test(html));
      assert(!/<script\b|<img src="https:\/\/unexpected/i.test(html));
      assert.equal(JSON.stringify(saved), before, 'renderer must not mutate saved payload');
      if (kind === 'designid') { assert(html.includes(`${persona} retained Primary_Text`)); assert(html.includes(`${persona} retained Shadow_Risk_D`)); assert(!html.includes('>0.4<')); }
      else { assert(html.includes(`${persona} retained plan_core`)); assert(html.includes(`${persona} retained sustainability_do_growth`)); assert(html.includes('Page 21')); }
      fs.writeFileSync(path.join(output, `${kind}-${persona}-report-preview.html`), html);
      cases.push({ kind, persona, bytes: Buffer.byteLength(html), unresolvedLiquid: 0, htmlSha256: crypto.createHash('sha256').update(html).digest('hex') });
    }
  }
  process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'production';
  assert.equal((await GET(request, context)).status, 404); assert.equal(state.authCalls, 0);
  process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'sandbox';
  process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF = 'atemrshtshxoqnuevvqu';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://atemrshtshxoqnuevvqu.supabase.co';
  const owner = state.user;
  for (const user of [null, { ...owner, email_confirmed_at: null }]) {
    state.user = user; const res = await GET(request, context); assert.equal(res.status, 303); assert(res.headers.get('location').includes('/login?next=')); assert(!res.headers.get('location').includes('foreign')); assert.equal(state.reads.length, 0);
  }
  state.user = owner;
  assert.equal((await GET(request, context)).status, 404);
  assert.deepEqual(state.reads.at(-1), [id, owner.id, 'owner@example.test']);
  state.snapshot = snapshot('designid', { Name: 'Owner', Primary: 'Architect', Secondary: 'Artisan', Architect_Pts: 40, Artisan_Pts: 30, Shepherd_Pts: 20, Steward_Pts: 10 });
  let res = await GET(request, context); assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');
  assert(reportPreviewHeaders['Content-Security-Policy'].includes("script-src 'none'"));
  assert(reportPreviewHeaders['Content-Security-Policy'].includes("connect-src 'none'"));
  assert(!reportPreviewHeaders['Content-Security-Policy'].includes('https:;'));
  state.snapshot = snapshot('spiritual_gifts', {}); assert.equal((await GET(request, context)).status,404);
  assert.equal(await renderSavedReportPreview(snapshot('fruit_360', {})), null);
  const sources = ['designid','designpd'].map(kind => { const t=require('./'+kind+'.json');return {kind,id:t.id,source:t.source,updatedAt:t.updatedAt,fetchedAt:t.fetchedAt,bodySha256:t.bodySha256,cssSha256:t.cssSha256,bytes:Buffer.byteLength(t.body)}; });
  const evidence = { generatedAt: new Date().toISOString(), state: 'local only', sourceFetchMethod: 'GET only; official published body and stylesheet; no drafts, credentials, or sample participant data retained', sources, cases, checks: { contrastingSavedProfiles: true, retainedNarrativeFields: true, noUnresolvedLiquid: true, savedPayloadUnchanged: true, escaping: true, production404BeforeAuth: true, unauthenticatedRedirect: true, unconfirmedEmailRedirect: true, exactOwnedSnapshotResolverArguments: true, missingOrForeign404: 'resolver null mocked; existing ownership resolver remains unchanged', privateNoStore: true, restrictiveCsp: true, unsupportedAssessment404: true }, providerWrites: 0, emails: 0, databaseWrites: 0, limitations: ['Synthetic retained-payload contrast render and mocked auth/ownership route tests; no authenticated live save/browser session exercised.', 'Browser layout and external source image loading not verified. Source template intentionally unchanged, including PDF-oriented page sizes.'] };
  fs.writeFileSync(path.join(output,'report-preview-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log('PASS: 4 full-source contrast renders; exact source hashes; zero unresolved Liquid; nonmutating payload/HTML escaping; sandbox/auth/ownership/no-store/CSP route gates.');
})().catch(e => { console.error(e); process.exitCode = 1; });

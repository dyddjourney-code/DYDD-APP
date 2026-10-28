const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const load = require('../scripts/fruitlife-test-load.cjs');

// Entirely isolated fixtures: no HTTP, database, account, object, or email writes.
global.fetch = () => { throw new Error('Network forbidden in boundary fixtures'); };
let user = null, authError = null, previewReport = null;
let privilegedQueries = 0, namedQueries = 0;
const empty = { all: [], latest: [] };
const fixture = [1, 2].map(n => ({
  id: `synthetic-snapshot-${n}`, assessment_type: 'designid',
  created_at: '2026-10-01T00:00:00Z', source_submitted_at: null,
  source: 'synthetic-only', scores: {},
  assessment_participants: { display_name: 'PRIVATE SYNTHETIC PARTICIPANT', normalized_email: 'private-fixture@example.invalid' },
}));
const sessionClient = {
  auth: { getUser: async () => ({ data: { user }, error: authError }) },
  from: () => ({ select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: null }) }),
};
const context = {
  getAssessmentSnapshotsForUser: async () => empty,
  getAssessmentSnapshotsForParticipantMatch: async () => { namedQueries++; return empty; },
  assessmentLabels: { designid: 'DesignID' }, displayDate: () => 'Synthetic date',
};
const review = {
  heatherReviewName: 'Synthetic reviewer', newReviewName: 'Synthetic preview',
  isHeatherReviewRequest: () => false, isNewReviewRequest: () => Boolean(previewReport),
  getHeatherReviewReport: async () => null, getNewReviewReport: async () => previewReport,
  reviewQuery: () => '', withReviewQuery: path => path,
};
const mocks = {
  '@/lib/supabase/server': { createSupabaseServerClient: async () => sessionClient },
  '@/lib/supabase/admin': { createSupabaseAdminClient: () => {
    privilegedQueries++;
    return { from: () => ({ select() { return this; }, order() { return this; }, limit: async () => ({ data: fixture }) }) };
  } },
  '@/lib/assessments/student-context': context,
  '@/lib/review/heather': review,
};
const boundary = load('lib/basecamp/admin-reports.ts', mocks);
const source = ts.createSourceFile('page.tsx', fs.readFileSync('app/hq/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true);
const pageMocks = {};
for (const statement of source.statements) {
  if (!ts.isImportDeclaration(statement)) continue;
  const name = statement.moduleSpecifier.text;
  const stub = {};
  if (statement.importClause?.name) stub.default = () => null;
  for (const element of statement.importClause?.namedBindings?.elements ?? []) stub[element.propertyName?.text ?? element.name.text] = () => null;
  pageMocks[name] = stub;
}
Object.assign(pageMocks, mocks, {
  '@/lib/basecamp/admin-reports': boundary,
  '@/lib/identity/email': load('lib/identity/email.ts'),
  '@/lib/environment': { isSandbox: () => false },
  '@/lib/passport/state': { syncPassportAwards: async () => null },
  '@/lib/passport-badges': { buildPassportBadges: () => [] },
  'next/navigation': { redirect: path => { throw new Error(`redirect:${path}`); } },
});
const page = load('app/hq/page.tsx', pageMocks).default;
const authenticated = email => ({ id: 'synthetic-user', email, email_confirmed_at: '2026-10-01T00:00:00Z', is_anonymous: false });
const serializedPage = async () => JSON.stringify(await page({ searchParams: Promise.resolve({ review: 'owner', key: 'forged' }) }));
async function expectDenied(candidate, label) {
  user = candidate; authError = null; previewReport = null;
  privilegedQueries = 0; namedQueries = 0;
  assert.deepEqual(await boundary.getBaseCampAdminReports(), { isAdmin: false, adminReport: null, heatherReport: null }, label);
  if (user) {
    const output = await serializedPage();
    assert(!output.includes('Admin report'), `${label}: no admin panel`);
    assert(!output.includes('PRIVATE SYNTHETIC'), `${label}: no private participant`);
    assert(!output.includes('private-fixture@'), `${label}: no private email`);
    assert(!output.includes('Recent mirrored rows'), `${label}: no counts/history`);
  } else {
    await assert.rejects(serializedPage, /redirect:\/login/);
  }
  assert.equal(privilegedQueries, 0, `${label}: no service-role report client`);
  assert.equal(namedQueries, 0, `${label}: no named participant lookup`);
}
(async () => {
  delete process.env.DYDD_ADMIN_EMAILS;
  await expectDenied(null, 'anonymous');
  await expectDenied(authenticated('ordinary@example.invalid'), 'ordinary learner');
  await expectDenied(authenticated('dyddjourney+learner@gmail.com'), 'owner plus alias learner');
  await expectDenied(authenticated('dydd.journey@gmail.com'), 'owner dotted alias learner');
  await expectDenied(authenticated('dyddjourney@googlemail.com'), 'owner alternate domain learner');
  await expectDenied({ ...authenticated('ordinary@example.invalid'), user_metadata: { role: 'admin', email: 'dyddjourney@gmail.com' } }, 'editable metadata forgery');
  await expectDenied({ ...authenticated('dyddjourney@gmail.com'), email_confirmed_at: null }, 'unconfirmed identity');
  await expectDenied({ ...authenticated('dyddjourney@gmail.com'), is_anonymous: true }, 'anonymous auth identity');
  user = authenticated('dyddjourney@gmail.com'); authError = new Error('invalid session');
  assert.equal((await boundary.getBaseCampAdminReports()).isAdmin, false);
  authError = null;
  process.env.DYDD_ADMIN_EMAILS = 'explicit-admin@example.invalid,dyddjourney+authorized@gmail.com';
  for (const email of ['dyddjourney@gmail.com', 'explicit-admin@example.invalid', 'dyddjourney+authorized@gmail.com']) {
    user = authenticated(email); privilegedQueries = 0; namedQueries = 0;
    const data = await boundary.getBaseCampAdminReports();
    assert.equal(data.isAdmin, true, email);
    assert.equal(data.adminReport.totalInRecentWindow, 2);
    assert.equal(data.adminReport.duplicatePairsInRecentWindow, 1);
    assert.equal(privilegedQueries, 1); assert.equal(namedQueries, 1);
    const output = await serializedPage();
    assert(output.includes('Admin report')); assert(output.includes('PRIVATE SYNTHETIC PARTICIPANT'));
  }
  await expectDenied(authenticated('explicit-admin+learner@example.invalid'), 'configured admin alias not implicitly authorized');
  user = authenticated('dyddjourney@gmail.com'); privilegedQueries = 0; namedQueries = 0;
  assert.equal((await boundary.getBaseCampAdminReports({ preview: true })).isAdmin, false);
  previewReport = empty;
  const previewOutput = await serializedPage();
  assert(!previewOutput.includes('Admin report'));
  assert.equal(privilegedQueries, 0); assert.equal(namedQueries, 0);
  console.log('PASS Base Camp anonymous/ordinary/alias/unconfirmed/forged/error/preview server+UI denial; exact owner/configured admins retain synthetic reports. No network or real customer operations.');
})().catch(error => { console.error(error); process.exitCode = 1; });

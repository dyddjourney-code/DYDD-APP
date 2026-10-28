const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const { sandboxProfileRequest } = load('lib/profile/sandbox-preview.ts', {
  'server-only': {},
  '@/lib/supabase/admin': { createSupabaseAdminClient() { throw Error('No storage calls allowed in access tests'); } },
  '@/lib/assessments/report-storage': { reportBucket: 'assessment-report-pdfs' },
  '@/lib/assessments/student-context': {},
});
process.env.DYDD_REVIEW_TOKEN = 'test-owner-token';
const request = (query) => new Request('https://school.example/api/profile'+query);
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'production';
assert.equal(sandboxProfileRequest(request('?review=new&key=test-owner-token')), false);
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'sandbox';
assert.equal(sandboxProfileRequest(request('')), false);
assert.equal(sandboxProfileRequest(request('?review=new&key=wrong')), false);
assert.equal(sandboxProfileRequest(request('?review=heather&key=test-owner-token')), false);
assert.equal(sandboxProfileRequest(request('?review=new&key=test-owner-token')), true);
delete process.env.DYDD_REVIEW_TOKEN;
assert.equal(sandboxProfileRequest(request('?review=new&key=test-owner-token')), false);
console.log('PASS preview profile saves require sandbox environment + configured owner credential + Jordan persona');

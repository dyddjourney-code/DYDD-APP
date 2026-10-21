const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const { requireTrailCourseAssessment: guard } = load('lib/trails/course-access.ts', {
  'next/navigation': { redirect(href) { throw Error(href); } },
  '@/lib/fruitlife360/dashboard': {},
  '@/lib/assessments/student-context': {},
});
const { isDesignIdOwnerCoursePreview: allowed, designIdCourseReviewParams: normalize } = load('lib/trails/course-preview.ts', {'@/lib/assessments/student-context': {}});
process.env.DYDD_REVIEW_TOKEN = 'test-only-placeholder';
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'sandbox';
const params = { review: 'new', key: process.env.DYDD_REVIEW_TOKEN };
const input = { slug: 'designid-foundations', snapshots: [], email: '', signedIn: false, preview: false };
(async () => {
  assert(allowed(params));
  const owner = { ...params, review: "owner" };
  assert(allowed(owner));
  assert.equal(normalize(owner).review, "new");
  await guard({ ...input, params: owner });
  await guard({ ...input, params });
  await assert.rejects(guard({ ...input, params: { review: 'new', key: 'invalid' } }), /login/);
  await assert.rejects(guard(input), /login/);
  await assert.rejects(guard({ ...input, signedIn: true }), /trailheads/);
  await assert.rejects(guard({ ...input, preview: true, params: { ...params, review: 'heather' } }), /trailheads/);
  await assert.rejects(guard({ ...input, slug: 'designpd-alignment', params }), /login/);
  process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'production';
  assert(!allowed(params));
  assert.equal(normalize({ ...params, review: "owner" }).review, "owner");
  await assert.rejects(guard({ ...input, preview: true, params }), /trailheads/);
  delete process.env.DYDD_REVIEW_TOKEN;
  process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'sandbox';
  assert(!allowed(params));
  console.log('PASS server-verified Jordan only; no/invalid credential denied; normal learner prerequisite; Heather and paid expansion unchanged; production denied');
})().catch(e => { console.error(e); process.exit(1); });

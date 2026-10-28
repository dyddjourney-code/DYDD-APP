const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
let signedIn = false;
const route = load('app/api/course-reflections/discussion/route.ts', {
  '@/lib/supabase/server': { createSupabaseServerClient: async () => ({ auth: { getUser: async () => ({data: {user: signedIn ? {id:'test-owner'} : null}}) } }) },
  '@/lib/supabase/admin': { createSupabaseAdminClient() { throw Error('Storage must not be reached for rejected requests'); } },
  '@/lib/assessments/report-storage': { reportBucket: 'assessment-report-pdfs' },
  '@/lib/reflections/preview': { previewParams: () => null },
});
(async()=>{
  process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'production';
  assert.equal((await route.GET(new Request('https://school.example/api/course-reflections/discussion?courseSlug=discover-your-divine-design'))).status,404);
  assert.equal((await route.POST(new Request('https://school.example/api/course-reflections/discussion',{method:'POST'}))).status,404);
  process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT = 'sandbox';
  assert.equal((await route.GET(new Request('https://school.example/api/course-reflections/discussion?courseSlug=discover-your-divine-design'))).status,401);
  signedIn = true;
  assert.equal((await route.GET(new Request('https://school.example/api/course-reflections/discussion?courseSlug=designid-foundations'))).status,400);
  assert.equal((await route.POST(new Request('https://school.example/api/course-reflections/discussion',{method:'POST',headers:{origin:'https://elsewhere.example'}}))).status,403);
  const {careDiscussionIds}=load('lib/reflections/discussion-catalog.ts');
  assert(careDiscussionIds.has('child-of-god-response'));assert(!careDiscussionIds.has('niche-working-declaration'));assert(!careDiscussionIds.has('anything-lesson-reflection'));
  console.log('PASS stable runtime disabled, auth required, wrong-course/foreign-origin denied before storage; only CARE questions eligible');
})();

const assert = require('node:assert/strict');
const load = require('../scripts/fruitlife-test-load.cjs');
const { hasDesignPdCourseAccess } = load('lib/designpd/access.ts');
const snapshot = (type, source = 'legacy', status) => ({ assessment_type: type, source, scores: status ? {pdfMonkey:{status}} : {} });
assert.equal(hasDesignPdCourseAccess('traveler@example.com', []), false);
assert.equal(hasDesignPdCourseAccess('traveler@example.com', [snapshot('designid')]), false);
assert.equal(hasDesignPdCourseAccess('traveler@example.com', [snapshot('designpd')]), true);
for (const status of ['error','pending','not_started']) assert.equal(hasDesignPdCourseAccess('traveler@example.com', [snapshot('designpd','designpd_app',status)]), false);
for (const status of ['success','ready']) assert.equal(hasDesignPdCourseAccess('traveler@example.com', [snapshot('designpd','designpd_app',status)]), true);
assert.equal(hasDesignPdCourseAccess('john@discoverdivine.design', []), true);
let user = null, all = [], preview = null;
const redirect = location => {throw new Error(`REDIRECT:${location}`)};
const mocks = {
 'next/navigation': {redirect, notFound:()=>{throw Error('404')}},
 '@/lib/supabase/server': {createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})},from:()=>({select:()=>{const q={eq:()=>q,then:fn=>Promise.resolve(fn({data:[]}))};return q;}})})},
 '@/lib/review/heather': {getHeatherReviewReport:async()=>preview,reviewQuery:()=>'',withReviewQuery:x=>x},
 '@/lib/assessments/student-context': {getAssessmentSnapshotsForUser:async()=>({all,latest:all}),buildAssessmentCourseInsights:()=>({rows:[],connected:false})},
 '@/components/assessment-course-navigator': {AssessmentCourseNavigator:()=>null},
 '@/components/fruitlife-mini-nav': {FruitLifeMiniNav:()=>null},
 '@/components/companion-audio-card': {CompanionAudioCard:()=>null},
};
const course = load('app/courses/[courseSlug]/page.tsx', mocks).default;
const lesson = load('app/learn/[courseSlug]/[lessonSlug]/page.tsx', mocks).default;
const catalog = load('lib/courses/course-catalog.ts');
const firstLesson = catalog.getLearningCourse('designpd-alignment').modules[0].lessons[0].slug;
(async()=>{
 for (const page of [course,lesson]) {
  const args = {params:Promise.resolve({courseSlug:'designpd-alignment',lessonSlug:firstLesson})};
  user = null; all = [];
  await assert.rejects(()=>page(args),/REDIRECT:.*login/);
  user = {id:'account',email:'traveler@example.com'};all = [snapshot('designid')];
  await assert.rejects(()=>page(args),/REDIRECT:\/field-kit#optional-expansions/);
  preview = {all:[snapshot('designpd')],latest:[]};
  await assert.rejects(()=>page(args),/REDIRECT:\/field-kit#optional-expansions/);
  preview = null;
  all = [snapshot('designpd','designpd_app','error')];
  await assert.rejects(()=>page(args),/REDIRECT:\/field-kit#optional-expansions/);
  all = [snapshot('designpd','designpd_app','success')];
  assert(await page(args));
  user = {id:'owner',email:'john@discoverdivine.design'};all=[];
  assert(await page(args));
 }
 console.log('PASS: DesignID-only denied; ready/legacy DesignPD allowed; failed/pending denied; owner preserved. Course and standalone lesson routes enforce signed-in access.');
})().catch(e=>{console.error(e);process.exitCode=1});

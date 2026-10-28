const assert = require('node:assert/strict');
const fs = require('node:fs');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const load = require('../scripts/fruitlife-test-load.cjs');
const {courseOrigin, courseCardHref, withCourseOrigin} = load('lib/trails/course-origin.ts');
for (const value of [undefined, '', '/journey', '//evil.test', 'https://evil.test', 'field-kit']) assert.equal(courseOrigin(value), 'field-kit');
assert.equal(courseOrigin('trailheads'), 'trailheads');
for (const [slug, card] of [['designpd-alignment','designpd'], ['fruitlife-360-formation','fruitlife-360']]) {
  assert.equal(courseCardHref(slug,'field-kit'), '/field-kit#collection-'+card);
  assert.equal(courseCardHref(slug,'trailheads'), '/trailheads#'+card);
  assert.equal(courseCardHref(slug,'field-kit',true), '/field-kit?lane=fruitlife#collection-'+card);
}
assert.equal(withCourseOrigin('/courses/designpd-alignment?lane=fruitlife#player','field-kit'), '/courses/designpd-alignment?lane=fruitlife&origin=field-kit#player');
const {canonicalLessonRoute} = load('lib/passport/lesson-route.ts',{'next/navigation':{redirect:href=>{throw {href}}},'@/lib/review/heather':{withReviewQuery:p=>p}});
for(const origin of ['field-kit','trailheads'])try{canonicalLessonRoute('designpd-alignment','your-planning-tendency',{origin});assert.fail('expected redirect')}catch(e){assert.equal(e.href,`/courses/designpd-alignment?lesson=your-planning-tendency&origin=${origin}`)}
let slug='what-you-see';
const {designPdCourse}=load('lib/courses/designpd-alignment.ts');
const lessons=designPdCourse.modules.flatMap(m=>m.lessons.map(l=>l.slug));
const source=[{label:'Plan',value:'Balanced'},{label:'Decide',value:'Strong_Think_It'},{label:'Do',value:'Moderate_Together'}];
const before=JSON.stringify(designPdCourse);
const {savedDesignPdTendencies}=load('lib/designpd/tendencies.ts');
for (const [key,values] of [
 ['summary',{Plan_Tendency:'Balanced',Decide_Tendency:'Strong_Think_It',Do_Tendency:'Moderate_Together'}],
 ['reportPayload',{plan_tendency:'Balanced',decide_tendency:'Strong_Think_It',do_tendency:'Moderate_Together'}],
 ['axisTendencies',{plan:'Balanced',decide:'Strong_Think_It',do:'Moderate_Together'}],
]){const snap={scores:{[key]:values}};const unchanged=JSON.stringify(snap);assert.deepEqual(savedDesignPdTendencies(snap),source);assert.equal(JSON.stringify(snap),unchanged);}
assert.deepEqual(savedDesignPdTendencies({scores:{axisScores:{plan:50,decide:75,do:80}}}),[],'No label inferred from numeric scores');

// Render actual navigator with only browser effects/progress mocked. The approved
// authored lesson bodies and reflection control are still rendered unchanged.
const realUseState=React.useState,realUseEffect=React.useEffect,realUseMemo=React.useMemo,realUseRef=React.useRef;
React.useState=initial=>[typeof initial==='string'?'':initial,()=>{}];React.useEffect=()=>{};React.useMemo=f=>f();React.useRef=v=>({current:v});
try{
 const {AssessmentCourseNavigator}=load('components/assessment-course-navigator.tsx',{
  '@/components/course-progress':{useCourseProgress:()=>({canVisit:s=>s===slug,state:{completed:[]},done:s=>s!==slug,percent:0}),CourseCompletionControls:()=>null},
  '@/components/reflection-session':{useReflectionPosition:()=>({}),ReflectionAnswer:()=>React.createElement('textarea',{'aria-label':'Preserved authored reflection'})},
  '@/components/companion-audio-card':{CompanionAudioCard:()=>null},
 });
 for(const [lesson,labels] of [['what-you-see',['Plan','Decide','Do']],['your-planning-tendency',['Plan']],['your-deciding-tendency',['Decide']],['your-doing-tendency',['Do']]]){
  slug=lesson;
  const html=renderToStaticMarkup(AssessmentCourseNavigator({accent:'orange',assessmentLabel:'DesignPD',connected:true,courseSlug:'designpd-alignment',insights:source,modules:designPdCourse.modules,reviewQuery:'',showPersonalization:false}));
  assert(html.includes('designpd-lesson-tendencies'),lesson);
  for(const label of labels)assert(html.includes(`<dt>${label}</dt><dd>${source.find(r=>r.label===label).value}</dd>`),lesson+' '+label);
  assert(html.includes('Preserved authored reflection'));
 }
 slug='what-you-see';
 const missing=renderToStaticMarkup(AssessmentCourseNavigator({accent:'orange',assessmentLabel:'DesignPD',connected:false,courseSlug:'designpd-alignment',insights:[],modules:designPdCourse.modules,reviewQuery:'',showPersonalization:false}));
 assert.equal((missing.match(/Not available in your saved report/g)||[]).length,3);
}finally{React.useState=realUseState;React.useEffect=realUseEffect;React.useMemo=realUseMemo;React.useRef=realUseRef;}
assert.equal(JSON.stringify(designPdCourse),before,'Never change authored source/reflective prompts');
console.log('PASS allowlisted durable origins, standalone routes, exact card anchors, actual source tendency panels, unavailable states and preserved teaching/reflections');

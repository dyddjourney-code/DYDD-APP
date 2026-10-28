const assert=require('node:assert/strict');const load=require('../scripts/fruitlife-test-load.cjs');
const {requireTrailCourseAssessment}=load('lib/trails/course-access.ts',{
 'next/navigation':{redirect:href=>{throw {href}}},
 '@/lib/trails/course-preview':{isOwnerCoursePreview:()=>false},
 '@/lib/review/heather':{withReviewQuery:p=>p},
});
(async()=>{
 for(const origin of ['field-kit','trailheads']){
  try{await requireTrailCourseAssessment({slug:'designpd-alignment',snapshots:[],email:'',signedIn:false,preview:false,params:{origin,lesson:'your-planning-tendency'}});assert.fail('redirect expected')}catch(e){const login=new URL(e.href,'https://school.invalid');assert.equal(login.pathname,'/login');assert.equal(login.searchParams.get('next'),`/courses/designpd-alignment?origin=${origin}&lesson=your-planning-tendency`);}
  try{await requireTrailCourseAssessment({slug:'designpd-alignment',snapshots:[],email:'learner@example.invalid',signedIn:true,preview:false,params:{origin}});assert.fail('redirect expected')}catch(e){assert.equal(e.href,origin==='field-kit'?'/field-kit#collection-designpd':'/trailheads#designpd');}
 }
 try{await requireTrailCourseAssessment({slug:'designpd-alignment',snapshots:[],email:'',signedIn:false,preview:false,params:{origin:'https://evil.invalid',lesson:'/journey'}});assert.fail('redirect expected')}catch(e){assert.equal(new URL(e.href,'https://school.invalid').searchParams.get('next'),'/courses/designpd-alignment?origin=field-kit');}
 console.log('PASS course sign-in retains allowlisted origin and real lesson; wrong/missing assessment returns precise originating card; untrusted route/lesson rejected');
})().catch(e=>{console.error(e);process.exitCode=1});

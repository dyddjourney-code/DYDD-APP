// Render real server UI with isolated read-only fixtures; no auth/session/database/email writes.
const assert=require('node:assert/strict'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const load=require('../scripts/fruitlife-test-load.cjs');
let all=[],sessions=[],owner=false;
const link=({children,href})=>React.createElement('a',{href},children),empty=()=>null;
const mocks={
 '@/lib/public-assessments/course-capability':{hasAssessmentCourseCapability:async()=>true},
 'next/link':link,
 '@/components/trail-anchor':{TrailAnchor:empty},
 '@/components/trail-placard':{TrailPlacard:({children})=>React.createElement('div',null,children)},
 '@/components/trail-resume-link':{TrailResumeLink:({href,startLabel})=>React.createElement('a',{href},startLabel)},
 '@/components/fruitlife-mini-nav':{FruitLifeMiniNav:empty},'@/components/fruitlife-mini-footer':{FruitLifeMiniFooter:empty},
 '@/lib/commerce/personal-access':{hasLifetimePersonalAccess:async()=>false,hasIncludedPersonalAccess:async()=>false},
 '@/lib/environment':{isFreeBeta:()=>true,isSandbox:()=>false},
 '@/lib/trails/course-preview':{designIdCourseReviewParams:x=>x,isOwnerCoursePreview:()=>false},
 '@/lib/assessments/student-context':{getAssessmentSnapshotsForUser:async()=>({all}),latestByAssessment:x=>x},
 '@/lib/fruitlife360/dashboard':{getFruitLifeDashboardSessions:async()=>sessions,fruitLifeIsActive:s=>s.session_status==='waiting_for_self',fruitLifeReportArtifact:s=>s.ready},
 '@/lib/designpd/access':{hasDesignPdCourseAccess:()=>true},
 '@/lib/commerce/fruitlife-entitlements':{userHasFruitLifeEntitlement:async()=>true},
 '@/lib/identity/email':{normalizeEmail:x=>x},
 '@/lib/review/heather':{getHeatherReviewReport:async()=>null,getNewReviewReport:async()=>null,isHeatherReviewRequest:()=>false,isNewReviewRequest:()=>false,reviewQuery:()=>'',withReviewQuery:x=>x},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:{id:owner?'owner':'beta',email:'fixture@example.invalid'}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{email:'fixture@example.invalid'}})})})})})},
};
const page=load('app/trailheads/page.tsx',mocks).default;
const Collection=load('components/field-kit-collection.tsx',mocks).FieldKitCollection;
const snapshots=()=>['designid','spiritual_gifts','fruit_360'].map((assessment_type,i)=>({id:String(i),assessment_type,scores:{},source:'fixture'}));
const artifacts=()=>['designid-foundations','spiritual-gifts-service','fruitlife-360-formation'].flatMap((experienceSlug,i)=>[0,1].map(n=>({id:`${i}-${n}`,experienceSlug,title:'Saved '+i+'-'+n,href:`/report/${i}-${n}`,pdfHref:`/pdf/${i}-${n}`,detail:'Completed earlier.',completedAt:`2026-10-${20+n}`,action:'View snapshot',logo:'',meta:[]})));
(async()=>{
 const fixtures={};
 for(owner of [false,true])for(const lane of [undefined,'fruitlife']){
  all=snapshots();sessions=[];
  let html=renderToStaticMarkup(await page({searchParams:Promise.resolve({lane})}));
  assert(html.includes('>Take Fruitful Life 360 Again</a>'),'completed Fruitful Life 360 must retain native retake action');
  assert(html.includes('>Take Spiritual Gifts Again</a>'),'completed Gifts must retain native retake action');
  assert(!html.includes('Take DesignID Again'),'never expose unrestricted DesignID retake');
  fixtures[`trailheads-${owner?'owner':'beta'}-${lane?'mini':'main'}`]=html;
  assert(html.includes('View My Results')&&html.includes('Start the Course'),'results and course preserved');
  sessions=[{session_status:'waiting_for_self'}];
  html=renderToStaticMarkup(await page({searchParams:Promise.resolve({lane})}));
  fixtures[`active-${owner?'owner':'beta'}-${lane?'mini':'main'}`]=html;
  assert(!html.includes('Take Fruitful Life 360 Again'),'active session must be resumed instead');assert(html.includes('Track Current Assessment'));
 }
 for(const populated of [false,true]){
  const reports=populated?artifacts():[];
  const html=renderToStaticMarkup(React.createElement(Collection,{artifacts:reports,rounds:populated?[{course_slug:'fruitlife-360-formation',started_at:'2026-10-22'}]:[]}));
  assert(html.includes('href="/fruitlife360"')&&html.includes('href="/spiritual-gifts?channel=app"'),'both native entrypoints remain in collection');
  fixtures[populated?'collection-populated':'collection-empty']=html;
  assert(html.includes('Continue course')&&html.includes('Review my reflections'));
  if(populated){assert(html.includes('Take assessment again'));assert(html.includes('Assessment history (1)'));for(const a of reports)assert(html.includes(a.href)&&html.includes(a.pdfHref),'all dated result/PDF links preserved');assert(!html.includes('href="/designid"'),'existing DesignID report cannot get unrestricted CTA');}
  else assert(html.includes('href="/designid"'),'empty DesignID entry preserved');
 }
 const {addSixCalendarMonths}=load('lib/designid/retake-policy.ts',mocks);
 assert.equal(addSixCalendarMonths('2026-08-31T12:00:00Z').toISOString(),'2027-02-28T12:00:00.000Z');
 assert.equal(addSixCalendarMonths('2023-08-31T12:00:00Z').toISOString(),'2024-02-29T12:00:00.000Z');
 const db={from:table=>{const q={select:()=>q,or:()=>q,eq:()=>q,order:()=>Promise.resolve({data:[{id:'prior',created_at:new Date().toISOString()}]}),in:()=>q,is:()=>q,gt:()=>q,limit:()=>Promise.resolve({data:[]}),then:resolve=>resolve({data:table==='assessment_participants'?[{id:'participant'}]:[]})};return q;}};
 const {getDesignIdEligibility}=load('lib/designid/retake.ts',{'../public-assessments/identity':{getOwnedAssessmentSnapshots:async()=>[{id:'prior',assessment_type:'designid',created_at:new Date().toISOString()}]},'../supabase/admin':{createSupabaseAdminClient:()=>db},'../identity/email':{normalizeEmail:x=>x,participantEmailCandidates:()=>['fixture@example.invalid']}});
 assert.equal((await getDesignIdEligibility('beta','fixture@example.invalid',false)).allowed,false,'recent DesignID still restricted');
 assert.equal((await getDesignIdEligibility('owner','fixture@example.invalid',true)).allowed,true,'owner DesignID exemption preserved');
 if(process.env.RETAKE_BROWSER==='1'){
  const fs=require('node:fs'),http=require('node:http');
  const {default:puppeteer}=await import('puppeteer-core'),{default:chromium}=await import('@sparticuz/chromium');
  const css=fs.readFileSync('app/globals.css','utf8'),checks=[];
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${fixtures[req.url.slice(1)]||''}</body></html>`)});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
   browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
   const page=await browser.newPage();await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith('http://127.0.0.1:')?r.continue():r.abort());
   for(const width of [1280,390,320])for(const route of Object.keys(fixtures)){
    await page.setViewport({width,height:950});await page.goto(`http://127.0.0.1:${server.address().port}/${route}`,{waitUntil:'domcontentloaded'});
    const found=await page.evaluate(()=>Array.from(document.querySelectorAll('a')).filter(a=>/Take.*Again|Take assessment( again)?/.test(a.textContent)).filter(a=>a.getClientRects().length&&getComputedStyle(a).visibility!=='hidden').map(a=>({text:a.textContent,href:a.getAttribute('href')})));
    for(const href of ['/fruitlife360','/spiritual-gifts?channel=app']){
     if(route.startsWith('active')&&href==='/fruitlife360')continue;
     assert(found.some(a=>a.href===href||a.href.startsWith(href+(href.includes('?')?'&':'?'))),`${width}/${route} visible ${href}`);
    }
    if(route.startsWith('active'))assert(await page.evaluate(()=>Array.from(document.querySelectorAll('a')).some(a=>a.textContent==='Track Current Assessment'&&a.getClientRects().length)));
    checks.push({width,route,visibleNativeEntrypoints:true});
   }
   fs.mkdirSync('tmp/retake-diagnosis',{recursive:true});fs.writeFileSync('tmp/retake-diagnosis/browser-proof.json',JSON.stringify({checks,scope:'Actual server UI and production CSS rendered with isolated read-only fixtures; no live authentication or writes.'},null,2));
   console.log(`PASS ${checks.length} browser fixture states at 1280/390/320: visible native entrypoints and unfinished-session tracking`);
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
 }
 console.log('PASS beta/owner, normal/mini Trailheads, completed/active Fruitful Life 360, repeatable Gifts, empty/populated Field Kit, preserved history/PDF/course/reflections and DesignID isolation.');
})().catch(e=>{console.error(e.stack);process.exitCode=1});

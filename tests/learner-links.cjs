// Actual server-page render and browser link/anchor checks, synthetic read-only data.
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const load=require('../scripts/fruitlife-test-load.cjs');
const anchor=({children,prefetch,...props})=>React.createElement('a',props,children);
const user={id:'fixture-user',email:'learner@example.invalid'};
let hasDesign=false;
const mocks={
 '@/components/trail-anchor':{TrailAnchor:()=>null},'next/link':anchor,'next/navigation':{redirect:()=>{throw Error('Unexpected redirect')}},
 '@/components/trail-resume-link':{TrailResumeLink:({href,startLabel})=>React.createElement('a',{href},startLabel)},
 '@/components/trail-placard':{TrailPlacard:({name,children})=>React.createElement('div',{},React.createElement('h3',{},name),children)},
 '@/components/fruitlife-mini-nav':{FruitLifeMiniNav:()=>null},'@/components/fruitlife-mini-footer':{FruitLifeMiniFooter:()=>null},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})},from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:null})})})},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'fixture',scores:{pdfMonkey:{status:'ready'}}}})})})},
 '@/lib/environment':{isFreeBeta:()=>true,isSandbox:()=>false},
 '@/lib/trails/course-preview':{isOwnerCoursePreview:()=>false,designIdCourseReviewParams:p=>p},
 '@/lib/assessments/student-context':{getAssessmentSnapshotsForUser:async()=>({all:hasDesign?[{assessment_type:'designid',id:'fixture'}]:[],latest:[]}),latestByAssessment:a=>a},
 '@/lib/fruitlife360/dashboard':{getFruitLifeDashboardSessions:async()=>[],fruitLifeIsActive:()=>false,fruitLifeReportArtifact:()=>null},
 '@/lib/designpd/access':{hasDesignPdCourseAccess:()=>false},'@/lib/commerce/fruitlife-entitlements':{userHasFruitLifeEntitlement:async()=>false},
 '@/lib/review/heather':{getHeatherReviewReport:async()=>null,getNewReviewReport:async()=>null,isHeatherReviewRequest:()=>false,isNewReviewRequest:()=>false,reviewQuery:()=>'',withReviewQuery:p=>p},
 './clear-draft':{ClearDesignIdDraft:()=>null},
};
(async()=>{
 const thanks=load('app/designid/thanks/page.tsx',mocks).default;
 const pd=load('app/designpd/thanks/page.tsx',mocks).default;
 const trail=load('app/trailheads/page.tsx',mocks).default;
 const gear=load('app/gear/page.tsx',mocks).default;
 const thanksHtml=renderToStaticMarkup(await thanks({searchParams:Promise.resolve({snapshot:'synthetic'})}));
 assert(thanksHtml.includes('href="/designid/report?snapshot=synthetic" target="_blank" rel="noopener noreferrer"'));
 assert(thanksHtml.includes('href="/courses/designid-foundations">Continue This Trail'));
 const pdHtml=renderToStaticMarkup(await pd({searchParams:Promise.resolve({snapshot:'synthetic'})}));
 assert(pdHtml.includes('target="_blank" rel="noopener noreferrer"'));assert(pdHtml.includes('href="/courses/designpd-alignment">Continue This Trail'));
 const gearHtml=renderToStaticMarkup(await gear({}));
 const hrefs=[...gearHtml.matchAll(/href="([^"]+)"[^>]*>Purchase (?:book|workbook)/g)].map(m=>m[1]);assert.equal(hrefs.length,2);assert.equal(hrefs[0],hrefs[1]);
 const fixture=[];
 for(const complete of [false,true]){hasDesign=complete;const html=renderToStaticMarkup(await trail({searchParams:Promise.resolve({from:'journey'})}));assert.equal((html.match(/id="designid"/g)||[]).length,1);const design=html.slice(html.indexOf('id="designid"'),html.indexOf('id="spiritual-gifts"'));assert(design.includes(complete?'href="/courses/designid-foundations"':'href="/designid"'));assert(design.includes(complete?'Start the Course':'Take DesignID'));fixture.push(process.env.LINKS_BASELINE ? html.replace(/ (?:width|height)="(?:1254|832|820)"/g,'') : html);}
 const {default:puppeteer}=await import('puppeteer-core'),{default:chromium}=await import('@sparticuz/chromium');
 const css=fs.readFileSync('app/globals.css','utf8');
 const server=http.createServer((req,res)=>{if(req.url.startsWith('/brand/')){const p='public'+req.url;setTimeout(()=>{res.setHeader('Content-Type','image/png');res.end(fs.readFileSync(p))},600);return;}if(req.url.startsWith('/report')){res.end('<h1>Synthetic report</h1>');return;}res.setHeader('Content-Type','text/html');res.end('<html><head><style>'+css+'</style></head><body>'+(req.url.startsWith('/thanks')?thanksHtml.replace('/designid/report?snapshot=synthetic','/report'):fixture[req.url.includes('complete')?1:0])+'</body></html>')});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 let browser;const checks=[];
 try{browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});const p=await browser.newPage();
 for(const width of [1280,390,320]){await p.setViewport({width,height:900});for(const status of ['empty','complete']){await p.goto(base+'/'+status+'#designid',{waitUntil:'networkidle0'});const rect=await p.$eval('#designid',e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}));assert(rect.top>=-2&&rect.top<100,JSON.stringify({width,status,rect}));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,status,correctDesignIdAnchor:true});}}
 await p.goto(base+'/thanks',{waitUntil:'domcontentloaded'});const before=p.url();const target=browser.waitForTarget(t=>t.url()===base+'/report');await p.click('a[target="_blank"]');await target;assert.equal(p.url(),before);checks.push({reportPopup:true,appPreserved:true});
 fs.mkdirSync('tmp/eight-learner-fixes',{recursive:true});fs.writeFileSync('tmp/eight-learner-fixes/learner-links-proof.json',JSON.stringify({checks,method:'Actual server pages with synthetic data; delayed real image browser loads and popup'},null,2));console.log('PASS actual thanks/PD/gear/trail renders, relevant continuation, report popup preserves app, 6 mobile/desktop pre/post completion delayed-image anchors');
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

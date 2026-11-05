const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),load=require('../scripts/fruitlife-test-load.cjs');
const drafts=Array.from({length:3},(_,i)=>({id:`round-${i}`,created_at:'2026-11-05T12:00:00Z',self_completed_at:null,session_status:'waiting_for_self',invites:[{observer_name:`Observer group ${i+1}`}]}));
const mocks={
 '@/lib/commerce/account-access':{requirePersonalMembershipContent:async()=>{}},
 '@/lib/commerce/fruitlife-entitlements':{getActiveFruitLifeEntitlement:async()=>null,userHasFruitLifeEntitlement:async()=>true},
 '@/lib/fruitlife360/dashboard':{getFruitLifeDashboardSessions:async()=>drafts,fruitLifeIsActive:()=>true},
 '@/lib/assessment-timing/policy':{getAssessmentEligibility:async()=>({allowed:false,owner:false,previousAttemptId:'saved-self',nextEligible:'2026-12-05',nextEligibleLabel:'December 5, 2026'})},
 '@/components/assessment-timing-status':{AssessmentTimingStatus:()=>React.createElement('p',{},'Self-only assessment · Available again on December 5, 2026.')},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'synthetic',email:'synthetic@example.invalid'}}})},from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{full_name:'Synthetic Fixture'}})})})},
 './actions':{createFruitLifeSession:async()=>{throw Error('No submission allowed')}},
 '@/components/page-help':{PageHelp:()=>null},'next/navigation':{redirect:path=>{throw Error('Unexpected redirect '+path)}},
};
(async()=>{
 const Page=load('app/fruitlife360/page.tsx',mocks).default;const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({})}));
 assert.equal((html.match(/name="resume_session_id"/g)||[]).length,3);assert.equal((html.match(/name="creation_id"/g)||[]).length,1);assert(html.includes('Start My Reflection'));for(let n=1;n<=3;n++)assert(html.includes('Observer group '+n));
 const css=fs.readFileSync('app/globals.css','utf8');const server=http.createServer((req,res)=>{if(req.url.startsWith('/brand/')){res.setHeader('Content-Type','image/jpeg');return res.end(fs.readFileSync('public/brand/tools/fruitful-life-360-logo.jpg'));}res.setHeader('Content-Type','text/html');res.end(`<html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body>${html}</body></html>`)});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{const {default:puppeteer}=await import('puppeteer-core'),{default:chromium}=await import('@sparticuz/chromium');browser=await puppeteer.launch({args:chromium.args.filter(a=>a!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});const page=await browser.newPage();for(const width of [1280,390,320]){await page.setViewport({width,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle0'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.$$eval('input[name="resume_session_id"]',els=>els.length),3);await page.screenshot({path:`tmp/fruitlife-timing/start-${width}.png`,fullPage:true});}console.log('PASS real setup page: explicit 3 distinct draft resume forms + separate new-round id/start; unchanged observer form; 1280/390/320 no overflow. Synthetic rendered fixtures, no submits.');}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});

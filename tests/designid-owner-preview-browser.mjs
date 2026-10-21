import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
process.loadEnvFile('.env.local');
const base=process.env.OWNER_COURSE_TEST_BASE||'http://localhost:3124',key=process.env.DYDD_REVIEW_TOKEN;
assert(key);assert(base.startsWith('http://localhost:')||base==='https://dydd-online-school-sandbox.vercel.app');
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1280,height:1000});
 await page.goto(base+'/command-center?'+new URLSearchParams({review:'owner',key}),{waitUntil:'networkidle2'});
 assert(!new URL(page.url()).pathname.startsWith('/login'),'Existing owner entry');
 const trailLink=await page.$('aside a[href^="/trailheads"]');assert(trailLink,'Owner sidebar Trailheads');
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),trailLink.click()]);
 await page.waitForSelector('#designid a[href^="/courses/designid-foundations"]');
 const previewLink=await page.$('#designid a[href^="/courses/designid-foundations"]');assert(previewLink,'Owner course preview button visible');
 assert((await previewLink.evaluate(e=>e.textContent)).includes('Preview DesignID Course'));
 // Assessment completion and ordinary action stay truthful.
 assert((await page.$eval('#designid',e=>e.textContent)).includes('Take DesignID'));
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),previewLink.click()]);
 await page.waitForSelector('.designid-welcome-body');
 assert(await page.$('[aria-label="Owner course preview"]'));
 assert.equal(new URL(page.url()).pathname,'/courses/designid-foundations');
 assert.deepEqual(await page.$$eval('.designid-welcome-snapshot dd',es=>es.map(e=>e.textContent)),Array(3).fill('Not available in your saved report.'));
 await page.screenshot({path:'tmp/designid-owner-preview-desktop.png',fullPage:true});
 await page.setViewport({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.screenshot({path:'tmp/designid-owner-preview-phone.png',fullPage:true});
 const query=new URL(page.url()).searchParams;
 const lesson='/learn/designid-foundations/welcome-to-designid';
 await page.goto(base+lesson+'?'+query,{waitUntil:'networkidle2'});
 assert(await page.$('.designid-welcome-body'));assert(await page.$('[aria-label="Owner course preview"]'));
 // Reflection access remains honest: no new assessment-backed round is unlocked.
 const data=await fetch(base+'/api/course-reflections?'+new URLSearchParams({courseSlug:'designid-foundations',review:'new',key})).then(r=>r.json());
 assert.equal(data.preview,true);assert.equal(data.canStart,false);assert.equal(data.reports.length,0);
 const context=await browser.createBrowserContext();const anon=await context.newPage();
 for(const path of ['/courses/designid-foundations',lesson]){
  await anon.goto(base+path,{waitUntil:'networkidle2'});assert.equal(new URL(anon.url()).pathname,'/login');
  await anon.goto(base+path+'?review=new&key=invalid',{waitUntil:'networkidle2'});assert.equal(new URL(anon.url()).pathname,'/login');
 }
 await anon.goto(base+'/trailheads',{waitUntil:'networkidle2'});assert.equal(await anon.$('#designid a[href^="/courses/designid-foundations"]'),null);
 await context.close();assert.deepEqual(errors,[]);
 console.log('PASS '+base+' actual owner Command Center → sidebar Trailheads → Owner Course Preview → Welcome + standalone; desktop/phone; honest missing fields; assessment still required for workbook; anon/invalid denial; no public preview CTA; no runtime errors');
}finally{await browser.close();}

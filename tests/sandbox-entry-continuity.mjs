import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.SANDBOX_ENTRY_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const errors=[];
try{
 for(const entry of ['owner','new']){
  const context=await browser.createBrowserContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1280,height:1000});await page.goto(base+'/',{waitUntil:'networkidle2'});
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click(entry==='owner'?'a[href="/owner"]':'form button')]);
  assert.equal(new URL(page.url()).pathname,entry==='owner'?'/command-center':'/hq');
  assert((await context.cookies()).some(c=>c.name==='dydd_sandbox_review'&&c.httpOnly),'verified query establishes private preview continuity');
  // Reproduce the exact failing raw Ranger Station link: no query retained.
  await page.goto(base+'/ranger-station'+new URL(page.url()).search,{waitUntil:'networkidle2'});
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('a[href="/trailheads"]')]);
  assert.equal(new URL(page.url()).pathname,'/trailheads');
  const course=await page.$('#designid a[href^="/courses/designid-foundations"]');assert(course,'DesignID course action restored after plain link');
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),course.click()]);await page.waitForSelector('.designid-welcome-body');
  assert.equal(new URL(page.url()).pathname,'/courses/designid-foundations');
  await page.goto(base+'/courses/designid-foundations',{waitUntil:'networkidle2'});await page.waitForSelector('.designid-welcome-body');
  await page.goto(base+'/learn/designid-foundations/welcome-to-designid',{waitUntil:'networkidle2'});await page.waitForSelector('.designid-welcome-body');
  await page.setViewport({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Existing tokenless gold-bar/Jordan browser: recovery is visible and does not require login.
  await page.goto(base+'/journey',{waitUntil:'networkidle2'});
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('a[href="/sandbox-review"]')]);await page.waitForSelector('#designid a[href^="/courses/designid-foundations"]');await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.$eval('#designid a[href^="/courses/designid-foundations"]',e=>e.click())]);await page.waitForSelector('.designid-welcome-body');
  await page.screenshot({path:`tmp/actual-access-${entry}-390.png`,fullPage:true});
  await context.close();console.log('PASS public homepage '+entry+' → real raw Ranger link → Trailheads → DesignID; direct course/lesson; gold-bar recovery; desktop/phone');
 }
 const context=await browser.createBrowserContext(),page=await context.newPage();
 for(const path of ['/courses/designid-foundations','/learn/designid-foundations/welcome-to-designid']){
  await page.goto(base+path,{waitUntil:'networkidle2'});assert.equal(new URL(page.url()).pathname,'/login');
  await page.goto(base+path+'?review=new&key=invalid',{waitUntil:'networkidle2'});assert.equal(new URL(page.url()).pathname,'/login');
 }
 // Recovery also works for an existing window which already lost all preview credentials.
 await page.goto(base+'/journey',{waitUntil:'networkidle2'});assert.equal((await context.cookies()).some(c=>c.name==='dydd_sandbox_review'),false);
 await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.click('a[href="/sandbox-review"]')]);await page.waitForSelector('#designid a[href^="/courses/designid-foundations"]');await Promise.all([page.waitForNavigation({waitUntil:'networkidle2'}),page.$eval('#designid a[href^="/courses/designid-foundations"]',e=>e.click())]);await page.waitForSelector('.designid-welcome-body');
 assert.equal(new URL(page.url()).pathname,'/courses/designid-foundations');
 await context.close();assert.deepEqual(errors,[]);console.log('PASS no-cookie anonymous/invalid learner denial; tokenless old-window gold-bar recovery; no runtime errors; no assessment submissions');
}finally{await browser.close()}

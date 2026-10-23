import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base = process.env.CONTACT_BASE || 'http://localhost:3000';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'Only local browser verification is authorized');
const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
try {
 fs.mkdirSync('tmp',{recursive:true});
 const page = await browser.newPage();
 const problems=[];page.on('pageerror',e=>problems.push(e.message));
 for (const width of [360,390,768,1280]) {
  await page.setViewport({width,height:900});
  const response=await page.goto(`${base}/contact`,{waitUntil:'networkidle2'});
  assert.equal(response.status(),200);
  assert.match(response.headers()['cache-control'],/no-store/);
  await page.waitForSelector('form input[name="name"]');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow at ${width}`);
  if([390,1280].includes(width))await page.screenshot({path:`tmp/contact-${width}.png`,fullPage:true});
  assert.equal(await page.$$eval('label',labels=>labels.filter(l=>l.control&&!l.closest('[aria-hidden="true"]')).length),4);
 }
 await page.setRequestInterception(true);let fail=true;
 page.on('request',r=>r.url().endsWith('/api/contact')?r.respond({status:fail?503:201,contentType:'application/json',body:JSON.stringify(fail?{error:'Your request could not be saved. Please try again.'}:{received:true,reference:'b21887a0-5fb4-4fd6-ad71-e840764e91fc'})}):r.continue());
 await page.type('[name="name"]','Contact QA');await page.type('[name="email"]','support-test@example.test');await page.type('[name="subject"]','Course access');await page.type('[name="message"]','Please help me open this course.');
 await page.click('form button');await page.waitForSelector('[role="alert"]');
 assert.equal(await page.$eval('[name="message"]',e=>e.value),'Please help me open this course.');
 fail=false;await page.click('form button');await page.waitForSelector('[role="status"]');
 assert((await page.$eval('main',e=>e.textContent)).includes('No confirmation email has been sent.'));
 page.removeAllListeners('request');await page.setRequestInterception(false);
 const denied=await page.goto(`${base}/admin/support?review=owner&key=not-a-login`,{waitUntil:'networkidle2'});
 assert(page.url().includes('/login'),'Preview query cannot grant support access');
 assert.equal(problems.length,0,problems.join('\n'));
 console.log('PASS contact public access, mobile 360/390/768/1280 no overflow, labels, error preserves message, success confirmation, preview denied admin, HTML no-store');
} finally { await browser.close(); }

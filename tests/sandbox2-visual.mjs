import fs from 'node:fs';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.SANDBOX2_BASE||'http://localhost:3148';
assert(base.startsWith('http://localhost:')||base==='https://dydd-online-school-sandbox-2.vercel.app');
const out='/home/openclaw/.openclaw/workspace/outputs/dydd-sandbox2-2026-11-24';
const browser=await puppeteer.launch({executablePath:await chromium.executablePath(),args:chromium.args.filter(a=>a!=='--single-process'),headless:true});
const results=[],errors=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390,320]){
 await page.setViewport({width,height:width>700?1000:844});
 for(const route of ['/base-camp','/trailheads','/field-kit','/journey','/ranger-station','/fireside']){
  await page.goto(base+route,{waitUntil:'networkidle2',timeout:60000});
  await page.waitForSelector('.forest-dock');
  const evidence=await page.evaluate(()=>({path:location.pathname,title:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,eyebrows:[...document.querySelectorAll('.eyebrow,.section-label')].filter(e=>getComputedStyle(e).display!=='none').length,audio:document.querySelectorAll('audio').length}));
  assert(!evidence.overflow,`${route} ${width}: overflow`);assert.equal(evidence.eyebrows,0);
  await page.screenshot({path:`${out}/${width}-${route.slice(1)}.png`,fullPage:route!=='/journey'});
  results.push({width,route,...evidence});
 }
 // Camp map dialog: native focus trap, close and Escape recovery.
 await page.click('.forest-menu');await page.waitForSelector('dialog[open]');
 assert(await page.$('.forest-map a[href*="command-center"]'));
 await page.keyboard.press('Escape');assert(!await page.$('dialog[open]'));
 }
 await page.setViewport({width:1440,height:1100});await page.goto(base+'/journey',{waitUntil:'networkidle2'});
 console.log('LESSONS',await page.$$eval('.journey-course-index button',es=>es.slice(0,9).map(e=>({text:e.textContent,disabled:e.disabled}))));
 console.log('AUDIO',await page.$$eval('audio',es=>es.map(e=>({src:e.getAttribute('src'),readyState:e.readyState,error:e.error?.message}))));
 fs.writeFileSync(out+'/qa-local.json',JSON.stringify({base,results,errors},null,2));assert.deepEqual(errors,[]);console.log('PASS '+results.length+' responsive route checks; camp map open/Escape; no runtime errors.');
}finally{await browser.close()}

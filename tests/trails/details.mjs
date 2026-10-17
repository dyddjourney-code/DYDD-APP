import assert from 'node:assert/strict';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const base = process.env.TRAIL_TEST_BASE ?? 'http://localhost:3154';
const tag = base.startsWith('https') ? 'live' : 'local';
const browser = await puppeteer.launch({args:chromium.args, executablePath:await chromium.executablePath(),headless:true});
const errors=[];
try {
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1280,768,390,320]) {
  await page.setViewport({width,height:900});
  await page.goto(`${base}/trailheads`,{waitUntil:'networkidle2'});
  assert.equal(await page.$eval('h1',e=>e.textContent),'Take your next faithful step.');
  assert.equal(await page.$$eval('#subscription-assessments .trail-guide-route',es=>es.length),3);
  assert.equal(await page.$$eval('#optional-expansions #designpd',es=>es.length),1);
  assert.equal(await page.$('.trail-fieldkit-note'),null);
  assert.equal(await page.$$eval('.trail-details-trigger',es=>es.length),5);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} page overflow`);
  const ratings=await page.$$eval('.trail-rating',es=>es.map(e=>{const a=e.querySelector('small').getBoundingClientRect(),b=e.querySelector('.trail-rating-summary').getBoundingClientRect();return {left:a.x,right:b.x,visible:a.width>0,font:getComputedStyle(e.querySelector('p')).fontSize};}));
  assert(ratings.every(r=>r.left<r.right&&r.visible&&parseFloat(r.font)>=16));
  assert(await page.$$eval('.trail-placard-facts dd',es=>es.every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)));
  const buttons=await page.$$('.trail-details-trigger');
  for(let i=0;i<buttons.length;i++) {
   await buttons[i].click();
   await page.waitForSelector('dialog[open]');
   assert(await page.$eval('dialog[open]',e=>e.scrollTop===0),'details open at beginning');
   const rect=await page.$eval('dialog[open]',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,overflow:e.scrollWidth>e.clientWidth,scroll:document.body.style.overflow,title:e.querySelector('h2').textContent,stats:e.querySelector('.trail-details-stats').textContent,outline:e.querySelectorAll('details').length};});
   assert(Math.abs(rect.x+rect.w/2-width/2)<2,'horizontally centered');
   assert(Math.abs(rect.y+rect.h/2-450)<2,'vertically centered');
   assert(!rect.overflow&&rect.y>=0&&rect.h<=900);
   assert.equal(rect.scroll,'hidden');
   const expected=[null,[3,13],[6,12],[5,19],[8,23]][i];
   if(expected){assert.equal(rect.outline,expected[0]);assert(rect.stats.includes(`${expected[1]} lessons`));} else { const sums=await page.$$eval('dialog[open] details',es=>({modules:es.length,units:es.reduce((n,e)=>n+e.querySelectorAll('li').length,0)})); assert(rect.stats.includes(`${sums.modules} modules · ${sums.units} lesson and workbook units`)); }
   const summary=await page.$('dialog[open] details summary');await summary.click();
   assert(await page.$eval('dialog[open] details',e=>e.open));
   // Browser-native modal keeps keyboard focus within the dialog.
   for(let t=0;t<12;t++)await page.keyboard.press('Tab');
   assert(await page.evaluate(()=>document.querySelector('dialog[open]').contains(document.activeElement)));
   if(i%2===0)await page.keyboard.press('Escape');else await page.click('dialog[open] .trail-details-close');
   await page.waitForFunction(()=>!document.querySelector('dialog[open]')&&document.body.style.overflow!=='hidden');
   assert(await buttons[i].evaluate(e=>document.activeElement===e),'focus restored');
  }
  await buttons[0].click();await page.mouse.click(2,2);await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  if(width===1280||width===390){await page.screenshot({path:`tmp/trailheads-refined-${tag}-${width}.png`,fullPage:true});await buttons[4].click();await page.screenshot({path:`tmp/trailheads-details-${tag}-${width}.png`});await page.keyboard.press('Escape');}
  console.log(`PASS ${width}px: sections, 5 course modals, actual counts, centering, larger type, Escape/Close/backdrop, keyboard focus, no overflow`);
 }
 await page.goto(`${base}/trailheads?lane=fruitlife`,{waitUntil:'networkidle2'});
 assert.equal(await page.$$eval('.trail-details-trigger',es=>es.length),2);
 assert.equal(await page.$('#optional-expansions'),null);
 assert.equal(await page.$('.trail-fieldkit-note'),null);
 assert.deepEqual(errors,[]);
 console.log('PASS mini-app: 2 trails only; no DesignPD; no page errors');
}finally{await browser.close();}

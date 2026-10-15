// Requires the temporary local-only non-delivering harness described in docs/designid-allocation-restoration-2026-10-15.md.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
const base=process.env.DESIGNID_QA_BASE??'http://localhost:3107';
assert(new URL(base).hostname==='localhost'||new URL(base).hostname==='127.0.0.1','Local harness only');
const browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
try{
 for(const mobile of (process.env.DESIGNID_QA_MOBILE_ONLY ? [true] : [false,true])){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:mobile?390:1280,height:900,isMobile:mobile,hasTouch:mobile});
  await page.goto(base+'/qa-designid-allocation',{waitUntil:'networkidle0'});
  const next=async()=>{await page.click('.fruitlife-step-controls button[type="submit"]');};
  const waitSet=async n=>page.waitForFunction(n=>document.querySelector('.designid-question-panel.active .section-label')?.textContent===`Question Set ${n}`,{},n);
  const choose=async(i,value)=>{const rows=await page.$$('.designid-question-panel.active .designid-rank-row');const input=await rows[i].$(`input[value="${value}"]`);await input.click();await page.waitForFunction((name,value)=>document.querySelector(`input[name="${name}"][value="${value}"]`)?.checked,{},await input.evaluate(e=>e.name),String(value));};
  await next();await waitSet(1);await next();await page.waitForSelector('.form-message.error');await waitSet(1);
  for(let i=0;i<4;i++)await choose(i,0);
  await next();await waitSet(1);assert.match(await page.$eval('.form-message.error',e=>e.textContent),/exactly 5/);
  await choose(0,3);await choose(1,3);
  assert.match(await page.$eval('.designid-question-panel.active .designid-allocation-total',e=>e.textContent),/6 \/ 5 points.*Remove 1 point/);
  await next();await waitSet(1);
  await choose(1,2);assert.match(await page.$eval('.designid-question-panel.active .designid-allocation-total',e=>e.textContent),/5 \/ 5 points/);
  await page.focus('.designid-question-panel.active input[value="0"]');await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.designid-question-panel.active input[value="1"]')?.checked);
  await choose(0,3);
  for(let set=1;set<=20;set++){
   if(set===20)console.log(`Reached question set 20 (${mobile?"mobile":"desktop"})`);
   if(set>1)for(const [i,v]of [3,2,0,0].entries())await choose(i,v);
   assert.match(await page.$eval('.designid-question-panel.active .designid-allocation-total',e=>e.textContent),/5 \/ 5 points/);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(set===1){
    const box=await page.$eval('.designid-progress-card img',e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));assert(box.width>=112&&box.height>=64);
    await page.screenshot({path:`tmp/designid-allocation-${mobile?'mobile':'desktop'}.png`,fullPage:true});
   }
   await next();
   if(set<20){await waitSet(set+1);await page.click('.fruitlife-step-controls button[type="button"]');await waitSet(set);assert.equal(await page.$$eval('.designid-question-panel.active input:checked',els=>els.length),4);await next();await waitSet(set+1);}
  }
  await page.waitForSelector('.designid-question-panel.active .maps-sort-bank');
  await next();await page.waitForSelector('.form-message.error');
  // Compact customer-facing copy, alphabetical bank, and all four targets in one row.
  assert.equal(await page.$eval('.maps-sort-intro h2',e=>e.textContent),'What sounds most like you?');
  const words=await page.$$eval('.maps-sort-bank .maps-sort-select-word',els=>els.map(e=>e.textContent));
  assert.deepEqual(words,[...words].sort((a,b)=>a.localeCompare(b)));
  await page.$eval('.maps-sort-intro',e=>e.scrollIntoView({block:'start',behavior:'instant'}));
  const targets=await page.$$eval('.maps-sort-bucket',els=>els.map(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
  assert(targets.every(t=>Math.abs(t.top-targets[0].top)<1));
  await page.screenshot({path:`tmp/designid-sort-geometry-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  assert(await page.$eval('.maps-sort-bank',e=>e.getBoundingClientRect().top)>targets[0].bottom);
  const sortText=await page.$eval('.maps-confirmation-sort',e=>e.innerText);
  assert(!/MAPS|Words to place|of 12 placed|Place selected word|adds another perspective/.test(sortText));
  await page.screenshot({path:`tmp/designid-sort-clean-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  // Tap placement.
  await page.click('.maps-sort-select-word');
  await page.click('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-place');
  await page.waitForFunction(()=>document.querySelector('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-word'));
  // Native drag/drop event handling.
  await page.evaluate(()=>{const card=document.querySelector('.maps-sort-bank .maps-sort-word');const dt=new DataTransfer();card.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));document.querySelector('.maps-sort-bucket[data-maps-bucket="most"]').dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}));});
  await page.waitForFunction(()=>document.querySelectorAll('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-word').length===2);
  // Real pointer/touch drag via grip. Empty bank remains reachable by scrolling.
  await page.evaluate(()=>{window.dragLog=[];for(const type of ['pointerdown','pointerup','pointercancel','dragstart','drop'])document.addEventListener(type,e=>window.dragLog.push({type,x:e.clientX,y:e.clientY,target:e.target.className,hit:document.elementFromPoint(e.clientX,e.clientY)?.outerHTML.slice(0,200)}),true);});
  const grip=await page.$('.maps-sort-bank .maps-sort-grip');await grip.scrollIntoView();
  const a=await grip.boundingBox();const x=a.x+a.width/2,y=a.y+a.height/2;
  let cdp;
  if(mobile){cdp=await page.createCDPSession();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});}
  else{await page.mouse.move(x,y);await page.mouse.down();}
  await page.waitForSelector('.maps-sort-bucket[data-maps-bucket="most"]');
  const b=await page.$eval('.maps-sort-bucket[data-maps-bucket="most"]',e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
  const tx=b.x+b.width/2,ty=b.y+b.height/2;
  if(mobile){for(let k=1;k<=8;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*k/8,y:y+(ty-y)*k/8}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(tx,ty,{steps:10});await page.mouse.up();}
  if(await page.$$eval('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-word',els=>els.length)!==3)console.log('Drag diagnostic',await page.evaluate(()=>({events:window.dragLog,announcement:document.querySelector('.maps-sort-announcement')?.textContent,count:document.querySelectorAll('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-word').length})));
  await page.waitForFunction(()=>document.querySelectorAll('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-word').length===3);
  // Full buckets must not accept a fourth word.
  const extra=await page.$('.maps-sort-bank select');await extra.select('most');await page.waitForFunction(()=>document.querySelectorAll('.maps-sort-bucket[data-maps-bucket="most"] .maps-sort-word').length===3);
  // Finish the remaining balanced groups via accessible menus.
  for(const bucket of ['often','sometimes','least'])for(let i=0;i<3;i++){
   const select=await page.$('.maps-sort-bank select');await select.select(bucket);
   await page.waitForFunction((bucket,n)=>document.querySelectorAll(`.maps-sort-bucket[data-maps-bucket="${bucket}"] .maps-sort-word`).length===n,{},bucket,i+1);
  }
  await page.screenshot({path:`tmp/designid-sort-placed-${mobile?'mobile':'desktop'}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await next();await page.waitForFunction(()=>document.querySelector('.designid-question-panel.active h2')?.textContent==='Submit your DesignID assessment.');
  await page.click('.fruitlife-step-controls button[type="button"]');await page.waitForSelector('.designid-question-panel.active .maps-sort-bank');assert.equal(await page.$$('.maps-sort-bucket .maps-sort-word').then(x=>x.length),12);
  await next();await page.waitForFunction(()=>document.querySelector('.designid-question-panel.active h2')?.textContent==='Submit your DesignID assessment.');
  await next();await page.waitForFunction(()=>Array.isArray(window.captured));
  const fields=await page.evaluate(()=>window.captured);assert.equal(fields.length,92);
  const allocation=fields.filter(([name])=>name.startsWith('designid_points_'));assert.equal(allocation.length,80);assert.equal(allocation.reduce((sum,[,v])=>sum+Number(v),0),100);
  assert.deepEqual(errors,[]);console.log(`PASS ${mobile?'touch/mobile':'desktop'}: 20 sets, running totals, under/over/missing rejection, zero/repeated choices, keyboard, Back/Next state, full sort interactions, balanced groups, review, 92 captured fields/100 points. No external delivery.`);
  await page.close();
 }
}finally{await browser.close();}

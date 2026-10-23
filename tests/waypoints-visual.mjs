import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.WAYPOINT_TEST_BASE||'http://localhost:3138';
assert(['http://localhost:3138','https://dydd-online-school-sandbox.vercel.app'].includes(base));
const browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
const errors=[],results=[];
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1280,768,390,320]){
  await page.setViewport({width,height:1100});
  const response=await page.goto(base+'/waypoints',{waitUntil:'domcontentloaded',timeout:90000});assert.equal(response.status(),200);
  await page.waitForFunction(()=>document.querySelector('.waypoint-scripture-passage') && getComputedStyle(document.querySelector('.waypoint-scripture-passage')).borderLeftWidth==='3px');
  const geometry=await page.evaluate(()=>{
   const card=document.querySelector('.waypoint-display-card');
   const rect=selector=>{const r=card.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
   return {body:rect('.waypoint-body'),passage:rect('.waypoint-scripture-passage'),reflection:rect('.waypoint-reflection-box'),overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert(geometry.body.bottom<=geometry.passage.top+1,'body must visually precede Scripture');
  assert(geometry.passage.bottom<=geometry.reflection.top+1,'Scripture must visually precede application');
  assert(!geometry.overflow,'No horizontal overflow');
  const path=`tmp/waypoints-${base.startsWith('https')?'live':'local'}-${width}.png`;
  await(await page.$('.waypoint-display-card')).screenshot({path});
  results.push({width,path,geometry});console.log('PASS visual reading order, full Scripture and responsive layout '+width);
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(`tmp/waypoints-${base.startsWith('https')?'live':'local'}-visual-proof.json`,JSON.stringify({base,results,errors},null,2));
} finally {await browser.close();}

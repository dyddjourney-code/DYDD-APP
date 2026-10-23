/** Read-only rendering checks: all authored35 via real component, released19 live. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const require=createRequire(import.meta.url);
const load=require('../scripts/fruitlife-test-load.cjs');
const {formatWaypointScripture:format}=load('lib/waypoints/scripture-format.ts');
const {WaypointExplorer}=load('components/waypoint-explorer.tsx');
const {getReleasedWaypoints}=load('lib/waypoints/waypoint-data.ts');
const data=JSON.parse(fs.readFileSync('lib/waypoints/waypoints.json','utf8'));
assert.equal(data.length,35);
for(const [input,expected] of [
 ['No speech.','“No speech.”'],
 ['“I am the vine.','“‘I am the vine.’”'],
 ['He said, “Be still.”','“He said, ‘Be still.’”'],
 ['He said, “Good news.','“He said, ‘Good news.’”'],
 ['“First.” Then “second.”','“‘First.’ Then ‘second.’”'],
 ['He said, "Come."','“He said, ‘Come.’”'],
 ['God’s love remains.','“God’s love remains.”'],
]) assert.equal(format(input),expected);
const browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
const errors=[];
const report={authored:0,future:0,releasedLive:0,edgeCases:7,widths:[],errors};
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 const html=data.map(w=>renderToStaticMarkup(React.createElement(WaypointExplorer,{
  categories:[],currentId:w.id,previousId:w.id,waypoints:[w],
 }))).join('');
 await page.setContent(html);
 const rendered=await page.$$eval('.waypoint-display-card',cards=>cards.map(card=>({
  id:card.dataset.waypointId,
  heading:card.querySelector('.waypoint-scripture-passage h3').textContent,
  text:card.querySelector('blockquote').textContent,
  attribution:card.querySelector('.waypoint-scripture-attribution').textContent,
  body:[...card.querySelectorAll('.waypoint-body p')].map(p=>p.textContent),
 })));
 assert.equal(rendered.length,35);
 for(const [i,w] of data.entries()) {
  const actual=rendered[i];assert.equal(actual.id,w.id);
  assert.equal(actual.heading,w.scripture,'no NIV suffix');
  assert.equal(actual.text,format(w.scriptureText));
  assert(actual.text.startsWith('“')&&actual.text.endsWith('”'));
  assert.equal((actual.text.match(/“/g)||[]).length,1);
  assert.equal((actual.text.match(/”/g)||[]).length,1);
  // Preserve every word/punctuation, allowing only quotation typography additions.
  const withoutQuotes=s=>s.replace(/[“”‘’"]/g,'');
  assert.equal(withoutQuotes(actual.text),withoutQuotes(w.scriptureText));
  assert.equal(actual.attribution,w.scriptureAttribution);
  assert.deepEqual(actual.body,w.body);
  report.authored++;
  if(Date.parse(w.releaseAt)>Date.now())report.future++;
 }
 console.log(`PASS real component rendered all${report.authored}, including future${report.future}; full attribution and devotional unchanged; seven quote edge cases`);
 const base=process.env.WAYPOINT_TEST_BASE;
 if(base) {
  assert(['http://localhost:3138','https://dydd-online-school-sandbox.vercel.app'].includes(base));
  report.base=base;
  await page.goto(base+'/waypoints',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>{const el=document.querySelector('.waypoint-result-card');return el&&Object.keys(el).some(k=>k.startsWith('__reactProps$'));},{timeout:60000});
  for(const w of getReleasedWaypoints()) {
   await page.$$eval('.waypoint-result-card',(cards,id)=>cards.find(c=>c.dataset.waypointId===id).click(),w.id);
   await page.waitForFunction(id=>document.querySelector('.waypoint-display-card').dataset.waypointId===id,{},w.id);
   const actual=await page.$eval('.waypoint-scripture-passage',el=>({heading:el.querySelector('h3').textContent,text:el.querySelector('blockquote').textContent,attribution:el.querySelector('.waypoint-scripture-attribution').textContent}));
   assert.equal(actual.heading,w.scripture);assert.equal(actual.text,format(w.scriptureText));assert.equal(actual.attribution,w.scriptureAttribution);
   report.releasedLive++;
  }
  for(const width of [1280,390]) {
   await page.setViewport({width,height:1100});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const path=`tmp/waypoints-scripture-${base.startsWith('https')?'live':'local'}-${width}.png`;
   await(await page.$('.waypoint-display-card')).screenshot({path});
   report.widths.push({width,path});
  }
  console.log(`PASS live hydrated current/archive ${report.releasedLive} released entries; desktop/mobile no overflow`);
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync('tmp/waypoints-scripture-format-proof.json',JSON.stringify(report,null,2));
} finally {await browser.close();}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');
const base=process.env.JOURNEY_TEST_BASE || 'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app' || base.startsWith('http://localhost:'));
const query='review=new&key='+encodeURIComponent(cfg.review_token);
const slug='discover-your-divine-design';
const q=load('lib/reflections/catalog.ts').getReflectionExperience(slug).questions.find(q=>q.id===(process.env.JOURNEY_TEST_QUESTION_ID||'child-of-god-response'));
const bucket=createClient(cfg.project_url,cfg.service_role_key).storage.from('assessment-report-pdfs');
const path='preview-reflections/new/'+slug+'.json';
async function read(){const r=await bucket.download(path,{cacheNonce:crypto.randomUUID()});if(r.error){assert(['400','404'].includes(String(r.error.statusCode)),r.error.message);return null;}return r.data.text();}
const backup=await read();let afterQA=null,browser;
try {
 browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1280,390,320]) {
  await page.setViewport({width,height:1000});
  await page.goto(base+'/journey?lesson='+q.lessonSlug+'&'+query,{waitUntil:'networkidle2'});
  const selector=`.journey-active-workbook [data-question="${q.id}"]`;
  await page.waitForSelector(selector+' textarea:not([disabled])');
  assert.equal(await page.$('.reflection-round-bar'),null);
  const answer='Temporary Jordan autosave QA '+crypto.randomUUID();
  await page.$eval(selector+' textarea',(e,text)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,text);e.dispatchEvent(new Event('input',{bubbles:true}));},answer);
  await page.waitForFunction(s=>document.querySelector(s+' [role=status]')?.textContent==='Saved',{},selector);
  afterQA=await read();assert(afterQA.includes(answer));
  await page.goto(base+'/field-kit/reflections/'+slug+'?'+query,{waitUntil:'networkidle2'});
  await page.waitForFunction(text=>document.body.textContent.includes(text),{},answer);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS Jordan owner preview automatic save and same Field Kit answer '+width+'px');
 }
 assert.deepEqual(errors,[]);
} finally {
 if(browser)await browser.close();
 const current=await read();
 if(current===afterQA || current===backup){
  const result=backup===null ? await bucket.remove([path]) : await bucket.upload(path,Buffer.from(backup),{contentType:'application/json',upsert:true,cacheControl:'0'});
  assert(!result.error,result.error?.message);
  assert.equal(await read(),backup);console.log('PASS original Jordan workbook restored exactly');
 } else throw Error('Preview workbook changed concurrently; preserve current data and reconcile QA answer without overwriting learner work.');
}

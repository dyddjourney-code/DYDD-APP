import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const c = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(c.ref, 'atemrshtshxoqnuevvqu');
const base = process.env.PROFILE_TEST_BASE || 'http://localhost:3124';
const query = '?review=new&key=' + encodeURIComponent(c.review_token);
const bucket = createClient(c.project_url, c.service_role_key).storage.from('assessment-report-pdfs');
const path = 'sandbox-profiles/jordan.json';
const before = await bucket.download(path, { cacheNonce: crypto.randomUUID() });
if (before.error && !['400','404'].includes(String(before.error.statusCode))) throw Error('Cannot back up preview profile');
const backup = before.data ? await before.data.text() : null;
let browser, lastRevision = null;
const api = async (suffix = '', q = query) => { const r = await fetch(base+'/api/profile'+suffix+q); return {status:r.status, body:r.headers.get('content-type')?.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer())}; };
const save = async (input, photo, headers = {}, q = query) => { const body = new FormData(); body.set('profile', JSON.stringify(input)); if(photo) body.set('photo',photo,'profile.jpg'); const r=await fetch(base+'/api/profile'+q,{method:'POST',headers,body});return {status:r.status,body:await r.json()}; };
try {
  assert.equal((await api('', '')).status,401);
  assert.equal((await api('', '?review=new&key=wrong')).status,401);
  assert.equal((await api('/photo','')).status,401);
  assert.equal((await api('', '?review=heather&key='+encodeURIComponent(c.review_token))).status,401);
  const original = (await api()).body.profile;
  const input = {...original,display_name:'Jordan Profile QA',bio:'Saved sandbox biography',fun_facts:['Hiking','Coffee','Music'],remove_photo:false};
  assert.equal((await save(input,null,{origin:'https://unrelated.example'})).status,403);
  assert.equal((await save({...input,display_name:''})).status,400);
  assert.equal((await save(input,new Blob(['invalid'],{type:'image/jpeg'}))).status,400);
  const first=await save(input);assert.equal(first.status,200);lastRevision=first.body.profile.revision;
  assert.equal((await save(input)).status,409);
  assert.equal((await api()).body.profile.bio,input.bio);
  console.log('PASS owner-review authorization, validation, CSRF, persistence, revision conflicts');
  browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  fs.mkdirSync('tmp',{recursive:true});
  const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='#496e56';ctx.fillRect(0,0,640,480);return canvas.toDataURL('image/png').split(',')[1];});
  fs.writeFileSync('tmp/sandbox-profile-qa.png',Buffer.from(png,'base64'));
  for(const width of [1280,768,390,320]) {
    await page.setViewport({width,height:1000});
    await page.goto(base+'/hq'+query,{waitUntil:'networkidle2',timeout:60000});
    await page.waitForSelector('#your-profile button');
    await page.$eval('#your-profile button',e=>e.click());
    await page.waitForSelector('[name=bio]');
    await page.$eval('[name=bio]',e=>e.focus());await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.type('Sandbox biography saved at '+width);
    if(width===1280) { await(await page.$('#profile-photo')).uploadFile('tmp/sandbox-profile-qa.png');await page.waitForFunction(()=>document.querySelector('#your-profile img')?.src.startsWith('blob:')); }
    const saved=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/profile' && r.request().method()==='POST');
    await page.$eval('#your-profile .button.primary',e=>e.click());
    const response=await saved;const body=await response.json();assert.equal(response.status(),200);lastRevision=body.profile.revision;
    await page.waitForFunction(()=>document.querySelector('#your-profile [role=status]')?.textContent==='Your profile is saved.');
    await page.reload({waitUntil:'networkidle2'});
    await page.waitForFunction(()=>document.querySelector('#your-profile img')?.naturalWidth===512);
    assert((await page.$eval('#your-profile',e=>e.textContent)).includes('Sandbox biography saved at '+width));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Base Camp overflow '+width);
    await page.goto(base+'/camp-circle/my-circles'+query,{waitUntil:'networkidle2'});
    await page.waitForFunction(()=>document.querySelector('#circle-profile-preview img')?.naturalWidth===512);
    assert((await page.$eval('#circle-profile-preview',e=>e.textContent)).includes('Sandbox biography saved at '+width));
    assert.equal(await page.$('#circle-profile-preview button'),null);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'My Circles overflow '+width);
    await(await page.$('#circle-profile-preview')).screenshot({path:`tmp/sandbox-profile-${base.startsWith('https')?'live':'local'}-${width}.png`});
    console.log('PASS actual browser save, photo, reload, private My Circles card '+width+'px');
  }
  const current=(await api()).body.profile;
  const removed=await save({...current,remove_photo:true});assert.equal(removed.status,200);lastRevision=removed.body.profile.revision;
  assert.equal((await api('/photo')).status,404);
  assert.deepEqual(errors,[]);
  console.log('PASS photo removal and no browser runtime errors');
} finally {
  if(browser) await browser.close();
  const current=await bucket.download(path,{cacheNonce:crypto.randomUUID()});
  const value=current.data ? JSON.parse(await current.data.text()) : null;
  if(lastRevision !== null && value?.profile.revision===lastRevision && value.profile.display_name==='Jordan Profile QA') {
    if(backup) {const r=await bucket.upload(path,Buffer.from(backup),{contentType:'application/json',upsert:true,cacheControl:'0'});assert(!r.error);}
    else {const r=await bucket.remove([path]);assert(!r.error);}
    console.log('QA fixture removed; previous Jordan profile restored');
  } else if(lastRevision!==null) console.log('Profile changed externally; preserving newer edits');
}

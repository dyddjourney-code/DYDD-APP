import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const base=process.env.PROFILE_TEST_BASE||'http://localhost:3123';
const c=JSON.parse(fs.readFileSync(process.env.PROFILE_TEST_CREDENTIALS||'/home/openclaw/.openclaw/secrets/dydd-online-school-supabase.json'));
const admin=createClient(c.project_url,c.service_role_key,{auth:{persistSession:false}});
const users=[];let browser,page;
async function user(){
 const email=`basecamp-qa-${crypto.randomUUID()}@example.com`,password=crypto.randomBytes(20).toString('hex');
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert(!error,error?.message);users.push(data.user.id);
 let cookies=[];const client=createServerClient(c.project_url,c.anon_key,{cookies:{getAll:()=>cookies,setAll:c=>{cookies=c}}});
 const signed=await client.auth.signInWithPassword({email,password});assert(!signed.error,signed.error?.message);
 return {id:data.user.id,client,cookies,cookie:cookies.map(c=>`${c.name}=${c.value}`).join('; ')};
}
async function get(path,cookie){const r=await fetch(base+path,{headers:cookie?{cookie}:{}});return {status:r.status,body:r.headers.get('content-type')?.includes('json')?await r.json():Buffer.from(await r.arrayBuffer())};}
async function save(actor,profile,photo,origin){const body=new FormData();body.set('profile',JSON.stringify(profile));if(photo)body.set('photo',photo,'photo.jpg');const r=await fetch(base+'/api/profile',{method:'POST',body,headers:{cookie:actor.cookie,...(origin?{origin}:{})}});return {status:r.status,body:await r.json()};}
const input={display_name:'Morgan River',bio:'A little story.\nFaith, family and the outdoors.',fun_facts:['Kayaking','Old bookstores','Making bread'],revision:0,remove_photo:false};
try{
 assert.equal((await get('/api/profile')).status,401);assert.equal((await get('/api/profile/photo')).status,401);
 const a=await user(),b=await user();assert.equal((await get('/api/profile',a.cookie)).body.profile.revision,0);
 assert.equal((await save(a,input,null,'https://unrelated.example')).status,403);
 assert.equal((await save(a,{...input,display_name:''})).status,400);
 assert.equal((await save(a,{...input,fun_facts:['x'.repeat(121)]})).status,400);
 assert.equal((await save(a,input,new Blob(['not an image'],{type:'image/jpeg'}))).status,400);
 let r=await save(a,input);assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.body.profile.revision,1);
 assert.equal((await get('/api/profile',a.cookie)).body.profile.bio,input.bio);
 assert.equal((await get('/api/profile',b.cookie)).body.profile.revision,0);
 assert.equal((await b.client.from('basecamp_profiles').select().eq('user_id',a.id)).data.length,0);
 const forged=await b.client.from('basecamp_profiles').insert({user_id:a.id,display_name:'Forged'});assert(forged.error);
 assert.equal((await save(a,input)).status,409);
 console.log('PASS auth, cross-origin, validation, save/reload, account isolation, RLS and conflict protection');
 browser=await puppeteer.launch({args:chromium.args,executablePath:await chromium.executablePath(),headless:true});
 await browser.setCookie(...a.cookies.map(x=>({name:x.name,value:x.value,url:base})));
 page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='#496e56';ctx.fillRect(0,0,640,480);return canvas.toDataURL('image/png').split(',')[1];});
 fs.mkdirSync('tmp',{recursive:true});fs.writeFileSync('tmp/basecamp-qa-photo.png',Buffer.from(png,'base64'));
 for(const width of [1280,768,390,320]){
  await page.setViewport({width,height:1000});
  const response=await page.goto(base+'/hq',{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);
  await page.waitForSelector('#your-profile button');
  const panel=await page.$('#your-profile');await panel.evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.$eval('#your-profile button',e=>e.click());await page.waitForSelector('[name=display_name]');
  await page.focus('[name=bio]');await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');await page.keyboard.type('Profile checked at '+width+'px');
  if(width===1280){await(await page.$('#profile-photo')).uploadFile('tmp/basecamp-qa-photo.png');await page.waitForFunction(()=>!!document.querySelector('#your-profile img')?.src.startsWith('blob:'));}
  const saveButton=await page.$('#your-profile button[type="submit"]')||await page.$('#your-profile .button.primary');const savedResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/profile' && r.request().method()==='POST');await saveButton.click();const saved=await savedResponse;const saveBody=await saved.json();assert.equal(saved.status(),200,JSON.stringify(saveBody));console.log('saved browser '+width+' revision '+saveBody.profile.revision);
  await page.waitForFunction(()=>document.querySelector('#your-profile [role=status]')?.textContent==='Your profile is saved.');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' overflow');
  await page.waitForNetworkIdle({idleTime:700,timeout:15000}).catch(()=>{});await page.reload({waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#your-profile img');
  await page.waitForFunction(()=>document.querySelector('#your-profile img')?.naturalWidth===512);
  assert.equal((await get('/api/profile',a.cookie)).body.profile.bio,'Profile checked at '+width+'px');
  const image=await get('/api/profile/photo',a.cookie);assert.equal(image.status,200);assert(image.body.length>500);
  assert.equal((await get('/api/profile/photo',b.cookie)).status,404);
  await(await page.$('#your-profile')).screenshot({path:`tmp/basecamp-profile-${base.startsWith('https')?'live':'local'}-${width}.png`});
  console.log('PASS browser edit/save/reload/photo and no overflow '+width+'px');
 }
 const stored=await get('/api/profile',a.cookie);r=await save(a,{...input,revision:stored.body.profile.revision,remove_photo:true});assert.equal(r.status,200);assert.equal((await get('/api/profile/photo',a.cookie)).status,404);
 const files=await admin.storage.from('basecamp-photos').list(a.id);assert.equal(files.data.length,0);
 assert.deepEqual(errors,[]);console.log('PASS private photo isolation, removal, file cleanup and no runtime errors');
} catch(error) {
 if(page){console.log('Browser failure snapshot',await page.evaluate(()=>({url:location.href,profile:document.querySelector('#your-profile')?.outerHTML})));await page.screenshot({path:'tmp/basecamp-profile-failure.png'});}
 throw error;
} finally {
 if(browser)await browser.close();
 for(const id of users){const {data:files}=await admin.storage.from('basecamp-photos').list(id);if(files?.length)await admin.storage.from('basecamp-photos').remove(files.map(f=>`${id}/${f.name}`));await admin.auth.admin.deleteUser(id);}
 console.log('QA-only users and photos cleaned up');
}

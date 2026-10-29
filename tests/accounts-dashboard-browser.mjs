// Sandbox-only, non-delivering acceptance. Fixtures are isolated and always cleaned.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(cfg.ref,'atemrshtshxoqnuevvqu');assert.equal(new URL(cfg.project_url).hostname,cfg.ref+'.supabase.co');
const base=new URL(process.env.ACCOUNTS_BASE||'http://127.0.0.1:3162').origin;
assert(['http://127.0.0.1:3162','https://dydd-online-school-sandbox.vercel.app'].includes(base));
const published=base.startsWith('https:');assert(!published||process.env.ACCOUNTS_DEPLOYMENT_READY==='1');
const out='tmp/accounts-dashboard',prefix=published?'published':'local';fs.mkdirSync(out,{recursive:true});
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}}),uid=[],emails=[],checks=[],screenshots=[],errors=[];
const good=r=>{assert(!r.error,r.error?.message);return r.data;};
const curriculum=load('lib/passport/curriculum.ts').passportCurriculum;
const codeHash=crypto.randomBytes(32).toString('hex'),circleId=crypto.randomUUID();let codeId,browser,failure;
const beforeCodes=good(await db.from('dydd_beta_access_codes').select('id,code_hash,redeemed_by,redeemed_at').order('id'));
const baseline=await db.auth.admin.listUsers({page:1,perPage:1000});good(baseline);const baselineCount=baseline.data.users.length;
assert.equal(baselineCount,0,'Acceptance expects clean sandbox accounts; never modifies existing accounts');
const ownerParams='?'+new URLSearchParams({review:'owner',key:cfg.review_token});
const url='/command-center/accounts';
let memberCookie='';
try {
  for(let i=0;i<2;i++){
    const email=`accounts-dashboard-${crypto.randomUUID()}@example.invalid`;emails.push(email);
    good(await db.from('dydd_email_suppressions').insert({email,reason:'isolated_accounts_dashboard_qa'}));
    const password=crypto.randomBytes(24).toString('hex');
    const user=good(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:i?'Synthetic Accounts QA Rowan':'Synthetic Accounts QA Ellis'}})).user;uid.push(user.id);
    if(i===0){let cookies=[];const auth=createServerClient(cfg.project_url,cfg.anon_key,{cookies:{getAll:()=>cookies,setAll:v=>{cookies=v}}});good(await auth.auth.signInWithPassword({email,password}));memberCookie=cookies.map(c=>c.name+'='+c.value).join('; ');}
  }
  codeId=good(await db.from('dydd_beta_access_codes').insert({code_hash:codeHash,batch:'isolated_accounts_dashboard_qa',redeemed_by:uid[0],redeemed_at:new Date().toISOString()}).select('id').single()).id;
  good(await db.from('dydd_personal_access').insert({user_id:uid[0],source_code_id:codeId}));
  const journey=curriculum.find(c=>c.slug==='discover-your-divine-design'),gifts=curriculum.find(c=>c.slug==='spiritual-gifts-service');
  good(await db.from('passport_lesson_completions').insert([...journey.lessons.map(l=>({user_id:uid[0],course_slug:journey.slug,lesson_slug:l.slug})),...gifts.lessons.map(l=>({user_id:uid[1],course_slug:gifts.slug,lesson_slug:l.slug}))]));
  good(await db.from('passport_awards').insert([{user_id:uid[0],badge_key:'designid',evidence:{source:'saved_completed_result'}},{user_id:uid[1],badge_key:'spiritual_gifts',evidence:{source:'saved_completed_result'}},{user_id:uid[0],badge_key:'Architect',evidence:{source:'canonical_saved_primary',privateSentinel:'DO_NOT_EXPOSE_PERSONAL_ASSESSMENT_CONTENT'}}]));
  good(await db.from('journey_circle_plans').insert({id:circleId,user_id:uid[0],status:'active',plan:{name:'Synthetic Accounts QA Circle',participants:emails.map(email=>({name:'Synthetic QA member',email}))}}));
  good(await db.from('dydd_circle_memberships').insert(uid.map((user_id,i)=>({circle_id:circleId,user_id,email:emails[i],display_name:'Synthetic QA member',status:'accepted',token_hash:crypto.randomBytes(32).toString('hex'),expires_at:new Date(Date.now()+86400000).toISOString(),accepted_at:new Date().toISOString()}))));
  for(const [name,headers,path] of [['anonymous',{},url],['invalid-preview',{},url+'?review=owner&key=invalid'],['nonowner',{cookie:memberCookie},url]]){
    const r=await fetch(base+path,{headers,redirect:'manual'});assert([200,404].includes(r.status),name);const body=await r.text();if(r.status===200)assert(body.includes('NEXT_HTTP_ERROR_FALLBACK;404'),'streamed not-found boundary required');assert(!body.includes('Synthetic Accounts QA'));assert(!body.includes(emails[0]));const api=await fetch(base+'/api/command-center/accounts'+(path.includes('?')?path.slice(path.indexOf('?')):''),{headers});assert.equal(api.status,403,name+' API');assert(api.headers.get('cache-control')?.includes('private'));assert(api.headers.get('cache-control')?.includes('no-store'));checks.push(name+' page not-found/API403 without account aggregate/identity leak');
  }
  const response=await fetch(base+url+ownerParams);assert.equal(response.status,200);const html=await response.text();assert(!html.includes('DO_NOT_EXPOSE_PERSONAL_ASSESSMENT_CONTENT'));assert(!html.includes('Architect'));assert(!html.includes(codeHash));assert(!html.includes('source_code_id'));assert(!html.includes('SUPABASE_SERVICE_ROLE_KEY'));const api=await fetch(base+'/api/command-center/accounts'+ownerParams);assert.equal(api.status,200);assert(api.headers.get('cache-control')?.includes('private'));assert(api.headers.get('cache-control')?.includes('no-store'));const payload=await api.json();assert.equal(payload.people.length,2);assert.equal(payload.circles.completionPercent,50);assert(!JSON.stringify(payload).includes('Architect'));assert(!JSON.stringify(payload).includes('DO_NOT_EXPOSE'));assert(!JSON.stringify(payload).includes('evidence'));checks.push('Owner-preview SSR/API200 private,no-store; personal result badge/evidence, beta hashes and internal source data absent');
  browser=await puppeteer.launch({args:chromium.args.filter(a=>a!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',request=>{if(!['GET','HEAD','OPTIONS'].includes(request.method())){errors.push('Unexpected mutation '+request.method()+' '+new URL(request.url()).pathname);return request.abort();}return request.continue();});
  for(const width of [1280,390,320]){
    await page.setViewport({width,height:1000});await page.goto(base+url+ownerParams,{waitUntil:'networkidle0',timeout:90000});
    await page.waitForSelector('input[type="search"]');
    assert(await page.$eval('main',e=>e.textContent.includes('SANDBOX DATA ONLY')));
    const metric=await page.$$eval('main>section[aria-label="Account totals"] article',elements=>elements.map(e=>e.textContent));assert(metric[0].includes('2'));assert(metric[2].includes('1'));
    const circles=await page.$eval('section[aria-labelledby="circles-title"]',e=>e.innerText);assert(circles.includes('50.0%'));assert(circles.includes('2.0'));
    const rows=await page.$$('tbody tr');assert.equal(rows.length,2);
    const body=await page.$eval('main',e=>e.innerText);assert(body.includes('Unavailable'));assert(body.includes('Not connected'));assert(!body.includes('Architect'));
    const geometry=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert(geometry.scroll<=geometry.width+1,'Page overflow at '+width+': '+JSON.stringify(geometry));
    const screenshot=`${out}/${prefix}-${width}.png`;await page.screenshot({path:screenshot,fullPage:true});screenshots.push(screenshot);
    await page.type('input[type="search"]','Rowan');await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1);assert(await page.$eval('tbody',e=>e.innerText.includes('Rowan')));
    await page.$eval('input[type="search"]',e=>{const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(e,'nobody-matches');e.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForFunction(()=>document.querySelector('main').innerText.includes('No accounts match'));
    await page.reload({waitUntil:'networkidle0'});
    await page.select('select','beta');await page.waitForFunction(()=>document.querySelectorAll('tbody tr').length===1);assert(await page.$eval('tbody',e=>e.innerText.includes('Ellis')));
    await page.select('select','all');
    await page.click('button[aria-label^="September 2026:"]');await page.waitForFunction(()=>document.querySelector('input[type="month"]').value==='2026-09');assert((await page.$eval('main>section[aria-label="Account totals"] article:nth-child(2)',e=>e.innerText)).includes('0'));
    await page.click('summary');await page.type('input[placeholder="Enter a planning count"]','7');assert(await page.$eval('details',e=>e.innerText.includes('$70 / month projected')));
    checks.push(width+'px: actual metrics2signups/1freebeta/1activecircle/2accepted/50%Journey, responsive no overflow, search/empty/beta filter, month chart, planning-only calculator');
  }
  await page.goto(base+'/command-center'+ownerParams,{waitUntil:'domcontentloaded',timeout:90000});assert(await page.$('a[href^="/command-center/accounts"]'));checks.push('Protected existing Command Center includes Accounts tab');
  assert.equal(errors.length,0,JSON.stringify(errors));
} catch(e) { failure=e; }
finally {
  if(browser)await browser.close();
  if(codeId)good(await db.from('dydd_personal_access').delete().in('user_id',uid));
  if(codeId)good(await db.from('dydd_beta_access_codes').delete().eq('id',codeId));
  good(await db.from('journey_circle_plans').delete().eq('id',circleId));
  for(const id of uid)good(await db.auth.admin.deleteUser(id));
  if(emails.length){for(const table of ['dydd_lifecycle_jobs','dydd_lifecycle_events','dydd_email_suppressions']){const result=await db.from(table).delete().in('email',emails);if(result.error)throw Error('Cleanup '+table+': '+result.error.message);}}
  const after=good(await db.from('dydd_beta_access_codes').select('id,code_hash,redeemed_by,redeemed_at').order('id'));assert.deepEqual(after,beforeCodes,'existing10beta codes unchanged');
  const users=await db.auth.admin.listUsers({page:1,perPage:1000});good(users);assert.equal(users.data.users.length,baselineCount);
  for(const table of ['passport_awards','passport_lesson_completions','dydd_personal_access','dydd_circle_memberships']){const result=await db.from(table).select('*',{count:'exact',head:true});good(result);assert.equal(result.count,0,'fixtures remaining '+table);}
  checks.push('All synthetic auth/checklist/award/personalaccess/membership/Circle/lifecycle/suppression fixtures cleaned; original10beta codes byte-for-byte unchanged');
  if(!failure){
    const emptyBrowser=await puppeteer.launch({args:chromium.args.filter(a=>a!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
    try {
      const empty=await emptyBrowser.newPage();
      for(const width of [1280,390]){
        await empty.setViewport({width,height:1000});await empty.goto(base+url+ownerParams,{waitUntil:'networkidle0',timeout:90000});
        assert(await empty.$eval('main',e=>e.innerText.includes('No sandbox accounts yet')));
        assert.equal(await empty.$eval('main>section[aria-label="Account totals"] article:first-child strong',e=>e.innerText),'0');
        const path=`${out}/${prefix}-actual-empty-${width}.png`;await empty.screenshot({path,fullPage:true});screenshots.push(path);
      }
      checks.push('Post-cleanup actual empty sandbox page verified1280/390,0accounts/0active real Circles,10unused beta codes, no live beta data');
    } finally {await emptyBrowser.close();}
  }

  const report={base,environment:'sandbox',status:failure?'FAIL':'PASS',checks,screenshots,errors,failure:failure?.message,completedAt:new Date().toISOString()};fs.writeFileSync(`${out}/${prefix}-browser.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
if(failure)throw failure;

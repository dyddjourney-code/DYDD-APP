// Read-only owner preview QA. No auth users, progress, reports or awards created.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
const config=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
assert.equal(config.ref,'atemrshtshxoqnuevvqu');
const base=process.env.PASSPORT_MOBILE_BASE||'http://127.0.0.1:3141';
assert(['http://127.0.0.1:3141','https://dydd-online-school-sandbox.vercel.app'].includes(base));
const tag=base.startsWith('https:')?'published':'local';
const browser=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const checks=[],errors=[];
const record=message=>{checks.push(message);console.log('PASS '+message);};
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 const params=new URLSearchParams({review:'new',key:config.review_token});
 await page.goto(base+'/sandbox-review',{waitUntil:'domcontentloaded'});
 const ready=()=>page.waitForFunction(()=>{const b=document.querySelector('.passport-badge-button');const k=b&&Object.keys(b).find(k=>k.startsWith('__reactProps$'));return k&&typeof b[k].onClick==='function'&&(!matchMedia('(max-width: 980px)').matches||b.getAttribute('aria-haspopup')==='dialog');});
 const preview=()=>page.evaluate(async()=>{const p=new URLSearchParams(location.search);p.set('courseSlug','discover-your-divine-design');const r=await fetch('/api/course-progress?'+p);if(!r.ok)throw Error('Preview progress GET '+r.status);return r.json();});
 let baseline;
 for(const width of [320,390,768,1280]) {
  await page.setViewport({width,height:width===320?568:844,isMobile:width<1000,hasTouch:width<1000});
  await page.goto(base+'/hq?'+params+'#passport',{waitUntil:'domcontentloaded'});await ready();
  await page.evaluate(()=>{window.__passportEvents=[];for(const name of ['touchstart','touchend','click'])document.addEventListener(name,e=>window.__passportEvents.push({name,target:e.target.closest('button')?.textContent,media:matchMedia('(max-width: 980px)').matches}),true)});
  const state=await preview();if(!baseline)baseline=state;else assert.deepEqual(state,baseline);
  const inventory=await page.$$eval('.passport-badge-button',es=>es.map(e=>({title:e.querySelector('strong').textContent,state:[...e.classList].find(c=>['ahead','earned','locked','next'].includes(c))})));
  assert(inventory.some(b=>b.state==='earned'));assert(inventory.some(b=>b.state==='ahead'));
  const total=await page.$eval('.passport-count-stamp span',e=>e.textContent);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow '+width);
  const buttons=await page.$$('.passport-badge-button');
  for(let i=0;i<buttons.length;i++) {
   const button=buttons[i],expected=inventory[i];
   console.log(`CHECK ${width}px ${i}: ${expected.title}`);
   // Cancel the page's smooth anchor scroll before measuring a real tap target.
   // Otherwise automation can tap the next row while the viewport is moving.
   await button.evaluate(e=>new Promise(resolve=>{e.scrollIntoView({behavior:'instant',block:'center'});requestAnimationFrame(()=>requestAnimationFrame(resolve));}));
   const pageScroll=await page.evaluate(()=>scrollY);
   // Actual hydrated pointer tap/click, including repeated milestones in every section.
   if(width<1000)await button.tap();else await button.click();
   if(width<1000) {
    await page.waitForSelector('.passport-detail-sheet[open]');
    assert.equal(await page.$eval('.passport-detail-sheet h3',e=>e.textContent),expected.title);
    const detail=await page.$eval('.passport-detail-sheet',e=>({text:e.textContent,box:{top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,width:e.getBoundingClientRect().width},focus:e.contains(document.activeElement),modal:e.matches(':modal')}));
    assert(detail.text.includes('Overview')&&detail.text.includes('Earn it by')&&detail.text.includes('Connected to'));
    assert(detail.text.includes(expected.state==='earned'?'Earned':expected.state==='next'?'Next':'Ahead'));
    assert(detail.modal&&detail.focus);assert(detail.box.top>=0&&detail.box.bottom<= (width===320?568:844)+1&&detail.box.width<=width);
    assert.equal(await page.$eval('.passport-badge-popover',e=>getComputedStyle(e).display),'none');
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
    assert(await page.$eval('.passport-sheet-header button',e=>{const b=e.getBoundingClientRect();return b.height>=44&&b.top>=0&&b.bottom<=innerHeight}));
    if(expected.title==='Niche Declared') {
     await page.hover('.passport-sheet-body');
     await page.mouse.wheel({deltaY:1600});
     await page.waitForFunction(()=>{const e=document.querySelector('.passport-sheet-body');return e.scrollTop+e.clientHeight>=e.scrollHeight-1});
     assert(await page.$eval('.passport-sheet-body',e=>{const dd=e.querySelector('dl > div:last-child dd').getBoundingClientRect(),r=e.getBoundingClientRect();return dd.bottom<=r.bottom+1&&dd.top>=r.top}),'Connection text reachable '+width);
     if(width===320) {
      assert(await page.$eval('.passport-sheet-body',e=>e.scrollTop>0),'Long details actually scroll');
      await page.screenshot({path:`tmp/passport-mobile-${tag}-320-scrolled.png`});
     }
    }
    if(i===1||expected.title==='DesignID'&&i>12||expected.title==='DesignPD')await page.screenshot({path:`tmp/passport-mobile-${tag}-${width}-${i===1?'what-is-dydd':expected.title.toLowerCase()}.png`});
    // Alternate Escape and visible Close; both restore the exact tapped duplicate.
    if(i%2)await page.keyboard.press('Escape');else await page.click('.passport-sheet-header button');
    await page.waitForFunction(()=>!document.querySelector('.passport-detail-sheet').open);
    assert(await button.evaluate(e=>document.activeElement===e),'Focus returns to tapped badge '+expected.title);
    assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
    assert(Math.abs(await page.evaluate(()=>scrollY)-pageScroll)<=1,'Close preserves list position '+expected.title);
   } else {
    await page.waitForFunction(t=>document.querySelector('.passport-badge-popover h3').textContent===t,{},expected.title);
    assert.equal(await page.$eval('.passport-detail-sheet',e=>e.open),false);
    assert.notEqual(await page.$eval('.passport-badge-popover',e=>getComputedStyle(e).display),'none');
   }
   assert.equal(await page.$eval('.passport-count-stamp span',e=>e.textContent),total);
  }
  if(width===1280) {
   await buttons[1].hover();assert.equal(await page.$eval('.passport-badge-popover h3',e=>e.textContent),'What is DYDD?');
   await page.$eval('.passport-book',e=>e.scrollIntoView());
  }
  await page.screenshot({path:`tmp/passport-mobile-${tag}-${width}-overview.png`});
  record(`${width}px: actual ${width<1000?'touch taps':'clicks and hover'} on all ${buttons.length} earned/ahead/next badges across main, short and deeper trails; correct contextual details, unchanged total, no overflow`);
 }
 await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
 await ready();
 const first=await page.$('.passport-badge-button');await first.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'center'}));await first.tap();await page.waitForSelector('.passport-detail-sheet[open]');
 await page.keyboard.press('Tab');assert(await page.$eval('.passport-detail-sheet',e=>e.contains(document.activeElement)));
 await page.keyboard.press('Tab');assert(await page.$eval('.passport-detail-sheet',e=>e.contains(document.activeElement)));
 await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert(await page.$eval('.passport-detail-sheet',e=>e.contains(document.activeElement)));
 await page.mouse.click(5,5);await page.waitForFunction(()=>!document.querySelector('.passport-detail-sheet').open);assert(await first.evaluate(e=>e===document.activeElement));
 await first.tap();await page.waitForSelector('.passport-detail-sheet[open]');await page.setViewport({width:1280,height:844,isMobile:true,hasTouch:true});await page.waitForFunction(()=>!document.querySelector('.passport-detail-sheet').open);assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
 record('Native modal focus containment (Tab/Shift+Tab), Escape, 44px Close, backdrop dismissal, exact trigger restoration, background lock and mobile-to-desktop dismissal verified');
 assert.deepEqual(await preview(),baseline);record('Owner preview progress/awards unchanged; no fixtures or backend writes');
 assert.deepEqual(errors,[]);record('Zero browser runtime errors');
 fs.writeFileSync(`tmp/passport-mobile-${tag}-qa.json`,JSON.stringify({base,verifiedAt:new Date().toISOString(),checks,errors},null,2));
}catch(error){const pages=await browser.pages();console.log('EVENTS',await pages.at(-1)?.evaluate(()=>window.__passportEvents?.slice(-8)));await pages.at(-1)?.screenshot({path:`tmp/passport-mobile-${tag}-failure.png`});throw error;}finally{await browser.close();}

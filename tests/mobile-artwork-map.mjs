import assert from 'node:assert/strict';
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import load from '../scripts/fruitlife-test-load.cjs';
const base=process.env.COURSE_TEST_BASE||'http://localhost:3124';
assert(base==='https://dydd-online-school-sandbox.vercel.app'||base.startsWith('http://localhost:'));
const tag=base.startsWith('https:')?'published':'local';
const section=process.env.MOBILE_TEST_SECTION||'all';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const courses=load('lib/courses/course-catalog.ts').learningCourses;
const design=load('lib/courses/designid-foundations.ts').designIdLessons;
const journey=load('lib/journey/dydd-course-outline.ts').dyddMainCourseOutline.flatMap(m=>m.units);
const headers=[['/',' .portal-hero'],['/base-camp','.basecamp-hero'],['/ranger-station','.ranger-station-header-image'],['/trailheads','.trailheads-hero'],['/journey','.journey-hero'],['/courses/designid-foundations','.designid-course-hero'],['/courses/designpd-alignment','.designpd-course-hero'],['/courses/spiritual-gifts-service','.spiritual-gifts-course-hero'],['/courses/fruitlife-360-formation','.fruitlife-course-hero'],['/field-kit','.fieldkit-hero'],['/gear','.gear-hero'],['/fireside','.fireside-page-hero'],['/camp-circle','.camp-circle-hero'],['/camp-circle/my-circles','.camp-circle-hero'],['/waypoints','.fireside-image-header'],['/live','.live-fireside-header'],['/command-center','.command-center-hero'],['/command-center/expedition','.expedition-page-hero'],['/command-center/design-map','.design-map-hero'],['/spiritual-gifts?lane=fruitlife','.spiritual-gifts-mini-hero'],['/field-kit/reflections/discover-your-divine-design','.reflection-notebook-hero'],['/field-kit/reflections/designid-foundations','.reflection-notebook-hero']];
const lessonCases=[...journey.map(l=>({path:'/journey?lesson='+l.slug,title:l.title})),...design.map(l=>({path:'/courses/designid-foundations?lesson='+l.slug,title:l.title})),...courses.flatMap(c=>c.modules.flatMap(m=>m.lessons.map(l=>({path:'/courses/'+c.slug+'?lesson='+l.slug,title:l.title}))))];
const representatives=lessonCases.filter((x,i)=>i%15===0||/welcome-to-designid|reflection-capacity|your-design-profile|applied-capacity|the-designid-lens|who-vs-whose|the-d-e-s-i-g-n/.test(x.path));
const b=await puppeteer.launch({args:chromium.args.filter(x=>x!=='--single-process'),executablePath:await chromium.executablePath(),headless:true});
const evidence=[],errors=[],blockedWrites=[];
const checkpoint=stage=>fs.writeFileSync(`tmp/mobile-artwork-${tag}-${section}-progress.json`,JSON.stringify({stage,checks:evidence.length,errors,evidence},null,2));
try {
 const p=await b.newPage(); p.setDefaultTimeout(30000);p.setDefaultNavigationTimeout(90000);p.on('pageerror',e=>errors.push(e.message));
 // Read-only layout run: never mutate owner/customer answers, position, support or profile.
 await p.setRequestInterception(true);p.on('request',r=>{if(new URL(r.url()).searchParams.has('_rsc')||r.headers()['next-router-prefetch']==='1'||r.headers()['purpose']==='prefetch')return r.abort();if(!['GET','HEAD','OPTIONS'].includes(r.method())&&new URL(r.url()).pathname.startsWith('/api/')){blockedWrites.push(new URL(r.url()).pathname);return r.respond({status:409,contentType:'application/json',body:JSON.stringify({error:'Read-only layout verification'})});}return r.continue()});
 await p.goto(base+'/sandbox-review',{waitUntil:'networkidle2'});await p.waitForSelector('.trail-main-route');
 const visit=async(path)=>{const url=new URL(base+path);if(path.startsWith('/spiritual-gifts?lane=')){url.searchParams.set('review','new');url.searchParams.set('key',cfg.review_token);}await p.goto(url.href,{waitUntil:'networkidle2'});await p.waitForFunction(()=>document.readyState==='complete');await p.evaluate(()=>document.fonts.ready);};
 const overflow=async(label)=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal page overflow '+label);
 if(['all','headers'].includes(section)) for(const width of [320,390,430,844,1280]) {
  await p.setViewport({width,height:width===844?390:950,isMobile:width<=980,hasTouch:width<=980});
  for(const [path,selector] of headers){
   await visit(path);const element=await p.$(selector);assert(element,'Header missing '+path+' at '+new URL(p.url()).pathname);await overflow(path+'/'+width);
   const geo=await element.evaluate(e=>{const s=getComputedStyle(e),before=getComputedStyle(e,'::before'),r=e.getBoundingClientRect();const imgs=[...e.querySelectorAll('img')].map(i=>({fit:getComputedStyle(i).objectFit,w:i.getBoundingClientRect().width,h:i.getBoundingClientRect().height,nw:i.naturalWidth,nh:i.naturalHeight}));return{w:r.width,h:r.height,bg:s.backgroundImage,before:before.backgroundImage,ratio:before.aspectRatio,imgs};});
   if(width<=980){
    if(geo.before.includes('/brand/')){assert.equal(geo.bg,'none','No cropped underlying image '+path);const dimensions=geo.ratio.split('/').map(Number);assert(dimensions.length===2&&dimensions[0]>0,'Actual illustration ratio '+path);}
    for(const img of geo.imgs.filter(i=>i.nw>500&&['/base-camp','/ranger-station','/waypoints','/live','/command-center/expedition'].includes(path))) {assert.equal(img.fit,'contain','No-crop header img '+path);assert(Math.abs(img.w/img.h-img.nw/img.nh)<.03,'Natural header aspect ratio '+path);}
   }
   evidence.push({kind:'header',path,width,...geo});
   if([390,1280].includes(width))await element.screenshot({path:`tmp/mobile-artwork-${tag}-header-${path.replaceAll('/','_')||'portal'}-${width}.png`});
  }
  checkpoint('headers-'+width);console.log('PASS headers',width,headers.length);
 }
 const inspectLesson=async(item,width,screenshot=false)=>{
  await visit(item.path);await p.waitForFunction(title=>document.querySelector('.journey-active-lesson h2,.assessment-active-lesson h2,.designid-active-lesson h2')?.textContent===title,{},item.title);const active=await p.$('.journey-active-lesson,.assessment-active-lesson,.designid-active-lesson');assert(active,'Course player missing '+item.path+' '+new URL(p.url()).pathname);await overflow(item.path+'/'+width);
  const result=await p.evaluate(()=>{
   const pairs=[];const pair=(art,body)=>{if(!art||!body)return;const a=art.getBoundingClientRect(),t=body.getBoundingClientRect();if(a.width&&a.height&&t.width&&t.height)pairs.push({art:art.className,artY:a.y,artBottom:a.bottom,artX:a.x,bodyY:t.y,bodyX:t.x});};
   for(const root of document.querySelectorAll('.assessment-lesson-content.with-image'))pair(root.querySelector(':scope > .assessment-lesson-image,:scope > .journey-lesson-images,:scope > .designid-lesson-artwork'),root.querySelector(':scope > .lesson-source'));
   for(const root of document.querySelectorAll('.journey-wrap-pilot .readable-lesson-body'))pair(root.querySelector('.journey-lesson-images'),root.querySelector('.lesson-body-subheading,p,.journey-expertise-body'));
   for(const root of document.querySelectorAll('.designid-authored-body,.designid-welcome-body')){const arts=[...root.querySelectorAll(':scope > figure')];pair(arts.at(-1),root.querySelector(':scope > .designid-semantic-body'));}
   pair(document.querySelector('.journey-designid-intro .journey-lesson-images'),document.querySelector('.journey-designid-intro > div:first-child'));
   pair(document.querySelector('.capacity-bulbs'),document.querySelector('.capacity-introduction > div'));
   const audio=document.querySelector('.journey-teaching-card > .companion-audio-card,.assessment-teaching-card > .companion-audio-card,.designid-active-lesson > .companion-audio-card');
   const images=[...document.querySelectorAll('.journey-lesson-images img,.assessment-lesson-content > .assessment-lesson-image img,.designid-authored-artwork img,.designid-welcome-artwork img,.capacity-bulbs img')];
   return{pairs,audioBottom:audio?.getBoundingClientRect().bottom,images:images.map(i=>({top:i.getBoundingClientRect().top,src:i.getAttribute('src')})),title:document.querySelector('.journey-active-lesson h2,.assessment-active-lesson h2,.designid-active-lesson h2')?.textContent};
  });
  if(width<=980){for(const pair of result.pairs)assert(pair.artBottom<=pair.bodyY+2,'Image before teaching '+item.path+' '+width+' '+JSON.stringify(pair));if(result.audioBottom)for(const image of result.images)assert(result.audioBottom<=image.top+2,'Audio before image '+item.path+' '+width+' '+JSON.stringify(result));}
  evidence.push({kind:'lesson',path:item.path,width,...result});
  if(screenshot){await active.evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:`tmp/mobile-artwork-${tag}-lesson-${lessonCases.indexOf(item)}-${width}.png`,fullPage:false});}
 };
 if(['all','lessons'].includes(section)){
 await p.setViewport({width:390,height:950,isMobile:true,hasTouch:true});
 for(let i=Number(process.env.MOBILE_LESSON_START||0);i<lessonCases.length;i++){await inspectLesson(lessonCases[i],390,i%20===0);if(i%20===0){checkpoint('lesson-'+(i+1));console.log('PASS lesson audit',i+1,'/',lessonCases.length);}}

 for(const width of [320,430,844,1280]){await p.setViewport({width,height:width===844?390:950,isMobile:width<=980,hasTouch:width<=980});for(const item of representatives)await inspectLesson(item,width,width===320||width===1280);checkpoint('representatives-'+width);console.log('PASS representative lessons',width,representatives.length);}
 }
 // Standalone routes share the same artwork ordering rules; this section can resume independently.
 if(['all','lessons','standalone'].includes(section)) for(const width of [320,390,430,1280]){await p.setViewport({width,height:950,isMobile:width<=980,hasTouch:width<=980});for(const path of ['/learn/designid-foundations/welcome-to-designid','/learn/designid-foundations/integrative-reflections',...courses.map(c=>'/learn/'+c.slug+'/'+c.modules[0].lessons[0].slug)]){await visit(path);await overflow(path+'/'+width);const pair=await p.evaluate(()=>{const a=document.querySelector('.assessment-lesson-content > .assessment-lesson-image,.designid-authored-artwork,.designid-welcome-artwork'),t=document.querySelector('.assessment-lesson-content > .lesson-source,.designid-semantic-body');return a&&t?{a:a.getBoundingClientRect().bottom,t:t.getBoundingClientRect().top}:null});if(width<768&&pair)assert(pair.a<=pair.t+2,'Standalone artwork order '+path);evidence.push({kind:'standalone',width,path});}}
 if(['all','map'].includes(section)) for(const [width,height] of [[320,950],[390,950],[430,950],[844,390],[1280,950]]){
  await p.setViewport({width,height,isMobile:width<=980,hasTouch:width<=980});await visit('/ranger-station');await p.waitForSelector('.relief-map-toolbar button');await p.waitForFunction(()=>Object.keys(document.querySelector('.relief-map-toolbar button')).some(k=>k.startsWith('__reactProps')));await overflow('map/'+width);
  assert(await p.$eval('.relief-map-stage-scroll',e=>e.scrollWidth<=e.clientWidth+1),'No inline map horizontal scrolling '+width);
  for(let index=1;index<=12;index++){const control=await p.$(`.relief-map-canvas .relief-map-places button:nth-child(${index})`);const name=await control.evaluate(e=>e.textContent.replace(/^\d+/,''));assert(await control.evaluate(e=>e.getBoundingClientRect().height>=44),'Readable place hit target');if(width<=980)await control.tap();else await control.click();await p.waitForFunction(name=>document.querySelector('.relief-map-panel h3')?.textContent===name,{},name);}
  const pins=await p.$$eval('.relief-map-stage .relief-map-marker',es=>es.map(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return{inside:a.x>=b.x-1&&a.right<=b.right+1&&a.y>=b.y-1&&a.bottom<=b.bottom+1,label:e.getAttribute('aria-label')}}));assert(pins.every(p=>p.inside),'Every numbered marker visible '+width+' '+JSON.stringify(pins));
  await p.click('.relief-map-places button:nth-child(5)');await p.waitForFunction(()=>document.querySelector('.relief-map-panel h3')?.textContent==='Fireside');assert.equal(await p.$eval('.relief-map-panel h3',e=>e.textContent),'Fireside');
  await p.$eval('.relief-map-toolbar',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.click('.relief-map-toolbar button');await p.waitForSelector('dialog[open]');assert.equal(await p.$eval('dialog',e=>e.matches(':modal')),true);assert.equal(await p.evaluate(()=>document.activeElement?.textContent),'Close map');await p.keyboard.down('Shift');await p.keyboard.press('Tab');await p.keyboard.up('Shift');assert((await p.evaluate(()=>document.activeElement?.textContent)).includes('DesignID Trail'),'Shift-tab wraps to final place');await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement?.textContent),'Close map');
  await p.click('dialog .relief-map-places button:nth-child(12)');assert((await p.$eval('.relief-map-selection',e=>e.textContent)).includes('DesignID Trail'));
  const mapgeo=await p.$eval('dialog .relief-map-stage',e=>{const r=e.getBoundingClientRect();return{x:r.x,right:r.right,top:r.top,bottom:r.bottom,w:r.width,scroll:e.scrollWidth,client:e.clientWidth}});assert(mapgeo.x>=0&&mapgeo.right<=width+1&&mapgeo.scroll<=mapgeo.client+1,'Expanded map fits '+width);if(width===844)assert(mapgeo.top>=0&&mapgeo.bottom<=height,'Whole expanded landscape map visible without vertical scrolling');
  for(let n=0;n<20;n++){await p.keyboard.press('Tab');assert(await p.evaluate(()=>document.querySelector('dialog').contains(document.activeElement)),'Modal focus trapped');}
  await p.$eval('dialog',e=>e.scrollTop=0);await p.screenshot({path:`tmp/mobile-artwork-${tag}-expanded-map-${width}.png`});await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(await p.evaluate(()=>document.activeElement?.textContent),'Expand map');assert.equal(await p.$eval('.relief-map-panel h3',e=>e.textContent),'DesignID Trail');
  await p.$eval('.relief-map-toolbar',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await p.click('.relief-map-toolbar button');await p.waitForSelector('dialog[open]');await p.click('dialog .relief-map-dialog-toolbar button');await p.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(await p.evaluate(()=>document.activeElement?.textContent),'Expand map');
  await p.$eval('.relief-map-workbench',e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:`tmp/mobile-artwork-${tag}-map-${width}.png`});evidence.push({kind:'map',width,height,...mapgeo});checkpoint('map-'+width);console.log('PASS map interactions/Escape/close/focus/no-scroll',width,height);
 }
 assert.deepEqual(errors,[],'No browser runtime errors');const result={status:'PASS',base,courseFamilies:7,lessons:lessonCases.length,lessonAuditStart:Number(process.env.MOBILE_LESSON_START||0),fullLessonAuditCount:['all','lessons'].includes(section)?Math.max(0,lessonCases.length-Number(process.env.MOBILE_LESSON_START||0)):0,headerSurfaces:headers.length,representatives:representatives.length,checks:evidence.length,blockedWrites:[...new Set(blockedWrites)],errors,evidence};fs.writeFileSync(`tmp/mobile-artwork-${tag}-${section}-qa.json`,JSON.stringify(result,null,2));console.log('PASS complete',JSON.stringify({...result,evidence:undefined}));
} finally {await b.close()}

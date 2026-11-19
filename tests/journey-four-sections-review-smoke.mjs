import {launchReviewBrowser,authenticateReviewPage} from "../scripts/journey-review-browser.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
const base=process.env.JOURNEY_TEST_BASE||"http://localhost:3124";
assert(base.startsWith("http://localhost:")||base==="https://dydd-online-school-sandbox.vercel.app");
const browser=await launchReviewBrowser();
try {
 const p=await browser.newPage(),errors=[];await authenticateReviewPage(p);p.on("pageerror",e=>errors.push(e.message));
 await p.setViewport({width:1280,height:1000});
 await p.goto(base+"/sandbox-review",{waitUntil:"domcontentloaded"});
 await p.waitForSelector('.trail-main-route a[href^="/journey"]',{visible:true});
 await Promise.all([p.waitForNavigation({waitUntil:"domcontentloaded"}),p.$eval('.trail-main-route a[href^="/journey"]',e=>e.click())]);
 await p.waitForSelector(".journey-course-index");
 console.log("PASS established owner review entry → Trailheads → Journey");
 for(const width of [1280,390,320]){
  await p.setViewport({width,height:1000});
  for(const [slug,selector] of [["identity-who-vs-whose-16",".journey-who-whose-care"],["expertise-the-journey-to-expertise-26",".journey-expertise-care"]]){
   await p.goto(base+"/journey?lesson="+slug,{waitUntil:"domcontentloaded"});
   await p.waitForSelector(selector+" textarea:not([disabled])");
   assert.equal(await p.$(".journey-review-lesson"),null);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
 }
 await p.goto(base+"/journey?lesson=story-why-story-matters-35",{waitUntil:"domcontentloaded"});
 await p.waitForSelector(".journey-review-care");
 const progress=()=>p.evaluate(async()=>{const q=new URLSearchParams(location.search);q.set("courseSlug","discover-your-divine-design");const r=await fetch("/api/course-progress?"+q);return r.json()});
 const before=await progress();assert.equal(before.reviewAllLessons,true);
 let completionWrites=0;await p.setRequestInterception(true);p.on("request",r=>{const u=new URL(r.url());if(u.pathname==="/api/course-progress"&&r.method()==="POST")completionWrites++;if(u.pathname==="/api/course-reflections"&&r.postData()?.includes('"action":"position"'))return void r.respond({status:200,contentType:"application/json",body:"{}"});void r.continue()});
 await p.$$eval(".course-completion-controls button",es=>es.find(e=>e.textContent.startsWith("Next for review:")).click());
 await p.waitForSelector('[data-question="story-god-never-wastes-a-hurt-36-care-act"] textarea:not([disabled])');
 const after=await progress();assert.deepEqual(after.completed,before.completed);assert.deepEqual(after.awards,before.awards);assert.equal(completionWrites,0);
 p.removeAllListeners("request");await p.setRequestInterception(false);console.log("PASS owner Next for review changes lessons without completion/award writes; bookmark write isolated");
 await p.goto(base+"/journey?lesson=story-why-story-matters-35",{waitUntil:"domcontentloaded"});await p.waitForSelector(".journey-review-care");
 assert(await p.$("audio"),"Original Story companion recording retained");
 await p.$eval("audio",e=>{e.muted=true;e.load()});
 await p.waitForFunction(()=>document.querySelector("audio")?.readyState>=2);
 await p.$eval("audio",e=>e.play());
 await p.waitForFunction(()=>document.querySelector("audio")?.currentTime>0);
 await p.$eval("audio",e=>e.pause());
 assert.deepEqual(errors,[]);
 console.log("PASS reference Identity/Expertise editable CARE at 1280/390/320; actual retained Story audio playback; zero JS errors");
 fs.writeFileSync("tmp/four-sections-smoke-results.json",JSON.stringify({base,passed:true,ownerEntry:true,neighbors:6,storyAudioPlayback:true,ownerNextWithoutCompletion:true,positionOnlyIntercepted:true,errors},null,2));
}finally{await browser.close()}

// Real sandbox DB persistence. Only failure branches intercept transport.
import fs from "node:fs";import assert from "node:assert/strict";import crypto from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {launchReviewBrowser,authenticateReviewPage} from "../scripts/journey-review-browser.mjs";
import load from "../scripts/fruitlife-test-load.cjs";
const cfg=JSON.parse(fs.readFileSync("/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json"));
assert.equal(cfg.ref,"atemrshtshxoqnuevvqu");
const base=process.env.JOURNEY_TEST_BASE||"http://localhost:3124",course="discover-your-divine-design";
assert(base.startsWith("http://localhost:")||base==="https://dydd-online-school-sandbox.vercel.app");
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}});
const question="story-god-never-wastes-a-hurt-36-care-act",other="story-god-never-wastes-a-hurt-36-care-connect",lesson="story-god-never-wastes-a-hurt-36";
const catalog=load("lib/reflections/catalog.ts").getReflectionExperience(course),units=load("lib/journey/dydd-course-outline.ts").dyddMainCourseOutline.flatMap(m=>m.units);
const checks=[],errors=[],run=crypto.randomUUID();let uid,browser,page,cookie;
const ok=r=>{assert(!r.error,r.error?.message);return r.data};
const api=async(path,body)=>{const r=await fetch(base+path,{method:body?"POST":"GET",headers:{cookie,origin:base,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json();assert(r.ok,data.error||"HTTP"+r.status);return data};
const data=()=>api("/api/course-reflections?courseSlug="+course);
const latest=(d,id)=>d.entries.filter(e=>e.question_id===id&&e.round_id===d.rounds[0].id).sort((a,b)=>b.revision-a.revision)[0];
const type=async(id,text,cls="textarea:not(.discussion-note)")=>page.$eval('[data-question="'+id+'"] '+cls,(e,text)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(e,text);e.dispatchEvent(new Event("input",{bubbles:true}))},text);
const advance=async()=>{const heading=await page.$eval(".journey-active-lesson h2",e=>e.textContent);await page.$eval(".journey-active-pagination .course-completion-controls button",e=>e.click());await page.waitForFunction(h=>document.querySelector(".journey-active-lesson h2")?.textContent!==h,{},heading)};
async function go(path,width=1280){
 if(page)await page.close();page=await browser.newPage();await authenticateReviewPage(page);await page.setViewport({width,height:1000});await page.setCookie(...cookies);
 page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>void d.accept());
 await page.setRequestInterception(true);page.on("request",r=>{const u=new URL(r.url());if(u.origin===base&&(u.pathname==="/base-camp"||u.pathname==="/sandbox-review"||u.searchParams.has("review")))return void r.abort();if(failSaves&&r.postData()?.includes('"action":"save"'))return void r.respond({status:503,contentType:"application/json",body:JSON.stringify({error:"Synthetic save failure; keep the draft"})});void r.continue()});
 await page.deleteCookie({name:"dydd_sandbox_review",url:base});const response=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:60000});assert.equal(response.status(),200,new URL(path,base).pathname);
 // Keep unrelated preview-prefetch suppression active for the entire real-account visit.

}
let cookies=[],failSaves=false;
try{
 const email="journey-four-sections-"+run+"@example.invalid",password=crypto.randomBytes(24).toString("base64url");
 uid=ok(await db.auth.admin.createUser({email,password,email_confirm:true})).user.id;
 // Completed-course QA fixture can revisit all lessons; no assessment/owner/customer state invented.
 ok(await db.from("passport_lesson_completions").insert(units.map(u=>({user_id:uid,course_slug:course,lesson_slug:u.slug}))));
 const link=ok(await db.auth.admin.generateLink({type:"magiclink",email}));
 const login=await fetch(base+"/auth/confirm",{method:"POST",body:new URLSearchParams({token_hash:link.properties.hashed_token,next:"/journey"}),redirect:"manual"});
 assert.equal(login.status,307);cookies=login.headers.getSetCookie().map(v=>{const p=v.split(";")[0],i=p.indexOf("=");return{name:p.slice(0,i),value:p.slice(i+1),url:base}});
 assert(cookies.length);cookie=cookies.map(c=>c.name+"="+c.value).join("; ");
 browser=await launchReviewBrowser();
 for(const width of [1280,390,320]){
  await go("/journey?lesson="+lesson,width);await page.waitForSelector('[data-question="'+question+'"] textarea:not([disabled])');
  const before=await data(),revision=latest(before,question)?.revision||0;
  assert.equal(before.rounds.length,1);assert.equal(before.rounds[0].questions.find(q=>q.id===question).version,"2026-11-19");
  const text="Actual lesson boundary "+run+" "+width,second="Second dirty CARE field "+width,note="Private class note "+width;
  await type(question,text);await type(other,second);await page.focus('[data-question="'+other+'"] textarea');
  await new Promise(r=>setTimeout(r,1000));
  assert.equal(latest(await data(),question)?.revision||0,revision,"No pause or blur autosave");
  await page.$eval('[data-question="'+question+'"] .discussion-mark',e=>e.click());
  const add=await page.$('[data-question="'+question+'"] .discussion-add-note');if(add)await add.click();
  await type(question,note,"textarea.discussion-note");
  await advance();const saved=await data();assert.equal(latest(saved,question).response,text);assert.equal(latest(saved,question).revision,revision+1);assert.equal(latest(saved,other).response,second);
  const reminder=await api("/api/course-reflections/discussion?courseSlug="+course);assert(reminder.reminders.some(r=>r.question_id===question&&r.marked&&r.note===note));
  await go("/field-kit/reflections/"+course,width);await page.waitForFunction(t=>document.body.textContent.includes(t),{},text);
  const selector='[data-question="'+question+'"]';await page.$eval(selector,e=>{for(let p=e;p;p=p.parentElement)if(p.tagName==="DETAILS")p.open=true});
  await page.$$eval(selector+" button",es=>es.find(e=>/Edit reflection|Add reflection/.test(e.textContent))?.click());
  await page.waitForSelector(selector+" textarea");const edited=text+" edited in Field Kit";await type(question,edited);
  await page.$eval(selector+" .reflection-answer-actions button",e=>e.click());await page.waitForFunction(s=>document.querySelector(s+" [role=status]")?.textContent.startsWith("Saved"),{},selector);
  const history=await data();assert.equal(latest(history,question).response,edited);assert(history.entries.some(e=>e.question_id===question&&e.response===text));assert(latest(history,question).revision>revision+1);
  for(const scope of ["round","course","all"]){const q=new URLSearchParams({scope,courseSlug:course,round:history.rounds[0].id});const r=await fetch(base+"/api/course-reflections/export?"+q,{headers:{cookie}});assert.equal(r.status,200);assert((await r.text()).includes(edited))}
  await go("/journey?lesson="+lesson,width);await page.waitForFunction(({id,text})=>document.querySelector('[data-question="'+id+'"] textarea')?.value===text,{}, {id:question,text:edited});
  assert.equal(await page.$eval(selector+" .discussion-mark",e=>e.getAttribute("aria-pressed")),"true");
  await page.$eval(selector+" .discussion-mark",e=>e.click());await advance();const unmarked=await api("/api/course-reflections/discussion?courseSlug="+course);assert(unmarked.reminders.some(r=>r.question_id===question&&!r.marked&&r.note===note));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));checks.push({width,realDbBoundarySave:true,noPauseBlurSave:true,twoFields:true,fieldKitEditHistoryExport:true,reopen:true,privateMarkNoteUnmark:true});console.log("PASS actual boundary save/FieldKit/history/export/reminders/reopen",width);
 }
 // Original early/final Pathfinder fields remain one answer, not copied values.
 for(const [id,later] of [["identity-declaration","niche-pathfinder-preparing-your-niche-declaration-68"],["identity-service-reflections","niche-which-will-enable-me-to-use-my-70"],["identity-love-for-others","niche-which-will-enable-me-to-use-my-70"],["expertise-talents-skills","niche-which-will-enable-me-to-use-my-70"],["expertise-declaration","niche-which-will-enable-me-to-use-my-70"],["story-declaration","niche-coming-from-69"],["desire-declaration","niche-impassioned-by-71"],["gifts-declaration","niche-supported-by-72"]]){
  const early=catalog.questions.find(q=>q.id===id).lessonSlug;await go("/journey?lesson="+early);await page.waitForSelector('[data-question="'+id+'"] textarea:not([disabled])');
  const a="Shared Pathfinder "+id+" "+run;await type(id,a);await advance();
  await go("/journey?lesson="+later);await page.waitForFunction(({id,a})=>document.querySelector('[data-question="'+id+'"] textarea')?.value===a,{}, {id,a});
  await type(id,a+" revised at final assembly");await advance();await go("/journey?lesson="+early);await page.waitForFunction(({id,a})=>document.querySelector('[data-question="'+id+'"] textarea')?.value===a+" revised at final assembly",{}, {id,a});
  checks.push({sharedPathfinder:id,realBidirectional:true});console.log("PASS shared early → final → early Pathfinder",id);
 }
 // Actual source picker writes the existing complete declaration key.
 await go("/journey?lesson=niche-pathfinder-preparing-your-niche-declaration-68");await page.waitForSelector(".journey-niche-builder > button");await page.$eval(".journey-niche-builder > button",e=>e.click());
 await page.waitForSelector(".fieldkit-source-dialog[open] article button");await page.$$eval(".fieldkit-source-dialog article",es=>es.find(e=>e.querySelector("h3")?.textContent.startsWith("I believe God created me")).querySelector("button").click());
 await page.$eval('.fieldkit-source-dialog [aria-label="Close Field Kit"]',e=>e.click());await advance();assert(latest(await data(),"niche-working-declaration").response.includes("#reflection-identity-declaration"));checks.push({originalDeclarationSourcePickerSaved:true});
 // Failure/retry and real stale-revision protection, tested separately from successful DB paths.
 await go("/journey?lesson="+lesson);await page.waitForSelector('[data-question="'+question+'"] textarea:not([disabled])');const draft="Retained failure draft "+run;await type(question,draft);
 failSaves=true;
 await page.$eval(".journey-active-pagination .course-completion-controls button",e=>e.click());await page.waitForSelector(".reflection-lesson-save-state[role=alert]");assert.equal(await page.$eval('[data-question="'+question+'"] textarea',e=>e.value),draft);
 failSaves=false;await page.$eval(".reflection-lesson-save-state button",e=>e.click());await page.waitForFunction(id=>document.querySelector('[data-question="'+id+'"] .reflection-answer-actions [role=status]')?.textContent==="Saved",{timeout:60000},question);assert.equal(latest(await data(),question).response,draft);
 const prior=latest(await data(),question),remote="Actual other-tab revision "+run;
 await api("/api/course-reflections",{action:"save",courseSlug:course,roundId:prior.round_id,questionId:question,response:remote,expectedRevision:prior.revision});
 await type(question,"Local conflict draft "+run);await page.$eval(".journey-active-pagination .course-completion-controls button",e=>e.click());await page.waitForSelector(".reflection-lesson-save-state[role=alert]");assert.equal(latest(await data(),question).response,remote);assert.equal(await page.$eval('[data-question="'+question+'"] textarea',e=>e.value),"Local conflict draft "+run);
 checks.push({interceptedFailureDraftRetained:true,retryRealDbSaved:true,actualStaleTabRevisionProtected:true});assert.deepEqual(errors,[]);
 fs.writeFileSync("tmp/four-sections-persistence-results.json",JSON.stringify({base,checks,errors,syntheticOnly:true,realSuccessfulDbWrites:true,onlyFailureIntercepted:true},null,2));
 console.log("PASS all actual database, shared Pathfinder, source picker, failure/retry/conflict checks");
}finally{
 if(browser)await browser.close().catch(()=>{});
 if(uid){ok(await db.storage.from("assessment-report-pdfs").remove(["private-discussion-reminders/user-"+uid+".json","private-discussion-reminders/user-"+uid+".lock"]));ok(await db.auth.admin.deleteUser(uid));console.log("Synthetic QA account and private reminder objects removed")}
}

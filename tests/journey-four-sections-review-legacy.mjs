// Isolated real DB test: metadata upgrades must preserve current/history/archives.
import fs from "node:fs";import assert from "node:assert/strict";import crypto from "node:crypto";import{createClient}from"@supabase/supabase-js";
const cfg=JSON.parse(fs.readFileSync("/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json"));assert.equal(cfg.ref,"atemrshtshxoqnuevvqu");
const base=process.env.JOURNEY_TEST_BASE||"http://localhost:3124";assert(base.startsWith("http://localhost:")||base==="https://dydd-online-school-sandbox.vercel.app");
const db=createClient(cfg.project_url,cfg.service_role_key,{auth:{persistSession:false}}),course="discover-your-divine-design",users=[];
const ok=r=>{assert(!r.error,r.error?.message);return r.data};
async function account(){const email="journey-legacy-"+crypto.randomUUID()+"@example.invalid";const u=ok(await db.auth.admin.createUser({email,password:crypto.randomBytes(24).toString("base64url"),email_confirm:true})).user;users.push(u);const link=ok(await db.auth.admin.generateLink({type:"magiclink",email}));const r=await fetch(base+"/auth/confirm",{method:"POST",body:new URLSearchParams({token_hash:link.properties.hashed_token,next:"/journey"}),redirect:"manual"});assert.equal(r.status,307);u.cookie=r.headers.getSetCookie().map(x=>x.split(";")[0]).join("; ");return u}
async function request(user,path,body){const r=await fetch(base+path,{method:body?"POST":"GET",headers:{...(user?{cookie:user.cookie}:{}),origin:base,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,body:await r.json()}}
try{
 const a=await account(),b=await account();
 const q={id:"shaping-moments",lessonSlug:"story-why-story-matters-35",lessonTitle:"Why story matters",moduleTitle:"Story",prompt:"List the biggest moments in your life that have shaped who you are.",version:"legacy-owner-authored"};
 const retired={...q,id:"retired-qa-history",prompt:"Retired question stays in history"};
 const archive=ok(await db.from("reflection_rounds").insert({user_id:a.id,course_slug:course,questions:[q],source:"qa-owner-review-legacy",started_at:"2026-09-01T00:00:00Z"}).select("*").single());
 const current=ok(await db.from("reflection_rounds").insert({user_id:a.id,course_slug:course,questions:[q,retired],source:"qa-owner-review-legacy",started_at:new Date().toISOString()}).select("*").single());
 const make=(round,question,response)=>({user_id:a.id,round_id:round.id,question_id:question.id,prompt:question.prompt,question_version:question.version,lesson_slug:question.lessonSlug,lesson_title:question.lessonTitle,response,revision:1});
 const entries=ok(await db.from("reflection_entries").insert([make(archive,q,"Archived old answer remains exact"),make(current,q,"Existing current answer remains exact"),make(current,retired,"Retired answer remains exact")]).select("*"));
 const opened=await request(a,"/api/course-reflections?courseSlug="+course);assert.equal(opened.status,200);assert.equal(opened.body.rounds[0].id,current.id);
 const fresh="story-god-never-wastes-a-hurt-36-care-act";assert(opened.body.rounds[0].questions.some(q=>q.id===fresh&&q.version==="2026-11-19"));assert(opened.body.rounds[0].questions.some(q=>q.id===retired.id));
 const saved=await request(a,"/api/course-reflections",{action:"save",courseSlug:course,roundId:current.id,questionId:fresh,response:"Actual additive new-stage save",expectedRevision:0});assert.equal(saved.status,200);
 const after=ok(await db.from("reflection_rounds").select("*").eq("id",archive.id).single());assert.deepEqual(after,archive,"Archive including original question snapshot unchanged");
 const originalEntries=ok(await db.from("reflection_entries").select("*").in("id",entries.map(e=>e.id)));assert.deepEqual(originalEntries.sort((a,b)=>a.id.localeCompare(b.id)),entries.sort((a,b)=>a.id.localeCompare(b.id)),"All original entries/versions/prompts/responses unchanged");
 const foreign=await request(b,"/api/course-reflections",{action:"save",courseSlug:course,roundId:current.id,questionId:fresh,response:"Denied foreign write",expectedRevision:1});assert.equal(foreign.status,404);
 const other=await request(b,"/api/course-reflections?courseSlug="+course);assert.equal(other.status,200);assert(!other.body.rounds.some(r=>r.id===current.id||r.id===archive.id));
 const anonymous=await request(null,"/api/course-reflections?courseSlug="+course);assert.equal(anonymous.body.signedIn,false);assert.deepEqual(anonymous.body.rounds,[]);assert.deepEqual(anonymous.body.entries,[]);assert.equal((await request(null,"/api/course-reflections",{action:"save",courseSlug:course,roundId:current.id,questionId:fresh,response:"Denied anonymous write",expectedRevision:1})).status,401);
 const ordinary=await request(a,"/api/course-progress?courseSlug="+course);assert.equal(ordinary.status,200);assert(!ordinary.body.reviewAllLessons);
 const invalid=await request(null,"/api/course-progress?"+new URLSearchParams({courseSlug:course,review:"new",key:"invalid-owner-token"}));assert.equal(invalid.status,401);
 const ownerUrl="/api/course-progress?"+new URLSearchParams({courseSlug:course,review:"new",key:cfg.review_token});
 const ownerBefore=await request(null,ownerUrl);assert.equal(ownerBefore.status,200);assert.equal(ownerBefore.body.reviewAllLessons,true);const ownerAfter=await request(null,ownerUrl);assert.deepEqual(ownerAfter.body,ownerBefore.body);
 fs.writeFileSync("tmp/four-sections-legacy-results.json",JSON.stringify({base,currentMetadataExtended:true,retiredKeysRetained:true,archivedRoundByteEquivalent:true,allOriginalEntriesByteEquivalent:true,newStageActualSave:true,foreignDenial:true,anonymousDenial:true,ordinaryCannotFreeReview:true,invalidOwnerDenial:true,realOwnerReadAccessNoProgressMutation:true},null,2));
 console.log("PASS real current-only metadata upgrade; archived snapshot and all original entries unchanged; additive stage save; foreign/anonymous/invalid-owner denial; ordinary gates and owner progress preserved");
}finally{for(const u of users)ok(await db.auth.admin.deleteUser(u.id));console.log("Isolated legacy QA users, rounds and entries removed")}

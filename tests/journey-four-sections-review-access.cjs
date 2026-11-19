const assert=require("node:assert/strict"),load=require("../scripts/fruitlife-test-load.cjs");
let sandbox=true,testState=null,hookCount=0,writes=[];
process.env.DYDD_REVIEW_TOKEN="unit-test-owner-review-key";
const saved={completed:{"discover-your-divine-design":[]},awards:[]},before=JSON.stringify(saved);
const bucket={download:async()=>({data:new Blob([JSON.stringify(saved)]),error:null}),upload:async(path)=>{writes.push(path);return {error:null}},remove:async()=>({error:null})};
const mocks={
 "react":{useState:initial=>[hookCount++===0?testState:initial,()=>{}],useEffect:()=>{},useRef:value=>({current:value}),useCallback:value=>value},
 "@/lib/environment":{isSandbox:()=>sandbox},
 "@/lib/review/heather":{isNewReviewRequest:p=>p?.review==="new"&&p.key===process.env.DYDD_REVIEW_TOKEN},
 "@/lib/supabase/admin":{createSupabaseAdminClient:()=>({storage:{from:()=>bucket}})},
 "@/lib/assessments/report-storage":{reportBucket:"qa-private"},
 "@/lib/reflections/preview":{previewReflectionData:async()=>{throw Error("No reflection write expected")}},
};
const {useCourseProgress}=load("components/course-progress.tsx",mocks);
const invoke=state=>{testState=state;hookCount=0;return useCourseProgress("discover-your-divine-design",["one","two","three"])};
let p=invoke({completed:[],awards:[],legacyComplete:false,complete:false,signedIn:true,reviewAllLessons:true});
assert(p.canVisit("three"));assert(!p.canComplete("three"));assert(p.canComplete("one"));assert(!p.canVisit("unknown"));
p=invoke({completed:[],awards:[],legacyComplete:false,complete:false,signedIn:true});
assert(!p.canVisit("three"));assert(!p.canComplete("three"));assert(p.canVisit("one"));
p=invoke({completed:["one"],awards:[],legacyComplete:false,complete:false,signedIn:true});
assert(p.canVisit("two"));assert(!p.canVisit("three"));
const {previewProgressRequest}=load("lib/passport/preview.ts",mocks);
(async()=>{
 const get=async(params,course="discover-your-divine-design")=>(await previewProgressRequest(new Request("http://localhost/api/course-progress?courseSlug="+course),params)).json();
 const owner={review:"new",key:process.env.DYDD_REVIEW_TOKEN};
 let response=await get(owner);assert.equal(response.reviewAllLessons,true);assert.deepEqual(response.completed,[]);assert.deepEqual(response.awards,[]);assert.equal(response.complete,false);
 assert.equal((await get({review:"heather",key:owner.key})).reviewAllLessons,false);
 assert.equal((await get({review:"new",key:"wrong"})).reviewAllLessons,false);
 assert.equal((await get(owner,"designid-foundations")).reviewAllLessons,false);
 sandbox=false;assert.equal((await get(owner)).reviewAllLessons,false);sandbox=true;
 assert.equal(writes.length,0,"Read-only access never rewrites saved progress");
 const outline=load("lib/journey/dydd-course-outline.ts",mocks).dyddMainCourseOutline;
 const last=outline.at(-1).units.at(-1).slug;
 const post=await previewProgressRequest(new Request("http://localhost/api/course-progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({courseSlug:"discover-your-divine-design",action:"complete-lesson",lessonSlug:last})}),owner);
 assert.equal(post.status,409,"Owner review cannot fabricate out-of-sequence completion");
 assert.equal(writes.filter(path=>!path.endsWith(".lock")).length,0);
 assert.equal(JSON.stringify(saved),before);
 console.log("PASS owner-only sandbox Journey read access; no fake completion/awards; learner/other-persona/invalid-token/non-sandbox denial; unchanged sequential completion");
})().catch(e=>{console.error(e);process.exitCode=1});

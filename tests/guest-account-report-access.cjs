const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let user={id:'linked-owner',email:'owner@example.test',email_confirmed_at:'2026-11-12'},signed=0,badPath=false;
const result={id,pdf:{},session_id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'};
const mocks={
 'next/server':{NextResponse:class extends Response {static redirect(url,opts){return new this(null,{status:opts.status,headers:{...opts.headers,Location:url}})}}},
 '@/lib/public-assessments/guest-account':{verifiedGuestAccountUser:async()=>{if(!user?.email_confirmed_at||user.is_anonymous)throw Error('Denied');return user},getAccountGuestResult:async uid=>{if(uid!=='linked-owner')throw Error('Denied');return result}},
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},
 '@/lib/supabase/admin':{createSupabaseAdminClient:()=>({from(){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:{session_id:result.session_id},error:null})};return q}})},
 '@/lib/admin-access':{isDyddAdminEmail:email=>email==='owner@example.test'},
 '@/lib/owner-preview':{isOwnerPreviewRequest:()=>false},
 '@/lib/public-assessments/guest':{ownedGuestResult:async()=>result},
 '@/lib/public-assessments/guest-reports':{guestStoredReport:()=>({bucket:'assessment-report-pdfs',path:badPath?'guest/foreign/report.pdf':`guest/${id}/report.pdf`,filename:'Report.pdf'})},
 '@/lib/assessments/report-storage':{storedReportUrl:async()=>{signed++;return'https://storage.example.test/private-signed'}},
};
const account=load('app/assessments/account/report/[resultId]/route.ts',mocks);
const owner=load('app/command-center/guest-report/[resultId]/route.ts',mocks);
(async()=>{
 const context={params:Promise.resolve({resultId:id})};
 for(const u of [null,{id:'unverified',email:'owner@example.test'},{id:'anonymous',email:'owner@example.test',email_confirmed_at:'2026-11-12',is_anonymous:true},{id:'wrong-account',email:'same-contact@example.test',email_confirmed_at:'2026-11-12'}]){
  user=u;assert.equal((await account.GET(new Request('https://app.test/assessments/account/report/'+id),context)).status,403);
  assert.equal((await owner.GET(new Request('https://app.test/command-center/guest-report/'+id),context)).status,403);
 }
 assert.equal(signed,0);
 user={id:'linked-owner',email:'owner@example.test',email_confirmed_at:'2026-11-12'};
 const response=await account.GET(new Request('https://app.test/assessments/account/report/'+id),context);
 assert.equal(response.status,303);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('referrer-policy'),'no-referrer');assert.equal(response.headers.get('location'),'https://storage.example.test/private-signed');
 assert.equal((await owner.GET(new Request('https://app.test/command-center/guest-report/'+id),context)).status,303);assert.equal(signed,2);
 badPath=true;assert.equal((await account.GET(new Request('https://app.test/assessments/account/report/'+id),context)).status,403);assert.equal((await owner.GET(new Request('https://app.test/command-center/guest-report/'+id),context)).status,403);assert.equal(signed,2);
 console.log('PASS report routes deny signed-out/unverified/anonymous/wrong-account, independently enforce verified admin, sign only exact private guest artifact, send no-store/no-referrer');
})().catch(e=>{console.error(e);process.exitCode=1});

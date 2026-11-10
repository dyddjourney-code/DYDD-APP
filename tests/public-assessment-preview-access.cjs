const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF='atemrshtshxoqnuevvqu';process.env.NEXT_PUBLIC_SUPABASE_URL='https://atemrshtshxoqnuevvqu.supabase.co';
let expired=true,owned=true,rendered=0;
const mocks={
 '@/lib/supabase/server':{createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user:{id:'synthetic',email:'synthetic@example.invalid',email_confirmed_at:'2026-01-01'}},error:null})}})},
 '@/lib/assessments/artifact-access':{getOwnedArtifactSnapshot:async()=>owned?{id:'11111111-1111-4111-8111-111111111111',assessment_type:'designid'}:null},
 '@/lib/commerce/account-artifact-access':{membershipArtifactExpired:async()=>expired},
 '@/lib/commerce/account-access':{personalRenewalPath:next=>'/renew?'+new URLSearchParams({next})},
 '@/lib/public-assessments/report-preview':{renderSavedReportPreview:async()=>{rendered++;return '<html>Source preview</html>';},reportPreviewHeaders:{'Cache-Control':'private, no-store'}}
};
const route=load('app/assessments/report/[snapshotId]/route.ts',mocks);const request=new Request('https://sandbox.invalid/assessments/report/11111111-1111-4111-8111-111111111111');const context={params:Promise.resolve({snapshotId:'11111111-1111-4111-8111-111111111111'})};
(async()=>{let r=await route.GET(request,context);assert.equal(r.status,303);assert(new URL(r.headers.get('location')).pathname==='/renew');assert.equal(rendered,0);expired=false;r=await route.GET(request,context);assert.equal(r.status,200);assert.equal(rendered,1);owned=false;r=await route.GET(request,context);assert.equal(r.status,404);assert.equal(rendered,1);console.log('PASS preview respects exact membership artifact decision; owned standalone/active access renders; foreign ownership404.');})().catch(e=>{console.error(e);process.exitCode=1;});

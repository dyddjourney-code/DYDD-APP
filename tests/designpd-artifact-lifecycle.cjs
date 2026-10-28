const assert = require('node:assert/strict');
const { NextRequest } = require('next/server');
const load = require('../scripts/fruitlife-test-load.cjs');
const id = '30b94575-0015-4793-a73a-41bec9ff189a';
let user = null, queries = 0;
let snapshot = { id, user_id: 'owner', participant_id: 'participant', assessment_type: 'designpd',
  created_at: '2026-10-28T12:00:00Z', scores: { reportArtifact: { path: `designpd/${id}/report.pdf` } } };
let participant = { id: 'participant', user_id: 'owner', normalized_email: 'owner@example.invalid' };
const noWrite = () => { throw Error('Read authorization must not write data'); };
const admin = () => ({ from(table) {
  const filters = {};
  return { select() { return this; }, eq(k,v) { filters[k]=v; return this; },
    update:noWrite, insert:noWrite, upsert:noWrite,
    async maybeSingle() {
      queries++;
      if (table === 'assessment_snapshots') {
        assert.deepEqual(filters, {id}, 'bounded ID lookup; no row-capped list query');
        return { data: snapshot };
      }
      assert.equal(table,'assessment_participants');
      assert.deepEqual(filters,{id:'participant'});
      return {data:participant};
    }
  };
}});
const mocks = {
  '@/lib/supabase/admin': { createSupabaseAdminClient:admin },
  '@/lib/supabase/server': { createSupabaseServerClient:async()=>({auth:{getUser:async()=>({data:{user}})}}) },
  '@/lib/review/heather': { isHeatherReviewRequest:()=>false,isNewReviewRequest:()=>false },
  '@/lib/owner-preview': {isOwnerPreviewRequest:()=>false},
  '@/lib/assessments/student-context': { assessmentLabels:{designpd:'DesignPD'}, displayDate:()=>'', snapshotHighlights:()=>[] },
  '@/lib/assessments/report-storage': { storedReportUrl:async()=> 'https://storage.invalid/signed.pdf' },
};
const route = load('app/api/artifacts/[snapshotId]/download/route.ts',mocks);
const legacy = load('app/designpd/report/route.ts',mocks);
const req = (query='')=>new NextRequest(`https://school.invalid/api/artifacts/${id}/download${query}`);
const get = (query='')=>route.GET(req(query),{params:Promise.resolve({snapshotId:id})});
const loginNext = response => new URL(response.headers.get('location')).searchParams.get('next');
(async()=>{
  let r=await get('?download=1');
  assert.equal(r.status,303);
  assert.equal(loginNext(r),`/api/artifacts/${id}/download?download=1`);
  assert.equal(queries,0,'anonymous email click neither reads private data nor returns missing-artifact');
  assert.equal(r.headers.get('cache-control'),'private, no-store');
  r=await legacy.GET(new NextRequest(`https://school.invalid/designpd/report?snapshot=${id}`));
  assert.equal(r.status,303,'existing emailed DesignPD locator survives a fresh session');
  const returnTo=loginNext(r);
  assert.equal(returnTo,`/api/artifacts/${id}/download`);
  user={id:'owner',email:'owner@example.invalid'};
  r=await route.GET(new NextRequest('https://school.invalid'+returnTo),{params:Promise.resolve({snapshotId:id})});
  assert.equal(r.status,307,'same owner resumes directly to durable PDF after login');
  assert.equal(r.headers.get('location'),'https://storage.invalid/signed.pdf');
  user={id:'foreign',email:'owner@example.invalid'};
  assert.equal((await get()).status,404,'matching email cannot override explicit foreign snapshot ownership');
  snapshot.user_id=null;
  assert.equal((await get()).status,404,'matching email cannot override participant ownership');
  user.id='owner'; user.email='changed@example.invalid';
  assert.equal((await get()).status,307,'participant ownership survives account email change');
  participant.user_id=null;
  assert.equal((await get()).status,404);
  user.email='OWNER@example.invalid';
  assert.equal((await get()).status,307,'exact normalized address permits unclaimed legacy result without claiming it');
  participant.normalized_email='owner+legacy@example.invalid';
  assert.equal((await get()).status,404,'delivery aliases are not ownership');
  snapshot.user_id='owner'; snapshot.participant_id=null;
  assert.equal((await get()).status,307,'native snapshot ownership is sufficient even without participant linkage');
  snapshot=null;
  assert.equal((await get()).status,404,'missing ID remains indistinguishable from denied ID');
  user=null;
  r=await route.POST(new NextRequest(req().url,{method:'POST',headers:{origin:'https://evil.invalid'}}),{params:Promise.resolve({snapshotId:id})});
  assert.equal(r.status,403,'cross-origin POST denied before authentication');
  r=await route.POST(new NextRequest(req().url,{method:'POST'}),{params:Promise.resolve({snapshotId:id})});
  assert.equal(r.status,303,'expired recovery session signs in then returns via safe GET');
  console.log('PASS DesignPD emailed locator, sign-in return, bounded direct lookup, owner/legacy/foreign/missing boundaries, read-only access, origin checks');
})().catch(e=>{ console.error(e);process.exitCode=1; });

const assert = require('node:assert/strict');
const {NextRequest, NextResponse} = require('next/server');
const load = require('../scripts/fruitlife-test-load.cjs');
let user = null, resolverStatus = 404, resolvedRequest, authReads = 0, sent;
const route = load('app/designid/report/route.ts', {
  '@/lib/supabase/server': {createSupabaseServerClient: async () => ({auth: {getUser: async () => {authReads++; return {data: {user}};}}})},
  '@/app/api/artifacts/[snapshotId]/download/route': {GET: async (request, context) => {
    resolvedRequest = {url: request.nextUrl, headers: request.headers, params: await context.params};
    return resolverStatus === 307 ? NextResponse.redirect('https://storage.test/private.pdf') : NextResponse.json({error: 'Artifact not found.'}, {status: resolverStatus});
  }},
});
const reporting = load('lib/assessment-reporting.ts', {
  '@/lib/lifecycle/application-mail': {sendApplicationEmail: async input => {sent = input; return {sent:true};}},
});
(async () => {
  const url = 'https://school.test/designid/report?snapshot=owned-snapshot&download=1';
  let response = await route.GET(new NextRequest(url));
  assert.equal(response.status, 307);
  const destination = new URL(response.headers.get('location'));
  assert.equal(destination.pathname, '/login');
  assert.equal(destination.origin, 'https://school.test');
  assert.equal(destination.searchParams.get('next'), '/designid/report?snapshot=owned-snapshot&download=1');
  assert.match(destination.searchParams.get('message'), /account that completed DesignID/);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(resolvedRequest.url.pathname, '/api/artifacts/owned-snapshot/download');
  assert.equal(resolvedRequest.url.searchParams.has('snapshot'), false);
  assert.equal(resolvedRequest.url.searchParams.get('download'), '1');
  assert.equal(resolvedRequest.params.snapshotId, 'owned-snapshot');
  user = {id: 'different-account'};
  response = await route.GET(new NextRequest(url));
  assert.equal(response.status, 404, 'Signed-in foreign accounts remain denied');
  assert.equal(response.headers.get('location'), null);
  resolverStatus = 307;
  const before = authReads;
  response = await route.GET(new NextRequest(url, {headers: {cookie: 'fixture=existing-session'}}));
  assert.equal(response.headers.get('location'), 'https://storage.test/private.pdf');
  assert.equal(authReads, before, 'Owned PDF/preview responses pass through without a second auth query');
  assert.equal(resolvedRequest.headers.get('cookie'), 'fixture=existing-session');
  response = await route.GET(new NextRequest('https://school.test/designid/report'));
  assert.equal(response.status, 404, 'Missing snapshot does not redirect');
  resolverStatus = 200;
  assert.equal((await route.GET(new NextRequest(url))).status, 200, 'Existing recovery/snapshot responses pass through');
  resolverStatus = 502;
  assert.equal((await route.GET(new NextRequest(url))).status, 502, 'Provider failures are not misrepresented as login failures');
  await reporting.sendAssessmentReportEmail({assessmentName: 'DesignID', participantEmail: 'learner@example.invalid', participantName: 'Learner', reportUrl: url});
  assert.match(sent.text, /same account you used to complete DesignID/);
  assert.match(sent.html, /same account you used to complete DesignID/);
  assert.match(sent.text, /Field Kit/);
  assert.equal(sent.deliveryContext.reportUrl, url);
  assert.equal(sent.subject, 'Your DesignID report is ready');
  const eventKey = sent.idempotencyKey;
  await reporting.sendAssessmentReportEmail({assessmentName: 'DesignID', participantEmail: 'learner@example.invalid', participantName: 'Learner', reportUrl: url});
  assert.equal(sent.idempotencyKey, eventKey, 'Existing delivery identity remains stable; no resend introduced');
  await reporting.sendAssessmentReportEmail({assessmentName: 'DesignPD', participantEmail: 'learner@example.invalid', participantName: 'Learner', reportUrl: url});
  assert(!sent.text.includes('same account you used to complete DesignID'));
  console.log('PASS DesignID issued email links resume through login, preserve exact target and cookies, deny foreign accounts, pass through PDFs/recovery/errors, and explain private account access without sending mail.');
})().catch(error => {console.error(error);process.exitCode=1;});

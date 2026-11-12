const assert=require('node:assert/strict'),load=require('../scripts/fruitlife-test-load.cjs');
const {appOrigin,isDeliveryAppOrigin,canonicalAppOrigin,legacyAppOrigin}=load('lib/app-origin.ts');
(async()=>{
 delete process.env.DYDD_APP_URL;process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';assert.equal(appOrigin(),legacyAppOrigin);
 process.env.DYDD_APP_URL=canonicalAppOrigin;assert.equal(appOrigin(),canonicalAppOrigin);assert(isDeliveryAppOrigin(new URL(legacyAppOrigin+'/assessments/recover')));
 for(const origin of ['https://attacker.invalid','https://app.discoverdivine.design.attacker.invalid','http://app.discoverdivine.design','https://dydd-online-school-sandbox.vercel.app','https://user@dydd-online-school.vercel.app'])assert(!isDeliveryAppOrigin(new URL(origin)),origin);
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';assert(!isDeliveryAppOrigin(new URL(legacyAppOrigin)));
 process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='production';process.env.DYDD_GUEST_EMAIL_ENABLED='true';
 const sid='11111111-1111-4111-8111-111111111111',rid='22222222-2222-4222-8222-222222222222';let verified=0;
 const {guestReportDeliveryEligibility}=load('lib/public-assessments/guest-delivery.ts',{'./guest':{verifyGuestCapability:async()=>{verified++;return {participant_email:'fixture@example.invalid'}},ownedGuestResult:async()=>({id:rid,report_state:'ready',pdf:{storage:{bucket:'assessment-report-pdfs',path:`guest/${rid}/report.pdf`}}}),GuestAccessDeniedError:class extends Error{}}});
 for(const origin of [legacyAppOrigin,canonicalAppOrigin]){
 const reportUrl=origin+`/assessments/recover?session=${sid}&key=${'A'.repeat(43)}&report=${rid}`;
 assert.deepEqual(await guestReportDeliveryEligibility({email:'fixture@example.invalid',context:{deliveryContext:{reportUrl,guestSessionId:sid,guestResultId:rid}}}),{});
 }
 assert.equal(verified,2);
 for(const value of ['http://app.discoverdivine.design','https://u:p@app.discoverdivine.design','https://app.discoverdivine.design/path','https://app.discoverdivine.design?x=1']){process.env.DYDD_APP_URL=value;assert.throws(appOrigin);}
 console.log('PASS: staged fallback, strict HTTPS, both historical/current queued report origins with capability/recipient/archive verification, sandbox and hostname spoofing denied. No provider/database calls.');
})().catch(e=>{console.error(e);process.exitCode=1});

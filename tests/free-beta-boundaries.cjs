const assert=require('node:assert/strict');
const load=require('../scripts/fruitlife-test-load.cjs');
process.env.DYDD_REVIEW_TOKEN='qa-not-a-real-token';
delete process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT;
const owner=load('lib/owner-preview.ts'),review=load('lib/review/heather.ts'),env=load('lib/environment.ts');
for(const kind of ['owner','new','heather']) {
 const params={review:kind,key:process.env.DYDD_REVIEW_TOKEN};
 assert.equal(owner.isOwnerPreviewRequest(params),false);
 assert.equal(review.isReviewRequest(params),false);
}
assert.equal(env.isFreeBeta(),true);
assert.throws(()=>load('lib/commerce/stripe.ts').getStripeClient(),/disabled/);
process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT='sandbox';
assert.equal(env.isFreeBeta(),false);
assert(owner.isOwnerPreviewRequest({review:'owner',key:process.env.DYDD_REVIEW_TOKEN}));
assert(review.isNewReviewRequest({review:'new',key:process.env.DYDD_REVIEW_TOKEN}));
console.log('PASS stable rejects all review credentials, payments blocked; sandbox owner review remains isolated.');

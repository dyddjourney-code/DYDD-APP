const assert=require('node:assert/strict'),crypto=require('node:crypto');
const load=require('../scripts/fruitlife-test-load.cjs');
const {verifyEmailWebhook}=load('lib/email/webhook-signature.ts');
const secret='whsec_'+crypto.randomBytes(32).toString('base64'),raw='{"type":"email.delivered"}',id='evt-test',timestamp=String(Math.floor(Date.now()/1000));
const signature=crypto.createHmac('sha256',Buffer.from(secret.slice(6),'base64')).update(`${id}.${timestamp}.${raw}`).digest('base64');
const h=new Headers({'svix-id':id,'svix-timestamp':timestamp,'svix-signature':'v1,'+signature});
assert(verifyEmailWebhook(raw,h,secret));assert(!verifyEmailWebhook(raw+' ',h,secret));assert(!verifyEmailWebhook(raw,h,'whsec_'+crypto.randomBytes(32).toString('base64')));assert(!verifyEmailWebhook(raw,h,secret,Date.now()+301000));assert(!verifyEmailWebhook(raw,new Headers(),secret));
h.set('svix-signature','v2,bogus v1,'+signature);assert(verifyEmailWebhook(raw,h,secret));
console.log('PASS authentic signatures, key rotation candidates, modified bytes, wrong secret, missing headers, expired replay');

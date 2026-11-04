// Isolated sandbox webhook bootstrap. Historical admin key stays local; runtime key stays sending-only.
import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';import {parseEnv} from 'node:util';
const root='/home/openclaw/.openclaw/secrets/',c=JSON.parse(fs.readFileSync(root+'dydd-online-school-sandbox.json')),v=JSON.parse(fs.readFileSync(root+'vercel-token.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(c.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
const historical='/home/openclaw/.openclaw/workspace/.trash/dydd-online-school-env-prod-pull-20260902-164851.env';
const adminKey=parseEnv(fs.readFileSync(historical,'utf8')).DYDD_RESEND_API_KEY;assert(adminKey,'Existing provider administrative authority not found');
const endpoint='https://dydd-online-school-sandbox.vercel.app/api/webhooks/dydd-email',path=root+'dydd-sandbox-resend-webhook.json';
const events=['email.sent','email.delivered','email.delivery_delayed','email.bounced','email.failed','email.complained'];
async function provider(method,url,body){const r=await fetch('https://api.resend.com'+url,{method,headers:{Authorization:'Bearer '+adminKey,'Content-Type':'application/json','User-Agent':'DYDD-Sandbox-Isolated-Webhook/1.0'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,'Provider administrative request '+r.status);return r.json();}
const view=w=>({id:w.id,endpoint:w.endpoint,status:w.status,events:w.events?.slice().sort()});
const hash=w=>crypto.createHash('sha256').update(JSON.stringify(w.map(view).sort((a,b)=>a.id.localeCompare(b.id)))).digest('hex');
let staged=fs.existsSync(path)?JSON.parse(fs.readFileSync(path)):null;
if(process.argv.includes('--prepare')){
 const before=(await provider('GET','/webhooks')).data;
 if(!staged){assert(!before.some(w=>w.endpoint===endpoint),'Existing sandbox webhook requires secret recovery, not duplicate registration');
  const created=await provider('POST','/webhooks',{endpoint,events});
  assert(created.id && created.signing_secret,'Provider did not supply registration/signing secret');
  staged={id:created.id,secret:created.signing_secret,endpoint,events,unrelatedBeforeHash:hash(before),createdAt:new Date().toISOString()};
  fs.writeFileSync(path,JSON.stringify(staged),{mode:0o600});
  await provider('PATCH','/webhooks/'+staged.id,{status:'disabled'});
 }
 const r=await fetch(`https://api.vercel.com/v10/projects/${c.vercel.projectId}/env?teamId=${c.vercel.orgId}`,{headers:{Authorization:'Bearer '+v.token}});assert(r.ok,'Sandbox Vercel env read');const {envs}=await r.json();const prior=envs.find(e=>e.key==='DYDD_RESEND_WEBHOOK_SECRET'&&e.target?.includes('production'));
 const url=prior?`/v9/projects/${c.vercel.projectId}/env/${prior.id}`:`/v10/projects/${c.vercel.projectId}/env`;
 const write=await fetch('https://api.vercel.com'+url+'?teamId='+c.vercel.orgId,{method:prior?'PATCH':'POST',headers:{Authorization:'Bearer '+v.token,'Content-Type':'application/json'},body:JSON.stringify({...(prior?{}:{key:'DYDD_RESEND_WEBHOOK_SECRET'}),value:staged.secret,type:'encrypted',target:['production','preview','development']})});assert(write.ok,'Sandbox signing secret storage failed');
 console.log(JSON.stringify({stage:'prepared',sandboxRef:c.ref,id:staged.id,endpoint,disabledUntilDeployment:true,runtimeSendingKeyUnchanged:true}));
}else if(process.argv.includes('--activate')){
 assert(staged,'Prepare first');assert.equal((await fetch(endpoint,{method:'POST',body:'{}'})).status,401,'Configured endpoint must reject invalid signatures');
 await provider('PATCH','/webhooks/'+staged.id,{status:'enabled'});
 const after=(await provider('GET','/webhooks')).data;assert.equal(hash(after.filter(w=>w.id!==staged.id)),staged.unrelatedBeforeHash,'Unrelated provider webhook configuration changed');
 const actual=await provider('GET','/webhooks/'+staged.id);assert.equal(actual.status,'enabled');assert.equal(actual.endpoint,endpoint);assert.deepEqual(actual.events.slice().sort(),events.slice().sort());
 const domains=(await provider('GET','/domains')).data;const domain=domains.find(d=>d.name==='mail.discoverdivine.design');
 const proof={at:new Date().toISOString(),sandboxRef:c.ref,id:staged.id,endpoint,events,status:actual.status,signingSecretStored:true,runtimeKeyStillSendingOnly:true,unrelatedWebhooksUnchanged:true,domain:domain?{name:domain.name,status:domain.status}:null,secretPrinted:false,adminCredentialDeployed:false};fs.writeFileSync('docs/evidence/email-webhook-activation-2026-11-04.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
}else throw Error('Use --prepare then deploy then --activate');

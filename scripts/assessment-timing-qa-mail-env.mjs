// Explicit temporary QA allowlist only; restore before final release. No sends or cron changes.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {credentials as c} from './assessment-timing-sandbox-db.mjs';
const v=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json'));
const staged=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-sandbox-email.json'));
assert.deepEqual(staged.allowlist,['dyddjourney@gmail.com']);
const qa=process.argv.includes('--qa'),restore=process.argv.includes('--restore');assert(qa!==restore,'Choose --qa or --restore');
const sinks=['delivered+dydd-timing-approval@resend.dev','delivered+dydd-timing-decline@resend.dev'];
async function api(method,path,body){const r=await fetch('https://api.vercel.com'+path+'?teamId='+c.vercel.orgId,{method,headers:{Authorization:'Bearer '+v.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,'Isolated Vercel env '+r.status);return r.json();}
const {envs}=await api('GET','/v10/projects/'+c.vercel.projectId+'/env');
const prior=envs.find(e=>e.key==='DYDD_SANDBOX_EMAIL_ALLOWLIST'&&e.target?.includes('production'));assert(prior,'Existing exact allowlist required');
const backup='/home/openclaw/.openclaw/secrets/dydd-assessment-timing-allowlist-before.json';if(qa&&!fs.existsSync(backup))fs.writeFileSync(backup,JSON.stringify({at:new Date().toISOString(),projectId:c.vercel.projectId,environment:prior,originalAllowlist:staged.allowlist}),{mode:0o600});
const allowed=qa?[...staged.allowlist,...sinks]:staged.allowlist;
await api('PATCH',`/v9/projects/${c.vercel.projectId}/env/${prior.id}`,{value:allowed.join(','),type:'encrypted',target:prior.target});
const proof={at:new Date().toISOString(),projectId:c.vercel.projectId,ref:c.ref,mode:qa?'temporary controlled QA':'restored original owner-only',recipientCount:allowed.length,recipientPolicy:qa?'one designated owner plus two Resend controlled QA sinks':'existing designated owner only',envId:prior.id,targets:prior.target,requiresRedeploy:true,otherEnvironmentChanges:0,providerSends:0,productionMutations:0};
fs.writeFileSync('tmp/assessment-timing/mail-env-'+(qa?'qa':'restored')+'.json',JSON.stringify(proof,null,2));console.log(proof);

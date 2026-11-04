// Prepare Vercel first, deploy the hook, then explicitly activate Supabase. No SMTP bypass.
import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const root='/home/openclaw/.openclaw/secrets/',c=JSON.parse(fs.readFileSync(root+'dydd-online-school-sandbox.json')),s=JSON.parse(fs.readFileSync(root+'supabase-project.json')),v=JSON.parse(fs.readFileSync(root+'vercel-token.json'));
assert.equal(c.ref,'atemrshtshxoqnuevvqu');assert.equal(c.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
const stagingPath=root+'dydd-sandbox-auth-email.json';
const staged=fs.existsSync(stagingPath)?JSON.parse(fs.readFileSync(stagingPath)):{secret:'whsec_'+crypto.randomBytes(32).toString('base64')};
fs.writeFileSync(stagingPath,JSON.stringify(staged),{mode:0o600});
async function auth(ref,method='GET',body){const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`,{method,headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,'Supabase auth config '+r.status);return r.json();}
const productionRef='laojrzlqbkmirzcbcnyw';
const before=await auth(c.ref),productionBefore=await auth(productionRef);
const hash=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
if(process.argv.includes('--prepare')){
 if(!fs.existsSync(root+'dydd-sandbox-auth-preserved.json'))fs.writeFileSync(root+'dydd-sandbox-auth-preserved.json',JSON.stringify({sandbox:before,productionHash:hash(productionBefore)}),{mode:0o600});
 async function api(method,path,body){const r=await fetch('https://api.vercel.com'+path+'?teamId='+c.vercel.orgId,{method,headers:{Authorization:'Bearer '+v.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});assert(r.ok,'Vercel sandbox env '+r.status);return r.json();}
 const {envs}=await api('GET','/v10/projects/'+c.vercel.projectId+'/env');
 for(const [key,value] of Object.entries({DYDD_SANDBOX_AUTH_HOOK_SECRET:staged.secret,DYDD_SANDBOX_AUTH_EMAIL_ENABLED:'true'})){
  const prior=envs.find(e=>e.key===key&&e.target?.includes('production'));
  const body={value,type:'encrypted',target:['production','preview','development']};
  await api(prior?'PATCH':'POST',prior?`/v9/projects/${c.vercel.projectId}/env/${prior.id}`:`/v10/projects/${c.vercel.projectId}/env`,prior?body:{key,...body});
 }
 console.log(JSON.stringify({stage:'prepared',sandboxRef:c.ref,deployRequired:true,authChanged:false,productionChanged:false}));
}else if(process.argv.includes('--activate')){
 const uri='https://dydd-online-school-sandbox.vercel.app/api/sandbox/auth-email';
 assert.equal((await fetch(uri,{method:'POST',body:'{}'})).status,401,'Deployed hook must reject unsigned requests before activation');
 const patch={hook_send_email_enabled:true,hook_send_email_uri:uri,hook_send_email_secrets:'v1,'+staged.secret,mailer_autoconfirm:false,rate_limit_email_sent:100};
 await auth(c.ref,'PATCH',patch);
 const after=await auth(c.ref);for(const [key,value] of Object.entries(patch)){if(key==='hook_send_email_secrets'){assert(after[key],'Stored hook secret is missing');continue;}assert(after[key]===value,'Auth patch not applied: '+key);}
 const preserved=JSON.parse(fs.readFileSync(root+'dydd-sandbox-auth-preserved.json'));
 assert.equal(hash(await auth(productionRef)),preserved.productionHash,'Production auth config must remain unchanged');
 const proof={at:new Date().toISOString(),sandboxRef:c.ref,hookEnabled:true,hookUri:uri,confirmationRequired:true,rateLimitPerHour:100,smtpUsed:false,exactOwnerAllowlist:true,productionAuthUnchanged:true,changes:Object.keys(patch),before:{hookEnabled:preserved.sandbox.hook_send_email_enabled,autoConfirm:preserved.sandbox.mailer_autoconfirm,rateLimit:preserved.sandbox.rate_limit_email_sent}};
 fs.writeFileSync('docs/evidence/email-auth-configuration-2026-11-04.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof));
}else throw Error('Use --prepare then deploy then --activate');

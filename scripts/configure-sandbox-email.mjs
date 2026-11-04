// Explicit sandbox-only controlled delivery. Does not touch production, subscribers or existing queues.
import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const v=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json'));
const staged=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-sandbox-email.json'));
if(c.ref!=='atemrshtshxoqnuevvqu'||c.vercel.projectId!=='prj_5EC6sfJe9DpGYW59L94iwppeMYUg'||c.vercel.projectName!=='dydd-online-school-sandbox')throw Error('Sandbox target mismatch');
if(staged.allowlist.length!==1||staged.allowlist[0]!=='dyddjourney@gmail.com')throw Error('Controlled recipient mismatch');
async function api(method,path,body){const r=await fetch('https://api.vercel.com'+path+'?teamId='+c.vercel.orgId,{method,headers:{Authorization:'Bearer '+v.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Sandbox env '+r.status);return r.json();}
const {envs}=await api('GET','/v10/projects/'+c.vercel.projectId+'/env');
const activatedAt=staged.activatedAt||new Date().toISOString();
const entries={DYDD_RESEND_API_KEY:staged.apiKey,DYDD_EMAIL_FROM:staged.from,DYDD_SANDBOX_EMAIL_ENABLED:'true',DYDD_SANDBOX_EMAIL_ALLOWLIST:staged.allowlist.join(','),DYDD_SANDBOX_EMAIL_ACTIVATED_AT:activatedAt};
for(const [key,value] of Object.entries(entries)){
 const prior=envs.find(e=>e.key===key&&e.target?.includes('production'));
 if(prior)await api('PATCH',`/v9/projects/${c.vercel.projectId}/env/${prior.id}`,{value,type:'encrypted',target:['production','preview','development']});
 else await api('POST',`/v10/projects/${c.vercel.projectId}/env`,{key,value,type:'encrypted',target:['production','preview','development']});
}
fs.writeFileSync('/home/openclaw/.openclaw/secrets/dydd-sandbox-email.json',JSON.stringify({...staged,activatedAt}),{mode:0o600});
console.log(JSON.stringify({project:c.vercel.projectName,ref:c.ref,activatedAt,controlledRecipientCount:staged.allowlist.length,backlogReplay:false,requiresDeployment:true,webhookRegistered:false}));

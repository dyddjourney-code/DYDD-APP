// Explicit deploy only: this project intentionally has no automatic Git linkage.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const credentials=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
const {token}=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json','utf8'));
const project=credentials.vercel;
if(project.projectName!=='dydd-online-school-sandbox'||project.productionRef!=='sandbox'||credentials.ref==='laojrzlqbkmirzcbcnyw')throw Error('Sandbox target validation failed.');
const remote=execFileSync('git',['ls-remote','origin','refs/heads/sandbox'],{encoding:'utf8'}).trim();
const sha=remote.split(/\s/)[0];if(!/^[a-f0-9]{40}$/.test(sha))throw Error('Push the sandbox branch first.');
async function api(method,path,body){const r=await fetch(`https://api.vercel.com${path}${path.includes('?')?'&':'?'}teamId=${project.orgId}`,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Vercel '+r.status+': '+(await r.text()).slice(0,500));return r.json();}
const result=await api('POST','/v13/deployments',{name:project.projectName,project:project.projectId,target:'production',gitSource:{type:'github',repoId:'1325734457',ref:'sandbox',sha},meta:{dyddEnvironment:'sandbox',expectedCommitSha:sha}});
console.log(JSON.stringify({deployment:result.id,sha,url:result.url,state:result.readyState}));
let last='';for(let attempt=0;attempt<90;attempt++){
 const d=await api('GET','/v13/deployments/'+result.id);
 if(d.readyState!==last){console.log('Sandbox deployment '+d.readyState);last=d.readyState;}
 if(['ERROR','CANCELED'].includes(d.readyState))throw Error('Sandbox deployment '+d.readyState);
 if(d.readyState==='READY'){console.log('READY https://dydd-online-school-sandbox.vercel.app');process.exit(0);}
 await new Promise(resolve=>setTimeout(resolve,5000));
}
throw Error('Sandbox deployment timed out; inspect the recorded deployment before retrying.');

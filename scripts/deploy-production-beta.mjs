// Explicit stable deploy. Sandbox has its own project, branch and database.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const {token}=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json','utf8'));
const projectId='prj_YO15mYTp64EHk0wlg6QmBTxNeV5k',teamId='team_uVFR0iaoxW2TA9q58bZhl8XK';
const sha=execFileSync('git',['ls-remote','origin','refs/heads/master'],{encoding:'utf8'}).trim().split(/\s/)[0];
const local=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(sha)||sha!==local)throw Error('Push the reviewed release HEAD to master before deploying.');
async function api(method,path,body){const r=await fetch(`https://api.vercel.com${path}${path.includes('?')?'&':'?'}teamId=${teamId}`,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Vercel '+r.status+': '+(await r.text()).slice(0,300));return r.json();}
const project=await api('GET','/v9/projects/'+projectId);
if(project.name!=='dydd-online-school'||project.link?.productionBranch!=='master')throw Error('Production project mismatch.');
// Git webhook creation can lag the push; give it a brief opportunity before fallback.
await new Promise(resolve=>setTimeout(resolve,10000));
const listed=await api('GET','/v6/deployments?projectId='+projectId+'&target=production&limit=8');
let deployment=listed.deployments.find(d=>d.meta?.githubCommitSha===sha&&!['ERROR','CANCELED'].includes(d.readyState||d.state));
if(!deployment)deployment=await api('POST','/v13/deployments',{name:'dydd-online-school',project:projectId,target:'production',gitSource:{type:'github',repoId:'1325734457',ref:'master',sha},meta:{dyddEnvironment:'stable-free-beta',expectedCommitSha:sha}});
const id=deployment.id||deployment.uid;
fs.mkdirSync('tmp',{recursive:true});
fs.writeFileSync('tmp/production-deploy-receipt.json',JSON.stringify({id,sha,url:deployment.url},null,2));
console.log(JSON.stringify({id,sha,url:deployment.url,state:deployment.readyState||deployment.state}));
let last='';for(let n=0;n<90;n++){
 const d=await api('GET','/v13/deployments/'+id);
 if(d.readyState!==last){console.log('Production deployment '+d.readyState);last=d.readyState;}
 if(['ERROR','CANCELED'].includes(d.readyState))throw Error('Production deployment '+d.readyState);
 if(d.readyState==='READY'){
  if(d.projectId!==projectId||d.meta?.githubCommitSha!==sha)throw Error('Deployment identity mismatch.');
  const alias=await api('GET','/v4/aliases/dydd-online-school.vercel.app');
  const liveId=alias.deploymentId||alias.deployment?.id;
  const live=liveId===id?d:await api('GET','/v13/deployments/'+liveId);
  if(live.projectId!==projectId||live.meta?.githubCommitSha!==sha||live.readyState!=='READY')throw Error('Stable alias does not point to the reviewed release.');
  fs.writeFileSync('tmp/production-deploy-proof.json',JSON.stringify({id:liveId,sha,url:'https://dydd-online-school.vercel.app',deploymentUrl:'https://'+live.url,state:d.readyState,projectId,aliasVerified:true,verifiedAt:new Date().toISOString()},null,2));
  console.log('READY https://dydd-online-school.vercel.app; exact SHA/project/stable alias verified');process.exit(0);
 }
 await new Promise(resolve=>setTimeout(resolve,5000));
}
throw Error('Deployment timed out; inspect recorded ID before retrying.');

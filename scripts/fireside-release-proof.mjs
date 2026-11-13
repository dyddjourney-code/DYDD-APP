import fs from 'node:fs';
const cfg=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
const {token}=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json','utf8'));
if(cfg.ref!=='atemrshtshxoqnuevvqu'||cfg.vercel.projectId!=='prj_5EC6sfJe9DpGYW59L94iwppeMYUg')throw Error('Sandbox guard');
async function api(path){const r=await fetch('https://api.vercel.com'+path+(path.includes('?')?'&':'?')+'teamId='+cfg.vercel.orgId,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Vercel read '+r.status);return r.json();}
async function resolve(alias){const a=await api('/v4/aliases/'+alias);const d=await api('/v13/deployments/'+a.deployment.id);return {alias,deployment:d.id,url:d.url,sha:d.meta?.githubCommitSha,branch:d.meta?.githubCommitRef,project:d.projectId,state:d.readyState};}
const result={checkedAt:new Date().toISOString(),sandbox:await resolve('dydd-online-school-sandbox.vercel.app'),production:await resolve('dydd-online-school.vercel.app')};
const directory='../../outputs/fireside-event-hub-2026-11-13';fs.mkdirSync(directory,{recursive:true});const name=process.argv[2]||'before';fs.writeFileSync(directory+'/'+name+'-deployment-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));

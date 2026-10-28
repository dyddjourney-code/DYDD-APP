import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root='/home/openclaw/.openclaw/workspace/projects/';
const {token}=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json'));
const sandbox=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json')).vercel;
const cases=[{env:'production',cwd:root+'dydd-online-school-release',alias:'dydd-online-school.vercel.app',projectId:'prj_YO15mYTp64EHk0wlg6QmBTxNeV5k',teamId:'team_uVFR0iaoxW2TA9q58bZhl8XK',branch:'master'},{env:'sandbox',cwd:root+'dydd-online-school-sandbox',alias:'dydd-online-school-sandbox.vercel.app',projectId:sandbox.projectId,teamId:sandbox.orgId,branch:'sandbox'}];
const out=process.env.JOURNEY_RELEASE_OUT||'tmp/journey-circle-release';fs.mkdirSync(out,{recursive:true});
async function api(path,teamId){const r=await fetch('https://api.vercel.com'+path+(path.includes('?')?'&':'?')+'teamId='+teamId,{headers:{Authorization:'Bearer '+token}});assert(r.ok,'Vercel read-only verification '+r.status);return r.json();}
for(const c of cases){const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:c.cwd,encoding:'utf8'}).trim();const remote=execFileSync('git',['ls-remote','origin','refs/heads/'+c.branch],{cwd:c.cwd,encoding:'utf8'}).trim().split(/\s/)[0];assert.equal(remote,sha,'Pushed branch SHA');const a=await api('/v4/aliases/'+c.alias,c.teamId);const id=a.deploymentId||a.deployment?.id;assert(id);const d=await api('/v13/deployments/'+id,c.teamId);assert.equal(d.projectId,c.projectId);assert.equal(d.meta.githubCommitSha,sha);assert.equal(d.readyState,'READY');const proof={env:c.env,sha,id,projectId:c.projectId,url:'https://'+c.alias,deploymentUrl:'https://'+d.url,aliasVerified:true,state:d.readyState,verifiedAt:new Date().toISOString()};fs.writeFileSync(out+'/'+c.env+'-deployment.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));}

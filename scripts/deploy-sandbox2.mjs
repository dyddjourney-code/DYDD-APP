// Explicitly deploy Sandbox 2 only. Never reuse scripts/deploy-sandbox.mjs here.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const expectedProject = 'prj_OIFpZrQcv3uqs14PEiBD1lVngXrH';
const branch = 'sandbox2/immersive-forest-2026-11-24';
const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
if (project.projectId !== expectedProject || project.projectName !== 'dydd-online-school-sandbox-2') {
  throw Error('Refusing to deploy: this checkout is not bound to Sandbox 2.');
}
const currentBranch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
if (currentBranch !== branch) throw Error('Refusing to deploy a different branch.');
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const remote = execFileSync('git', ['ls-remote', 'origin', `refs/heads/${branch}`], { encoding: 'utf8' }).split(/\s/)[0];
if (sha !== remote) throw Error('Push this Sandbox 2 commit before deploying.');
const { token } = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json', 'utf8'));
async function api(method, path, body) {
  const response = await fetch(`https://api.vercel.com${path}${path.includes('?') ? '&' : '?'}teamId=${project.orgId}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw Error(`Vercel ${response.status}; inspect the target project before retrying.`);
  return response.json();
}
const protectedProjects = ['prj_5EC6sfJe9DpGYW59L94iwppeMYUg', 'prj_YO15mYTp64EHk0wlg6QmBTxNeV5k', 'prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq'];
const before = new Map();
for (const id of protectedProjects) {
  const p = await api('GET', `/v9/projects/${id}`);
  before.set(id, p.targets?.production?.id);
}
const deployment = await api('POST', '/v13/deployments', {
  name: project.projectName, project: expectedProject, target: 'production',
  gitSource: { type: 'github', repoId: '1325734457', ref: branch, sha },
  meta: { dyddEnvironment: 'sandbox2', expectedCommitSha: sha },
  projectSettings: { framework: 'nextjs', buildCommand: 'npm run build -- --webpack' },
});
const receipt = { id: deployment.id, sha, url: deployment.url, projectId: expectedProject, state: deployment.readyState };
fs.writeFileSync('.vercel/sandbox2-last-deployment.json', JSON.stringify(receipt, null, 2));
console.log(`Sandbox 2 deployment ${deployment.id}; commit ${sha}`);
let previous = '';
for (let attempt = 0; attempt < 100; attempt++) {
  const d = await api('GET', `/v13/deployments/${deployment.id}`);
  if (d.readyState !== previous) { console.log(d.readyState); previous = d.readyState; }
  if (['ERROR', 'CANCELED'].includes(d.readyState)) throw Error(`Sandbox 2 ${d.readyState}.`);
  if (d.readyState === 'READY') {
    if (d.projectId !== expectedProject || d.meta?.githubCommitSha !== sha) throw Error('Project/commit verification failed.');
    const alias = await api('GET', '/v4/aliases/dydd-online-school-sandbox-2.vercel.app');
    if (alias.projectId !== expectedProject || (alias.deploymentId || alias.deployment?.id) !== d.id) throw Error('Sandbox 2 alias verification failed.');
    for (const id of protectedProjects) {
      const p = await api('GET', `/v9/projects/${id}`);
      if (p.targets?.production?.id !== before.get(id)) throw Error('A protected project changed during deployment; inspect independently.');
    }
    fs.writeFileSync('.vercel/sandbox2-last-deployment.json', JSON.stringify({ ...receipt, state: 'READY', alias: d.alias }, null, 2));
    console.log('READY https://dydd-online-school-sandbox-2.vercel.app — exact SHA/alias verified; original sandbox, production and owner deployments unchanged.');
    process.exit(0);
  }
  await new Promise(resolve => setTimeout(resolve, 5000));
}
throw Error('Sandbox 2 timed out. Inspect the recorded deployment ID before creating another.');

// Repair the obsolete Vercel Active Branches sandbox entry, never production.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const sandboxAlias = 'dydd-online-school-sandbox.vercel.app';
const branchAlias = 'dydd-online-school-git-sandbox-dydd-6069s-projects.vercel.app';
const productionAlias = 'dydd-online-school.vercel.app';
const sandboxProject = 'prj_5EC6sfJe9DpGYW59L94iwppeMYUg';
const productionProject = 'prj_YO15mYTp64EHk0wlg6QmBTxNeV5k';
const cfg = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json', 'utf8'));
const {token} = JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json', 'utf8'));
if (cfg.ref !== 'atemrshtshxoqnuevvqu' || cfg.vercel.projectId !== sandboxProject || cfg.vercel.productionRef !== 'sandbox') throw Error('Sandbox configuration mismatch');
async function api(method, path, body) {
  const response = await fetch('https://api.vercel.com' + path + (path.includes('?') ? '&' : '?') + 'teamId=' + cfg.vercel.orgId, {
    method, headers: {Authorization: 'Bearer ' + token, 'Content-Type': 'application/json'},
    ...(body ? {body: JSON.stringify(body)} : {}),
  });
  if (!response.ok) throw Error('Vercel alias operation failed: HTTP ' + response.status + ' ' + (await response.text()).slice(0, 300));
  return response.json();
}
async function resolve(alias) {
  const a = await api('GET', '/v4/aliases/' + alias);
  const d = await api('GET', '/v13/deployments/' + a.deployment?.id);
  return {alias, id: d.id, project: d.projectId, sha: d.meta?.githubCommitSha, branch: d.meta?.githubCommitRef, state: d.readyState};
}
const [productionBefore, target, previous] = await Promise.all([resolve(productionAlias), resolve(sandboxAlias), resolve(branchAlias)]);
const remoteSha = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/sandbox'], {encoding: 'utf8'}).trim().split(/\s/)[0];
if (productionBefore.project !== productionProject || target.project !== sandboxProject || target.branch !== 'sandbox' || target.state !== 'READY' || target.sha !== remoteSha) throw Error('Refusing noncurrent or nonisolated sandbox target');
if (![sandboxProject, productionProject].includes(previous.project) || previous.branch !== 'sandbox') throw Error('Unexpected legacy branch alias owner');
if (previous.id !== target.id) await api('POST', '/v2/deployments/' + target.id + '/aliases', {alias: branchAlias});
const [productionAfter, branchAfter, stableAfter] = await Promise.all([resolve(productionAlias), resolve(branchAlias), resolve(sandboxAlias)]);
if (JSON.stringify(productionBefore) !== JSON.stringify(productionAfter)) throw Error('Production alias changed during sandbox repair: investigate concurrent deployment');
if (branchAfter.id !== target.id || stableAfter.id !== target.id || branchAfter.project !== sandboxProject) throw Error('Sandbox alias verification failed');
fs.mkdirSync('tmp/sandbox-owner-access', {recursive: true});
const receipt = {checkedAt: new Date().toISOString(), previous, target, branchAfter, productionBefore, productionAfter, productionUntouched: true};
fs.writeFileSync('tmp/sandbox-owner-access/alias-repair.json', JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({branchAlias, deployment: target.id, sha: target.sha, project: target.project, productionUntouched: true}));

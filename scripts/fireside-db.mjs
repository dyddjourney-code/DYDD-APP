import fs from 'node:fs';
import assert from 'node:assert/strict';
export const target=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
const management=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json','utf8'));
assert.equal(target.ref,'atemrshtshxoqnuevvqu');assert.equal(target.project_url,'https://atemrshtshxoqnuevvqu.supabase.co');assert.equal(target.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
export async function sql(query){const r=await fetch(`https://api.supabase.com/v1/projects/${target.ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${management.management_access_token}`,'Content-Type':'application/json'},body:JSON.stringify({query})});const data=await r.json();if(!r.ok)throw Error(`Sandbox SQL ${r.status}: ${JSON.stringify(data).slice(0,1400)}`);return data;}

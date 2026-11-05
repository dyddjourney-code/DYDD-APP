import fs from 'node:fs';
import assert from 'node:assert/strict';
export const credentials=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json','utf8'));
const management=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json','utf8'));
assert.equal(credentials.ref,'atemrshtshxoqnuevvqu');
assert.equal(credentials.project_url,'https://atemrshtshxoqnuevvqu.supabase.co');
assert.equal(credentials.vercel.projectId,'prj_5EC6sfJe9DpGYW59L94iwppeMYUg');
export async function sandboxSql(query,readOnly=false){
 const response=await fetch(`https://api.supabase.com/v1/projects/${credentials.ref}/database/query`,{method:'POST',headers:{Authorization:`Bearer ${management.management_access_token}`,'Content-Type':'application/json'},body:JSON.stringify({query,read_only:readOnly})});
 const data=await response.json();assert(response.ok,`Sandbox SQL ${response.status}: ${JSON.stringify(data).slice(0,1800)}`);return data;
}

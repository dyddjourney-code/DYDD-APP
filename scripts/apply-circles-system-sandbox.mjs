// Explicit isolated sandbox migration; never falls back to any other project.
import fs from 'node:fs';
import crypto from 'node:crypto';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const s=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
if(c.ref!=='atemrshtshxoqnuevvqu'||c.vercel.projectId!=='prj_5EC6sfJe9DpGYW59L94iwppeMYUg')throw Error('Sandbox target mismatch');
const paths=process.argv.slice(2).filter(x=>/^supabase\/migrations\/20261104\d{6}_[a-z0-9_]+\.sql$/.test(x));
if(!paths.length)throw Error('Provide explicit Circles migration paths');
async function sql(query){const r=await fetch('https://api.supabase.com/v1/projects/'+c.ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query})});if(!r.ok)throw Error('Sandbox SQL '+r.status+': '+(await r.text()).slice(0,1200));return r.json();}
const evidence=[];
for(const path of paths){
 const file=path.split('/').pop(),version=file.slice(0,14),name=file.slice(15,-4),source=fs.readFileSync(path,'utf8');
 const sha256=crypto.createHash('sha256').update(source).digest('hex');
 const prior=await sql("select version,name,statements from supabase_migrations.schema_migrations where version='"+version+"'");
 if(prior.length){const recorded=prior[0].statements?.[0]||'';const normalized=recorded.replace(/(?<!\$)\$(?!\$)/g,()=> '$$');if(recorded!==source&&normalized!==source)throw Error('Applied migration source drift: '+version);evidence.push({version,sha256,alreadyApplied:true,recordedDelimiterNormalization:recorded!==source});continue;}
 if(!process.argv.includes('--apply')){evidence.push({version,sha256,apply:false});continue;}
 if(source.includes('$circle_migration_source$'))throw Error('Delimiter conflict');
 const transactional=source.replace(/^([\s\S]*?)(?:^begin;\s*)/m,'$1').replace(/commit;\s*$/,'');
 await sql("begin;\n"+transactional+"\ninsert into supabase_migrations.schema_migrations(version,name,statements) values ('"+version+"','"+name+"',array[$circle_migration_source$"+source+"$circle_migration_source$]);\ncommit;");
 evidence.push({version,sha256,applied:true});
}
const receipt={sandbox:true,ref:c.ref,at:new Date().toISOString(),evidence};
fs.mkdirSync('docs/evidence',{recursive:true});fs.writeFileSync('docs/evidence/circles-migration-receipt.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));

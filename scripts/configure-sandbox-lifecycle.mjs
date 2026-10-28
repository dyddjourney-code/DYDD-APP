// Environment-specific activation. Never runs against the production school project.
import fs from 'node:fs';import crypto from 'node:crypto';
const c=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/dydd-online-school-sandbox.json'));
const v=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/vercel-token.json'));
const s=JSON.parse(fs.readFileSync('/home/openclaw/.openclaw/secrets/supabase-project.json'));
if(c.ref!=='atemrshtshxoqnuevvqu'||c.vercel.projectName!=='dydd-online-school-sandbox'||c.vercel.projectId!=='prj_5EC6sfJe9DpGYW59L94iwppeMYUg')throw Error('Sandbox target mismatch');
const action=process.argv[2],secretPath='/home/openclaw/.openclaw/secrets/dydd-sandbox-lifecycle-cron.json';
async function sql(query){const r=await fetch('https://api.supabase.com/v1/projects/'+c.ref+'/database/query',{method:'POST',headers:{Authorization:'Bearer '+s.management_access_token,'Content-Type':'application/json'},body:JSON.stringify({query})});if(!r.ok)throw Error('Sandbox SQL '+r.status+': '+(await r.text()).slice(0,200));return r.json();}
async function api(method,path,body){const r=await fetch(`https://api.vercel.com${path}${path.includes('?')?'&':'?'}teamId=${c.vercel.orgId}`,{method,headers:{Authorization:'Bearer '+v.token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Sandbox Vercel '+r.status);return r.json();}
if(action==='prepare'){
 const existing=await api('GET',`/v10/projects/${c.vercel.projectId}/env`),entry=(existing.envs||[]).find(e=>e.key==='DYDD_LIFECYCLE_CRON_SECRET');
 if(entry&&!fs.existsSync(secretPath))throw Error('Existing cron secret has no local record. Reconcile rather than rotate silently.');
 const secret=fs.existsSync(secretPath)?JSON.parse(fs.readFileSync(secretPath)).secret:crypto.randomBytes(32).toString('hex');
 if(!entry)await api('POST',`/v10/projects/${c.vercel.projectId}/env`,{key:'DYDD_LIFECYCLE_CRON_SECRET',value:secret,type:'encrypted',target:['production','preview','development']});
 fs.writeFileSync(secretPath,JSON.stringify({secret,project:c.vercel.projectId,ref:c.ref}),{mode:0o600});
 const prior=await sql("select id from vault.secrets where name='dydd_sandbox_lifecycle_cron'");
 if(!prior.length)await sql(`select vault.create_secret('${secret}','dydd_sandbox_lifecycle_cron','Sandbox lifecycle endpoint authentication only')`);
 console.log('Sandbox-only encrypted Vercel env and Vault secret prepared; cron not yet activated.');
} else if(action==='activate'){
 const {secret}=JSON.parse(fs.readFileSync(secretPath));
 const r=await fetch('https://dydd-online-school-sandbox.vercel.app/api/cron/lifecycle',{headers:{Authorization:'Bearer '+secret}});
 if(!r.ok)throw Error('Published sandbox worker unavailable '+r.status);const b=await r.json();if(b.sandbox!==true||b.accepted!==0)throw Error('Sandbox outbound guard not proven');
 // Inspect before installing; preserve every unrelated scheduler entry.
 const installed=await sql("select extname from pg_extension where extname='pg_cron'");
 if(!installed.length)await sql('create extension if not exists pg_cron');
 const jobs=await sql("select jobid,jobname,schedule,active from cron.job");
 await sql(`create or replace function dydd_private.sandbox_lifecycle_tick() returns bigint language plpgsql security definer set search_path='' as $$
 declare secret_value text; request_id bigint;
 begin
  select decrypted_secret into secret_value from vault.decrypted_secrets where name='dydd_sandbox_lifecycle_cron';
  if secret_value is null then raise exception 'Sandbox cron secret missing'; end if;
  select net.http_post(url:='https://dydd-online-school-sandbox.vercel.app/api/cron/lifecycle',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret_value),body:='{}'::jsonb,timeout_milliseconds:=55000) into request_id;
  return request_id;
 end $$;
 revoke all on function dydd_private.sandbox_lifecycle_tick() from public,anon,authenticated;
 select cron.schedule('dydd-sandbox-lifecycle','*/5 * * * *','select dydd_private.sandbox_lifecycle_tick()');`);
 console.log(JSON.stringify({activated:true,project:c.vercel.projectName,ref:c.ref,preservedOtherJobs:jobs.filter(j=>j.jobname!=='dydd-sandbox-lifecycle').length,worker:b}));
} else if(action==='status'){
 console.log(JSON.stringify(await sql("select jobid,jobname,schedule,active from cron.job where jobname='dydd-sandbox-lifecycle'")));
 console.log(JSON.stringify(await sql("select status,return_message,start_time,end_time from cron.job_run_details where jobid in (select jobid from cron.job where jobname='dydd-sandbox-lifecycle') order by start_time desc limit 3")));
} else throw Error('Use prepare, activate, or status');

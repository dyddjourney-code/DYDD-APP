import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {sandboxSql,credentials} from './assessment-timing-sandbox-db.mjs';
const filename='supabase/migrations/20261105231126_assessment_timing_core_sandbox.sql';
const source=fs.readFileSync(filename,'utf8');
const history=await sandboxSql("select statements from supabase_migrations.schema_migrations where version='20261105231126'",true);
const dependency=await sandboxSql("select to_regclass('public.dydd_assessment_retake_grants') grants,to_regprocedure('public.dydd_fruitlife_last_self_completion(uuid,text)') fruitful_helper",true);
assert(dependency[0].grants && dependency[0].fruitful_helper,'Apply request and FruitLife migrations first');
if(!history.length){
 const baseline=JSON.parse(fs.readFileSync('tmp/assessment-timing/functions-before.json','utf8')).find(f=>f.proname==='save_designid_attempt').definition;
 const current=(await sandboxSql("select pg_get_functiondef('public.save_designid_attempt(uuid,uuid,text,boolean,jsonb)'::regprocedure) definition",true))[0].definition;
 assert.equal(current,baseline,'Core DesignID function drift: inspect before overwrite');
 await sandboxSql(source.replace(/commit;\s*$/,()=>"insert into supabase_migrations.schema_migrations(version,name,statements) values('20261105231126','assessment_timing_core_sandbox',array[$migration$"+source+"$migration$]); commit;"));
}else assert.equal(history[0].statements[0],source,'Applied migration differs from source');
const security=await sandboxSql("select p.proname,p.prosecdef,has_function_privilege('anon',p.oid,'execute') anon_execute,has_function_privilege('authenticated',p.oid,'execute') authenticated_execute,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('dydd_assessment_eligibility','dydd_assert_assessment_completion','save_designid_attempt','save_spiritual_gifts_attempt') order by p.proname",true);
assert.equal(security.length,4);assert(security.every(p=>!p.prosecdef&&!p.anon_execute&&!p.authenticated_execute));
const proof={at:new Date().toISOString(),ref:credentials.ref,projectId:credentials.vercel.projectId,filename,sha256:crypto.createHash('sha256').update(source).digest('hex'),applied:!history.length,security,productionMutations:0};
fs.writeFileSync('tmp/assessment-timing/core-migration-proof.json',JSON.stringify(proof,null,2));console.log(proof);

#!/usr/bin/env python3
"""Isolated PostgreSQL contract + capacity/replay races. No hosted credentials."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess, uuid, threading
root=Path(__file__).resolve().parents[2]
container='dydd-group-test-'+uuid.uuid4().hex[:10]
def docker(*args,sql=None,check=True):
 r=subprocess.run(['docker',*args],input=sql,text=True,capture_output=True)
 if check and r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r
def q(sql):return docker('exec','-i',container,'psql','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql=sql).stdout.strip()
def attempt(sql):return docker('exec','-i',container,'psql','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql='set role service_role;'+sql,check=False)
def race(sqls):
 barrier=threading.Barrier(len(sqls))
 def job(sql):barrier.wait(timeout=5);return attempt(sql)
 with ThreadPoolExecutor(max_workers=len(sqls)) as pool:return list(pool.map(job,sqls))
try:
 docker('run','-d','--rm','--name',container,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine')
 docker('exec',container,'sh','-c','until pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do sleep 0.1; done')
 q("""create role anon;create role authenticated;create role service_role bypassrls;
 create table public.dydd_public_assessment_runtime(singleton boolean primary key,payment_mode text);
 insert into public.dydd_public_assessment_runtime values(true,'test');grant select on public.dydd_public_assessment_runtime to service_role;
 create function public.dydd_public_assessment_provider_allowed(p_provider text) returns boolean language sql stable security invoker set search_path='' as $$ select p_provider is null or exists(select 1 from public.dydd_public_assessment_runtime where singleton and p_provider='stripe_'||payment_mode) $$;
 create table public.account_sentinel(id int primary key,payload text);insert into public.account_sentinel values(1,'unchanged');""")
 baseline=q("select pg_get_functiondef('public.dydd_public_assessment_provider_allowed(text)'::regprocedure);select * from public.account_sentinel")
 q((root/'supabase/migrations/20261112000100_public_guest_assessments.sql').read_text())
 migration=(root/'supabase/migrations/20261112142808_guest_group_access.sql').read_text()
 q(migration.rsplit('commit;',1)[0]+'rollback;')
 assert q("select to_regclass('public.dydd_guest_access_grants') is null")=='t'
 print('PASS additive migration rollback rehearsal')
 q(migration)
 q((root/'supabase/tests/guest_group_access.sql').read_text())
 assert q("select count(*) from public.dydd_guest_access_grants")=='0'
 print('PASS rollback-only synthetic verification leaves zero group fixtures')
 def session(email):
  return q("insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values('"+uuid.uuid4().hex*2+"','Fixture','"+email+"') returning id;").splitlines()[0]
 def grant(products="array['designid','designpd']",limit=2,kind='group',code='null'):
  token=uuid.uuid4().hex*2
  gid=q(f"insert into public.dydd_guest_access_grants(token_hash,name,kind,coupon_code,products,expires_at,max_uses,created_by) values('{token}','Synthetic contract fixture','{kind}',{code},{products},now()+interval '1 day',{limit},gen_random_uuid()) returning id").splitlines()[0]
  return gid,token
 def redeem(s,t,source=None):return f"select public.dydd_guest_redeem_access('{s}','{t}',"+(f"'{source}'" if source else 'null')+");"
 def fails(sql,phrase=None):
  result=attempt(sql);assert result.returncode,result.stdout
  if phrase:assert phrase in result.stderr,result.stderr
 sid=session('fixture@example.test');gid,token=grant(kind='coupon',code="'OWNER-FIXTURE-CODE'")
 fails(redeem(sid,'f'*64),'unavailable')
 out=attempt(redeem(sid,token));assert out.returncode==0,out.stderr
 oid=q(f"select id from public.dydd_guest_orders where session_id='{sid}' and product='designid'")
 assert q(f"select expected_amount=0 and payment_provider='group_free' and payment_intent_id is null and access_grant_id='{gid}' and coupon_code='OWNER-FIXTURE-CODE' from public.dydd_guest_orders where id='{oid}'")=='t'
 print('PASS coupon provenance and zero-dollar entitlement, no fake Stripe evidence')
 attempts=race([redeem(sid,token),redeem(sid,token)]);assert all(a.returncode==0 for a in attempts)
 assert q(f"select uses from public.dydd_guest_access_grants where id='{gid}'")=='1'
 assert q(f"select count(*) from public.dydd_guest_orders where session_id='{sid}'")=='1'
 print('PASS concurrent replay returns original order and consumes one enrollment')
 points='{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}'
 rid=q(f"select public.dydd_guest_save_result('{sid}','{oid}','{points}')")
 assert q(f"select public.dydd_guest_save_result('{sid}','{oid}','{{}}')")==rid
 assert attempt(redeem(sid,token,rid)).returncode==0
 pd=q(f"select id from public.dydd_guest_orders where session_id='{sid}' and product='designpd'")
 pd_result=q(f'''select public.dydd_guest_save_result('{sid}','{pd}','{{"designIdSnapshotId":"{rid}"}}')''')
 assert pd_result
 assert q(f"select uses from public.dydd_guest_access_grants where id='{gid}'")=='1'
 print('PASS DesignID scoring contract and immutable replay; PD derives exact source without second enrollment')
 other=session('other@example.test');fails(redeem(other,token,rid),'completed DesignID')
 same_email=session(' FIXTURE@example.test ');fails(redeem(same_email,token),'timing needs recovery')
 q(f"update public.dydd_guest_results set created_at=now()-interval '6 months 1 second' where id='{rid}'")
 assert attempt(redeem(same_email,token)).returncode==0
 print('PASS foreign source rejected; normalized guest email six-month timing before redemption; eligible retake allowed')
 q(f"update public.dydd_guest_access_grants set revoked_at=now() where id='{gid}'")
 assert q(f"select public.dydd_guest_order_entitled('{oid}')")=='f'
 fails(f"select public.dydd_guest_save_result('{sid}','{pd}','{{}}')",'valid paid guest order')
 fails(redeem(sid,token),'unavailable')
 print('PASS revocation blocks existing entitlement/save/re-enrollment; historical results retained')
 a,b=session('a@example.test'),session('b@example.test');cap,t=grant(limit=1)
 attempts=race([redeem(a,t),redeem(b,t)])
 assert sum(r.returncode==0 for r in attempts)==1,[r.stderr for r in attempts]
 assert q(f"select uses from public.dydd_guest_access_grants where id='{cap}'")=='1'
 print('PASS concurrent final-capacity race grants exactly one guest')
 winner=q(f"select session_id from public.dydd_guest_access_redemptions where grant_id='{cap}'")
 q(f"update public.dydd_guest_access_grants set created_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id='{cap}'")
 assert attempt(redeem(winner,t)).returncode==0
 fresh=session('fresh@example.test');fails(redeem(fresh,t),'expired or fully used')
 print('PASS expiry/cap block new enrollments, not original enrolled recovery')
 pdg,pdt=grant(products="array['designpd']")
 fails(redeem(fresh,pdt),'existing DesignID session')
 print('PASS PD-only grant cannot create questionnaire or bypass completed source')
 for role in ['anon','authenticated']:
  for table in ['dydd_guest_access_grants','dydd_guest_access_redemptions']:
   assert q(f"select has_table_privilege('{role}','public.{table}','SELECT')")=='f'
  for function in ['dydd_guest_redeem_access(uuid,text,uuid)','dydd_guest_order_entitled(uuid)']:
   assert q(f"select has_function_privilege('{role}','public.{function}','EXECUTE')")=='f'
 assert q("select count(*) from pg_class where relname in ('dydd_guest_access_grants','dydd_guest_access_redemptions') and relrowsecurity")=='2'
 assert q("select pg_get_functiondef('public.dydd_public_assessment_provider_allowed(text)'::regprocedure);select * from public.account_sentinel")==baseline
 print('PASS service-only functions/tables, RLS on, shared mode fence and account sentinel unchanged')
 print('PASS isolated PostgreSQL 17 group access contract complete; hosted DB not contacted')
finally:docker('stop',container,check=False)

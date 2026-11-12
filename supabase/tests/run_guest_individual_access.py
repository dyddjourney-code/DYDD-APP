#!/usr/bin/env python3
"""Isolated PostgreSQL individual invitation contract + real deadline/capacity races. No hosted credentials."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess, uuid, threading
root=Path(__file__).resolve().parents[2]
container='dydd-individual-test-'+uuid.uuid4().hex[:10]
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

 for migration in ['20261112000100_public_guest_assessments.sql','20261112142808_guest_group_access.sql','20261112172236_paid_standalone_designid_repeats.sql']:
  q((root/'supabase/migrations'/migration).read_text())
 baseline=q("select pg_get_functiondef('public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text)'::regprocedure);select pg_get_functiondef('public.dydd_guest_order_entitled(uuid)'::regprocedure);select * from public.account_sentinel")
 migration=(root/'supabase/migrations/20261112175048_guest_individual_access.sql').read_text()
 q(migration.rsplit('commit;',1)[0]+'rollback;')
 assert q("select count(*) from information_schema.columns where table_name='dydd_guest_access_grants' and column_name='recipient_email'")=='0'
 print('PASS additive DDL rollback rehearsal')
 q(migration)
 q((root/'supabase/tests/guest_individual_access.sql').read_text())
 q((root/'supabase/tests/guest_group_access.sql').read_text())
 assert q('select count(*) from public.dydd_guest_access_grants')=='0'
 print('PASS normalized required recipient, single capacity, invitation defaults/metadata, ACL and RLS; fixtures rolled back')
 def session(email):
  return q(f"insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values('{uuid.uuid4().hex*2}','Fixture','{email}') returning id").splitlines()[0]
 def grant(email,products="array['designid','designpd']",kind='individual'):
  token=uuid.uuid4().hex*2
  gid=q(f"insert into public.dydd_guest_access_grants(token_hash,name,kind,recipient_email,products,expires_at,max_uses,created_by) values('{token}','Individual fixture','{kind}','{email}',{products},clock_timestamp()+interval '1 day',1,gen_random_uuid()) returning id").splitlines()[0]
  return gid,token
 def redeem(s,t,source=None):
  return f"select public.dydd_guest_redeem_access('{s}','{t}',"+(f"'{source}'" if source else 'null')+");"
 def fails(sql,phrase):
  result=attempt(sql)
  assert result.returncode and phrase in result.stderr,result.stdout+result.stderr
 def expire(gid):q(f"update public.dydd_guest_access_grants set created_at=now()-interval '2 days',expires_at=now()-interval '1 second' where id='{gid}'")
 def oid(s,prod='designid'):return q(f"select id from public.dydd_guest_orders where session_id='{s}' and product='{prod}'")
 points='{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}'
 def save(s,o,payload=points):return f"select public.dydd_guest_save_result('{s}','{o}','{payload}');"
 sid=session(' INVITED@example.test ');gid,token=grant('invited@example.test')
 wrong=session('other@example.test');fails(redeem(wrong,token),'different recipient')
 alias=session('invited+alias@example.test');fails(redeem(alias,token),'different recipient')
 fails(redeem(sid,'f'*64),'unavailable')
 assert attempt(redeem(sid,token)).returncode==0
 order=oid(sid)
 assert q(f"select expected_amount=0 and payment_provider='group_free' and access_grant_id='{gid}' and payment_intent_id is null from public.dydd_guest_orders where id='{order}'")=='t'
 attempts=race([redeem(sid,token),redeem(sid,token)])
 assert all(a.returncode==0 for a in attempts),[a.stderr for a in attempts]
 assert q(f"select uses from public.dydd_guest_access_grants where id='{gid}'")=='1'
 assert q(f"select count(*) from public.dydd_guest_orders where session_id='{sid}'")=='1'
 other=session('invited@example.test');fails(redeem(other,token),'expired or fully used')
 print('PASS exact normalized email binding without alias folding, zero-dollar provenance, concurrent immutable enrollment replay and one-session capacity')
 # PD cannot begin without a saved, entitled DesignID in this exact session.
 pds=session('pdonly@example.test');pdg,pdt=grant('pdonly@example.test',"array['designpd']")
 fails(redeem(pds,pdt),'existing DesignID session')
 result=q(save(sid,order)).splitlines()[0]
 assert q(save(sid,order,'{}'))==result
 fails(redeem(pds,pdt,result),'completed DesignID')
 assert attempt(redeem(sid,token,result)).returncode==0
 pdorder=oid(sid,'designpd')
 fails(save(sid,pdorder,'{}'),'source must match')
 print('PASS canonical scoring and immutable replay; PD-only and foreign-source prerequisites, exact source binding')
 # Pending PD loses submission permission at expiry; completed ID keeps report rights.
 expire(gid)
 fails(redeem(sid,token),'deadline has passed')
 fails(redeem(sid,token,result),'deadline has passed')
 fails(f"select public.dydd_guest_unlock_included_pd('{sid}','{result}')",'deadline has passed')
 assert q(f"select public.dydd_guest_order_entitled('{order}')")=='t'
 assert q(save(sid,order,'{}'))==result
 fails(save(sid,pdorder,'{"designIdSnapshotId":"'+result+'"}'),'deadline has passed')
 # Even direct trusted-server INSERT must honor the actual save deadline.
 fails(f"insert into public.dydd_guest_results(order_id,session_id,product,source_result_id,scores) values('{pdorder}','{sid}','designpd','{result}','{{}}')",'deadline has passed')
 q(f"update public.dydd_guest_results set report_state='ready',pdf=jsonb_build_object('status','ready') where id='{result}'")
 print('PASS expiry blocks enrolled redemption/unlock/new PD RPC and direct INSERT; saved ID entitlement, replay and report metadata survive')
 # An enrolled but not completed ID is also fenced at INSERT.
 late=session('late@example.test');lg,lt=grant('late@example.test')
 assert attempt(redeem(late,lt)).returncode==0
 lo=oid(late);expire(lg);fails(save(late,lo),'deadline has passed')
 # Wall-clock guard rejects a transaction started before a future deadline.
 wall=session('wall@example.test');wg,wt=grant('wall@example.test')
 assert attempt(redeem(wall,wt)).returncode==0
 wo=oid(wall)
 fails(f"begin;update public.dydd_guest_access_grants set expires_at=clock_timestamp()+interval '150 milliseconds' where id='{wg}';select pg_sleep(0.25);"+save(wall,wo)+'commit;','deadline has passed')
 fails(f"begin;update public.dydd_guest_access_grants set expires_at=clock_timestamp()+interval '150 milliseconds' where id='{wg}';select pg_sleep(0.25);"+redeem(wall,wt)+'commit;','deadline has passed')
 print('PASS uncompleted ID and pre-deadline long transaction cannot bypass wall-clock save/redemption deadline')
 # Two sessions for the exact recipient race for the last slot.
 ca,cb=session('race@example.test'),session('race@example.test');cg,ct=grant('race@example.test')
 attempts=race([redeem(ca,ct),redeem(cb,ct)])
 assert sum(a.returncode==0 for a in attempts)==1,[a.stderr for a in attempts]
 assert q(f"select uses from public.dydd_guest_access_grants where id='{cg}'")=='1'
 assert q(f"select count(*) from public.dydd_guest_access_redemptions where grant_id='{cg}'")=='1'
 print('PASS real concurrent same-recipient two-session race enrolls exactly one session')
 # Free cooldown remains, whereas paid standalone repeats remain permitted.
 timing=session('invited@example.test');tg,tt=grant('invited@example.test')
 fails(redeem(timing,tt),'timing needs recovery')
 assert q(f"select public.dydd_guest_reserve_order('{timing}','designid',null,'stripe_test','prod_repeat','price_repeat')")
 print('PASS six-month free timing unchanged and paid standalone repeat reservation remains allowed')
 # Group enrollment retains its historical expiry behavior.
 group=session('group@example.test');gg,gt=grant('unused@example.test',kind='group')
 assert attempt(redeem(group,gt)).returncode==0
 go=oid(group);expire(gg)
 assert attempt(redeem(group,gt)).returncode==0
 assert q(save(group,go))
 print('PASS existing group redemption and first save still work after grant expiry')
 # Fully completed individual PD also keeps replay and report entitlement.
 done=session('done@example.test');dg,dt=grant('done@example.test')
 assert attempt(redeem(done,dt)).returncode==0
 do=oid(done);dr=q(save(done,do)).splitlines()[0]
 assert attempt(redeem(done,dt,dr)).returncode==0
 dpo=oid(done,'designpd');dpr=q(save(done,dpo,'{"designIdSnapshotId":"'+dr+'"}')).splitlines()[0]
 expire(dg)
 assert q(save(done,dpo,'{}'))==dpr
 assert q(f"select public.dydd_guest_order_entitled('{dpo}')")=='t'
 q(f"update public.dydd_guest_access_grants set revoked_at=now() where id='{dg}'")
 assert q(f"select public.dydd_guest_order_entitled('{do}') or public.dydd_guest_order_entitled('{dpo}')")=='f'
 fails(save(done,dpo,'{}'),'valid paid guest order')
 assert q(f"select count(*) from public.dydd_guest_results where session_id='{done}'")=='2'
 print('PASS completed ID/PD replay and entitlement survive expiry; explicit revocation disables rights without deleting results')
 assert q("select pg_get_functiondef('public.dydd_guest_reserve_order(uuid,text,uuid,text,text,text)'::regprocedure);select pg_get_functiondef('public.dydd_guest_order_entitled(uuid)'::regprocedure);select * from public.account_sentinel")==baseline
 print('PASS paid reservation/verifier definitions and unrelated account sentinel unchanged')
 print('PASS isolated PostgreSQL 17 individual guest contract complete; hosted DB never contacted')
finally:docker('stop',container,check=False)

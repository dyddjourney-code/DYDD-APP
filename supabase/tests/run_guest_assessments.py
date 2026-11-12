#!/usr/bin/env python3
"""Disposable PostgreSQL verification only. Never uses project credentials or a host DB.
Requires an already available postgres:17-alpine Docker image; uses --network none.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import threading
import uuid

root = Path(__file__).resolve().parents[2]
container = 'dydd-guest-test-' + uuid.uuid4().hex[:10]

def docker(*args, sql=None, check=True):
    result = subprocess.run(['docker', *args], input=sql, text=True, capture_output=True)
    if check and result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result

def query(sql):
    result = docker('exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', sql=sql)
    return result.stdout.strip()

def race(statement1, statement2):
    barrier = threading.Barrier(2)
    def run(sql):
        barrier.wait(timeout=5)
        return query('begin; set local role service_role; ' + sql + '; select pg_sleep(0.1); commit;')
    with ThreadPoolExecutor(max_workers=2) as pool:
        jobs = [pool.submit(run, s) for s in [statement1, statement2]]
        return [j.result(timeout=20) for j in jobs]

try:
    docker('run', '-d', '--rm', '--name', container, '--network', 'none', '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17-alpine')
    docker('exec', container, 'sh', '-c', 'until pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do sleep 0.1; done')
    query("""
create role anon; create role authenticated; create role service_role bypassrls;
create table public.dydd_public_assessment_runtime(singleton boolean primary key, payment_mode text);
insert into public.dydd_public_assessment_runtime values(true,'test');
grant select on public.dydd_public_assessment_runtime to service_role;
create function public.dydd_public_assessment_provider_allowed(p_provider text)
returns boolean language sql stable security invoker set search_path='' as $$
 select p_provider is null or exists(select 1 from public.dydd_public_assessment_runtime where singleton and p_provider='stripe_'||payment_mode)
$$;
create table public.account_sentinel(id integer primary key, payload text);
insert into public.account_sentinel values(1,'must remain unchanged');
""")
    baseline = query("select pg_get_functiondef('public.dydd_public_assessment_provider_allowed(text)'::regprocedure); select * from public.account_sentinel;")
    migration = (root / 'supabase/migrations/20261112000100_public_guest_assessments.sql').read_text()
    # Explicit rollback rehearsal of DDL in this disposable DB; no migration history writes.
    rehearsal = migration.replace('begin;', 'begin;', 1).rsplit('commit;', 1)[0] + 'rollback;'
    query(rehearsal)
    assert query("select count(*) from pg_class where relnamespace='public'::regnamespace and relname like 'dydd_guest_%';") == '0'
    print('PASS: migration DDL rollback leaves zero guest objects')
    query(migration)
    sql_test = (root / 'supabase/tests/guest_assessments.sql').read_text()
    result = docker('exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', sql=sql_test)
    print(result.stdout.strip())
    print(result.stderr.strip())
    assert query('select count(*) from public.dydd_guest_sessions;') == '0'
    print('PASS: contract/ACL fixture transaction rolled back')
    # Actual reservation races: no two payable provider requests can be reserved.
    reserve_sid = query("insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('d',64),'Reserve','reserve@example.test') returning id;").splitlines()[0]
    reserve = f"select public.dydd_guest_reserve_order('{reserve_sid}','designid',null,'stripe_test','prod_id','price_id')"
    def reserve_attempt():
        return docker('exec','-i',container,'psql','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql='set role service_role;'+reserve+';',check=False)
    with ThreadPoolExecutor(max_workers=2) as pool:
        attempts=list(pool.map(lambda _:reserve_attempt(),range(2)))
    assert sum(x.returncode==0 for x in attempts)==1
    assert query(f"select count(*) from public.dydd_guest_orders where session_id='{reserve_sid}';")=='1'
    print('PASS: concurrent checkout reservation permits exactly one pending order')
    duplicate_sid=query("insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('e',64),'Reserve2',' RESERVE@example.test ') returning id;").splitlines()[0]
    blocked=docker('exec','-i',container,'psql','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql=f"select public.dydd_guest_reserve_order('{duplicate_sid}','designid',null,'stripe_test','prod_id','price_id');",check=False)
    assert blocked.returncode and 'existing purchase needs recovery' in blocked.stderr
    reserve_oid=query(f"select id from public.dydd_guest_orders where session_id='{reserve_sid}';")
    query(f"update public.dydd_guest_orders set payment_reference='cs_reserve' where id='{reserve_oid}'; select public.dydd_guest_apply_payment('{reserve_oid}','stripe_test','cs_reserve','pi_reserve',1999,'usd','price_id');")
    query(f"select public.dydd_guest_save_result('{reserve_sid}','{reserve_oid}','{{\"Architect_Pts\":40,\"Artisan_Pts\":30,\"Shepherd_Pts\":20,\"Steward_Pts\":10,\"Total_Pts\":100}}');")
    blocked=docker('exec','-i',container,'psql','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql=f"select public.dydd_guest_reserve_order('{duplicate_sid}','designid',null,'stripe_test','prod_id','price_id');",check=False)
    assert blocked.returncode and 'Assessment timing needs recovery' in blocked.stderr
    query(f"update public.dydd_guest_results set created_at=now()-interval '6 months 1 second' where order_id='{reserve_oid}';")
    allowed=query(f"select public.dydd_guest_reserve_order('{duplicate_sid}','designid',null,'stripe_test','prod_id','price_id');")
    assert allowed
    print('PASS: cross-session normalized guest-email pending recovery and six-calendar-month timing enforced before checkout; eligible retake reserves a new session')
    sid = query("insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('c',64),'Concurrency','c@example.test') returning id;").splitlines()[0]
    def order(ref, product='designid', source=None):
        src = "'" + source + "'" if source else 'null'
        return query(f"insert into public.dydd_guest_orders(session_id,product,source_result_id,payment_provider,payment_reference,expected_product_id,expected_price_id) values('{sid}','{product}',{src},'stripe_test','{ref}','prod_id','price_id') returning id;").splitlines()[0]
    def payment(oid, ref, intent):
        return f"select public.dydd_guest_apply_payment('{oid}','stripe_test','{ref}','{intent}',1999,'usd','price_id')"
    points = '{"Architect_Pts":40,"Artisan_Pts":30,"Shepherd_Pts":20,"Steward_Pts":10,"Total_Pts":100}'
    oid = order('cs_concurrent')
    outputs = race(payment(oid,'cs_concurrent','pi_concurrent'), payment(oid,'cs_concurrent','pi_concurrent'))
    assert all('t' in out.splitlines() for out in outputs), outputs
    assert query(f"select count(*) from public.dydd_guest_orders where id='{oid}' and status='paid';") == '1'
    print('PASS: two concurrent payment deliveries bind exactly one paid order')
    save = f"select public.dydd_guest_save_result('{sid}','{oid}','{points}')"
    outputs = race(save,save)
    rid = query(f"select id from public.dydd_guest_results where order_id='{oid}';")
    assert all(rid in out.splitlines() for out in outputs), outputs
    assert query(f"select count(*) from public.dydd_guest_results where order_id='{oid}';") == '1'
    print('PASS: concurrent saves return the same unique result (no rescore)')
    leases = [str(uuid.uuid4()),str(uuid.uuid4())]
    def claim(lease):
        return f"update public.dydd_guest_results set report_state='creating',report_lease='{lease}' where id='{rid}' and report_state='not_started' returning id"
    outputs = race(claim(leases[0]),claim(leases[1]))
    assert sum(rid in out.splitlines() for out in outputs) == 1, outputs
    print('PASS: concurrent report CAS has exactly one lease winner')
    pd = order('cs_pd_race','designpd',rid)
    assert query(payment(pd,'cs_pd_race','pi_pd_race')).splitlines()[0] == 't'
    pd_scores = '{"designIdSnapshotId":"' + rid + '"}'
    savepd = f"select public.dydd_guest_save_result('{sid}','{pd}','{pd_scores}')"
    reverse = "select public.dydd_guest_reverse_payment('stripe_test','pi_concurrent','cs_concurrent')"
    # Save may be rejected when reversal wins; either outcome must leave all access revoked.
    def tolerant(sql):
        return f"do $$ begin perform ({sql}); exception when raise_exception then null; end $$"
    race(tolerant(savepd),reverse)
    assert query(f"select count(*) from public.dydd_guest_orders where id in ('{oid}','{pd}') and status='refunded';") == '2'
    assert query(payment(pd,'cs_pd_race','pi_pd_race')).splitlines()[0] == 'f'
    print('PASS: concurrent PD save / source refund serializes; both orders end revoked')
    early = order('cs_refund_race')
    race(payment(early,'cs_refund_race','pi_refund_race'), "select public.dydd_guest_reverse_payment('stripe_test','pi_refund_race','cs_refund_race')")
    assert query(f"select status from public.dydd_guest_orders where id='{early}';") == 'refunded'
    assert query(payment(early,'cs_refund_race','pi_refund_race')).splitlines()[0] == 'f'
    print('PASS: concurrent payment / reversal always ends refunded; replay cannot resurrect')
    fresh = order('cs_mode')
    assert query(payment(fresh,'cs_mode','pi_mode')).splitlines()[0] == 't'
    query("update public.dydd_public_assessment_runtime set payment_mode='live';")
    assert query(payment(fresh,'cs_mode','pi_mode')).splitlines()[0] == 'f'
    blocked = docker('exec','-i',container,'psql','-X','-U','postgres','-v','ON_ERROR_STOP=1',sql=f"select public.dydd_guest_save_result('{sid}','{fresh}','{points}');",check=False)
    assert blocked.returncode != 0 and 'valid paid guest order' in blocked.stderr
    assert query("select public.dydd_guest_reverse_payment('stripe_test','pi_mode','cs_mode');").splitlines()[0] == 't'
    query("update public.dydd_public_assessment_runtime set payment_mode='test';")
    print('PASS: mode switch blocks payment/save while old-mode reversal remains accepted')
    assert query("select pg_get_functiondef('public.dydd_public_assessment_provider_allowed(text)'::regprocedure); select * from public.account_sentinel;") == baseline
    print('PASS: existing provider function definition and unrelated account sentinel unchanged')
    print('PASS: isolated PostgreSQL 17 verification complete; production never contacted')
finally:
    docker('stop', container, check=False)

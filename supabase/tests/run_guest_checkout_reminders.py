#!/usr/bin/env python3
"""Isolated PostgreSQL; no credentials, outbound calls or production data."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess,uuid
root=Path(__file__).resolve().parents[2]; container='dydd-reminder-test-'+uuid.uuid4().hex[:10]
def docker(*args,sql=None,check=True):
 r=subprocess.run(['docker',*args],input=sql,text=True,capture_output=True)
 if check and r.returncode: raise RuntimeError(r.stdout+r.stderr)
 return r
def query(sql,check=True):return docker('exec','-i',container,'psql','-h','127.0.0.1','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql=sql,check=check)
try:
 docker('run','-d','--rm','--name',container,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine')
 docker('exec',container,'sh','-c','until pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do sleep 0.1; done')
 query("create role anon;create role authenticated;create role service_role bypassrls;create function public.dydd_public_assessment_provider_allowed(text) returns boolean language sql as $$select $1='stripe_test'$$;")
 query((root/'supabase/migrations/20261112000100_public_guest_assessments.sql').read_text())
 query("alter table public.dydd_guest_orders add column access_grant_id uuid;create table public.dydd_email_suppressions(email text primary key);")
 sid=query("insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('a',64),'Reminder','reminder@example.invalid') returning id").stdout.splitlines()[0]
 old=query(f"insert into public.dydd_guest_orders(session_id,product,payment_provider) values('{sid}','designid','stripe_test') returning id").stdout.splitlines()[0]
 query((root/'supabase/migrations/20261112155246_guest_checkout_reminder.sql').read_text())
 assert query('select count(*) from public.dydd_guest_checkout_reminders').stdout.strip()=='0','no historical backfill'
 query(f"update public.dydd_guest_orders set status='cancelled' where id='{old}'")
 oid=query(f"insert into public.dydd_guest_orders(session_id,product,payment_provider,payment_reference) values('{sid}','designid','stripe_test','cs_fixture') returning id").stdout.splitlines()[0]
 assert query(f"select count(*) from public.dydd_guest_checkout_reminders where order_id='{oid}' and due_at=created_at+interval '1 hour' and expires_at=created_at+interval '24 hours'").stdout.strip()=='1'
 assert query(f"select public.dydd_guest_register_checkout_reminder('{oid}',repeat('b',64),'{{}}')").stdout.splitlines()[0]=='f'
 assert query(f"select public.dydd_guest_register_checkout_reminder('{oid}',repeat('a',64),'{{\"immutable\":true}}')").stdout.splitlines()[0]=='t'
 assert query(f"select public.dydd_guest_register_checkout_reminder('{oid}',repeat('a',64),'{{\"changed\":true}}')").stdout.splitlines()[0]=='f'
 assert query('select count(*) from public.dydd_guest_claim_checkout_reminders(10)').stdout.strip()=='0','cannot claim early'
 query("update public.dydd_guest_checkout_reminders set due_at=now()-interval '1 second'")
 def claim(_):return query('select order_id from public.dydd_guest_claim_checkout_reminders(10)').stdout.strip()
 with ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(claim,range(8)))
 assert sum(bool(r) for r in results)==1,results
 lease=query(f"select claim_token from public.dydd_guest_checkout_reminders where order_id='{oid}'").stdout.strip()
 assert query(f"select public.dydd_guest_authorize_checkout_reminder('{oid}',gen_random_uuid())").stdout.strip()=='f'
 assert query(f"select public.dydd_guest_authorize_checkout_reminder('{oid}','{lease}')").stdout.strip()=='t'
 assert query(f"select public.dydd_guest_authorize_checkout_reminder('{oid}','{lease}')").stdout.strip()=='f','one submit transition per lease'
 query(f"select public.dydd_guest_mark_checkout_resumed('{sid}')")
 assert query(f"select status from public.dydd_guest_checkout_reminders where order_id='{oid}'").stdout.strip()=='skipped'
 assert query(f"select public.dydd_guest_authorize_checkout_reminder('{oid}','{lease}')").stdout.strip()=='f'
 query(f"update public.dydd_guest_checkout_reminders set status='queued',resumed_at=null;update public.dydd_guest_orders set status='cancelled' where id='{oid}'")
 assert query(f"select status from public.dydd_guest_checkout_reminders where order_id='{oid}'").stdout.strip()=='skipped','status trigger cancels'
 query("update public.dydd_guest_checkout_reminders set status='queued',expires_at=now()-interval '1 second'")
 assert query('select count(*) from public.dydd_guest_claim_checkout_reminders(10)').stdout.strip()=='0'
 assert query('select status from public.dydd_guest_checkout_reminders').stdout.strip()=='review'
 for role in ['anon','authenticated']:
  assert query(f"select has_table_privilege('{role}','public.dydd_guest_checkout_reminders','select')").stdout.strip()=='f'
  for fn in ['dydd_guest_register_checkout_reminder(uuid,text,jsonb)','dydd_guest_mark_checkout_resumed(uuid)','dydd_guest_claim_checkout_reminders(integer)','dydd_guest_authorize_checkout_reminder(uuid,uuid)']:
   assert query(f"select has_function_privilege('{role}','public.{fn}','execute')").stdout.strip()=='f'
 print('PASS SQL: future-only/no backfill, +1h due, +24h cutoff, immutable proof-bound registration, no early claim, 8 concurrent claims exactly one winner, stale lease denial, single submit transition, resumed/cancelled suppression, expiry cutoff, browser table/RPC ACL')
finally:docker('rm','-f',container,check=False)

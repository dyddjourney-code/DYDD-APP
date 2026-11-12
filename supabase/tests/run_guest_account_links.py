#!/usr/bin/env python3
"""Disposable local PostgreSQL ONLY; never loads credentials or applies production SQL."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess, uuid
root=Path(__file__).resolve().parents[2]
container='dydd-link-test-'+uuid.uuid4().hex[:10]
def docker(*args,sql=None,check=True):
 r=subprocess.run(['docker',*args],input=sql,text=True,capture_output=True)
 if check and r.returncode: raise RuntimeError(r.stdout+r.stderr)
 return r
def query(sql,check=True):
 return docker('exec','-i',container,'psql','-h','127.0.0.1','-X','-U','postgres','-At','-v','ON_ERROR_STOP=1',sql=sql,check=check)
try:
 docker('run','-d','--rm','--name',container,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust','postgres:17-alpine')
 docker('exec',container,'sh','-c','until pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; do sleep 0.1; done')
 query("""
 create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean,banned_until timestamptz);
 create function public.dydd_public_assessment_provider_allowed(p_provider text) returns boolean language sql as $$ select p_provider='stripe_test' $$;
 """)
 for name in ['20261112000100_public_guest_assessments.sql','20261112142808_guest_group_access.sql','20261112142809_secure_guest_account_linking.sql']:
  query((root/'supabase/migrations'/name).read_text())
 query((root/'supabase/tests/guest_account_links.sql').read_text())
 assert query('select count(*) from public.dydd_guest_account_links').stdout.strip()=='0'
 print('PASS SQL: wrong/missing proof, unverified/anonymous/nonexistent accounts, expired cookie, browser RPC/table ACL, immutable binding/audit, contact provenance, idempotency and fixture rollback')
 query("insert into auth.users(id,email,email_confirmed_at,is_anonymous) values ('11111111-1111-4111-8111-111111111111','one@example.test',now(),false),('22222222-2222-4222-8222-222222222222','two@example.test',now(),false)")
 sid=query("insert into public.dydd_guest_sessions(capability_hash,participant_name,participant_email) values(repeat('c',64),'Race','race@example.test') returning id").stdout.splitlines()[0]
 def claim(uid):
  return query(f"set role service_role; select public.dydd_guest_link_verified_account('{sid}','{uid}',repeat('c',64))",check=False)
 with ThreadPoolExecutor(max_workers=2) as pool:
  results=list(pool.map(claim,['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222']))
 assert sum(r.returncode==0 for r in results)==1
 assert query('select count(*) from public.dydd_guest_account_links').stdout.strip()=='1'
 assert query('select count(*) from public.dydd_guest_account_link_audit').stdout.strip()=='1'
 print('PASS concurrent competing verified claims: exactly one immutable owner and one atomic audit')
finally:
 docker('rm','-f',container,check=False)

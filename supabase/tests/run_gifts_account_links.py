#!/usr/bin/env python3
"""Disposable local PostgreSQL ONLY. No production credentials or production SQL execution."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess, uuid
root=Path(__file__).resolve().parents[2]
container='dydd-gifts-test-'+uuid.uuid4().hex[:10]
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
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated;
 create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
 create table public.assessment_snapshots(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id),assessment_type text not null,scores jsonb not null default '{}',source text,created_at timestamptz not null default now());
 alter table public.assessment_snapshots enable row level security;
 """)
 for name in ['20260806203250_assessment_participant_identity.sql','20260905144000_add_spiritual_gifts_app_channel.sql','20261112143754_secure_public_gifts_account_linking.sql']:
  query((root/'supabase/migrations'/name).read_text())
 query('grant select on public.assessment_snapshots,public.assessment_participants,public.spiritual_gifts_sessions,public.spiritual_gifts_responses to authenticated;')
 query((root/'supabase/tests/gifts_account_links.sql').read_text())
 assert query('select count(*) from public.dydd_gifts_account_links').stdout.strip()=='0'
 print('PASS hosted-compatible rollback SQL: exact capability, verified/nonanonymous Auth, native/pending rejection, cross-email contact retention, no provenance rewrites, immutable/idempotent claims, browser ACL, participant-based RLS blocked')
 # Independent committed local-only fixtures exercise actual competing transactions.
 uid1,uid2,pid,snap,sid=[str(uuid.uuid4()) for _ in range(5)]
 query(f"insert into auth.users(id,email,email_confirmed_at) values ('{uid1}','one@example.test',now()),('{uid2}','two@example.test',now()); insert into public.assessment_participants(id,normalized_email) values('{pid}','contact@example.test'); insert into public.assessment_snapshots(id,assessment_type) values('{snap}','spiritual_gifts'); insert into public.spiritual_gifts_sessions(id,participant_id,result_snapshot_id,intake_token_hash,metadata,session_status,submitted_at) values('{sid}','{pid}','{snap}',repeat('c',64),'{{\"channel\":\"public_assessment\"}}','completed',now());")
 def claim(uid): return query(f"set role service_role; select public.dydd_gifts_link_verified_account('{sid}','{uid}',repeat('c',64))",check=False)
 with ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(claim,[uid1,uid2]))
 assert sum(r.returncode==0 for r in results)==1
 assert query('select count(*) from public.dydd_gifts_account_links').stdout.strip()=='1'
 assert query('select count(*) from public.dydd_gifts_account_link_audit').stdout.strip()=='1'
 print('PASS concurrent competing Gifts claims: exactly one owner and one atomic audit')
finally: docker('rm','-f',container,check=False)

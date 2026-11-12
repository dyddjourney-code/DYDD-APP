#!/usr/bin/env python3
"""Disposable PostgreSQL17 contract tests; never connects to a remote database."""
from pathlib import Path
import subprocess,time,uuid
R=Path(__file__).resolve().parents[1];N='dydd-bridge-'+uuid.uuid4().hex[:10]
CMD=['docker','exec','-i',N,'psql','-X','-qAt','-U','postgres','-v','ON_ERROR_STOP=1']
def sql(q,error=None):
 r=subprocess.run(CMD,input=q,text=True,capture_output=True,timeout=30)
 if error:assert r.returncode and error in r.stderr,r.stderr
 else:assert r.returncode==0,r.stderr
 return r.stdout.strip()
try:
 subprocess.run(['docker','run','--detach','--rm','--pull=never','--name',N,'-e','POSTGRES_PASSWORD=local-only','postgres:17-alpine'],check=True,capture_output=True)
 for _ in range(100):
  if subprocess.run(['docker','exec',N,'pg_isready','-h','127.0.0.1','-U','postgres'],capture_output=True).returncode==0:break
  time.sleep(.1)
 sql((R/'tests/sql/public-assessment-production-bootstrap.sql').read_text());sql((R/'tests/sql/public-assessment-production-managed-stubs.sql').read_text())
 sql('alter table auth.users add column is_anonymous boolean default false,add column banned_until timestamptz;')
 for p in sorted((R/'supabase/migrations').glob('*.sql')):
  sql(p.read_text())
 sql('grant all on public.assessment_snapshots,public.assessment_participants to service_role;')
 sql('begin;'+(R/'tests/sql/verified-guest-bridge.sql').read_text()+'commit;')
 bridge=(R/'supabase/migrations/20261112175033_verified_guest_school_bridge.sql').read_text()
 sql(bridge[bridge.index('do $backfill$'):bridge.index('end $backfill$;')+len('end $backfill$;')])
 assert sql('select current_user')=='postgres'
 print('PASS full migration replay, exact-email auto-link, verified/banned/alias/conflict denial, projection immutability, eligible source and course FK, original completion cooldown, refund fencing; PostgreSQL '+sql('show server_version'))
finally:subprocess.run(['docker','stop',N],capture_output=True)

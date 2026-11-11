#!/usr/bin/env python3
"""Disposable Docker PostgreSQL 17 integration tests. Never accepts a remote DB URL."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
NAME = 'dydd-assessment-sql-' + uuid.uuid4().hex[:10]
IMAGE = 'postgres:17-alpine'
MIGRATIONS = [
 '20261111215314_public_assessment_production_schema.sql',
 '20261111215316_public_assessment_production_reservations.sql',
 '20261111215318_public_assessment_production_rpc.sql',
]
BASELINE = [
 '20260805023500_initial_school_schema.sql',
 '20260806203250_assessment_participant_identity.sql',
 '20261015161544_designid_six_month_retake_policy.sql',
]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--full-baseline', action='store_true', help='Replay all 28 baseline SQL files, including actual lifecycle triggers')
parser.add_argument('--with-artifact-recovery', action='store_true', help='Also verify parent integration recovery migration')
args = parser.parse_args()
if args.with_artifact_recovery:
 MIGRATIONS.append('20261111215818_public_assessment_artifact_recovery.sql')
if args.full_baseline:
 BASELINE = sorted(p.name for p in (ROOT/'supabase/migrations').glob('*.sql') if p.name[:14] <= '20261028213224')
CMD = ['docker', 'exec', '-i', NAME, 'psql', '-X', '-qAt', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1']
U = '00000000-0000-0000-0000-000000000001'
P = '10000000-0000-0000-0000-000000000001'
SRC = '20000000-0000-0000-0000-000000000001'

def sql(query, allowed_error=None):
 result = subprocess.run(CMD, input=query, text=True, capture_output=True, timeout=20)
 if allowed_error:
  assert result.returncode and allowed_error in result.stderr, result.stderr
 else:
  assert result.returncode == 0, result.stderr
 return result.stdout.strip()

def apply_file(path):
 sql(path.read_text())

def pair(first, second, second_error=None):
 """The first transaction emits its marker only AFTER holding its actual DB locks."""
 proc = subprocess.Popen(CMD, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
 script = "begin; set local statement_timeout='8s'; set role service_role;\n" + first + "\n\\echo LOCK_HELD\nselect pg_sleep(0.6); commit;\n"
 proc.stdin.write(script)
 proc.stdin.close()
 # stdout is flushed by psql's \echo, so no sleep-based guess about lock acquisition.
 while True:
  line = proc.stdout.readline()
  if line.strip() == 'LOCK_HELD':
   break
  assert line, proc.stderr.read()
 output = sql("set statement_timeout='8s'; set role service_role;" + second, second_error)
 proc.wait(timeout=12)
 error = proc.stderr.read()
 assert proc.returncode == 0, error
 return output

def order(label, product='designid', source='null'):
 return sql(f"""set role service_role; insert into public.dydd_public_assessment_orders
 (user_id,product,source_snapshot_id,payment_provider,payment_reference,expected_price_id,expected_product_id,expected_amount,currency)
 values('{U}','{product}',{source},'stripe_test','cs_{label}','price_fixture','prod_fixture',1234,'usd') returning id;""")

def fulfill(oid, label):
 return f"select public.dydd_apply_verified_public_assessment_payment('{oid}','cs_{label}',1234,'usd','price_fixture','pi_{label}','stripe_test');"

def revoke(label):
 return f"select public.dydd_revoke_public_assessment_payment('pi_{label}','stripe_test');"

def reserve(version):
 return f"""select public.reserve_designpd_generation('{U}','{SRC}','{version}','{P}',
 '{{"designIdSnapshotId":"{SRC}","contentVersion":"{version}"}}');"""

try:
 subprocess.run(['docker','image','inspect',IMAGE], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
 subprocess.run(['docker','run','--detach','--rm','--pull=never','--name',NAME,'-e','POSTGRES_PASSWORD=local-disposable-only',IMAGE], check=True, stdout=subprocess.DEVNULL)
 for attempt in range(100):
  ready = subprocess.run(['docker','exec',NAME,'pg_isready','-h','127.0.0.1','-U','postgres'], capture_output=True)
  if ready.returncode == 0:
   break
  time.sleep(0.1)
 else:
  raise AssertionError('Disposable PostgreSQL did not start')
 apply_file(ROOT/'tests/sql/public-assessment-production-bootstrap.sql')
 if args.full_baseline:
  apply_file(ROOT/'tests/sql/public-assessment-production-managed-stubs.sql')
 for name in BASELINE:
  apply_file(ROOT/'supabase/migrations'/name)
 sql('grant all on public.assessment_snapshots,public.assessment_participants to service_role;')
 legacy_sql = sql("select pg_get_functiondef('public.save_designid_attempt(uuid,uuid,text,boolean,jsonb)'::regprocedure);")
 for name in MIGRATIONS:
  apply_file(ROOT/'supabase/migrations'/name)
 assert legacy_sql == sql("select pg_get_functiondef('public.save_designid_attempt(uuid,uuid,text,boolean,jsonb)'::regprocedure);"), 'Legacy six-month function changed'
 apply_file(ROOT/'tests/sql/public-assessment-production.sql')
 if args.with_artifact_recovery:
  apply_file(ROOT/'tests/sql/public-assessment-production-recovery.sql')
  print('PASS: parent recovery migration archive prerequisite, ownership, atomic consumption and replay')
 print(f'Baseline replayed: {len(BASELINE)} actual migrations')
 print('PASS: ordered additive migrations, SQL contracts, RLS/grants, actual role denials, legacy save unchanged')

 oid = order('race_paid_first')
 pair(fulfill(oid,'race_paid_first'), revoke('race_paid_first'))
 assert sql(f"select status||':'||fulfillment_status from public.dydd_public_assessment_orders where id='{oid}'") == 'refunded:revoked'
 assert sql(f"select revoked_at is not null from public.dydd_public_assessment_entitlements where order_id='{oid}'") == 't'
 print('PASS: concurrent fulfillment-first then reversal revokes entitlement')
 oid = order('race_reversed_first')
 pair(revoke('race_reversed_first'), fulfill(oid,'race_reversed_first'), 'refunded or disputed')
 assert sql(f"select count(*) from public.dydd_public_assessment_entitlements where order_id='{oid}'") == '0'
 print('PASS: concurrent reversal-first blocks fulfillment/replay')
 result = pair(reserve('race-reservation'), reserve('race-reservation'))
 assert json.loads(result)['status'] == 'running', result
 assert sql("select count(*) from public.designpd_generation_reservations where content_version='race-reservation'") == '1'
 print('PASS: concurrent absent-row reservation creates one job/snapshot')
 # A refund taking the order lock before completion must fence consumption after the wait.
 oid = order('race_refund_finish','designpd',f"'{SRC}'")
 sql('set role service_role;'+fulfill(oid,'race_refund_finish'))
 reserved = json.loads(sql('set role service_role;'+reserve('race-refund-finish')))
 finish = f"select public.finish_public_designpd_generation('{U}','{SRC}','race-refund-finish','{reserved['token']}','{{\"status\":\"ready\"}}','https://example.com/report');"
 result = pair(revoke('race_refund_finish'), finish)
 assert result == 'f', result
 assert sql(f"select consumed_at is null and revoked_at is not null from public.dydd_public_assessment_entitlements where order_id='{oid}'") == 't'
 print('PASS: concurrent reversal-before-completion does not consume access')
 # Completion first then refund is also serialized; retain artifact and consumed audit, revoke future rights.
 oid = order('race_finish_refund','designpd',f"'{SRC}'")
 sql('set role service_role;'+fulfill(oid,'race_finish_refund'))
 reserved = json.loads(sql('set role service_role;'+reserve('race-finish-refund')))
 finish = f"select public.finish_public_designpd_generation('{U}','{SRC}','race-finish-refund','{reserved['token']}','{{\"status\":\"ready\"}}','https://example.com/report');"
 pair(finish, revoke('race_finish_refund'))
 assert sql(f"select consumed_at is not null and revoked_at is not null and completion_snapshot_id is not null from public.dydd_public_assessment_entitlements where order_id='{oid}'") == 't'
 print('PASS: concurrent completion-before-refund retains artifact/audit and revokes grant')
 print('PASS: PostgreSQL '+sql('show server_version;'))
 print('Six-month function definition SHA256: '+hashlib.sha256(legacy_sql.encode()).hexdigest())
finally:
 subprocess.run(['docker','stop',NAME], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

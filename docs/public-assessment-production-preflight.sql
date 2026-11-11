-- READ-ONLY INVENTORY. Does not mutate data or reveal user/customer/email contents.
-- Use before reviewing this additive bundle against the actual production database.
begin read only;
select current_database(),current_user,current_setting('server_version') as postgres_version;
select to_regclass('supabase_migrations.schema_migrations') as migration_history_table;
-- If present, separately SELECT version,name FROM supabase_migrations.schema_migrations ORDER BY version;
select n.nspname as schema_name,c.relname,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname in ('public','auth') and c.relname in
 ('users','assessment_snapshots','assessment_participants','designid_retake_overrides',
 'dydd_assessment_grandfathered_access','dydd_public_assessment_runtime',
 'dydd_public_assessment_orders','dydd_public_assessment_codes','dydd_public_assessment_entitlements',
 'dydd_public_assessment_payment_reversals','designpd_generation_reservations') order by 1,2;
select table_schema,table_name,column_name,data_type,is_nullable
from information_schema.columns
where (table_schema='auth' and table_name='users' and column_name in ('id','email','email_confirmed_at','deleted_at'))
 or (table_schema='public' and table_name in ('assessment_snapshots','assessment_participants','designid_retake_overrides'))
order by table_schema,table_name,ordinal_position;
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,p.proconfig,
 has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','dydd_private') and
 (p.proname like '%public_assessment%' or p.proname in ('save_designid_attempt','save_public_designid_attempt',
 'retake_verified_email','timing_email_key','reserve_designpd_generation','finish_designpd_generation','finish_public_designpd_generation'))
order by 1,2,3;
-- Must remain the existing six-calendar-month function, with no 90-day sandbox replacement.
select pg_get_functiondef(to_regprocedure('public.save_designid_attempt(uuid,uuid,text,boolean,jsonb)')) as existing_designid_save;
select c.relname,con.conname,pg_get_constraintdef(con.oid)
from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and (c.relname like 'dydd_public_assessment_%' or c.relname='designpd_generation_reservations')
order by 1,2;
select tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and (tablename like 'dydd_public_assessment_%' or tablename in
 ('dydd_assessment_grandfathered_access','designpd_generation_reservations','assessment_snapshots','assessment_participants'))
order by tablename,policyname;
select c.relname,
 has_table_privilege('service_role',c.oid,'SELECT') as service_select,
 has_table_privilege('service_role',c.oid,'INSERT') as service_insert,
 has_table_privilege('service_role',c.oid,'UPDATE') as service_update,
 has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE') as anon_any_data_privilege,
 has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE') as authenticated_any_data_privilege
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'
and (c.relname like 'dydd_public_assessment_%' or c.relname in
 ('assessment_snapshots','assessment_participants','designid_retake_overrides','designpd_generation_reservations','dydd_assessment_grandfathered_access'))
order by c.relname;
rollback;
-- Supabase-specific private assessment-report-pdfs bucket inventory is separate:
-- SELECT id,public FROM storage.buckets WHERE id='assessment-report-pdfs';
-- Do not proceed from the repository migration list alone: it is not hosted history proof.

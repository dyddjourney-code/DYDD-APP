-- Disposable PostgreSQL-only stand-in for the managed Auth role/catalog boundary.
-- Not a deployment migration; do not run against any hosted database.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,deleted_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
grant usage on schema auth to anon,authenticated,service_role;
create schema test_support;
create function test_support.ok(v boolean,msg text) returns void language plpgsql as $$
begin if v is distinct from true then raise exception 'Assertion failed: %',msg;end if;end $$;
create function test_support.rejects(q text,msg text) returns void language plpgsql as $$
begin
 begin execute q;exception when others then
  if position(msg in sqlerrm)=0 then raise exception 'Unexpected rejection %, wanted %',sqlerrm,msg;end if;
  return;
 end;
 raise exception 'Expected rejection: %',msg;
end $$;
grant usage on schema test_support to anon,authenticated,service_role;
grant execute on all functions in schema test_support to anon,authenticated,service_role;

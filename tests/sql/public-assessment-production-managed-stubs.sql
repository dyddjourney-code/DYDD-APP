-- Additional managed-platform stand-ins for replaying the entire 023b480 baseline.
-- Only local tests; these are NOT deployable replacements for Supabase Auth/Storage.
create schema extensions;
create extension pgcrypto with schema extensions;
create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;

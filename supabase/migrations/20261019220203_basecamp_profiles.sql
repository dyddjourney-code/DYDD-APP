-- Separate from account identity, assessment matching and private reflections.
create table public.basecamp_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  bio text not null default '' check (char_length(bio) <= 600),
  fun_facts text[] not null default '{}' check (cardinality(fun_facts) <= 3 and char_length(array_to_string(fun_facts, '')) <= 360),
  photo_path text check (photo_path is null or photo_path like user_id::text || '/%'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.basecamp_profiles enable row level security;
grant select, insert, update on public.basecamp_profiles to authenticated;
revoke all on public.basecamp_profiles from anon;
create policy "Read own Base Camp profile" on public.basecamp_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own Base Camp profile" on public.basecamp_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own Base Camp profile" on public.basecamp_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('basecamp-photos', 'basecamp-photos', false, 1048576, array['image/jpeg','image/png','image/webp']);
create policy "Read own Base Camp photo" on storage.objects for select to authenticated using (bucket_id = 'basecamp-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own Base Camp photo" on storage.objects for insert to authenticated with check (bucket_id = 'basecamp-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Remove own Base Camp photo" on storage.objects for delete to authenticated using (bucket_id = 'basecamp-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

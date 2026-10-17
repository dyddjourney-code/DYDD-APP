begin;
create table public.reflection_rounds (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 course_slug text not null,
 last_lesson_slug text,
 questions jsonb not null check (jsonb_typeof(questions) = 'array'),
 assessment_snapshot_id text,
 assessment_label text,
 source text not null default 'course',
 started_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 legacy_key text unique
);
create index reflection_rounds_owner_course on public.reflection_rounds(user_id,course_slug,started_at desc,id);
create table public.reflection_entries (
 id uuid primary key default gen_random_uuid(),
 round_id uuid not null references public.reflection_rounds(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 question_id text not null,
 prompt text not null,
 question_version text not null,
 lesson_slug text not null,
 lesson_title text not null,
 response text not null check(length(response)<=8000),
 revision integer not null check(revision>0),
 saved_at timestamptz not null default now(),
 unique(round_id,question_id,revision)
);
create index reflection_entries_owner_round on public.reflection_entries(user_id,round_id,question_id,revision desc);
alter table public.reflection_rounds enable row level security;
alter table public.reflection_entries enable row level security;
-- Do not inherit broad Supabase default table privileges.
revoke all on public.reflection_rounds,public.reflection_entries from public,anon,authenticated;
create policy "read own reflection rounds" on public.reflection_rounds for select to authenticated using((select auth.uid())=user_id);
create policy "create own reflection rounds" on public.reflection_rounds for insert to authenticated with check((select auth.uid())=user_id);
create policy "read own reflection history" on public.reflection_entries for select to authenticated using((select auth.uid())=user_id);
create policy "append own reflection history" on public.reflection_entries for insert to authenticated with check((select auth.uid())=user_id and exists(select 1 from public.reflection_rounds r where r.id=round_id and r.user_id=(select auth.uid())));
create policy "update own reflection position" on public.reflection_rounds for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
grant update(last_lesson_slug,updated_at) on public.reflection_rounds to authenticated;
grant select,insert on public.reflection_rounds,public.reflection_entries to authenticated;
grant all on public.reflection_rounds,public.reflection_entries to service_role;
revoke all on public.reflection_rounds,public.reflection_entries from anon;

-- Invoker privileges + RLS; append-only, serialized per question, detects stale tabs.
create function public.save_reflection_entry(p_round_id uuid,p_question_id text,p_response text,p_expected_revision integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.reflection_rounds; q jsonb; previous public.reflection_entries; result public.reflection_entries;
begin
 if auth.uid() is null then raise exception 'Sign in to save reflections.' using errcode='42501'; end if;
 select * into r from public.reflection_rounds where id=p_round_id and user_id=auth.uid();
 if not found then raise exception 'Reflection round not found.' using errcode='42501'; end if;
 select value into q from jsonb_array_elements(r.questions) where value->>'id'=p_question_id limit 1;
 if q is null or p_response is null or length(p_response)>8000 then raise exception 'Invalid reflection.' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_round_id::text||':'||p_question_id,0));
 select * into previous from public.reflection_entries where round_id=p_round_id and question_id=p_question_id order by revision desc limit 1;
 if coalesce(previous.revision,0) <> p_expected_revision then raise exception 'This answer changed in another tab. Reload before saving.' using errcode='PT409'; end if;
 if previous.id is not null and previous.response=p_response then return to_jsonb(previous); end if;
 insert into public.reflection_entries(round_id,user_id,question_id,prompt,question_version,lesson_slug,lesson_title,response,revision)
 values(p_round_id,auth.uid(),p_question_id,q->>'prompt',q->>'version',q->>'lessonSlug',q->>'lessonTitle',p_response,coalesce(previous.revision,0)+1) returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.save_reflection_entry(uuid,text,text,integer) from public,anon;
grant execute on function public.save_reflection_entry(uuid,text,text,integer) to authenticated;
commit;

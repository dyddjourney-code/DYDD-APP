create table if not exists public.course_lesson_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_slug text not null,
  lesson_slug text not null,
  lesson_title text not null,
  prompt text not null,
  response text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_slug, lesson_slug)
);

create index if not exists course_lesson_reflections_user_course_idx
on public.course_lesson_reflections (user_id, course_slug, updated_at desc);

drop trigger if exists set_course_lesson_reflections_updated_at
on public.course_lesson_reflections;

create trigger set_course_lesson_reflections_updated_at
before update on public.course_lesson_reflections
for each row
execute function public.set_updated_at();

alter table public.course_lesson_reflections enable row level security;

drop policy if exists "students read own course lesson reflections"
on public.course_lesson_reflections;

create policy "students read own course lesson reflections"
on public.course_lesson_reflections for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "students create own course lesson reflections"
on public.course_lesson_reflections;

create policy "students create own course lesson reflections"
on public.course_lesson_reflections for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "students update own course lesson reflections"
on public.course_lesson_reflections;

create policy "students update own course lesson reflections"
on public.course_lesson_reflections for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on public.course_lesson_reflections to authenticated;

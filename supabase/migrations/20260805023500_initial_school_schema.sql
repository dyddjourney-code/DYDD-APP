create table if not exists public.school_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (course_id, position)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete set null,
  slug text not null,
  title text not null,
  position integer not null,
  content_mdx text,
  video_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  source text,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.assessment_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null,
  scores jsonb not null default '{}'::jsonb,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  prompt text not null,
  response text not null,
  companion_response text,
  created_at timestamptz not null default now()
);

alter table public.school_profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.assessment_snapshots enable row level security;
alter table public.lesson_reflections enable row level security;

create policy "profiles are visible to owner"
on public.school_profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles are updated by owner"
on public.school_profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "published courses are readable"
on public.courses for select
to anon, authenticated
using (status = 'published');

create policy "published modules are readable"
on public.course_modules for select
to anon, authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = course_modules.course_id
      and courses.status = 'published'
  )
);

create policy "published lessons are readable"
on public.lessons for select
to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.enrollments
    where enrollments.course_id = lessons.course_id
      and enrollments.user_id = (select auth.uid())
      and enrollments.status = 'active'
  )
);

create policy "students read own enrollments"
on public.enrollments for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "students read own progress"
on public.lesson_progress for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "students upsert own progress"
on public.lesson_progress for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "students update own progress"
on public.lesson_progress for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "students read own assessments"
on public.assessment_snapshots for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "students read own reflections"
on public.lesson_reflections for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "students create own reflections"
on public.lesson_reflections for insert
to authenticated
with check ((select auth.uid()) = user_id);


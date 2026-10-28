-- Additive checklist: position/reflection history never imply lesson completion.
create table public.passport_lesson_completions (
 user_id uuid not null references auth.users(id) on delete cascade,
 course_slug text not null,
 lesson_slug text not null,
 completed_at timestamptz not null default now(),
 primary key (user_id, course_slug, lesson_slug)
);
create table public.passport_awards (
 user_id uuid not null references auth.users(id) on delete cascade,
 badge_key text not null,
 evidence jsonb not null default '{}'::jsonb,
 awarded_at timestamptz not null default now(),
 primary key (user_id, badge_key)
);
alter table public.passport_lesson_completions enable row level security;
alter table public.passport_awards enable row level security;
revoke all on public.passport_lesson_completions, public.passport_awards from anon, authenticated;
grant select on public.passport_lesson_completions, public.passport_awards to authenticated;
grant all on public.passport_lesson_completions, public.passport_awards to service_role;
create policy "Learners read their checklist" on public.passport_lesson_completions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Learners read their awards" on public.passport_awards for select to authenticated using ((select auth.uid()) = user_id);
-- Writes are server-only: the authenticated endpoint validates canonical lesson order,
-- course access and saved evidence. Learners cannot forge awards through REST.

-- One-time trusted preservation of explicit pre-Passport completions.
-- Old tables are learner-writable. They MUST NOT be consulted for new awards
-- after this baseline. Do not replay this import outside migration history.
insert into public.passport_lesson_completions(user_id,course_slug,lesson_slug,completed_at)
select p.user_id,c.slug,l.slug,p.completed_at
from public.lesson_progress p
join public.lessons l on l.id=p.lesson_id
join public.courses c on c.id=l.course_id
where p.completed_at is not null
on conflict(user_id,course_slug,lesson_slug) do nothing;

insert into public.passport_awards(user_id,badge_key,evidence)
select e.user_id,c.slug,jsonb_build_object('source','legacy_completed_enrollment','course',c.slug,'legacyEnrollmentId',e.id)
from public.enrollments e join public.courses c on c.id=e.course_id
where e.status='completed'
on conflict(user_id,badge_key) do nothing;

insert into public.passport_awards(user_id,badge_key,evidence)
select e.user_id,chapter.badge,jsonb_build_object('source','legacy_completed_enrollment','course',e.journey_slug,'legacyEnrollmentId',e.id)
from public.journey_enrollments e
cross join (values ('DYD Journey Started'),('What is DYDD?'),('Identity'),('Expertise'),('Story'),('Desire'),('Gifts'),('Niche')) as chapter(badge)
where e.journey_slug='discover-your-divine-design' and e.status='completed'
on conflict(user_id,badge_key) do nothing;

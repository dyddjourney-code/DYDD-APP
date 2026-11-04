-- Capture actual current Journey writer format, not only the historical source='course'.
-- No backfill. Retake/import rounds retain their existing exclusions and first-round key.
begin;
create or replace function dydd_private.capture_course_enrollment() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and auth.uid()<>new.user_id then return new; end if;
 if (new.source='course' or (new.course_slug='discover-your-divine-design' and new.source like 'journey-assessments-v1:%'))
 and new.legacy_key is null
 and new.started_at>=(select activated_at from public.dydd_lifecycle_settings where id)
 and not exists(select 1 from public.reflection_rounds where user_id=new.user_id and course_slug=new.course_slug and id<>new.id) then
  insert into public.dydd_lifecycle_events(event_key,kind,user_id,source_id,payload)
  values('course-enrolled:'||new.user_id||':'||new.course_slug,'course_enrolled',new.user_id,new.id::text,jsonb_build_object('courseSlug',new.course_slug))
  on conflict(event_key) do nothing;
 end if;
 return new;
end $$;
revoke all on function dydd_private.capture_course_enrollment() from public,anon,authenticated;
commit;

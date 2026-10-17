begin;
-- No history is rewritten. Save and assessment rollover share a per-course lock.
create or replace function public.save_reflection_entry(p_round_id uuid,p_question_id text,p_response text,p_expected_revision integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.reflection_rounds; q jsonb; previous public.reflection_entries; result public.reflection_entries;
begin
 if auth.uid() is null then raise exception 'Sign in to save reflections.' using errcode='42501'; end if;
 select * into r from public.reflection_rounds where id=p_round_id and user_id=auth.uid();
 if not found then raise exception 'Reflection round not found.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(r.user_id::text||':'||r.course_slug,0));
 if r.id <> (select id from public.reflection_rounds where user_id=auth.uid() and course_slug=r.course_slug order by started_at desc,id desc limit 1) then raise exception 'Previous walkthroughs are read-only. Choose your current walkthrough.' using errcode='PT403'; end if;
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

create or replace function public.sync_assessment_reflection_round(p_course_slug text,p_snapshot_id uuid,p_questions jsonb,p_label text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare current_round public.reflection_rounds; result public.reflection_rounds; assessed_at timestamptz; expected_type text;
begin
 if auth.uid() is null then raise exception 'Sign in.' using errcode='42501'; end if;
 expected_type := case p_course_slug when 'designid-foundations' then 'designid' when 'spiritual-gifts-service' then 'spiritual_gifts' when 'fruitlife-360-formation' then 'fruit_360' when 'designpd-alignment' then 'designpd' end;
 if expected_type is null then raise exception 'Unknown assessment course.' using errcode='22023'; end if;
 select coalesce(s.source_submitted_at,s.created_at) into assessed_at from public.assessment_snapshots s
 left join public.assessment_participants p on p.id=s.participant_id
 where s.id=p_snapshot_id and s.assessment_type=expected_type and (s.user_id=auth.uid() or p.user_id=auth.uid());
 if assessed_at is null then raise exception 'Report not found.' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||p_course_slug,0));
 select * into current_round from public.reflection_rounds where user_id=auth.uid() and course_slug=p_course_slug order by started_at desc,id desc limit 1;
 -- No automatic first round: a learner deliberately begins their first workbook.
 if current_round.id is null then return null; end if;
 if current_round.assessment_snapshot_id=p_snapshot_id::text or assessed_at<=current_round.started_at then return to_jsonb(current_round); end if;
 insert into public.reflection_rounds(user_id,course_slug,questions,assessment_snapshot_id,assessment_label,source)
 values(auth.uid(),p_course_slug,p_questions,p_snapshot_id::text,p_label,'assessment') returning * into result;
 return to_jsonb(result);
end $$;
revoke all on function public.sync_assessment_reflection_round(text,uuid,jsonb,text) from public,anon;
grant execute on function public.sync_assessment_reflection_round(text,uuid,jsonb,text) to authenticated;
-- The same read-only rule also covers direct Data API inserts, not only the UI.
alter policy "append own reflection history" on public.reflection_entries
with check ((select auth.uid())=user_id and round_id=(select r.id from public.reflection_rounds r where r.user_id=(select auth.uid()) and r.course_slug=(select own.course_slug from public.reflection_rounds own where own.id=round_id) order by r.started_at desc,r.id desc limit 1));
commit;

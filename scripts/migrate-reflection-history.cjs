// Generate additive legacy import SQL after deploying the reflection-round schema.
// Usage: node scripts/migrate-reflection-history.cjs > private-import.sql
// Apply using your ordinary privileged database connection; no credentials are printed.
const load = require("./fruitlife-test-load.cjs");
const { reflectionExperiences } = load("lib/reflections/catalog.ts");
const literal = (value) => "'" + String(value).replaceAll("'", "''") + "'";
console.log(
  "begin; create temporary table reflection_catalog_import(course_slug text, questions jsonb) on commit drop;",
);
for (const c of reflectionExperiences)
  console.log(
    `insert into reflection_catalog_import values(${literal(c.slug)},${literal(JSON.stringify(c.questions))}::jsonb);`,
  );
console.log(`
insert into public.reflection_rounds(user_id,course_slug,questions,source,started_at,updated_at,legacy_key)
select l.user_id,l.course_slug,coalesce(c.questions,'[]'::jsonb),'legacy',min(l.created_at),max(l.updated_at),'course:'||l.user_id::text||':'||l.course_slug
from public.course_lesson_reflections l left join reflection_catalog_import c on c.course_slug=l.course_slug group by l.user_id,l.course_slug,c.questions on conflict(legacy_key) do nothing;
update public.reflection_rounds r set questions=(select jsonb_agg(case when l.id is not null then jsonb_set(q.value,'{prompt}',to_jsonb(l.prompt)) else q.value end order by q.ordinality) from jsonb_array_elements(r.questions) with ordinality q(value,ordinality) left join public.course_lesson_reflections l on l.user_id=r.user_id and l.course_slug=r.course_slug and l.lesson_slug=q.value->>'id') where r.source='legacy' and r.legacy_key like 'course:%';
update public.reflection_rounds r set questions=r.questions||coalesce((select jsonb_agg(jsonb_build_object('id',l.lesson_slug,'lessonSlug',l.lesson_slug,'lessonTitle',l.lesson_title,'moduleTitle','Earlier saved work','prompt',l.prompt,'version','legacy')) from public.course_lesson_reflections l where l.user_id=r.user_id and l.course_slug=r.course_slug and not exists(select 1 from jsonb_array_elements(r.questions) q where q->>'id'=l.lesson_slug)),'[]'::jsonb) where r.source='legacy' and r.legacy_key like 'course:%';
insert into public.reflection_entries(round_id,user_id,question_id,prompt,question_version,lesson_slug,lesson_title,response,revision,saved_at) select r.id,l.user_id,l.lesson_slug,l.prompt,'legacy',l.lesson_slug,l.lesson_title,l.response,1,l.updated_at from public.course_lesson_reflections l join public.reflection_rounds r on r.legacy_key='course:'||l.user_id::text||':'||l.course_slug on conflict(round_id,question_id,revision) do nothing;
-- The original chapter-form store also retains its original revisions if populated.
insert into public.reflection_rounds(user_id,course_slug,questions,source,started_at,updated_at,legacy_key)
select l.user_id,'discover-your-divine-design',c.questions,'legacy',min(l.created_at),max(l.updated_at),'journey:'||l.user_id::text
from public.journey_workbook_responses l cross join reflection_catalog_import c where c.course_slug='discover-your-divine-design' group by l.user_id,c.questions on conflict(legacy_key) do nothing;
update public.reflection_rounds r set questions=r.questions||coalesce((select jsonb_agg(jsonb_build_object('id',l.prompt_id,'lessonSlug',l.stage_slug,'lessonTitle',l.stage_title,'moduleTitle',l.stage_title,'prompt',l.prompt_label,'version','legacy')) from (select distinct on(prompt_id) * from public.journey_workbook_responses where user_id=r.user_id order by prompt_id,entry_version desc,created_at desc) l where not exists(select 1 from jsonb_array_elements(r.questions) q where q->>'id'=l.prompt_id)),'[]'::jsonb) where r.legacy_key like 'journey:%';
insert into public.reflection_entries(round_id,user_id,question_id,prompt,question_version,lesson_slug,lesson_title,response,revision,saved_at)
select r.id,l.user_id,l.prompt_id,coalesce(l.prompt_label,l.prompt_id),'legacy',l.stage_slug,coalesce(l.stage_title,l.stage_slug),coalesce(l.response_text,''),row_number() over(partition by r.id,l.prompt_id order by l.entry_version,l.created_at,l.id),l.updated_at from public.journey_workbook_responses l join public.reflection_rounds r on r.legacy_key='journey:'||l.user_id::text on conflict(round_id,question_id,revision) do nothing;
commit;
`);

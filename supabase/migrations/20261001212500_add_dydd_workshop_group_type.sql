alter table public.assessment_groups
drop constraint if exists assessment_groups_group_type_check;

alter table public.assessment_groups
add constraint assessment_groups_group_type_check
check (
  group_type in (
    'class_cohort',
    'camp_circle',
    'couple',
    'marriage_workshop',
    'church_team',
    'leadership_team',
    'discover_your_divine_design_workshop',
    'other'
  )
);

insert into public.native_assessment_definitions (
  assessment_type,
  version,
  title,
  definition,
  status
)
values (
  'maps_personal_roadmap',
  '2026-10-09',
  'MAPS Personal Roadmap',
  '{
    "source": "DesignID Journey Mapping MAPS brain",
    "required_assessments": ["designid", "designpd"],
    "sections": [
      {
        "name": "Mission",
        "subcategories": [
          {"name": "Purpose", "terms": ["Calling", "Direction", "Impact"]},
          {"name": "Culture", "terms": ["Belonging", "Trust", "Unity"]},
          {"name": "Motivation", "terms": ["Care", "Growth", "Life-giving"]}
        ]
      },
      {
        "name": "Approach",
        "subcategories": [
          {"name": "Assessment", "terms": ["Discern", "Understand", "Clarify"]},
          {"name": "Insight", "terms": ["Shape", "Refine", "Adjust"]},
          {"name": "Direction", "terms": ["Improve", "Strengthen", "Elevate"]}
        ]
      },
      {
        "name": "Process",
        "subcategories": [
          {"name": "Proof", "terms": ["Trackable", "Measurable", "Verified"]},
          {"name": "Organization", "terms": ["Defined Roles", "Ownership", "Responsibility"]},
          {"name": "Reliability", "terms": ["Consistent", "Dependable", "Sustainable"]}
        ]
      },
      {
        "name": "Send",
        "subcategories": [
          {"name": "Energy", "terms": ["Initiative", "Activate", "Move"]},
          {"name": "Momentum", "terms": ["Build", "Advance", "Expand"]},
          {"name": "Outcomes", "terms": ["Complete", "Deliver", "Done"]}
        ]
      }
    ],
    "generation_model": {
      "individual": "Command Center can generate a MAPS PDF for any participant with current DesignID and DesignPD snapshots.",
      "email": "Resend can send the generated PDF to the participant profile email.",
      "group": "Command Center group action sends one personalized MAPS report to each active group member with required snapshots."
    }
  }'::jsonb,
  'active'
)
on conflict (assessment_type, version)
do update set
  definition = excluded.definition,
  status = excluded.status,
  title = excluded.title,
  updated_at = now();

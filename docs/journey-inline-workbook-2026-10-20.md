# Journey inline CARE workbook and Field Kit

John confirmed: keep the digitized workbook and live CARE reflection entry inline in the Journey. Field Kit provides another view of the same saved answers, including editing; it does not replace inline work with a link.

Both surfaces use `ReflectionCourseShell` → `ReflectionSession`, the same `discover-your-divine-design` experience, 97 stable workbook/CARE/Pathfinder question IDs and `/api/course-reflections`. Existing current-round editing, earlier read-only rounds, revision history, save conflicts and unsaved-draft protection remain unchanged. No question IDs, course content or stored answers are migrated/deleted.

The Journey alone opts into compact round/history controls: the large “Your private workbook / Reflections for this walk” panel becomes “Saved reflections & history,” collapsed during a current walkthrough. It opens when a learner must begin a round, when viewing an archived round, or on load errors. Field Kit and all other courses retain their existing full panel. CARE prompts remain under the lesson.

Verification: catalog checks cover every published workbook question against the shared experience; typecheck/build/environment isolation; `tests/journey-fieldkit-sync.mjs` uses a synthetic sandbox-only account to exercise class save → Field Kit exact answer → Field Kit edit → class reload at desktop/phone widths, then removes the account. It never edits Jordan's saved work.

Next conversation requested by John: where/how people mark an item for group discussion, what the mark means, how it is indicated and who can see it. Do not implement discussion sharing from this cleanup request.

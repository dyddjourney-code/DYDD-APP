# Content Migration Plan

## Source

The initial source course is the DesignID class currently built in GoHighLevel.

Known limitation: current GHL API access can see the DYDD location and products/memberships, but not the actual membership lesson/code-block content.

## Capture Template

For each lesson:

- Course name.
- Module name.
- Lesson title.
- Lesson order.
- Video URL or embed code.
- Existing code-block HTML.
- Main lesson text.
- Reflection questions.
- Downloads/resources.
- Any calls to action.

## Target Format

Use Markdown or MDX for the first content pass, then move into Supabase tables when the admin workflow is needed.

Suggested frontmatter:

```yaml
course: designid-foundations
module: getting-started
title: Example Lesson
order: 1
video_url:
companion_mode: shepherd
```

## First Migration Batch

1. Course overview.
2. First module.
3. Two to three representative lessons.
4. One reflection prompt per lesson.
5. One personalized DesignID response block.


import { missingPathfinderEntries, retiredPathfinderCanonical } from '@/lib/journey/pathfinder';
import type { ReflectionEntry } from '@/lib/reflections/types';
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { previewParams, previewReflectionRequest } from "@/lib/reflections/preview";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getReflectionExperience, withCurrentJourneyActivities,
  withWhoWhoseExplore,
  withDesignIdWelcome,
  withDesignIdLens, withIdentityBelievers, withDesignReflectionsLove, withOneAnother, withPathfinder, withExpertise,
  reflectionLessonExists,
} from "@/lib/reflections/catalog";
import {
  getAssessmentSnapshotsForUser,
  displayDateTime,
} from "@/lib/assessments/student-context";
import {
  trailDefinitions,
  isTrailAssessmentComplete,
} from "@/lib/trails/catalog";
import { hasDesignPdCourseAccess } from "@/lib/designpd/access";
import {
  getFruitLifeDashboardSessions,
  fruitLifeReportArtifact,
} from "@/lib/fruitlife360/dashboard";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
async function context(
  courseSlug: string,
  user: { id: string; email?: string },
) {
  const experience = getReflectionExperience(courseSlug);
  if (!experience) return null;
  const trail = trailDefinitions.find((t) => t.courseSlug === courseSlug);
  const snapshots = trail
    ? await getAssessmentSnapshotsForUser(user.id, user.email ?? "")
    : { all: [], latest: [] };
  let ready =
    !trail || isTrailAssessmentComplete(trail.assessmentType, snapshots.all);
  if (!ready && trail?.id === "fruitlife-360")
    ready = (
      await getFruitLifeDashboardSessions({
        email: user.email ?? "",
        enabled: Boolean(user.email),
      })
    ).some((s) => Boolean(fruitLifeReportArtifact(s)));
  if (trail?.id === "designpd")
    ready = ready && hasDesignPdCourseAccess(user.email, snapshots.all);
  return {
    experience,
    canStart: ready,
    reports: snapshots.all
      .filter(
        (s) =>
          s.assessment_type === trail?.assessmentType &&
          isTrailAssessmentComplete(s.assessment_type, [s]),
      )
      .map((s) => ({
        id: s.id,
        completedAt: s.source_submitted_at ?? s.created_at,
        label: `${experience.title} — ${displayDateTime(s.source_submitted_at ?? s.created_at)}`,
      })),
  };
}
export async function GET(request: Request) {
  const preview = previewParams(new URL(request.url));
  if (preview) return previewReflectionRequest(request, preview);
  const courseSlug = new URL(request.url).searchParams.get("courseSlug") ?? "";
  if (!getReflectionExperience(courseSlug))
    return json({ error: "Unknown course." }, 400);
  const s = await createSupabaseServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user)
    return json({
      signedIn: false,
      rounds: [],
      entries: [],
      reports: [],
      canStart: false,
    });
  const ctx = await context(courseSlug, user);
  if (!ctx) return json({ error: "Unknown course." }, 400);
  const { data: rounds, error } = await s
    .from("reflection_rounds")
    .select(
      "id,course_slug,last_lesson_slug,questions,assessment_snapshot_id,assessment_label,source,started_at,updated_at",
    )
    .eq("user_id", user.id)
    .eq("course_slug", courseSlug)
    .order("started_at", { ascending: false })
    .order("id", { ascending: false });
  if (error)
    return json(
      { error: "Could not load your reflection history. Try again." },
      500,
    );
  // Refresh only approved current-workbook prompt metadata (Journey Explore /
  // DesignID Lens / course prompts), preserving every old answer key/revision and archive.
  if (rounds?.[0] && ["discover-your-divine-design", "designid-foundations"].includes(courseSlug)) {
    const current = rounds[0];
    const updatedQuestions = withExpertise(courseSlug, withPathfinder(courseSlug, withOneAnother(courseSlug, withDesignReflectionsLove(courseSlug, withIdentityBelievers(courseSlug, withDesignIdLens(courseSlug, withDesignIdWelcome(courseSlug, withWhoWhoseExplore(courseSlug, current.questions))))))));
    const questions = withCurrentJourneyActivities(courseSlug, updatedQuestions);
    if (questions !== current.questions) {
      // Authenticated users cannot edit their prompt snapshots. The server adds
      // only approved prompt metadata to the already owner-filtered current round.
      const extended = await createSupabaseAdminClient().from("reflection_rounds").update({ questions })
        .eq("id", current.id).eq("user_id", user.id).eq("course_slug", courseSlug)
        .eq("updated_at", current.updated_at).select("id").maybeSingle();
      if (extended.error || !extended.data)
        return json({ error: "Could not open the updated workbook. Please reload; your answers are unchanged." }, 503);
      current.questions = questions;
    }
  }
  const entries: unknown[] = [];
  if (rounds?.length) {
    for (let from = 0; ; from += 1000) {
      const page = await s
        .from("reflection_entries")
        .select(
          "id,round_id,question_id,prompt,question_version,lesson_slug,lesson_title,response,revision,saved_at",
        )
        .eq("user_id", user.id)
        .in(
          "round_id",
          rounds.map((r) => r.id),
        )
        .order("id")
        .range(from, from + 999);
      if (page.error)
        return json({ error: "Could not load your answers. Try again." }, 500);
      entries.push(...page.data);
      if (page.data.length < 1000) break;
    }
  }
  if (courseSlug === "discover-your-divine-design" && rounds?.[0]) {
    const round = rounds[0];
    for (const recovered of missingPathfinderEntries(round.id, entries as ReflectionEntry[])) {
      const question = round.questions.find((q: {id: string}) => q.id === recovered.question_id);
      if (!question) continue;
      const {id: _id, ...entry} = recovered;
      const inserted = await createSupabaseAdminClient().from("reflection_entries").upsert({ ...entry, user_id: user.id, prompt: question.prompt, question_version: question.version, lesson_slug: question.lessonSlug, lesson_title: question.lessonTitle }, { onConflict: "round_id,question_id,revision", ignoreDuplicates: true }).select("id,round_id,question_id,prompt,question_version,lesson_slug,lesson_title,response,revision,saved_at");
      if (inserted.error) return json({error: "Could not recover your Pathfinder answer. Please reload; your original answer is unchanged."}, 503);
      if (inserted.data.length) entries.push(...inserted.data);
      else {
        // A concurrent canonical save/recovery won. Return its real revisions,
        // rather than briefly presenting an empty answer with revision zero.
        const winner = await s.from("reflection_entries").select("id,round_id,question_id,prompt,question_version,lesson_slug,lesson_title,response,revision,saved_at")
          .eq("user_id", user.id).eq("round_id", round.id).eq("question_id", recovered.question_id);
        if (winner.error) return json({error: "Your Pathfinder answer was saved in another tab. Please reload to see it."}, 503);
        entries.push(...winner.data);
      }
    }
  }
  return json({
    rounds: rounds ?? [],
    entries,
    reports: ctx.reports,
    canStart: ctx.canStart,
    signedIn: true,
    nextAssessmentReportId: rounds?.[0]
      ? ctx.reports[0] &&
        ctx.reports[0].id !== rounds[0].assessment_snapshot_id &&
        new Date(ctx.reports[0].completedAt) > new Date(rounds[0].started_at)
        ? ctx.reports[0].id
        : null
      : null,
  });
}
export async function POST(request: Request) {
  const preview = previewParams(new URL(request.url));
  if (preview) return previewReflectionRequest(request, preview);
  const s = await createSupabaseServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return json({ error: "Sign in to save reflections." }, 401);
  const b = await request.json().catch(() => null);
  if (
    !b ||
    typeof b.courseSlug !== "string" ||
    !getReflectionExperience(b.courseSlug)
  )
    return json({ error: "Unknown course." }, 400);
  if (b.action === "ensure-round") {
    if (b.courseSlug !== "discover-your-divine-design")
      return json({ error: "Automatic setup is only available for the Journey." }, 400);
    const ctx = await context(b.courseSlug, user);
    const existing = await s.from("reflection_rounds").select("*")
      .eq("user_id", user.id).eq("course_slug", b.courseSlug)
      .order("started_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
    if (existing.error) return json({ error: "Could not open your workbook. Please try again." }, 500);
    if (existing.data) return json({ round: existing.data });
    // Stable first-round ID makes concurrent tabs/retries create one workbook, without schema changes.
    const hash = createHash("sha256").update(`journey-first-round:${user.id}`).digest("hex");
    const id = `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
    const created = await s.from("reflection_rounds").upsert({
      id, user_id: user.id, course_slug: b.courseSlug, questions: ctx!.experience.questions,
    }, { onConflict: "id", ignoreDuplicates: true });
    if (created.error) return json({ error: "Could not open your workbook. Please try again." }, 500);
    const opened = await s.from("reflection_rounds").select("*").eq("id", id).eq("user_id", user.id).single();
    return opened.error ? json({ error: "Could not open your workbook. Please try again." }, 500) : json({ round: opened.data });
  }
  if (b.action === "sync-round") {
    const ctx = await context(b.courseSlug, user);
    if (!ctx?.canStart)
      return json({ error: "Complete this trail’s report first." }, 403);
    const report = ctx.reports[0];
    if (!report)
      return json({ error: "No completed assessment report found." }, 400);
    const { data: round, error } = await s.rpc(
      "sync_assessment_reflection_round",
      {
        p_course_slug: b.courseSlug,
        p_snapshot_id: report.id,
        p_questions: ctx.experience.questions,
        p_label: report.label,
      },
    );
    if (error)
      return json(
        {
          error:
            "Could not open your new walkthrough. Your earlier reflections are safe. Try loading again.",
        },
        500,
      );
    return json({ round });
  }
  if (b.action === "new-round") {
    const ctx = await context(b.courseSlug, user);
    if (!ctx || !ctx.canStart)
      return json(
        {
          error:
            "Complete this trail’s assessment and report before beginning its reflections.",
        },
        403,
      );
    const report = b.assessmentSnapshotId
      ? ctx.reports.find((r) => r.id === b.assessmentSnapshotId)
      : null;
    if (b.assessmentSnapshotId && !report)
      return json({ error: "Choose one of your own reports." }, 400);
    const { data: round, error } = await s
      .from("reflection_rounds")
      .insert({
        user_id: user.id,
        course_slug: b.courseSlug,
        questions: ctx.experience.questions,
        assessment_snapshot_id: report?.id ?? null,
        assessment_label: report?.label ?? null,
      })
      .select(
        "id,course_slug,last_lesson_slug,questions,assessment_snapshot_id,assessment_label,source,started_at,updated_at",
      )
      .single();
    if (error)
      return json(
        { error: "Could not begin a reflection round. Please try again." },
        500,
      );
    return json({ round }, 201);
  }
  if (b.action === "position") {
    if (
      typeof b.roundId !== "string" ||
      typeof b.lessonSlug !== "string" ||
      !reflectionLessonExists(b.courseSlug, b.lessonSlug)
    )
      return json({ error: "Unknown lesson." }, 400);
    const { data, error } = await s
      .from("reflection_rounds")
      .update({
        last_lesson_slug: b.lessonSlug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", b.roundId)
      .eq("user_id", user.id)
      .eq("course_slug", b.courseSlug)
      .select("id")
      .maybeSingle();
    if (error)
      return json({ error: "Could not save your course position." }, 500);
    return data
      ? json({ ok: true })
      : json({ error: "Reflection round not found." }, 404);
  }
  if (
    b.action !== "save" ||
    typeof b.roundId !== "string" ||
    typeof b.questionId !== "string" ||
    typeof b.response !== "string" ||
    b.response.length > 8000 ||
    !Number.isSafeInteger(b.expectedRevision) ||
    b.expectedRevision < 0
  )
    return json(
      {
        error:
          "Invalid reflection details. Answers may contain up to 8,000 characters.",
      },
      400,
    );
  if (b.courseSlug === "discover-your-divine-design" && retiredPathfinderCanonical(b.questionId))
    return json({error: "This Pathfinder piece now has one shared answer. Your earlier answer is preserved for history. Copy any draft and reopen the Pathfinder lesson to continue."}, 409);
  const { data: round } = await s
    .from("reflection_rounds")
    .select("id,started_at,assessment_snapshot_id")
    .eq("id", b.roundId)
    .eq("user_id", user.id)
    .eq("course_slug", b.courseSlug)
    .maybeSingle();
  if (!round) return json({ error: "Reflection round not found." }, 404);
  const ctx = await context(b.courseSlug, user);
  const latestReport = ctx?.reports[0];
  if (
    latestReport &&
    latestReport.id !== round.assessment_snapshot_id &&
    new Date(latestReport.completedAt) > new Date(round.started_at)
  )
    return json(
      {
        error:
          "A new assessment has opened a fresh walkthrough. Your draft is still here; copy it and reload to continue in the current walkthrough.",
      },
      409,
    );
  const { data: entry, error } = await s.rpc("save_reflection_entry", {
    p_round_id: b.roundId,
    p_question_id: b.questionId,
    p_response: b.response,
    p_expected_revision: b.expectedRevision,
  });
  if (error)
    return json(
      {
        error:
          error.code === "PT409"
            ? "This answer changed in another tab. Your draft is still here. Copy it, reload, and review the latest answer before saving."
            : error.code === "PT403"
              ? "Previous walkthroughs are read-only. Your draft is still here; choose the current walkthrough."
              : "Could not save. Your draft is still here; please try again.",
      },
      error.code === "PT409"
        ? 409
        : error.code === "PT403"
          ? 403
          : error.code === "22023"
            ? 400
            : 500,
    );
  return json({ entry });
}

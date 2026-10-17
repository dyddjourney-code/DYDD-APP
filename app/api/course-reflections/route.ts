import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getReflectionExperience,
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
        label: `${experience.title} — ${displayDateTime(s.source_submitted_at ?? s.created_at)}`,
      })),
  };
}
export async function GET(request: Request) {
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
  return json({
    rounds: rounds ?? [],
    entries,
    reports: ctx.reports,
    canStart: ctx.canStart,
    signedIn: true,
  });
}
export async function POST(request: Request) {
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
  const { data: round } = await s
    .from("reflection_rounds")
    .select("id")
    .eq("id", b.roundId)
    .eq("user_id", user.id)
    .eq("course_slug", b.courseSlug)
    .maybeSingle();
  if (!round) return json({ error: "Reflection round not found." }, 404);
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
            : "Could not save. Your draft is still here; please try again.",
      },
      error.code === "PT409" ? 409 : error.code === "22023" ? 400 : 500,
    );
  return json({ entry });
}

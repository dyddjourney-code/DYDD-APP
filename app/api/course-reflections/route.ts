import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supportedCourses = new Set([
  "fruitlife-360-formation",
  "spiritual-gifts-service",
]);

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to save reflections." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const courseSlug = cleanText(body?.courseSlug, 120);
  const lessonSlug = cleanText(body?.lessonSlug, 160);
  const lessonTitle = cleanText(body?.lessonTitle, 220);
  const prompt = cleanText(body?.prompt, 1000);
  const response = cleanText(body?.response, 8000);

  if (!supportedCourses.has(courseSlug) || !lessonSlug || !lessonTitle || !prompt) {
    return NextResponse.json({ error: "Missing reflection details." }, { status: 400 });
  }

  const { error } = await supabase.from("course_lesson_reflections").upsert(
    {
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
      lesson_title: lessonTitle,
      metadata: {
        source: "assessment_course_player",
      },
      prompt,
      response,
      user_id: user.id,
    },
    { onConflict: "user_id,course_slug,lesson_slug" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

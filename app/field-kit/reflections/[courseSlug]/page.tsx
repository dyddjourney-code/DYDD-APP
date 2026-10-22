import { previewParams } from "@/lib/reflections/preview";
import { withReviewQuery, type ReviewSearchParams } from "@/lib/review/heather";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { learningCourses } from "@/lib/courses/course-catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getReflectionExperience } from "@/lib/reflections/catalog";
import { ReflectionCourseShell } from "@/components/reflection-course-shell";
import { ReflectionWorkbook } from "@/components/reflection-session";
export const dynamic = "force-dynamic";
export default async function ReflectionWorkbookPage({
  params, searchParams,
}: {
  searchParams: Promise<ReviewSearchParams>;
  params: Promise<{
    courseSlug: string;
  }>;
}) {
  const { courseSlug } = await params;
  const preview = previewParams(await searchParams);
  const path = (href: string) => withReviewQuery(href, preview);
  const s = await createSupabaseServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user && !preview)
    redirect(
      `/login?next=${encodeURIComponent(`/field-kit/reflections/${courseSlug}`)}`,
    );
  const experience = getReflectionExperience(courseSlug);
  if (!experience) notFound();
  const journey = courseSlug === "discover-your-divine-design";
  const logo =
    learningCourses.find((course) => course.slug === courseSlug)?.logo ??
    "/brand/tools/designid-logo.webp";
  return (
    <main className="journey-shell hq-standalone-page reflection-notebook-page">
      <nav className="course-nav">
        <Link href={path("/field-kit#artifacts")}>Back to Field Kit</Link>
        <Link href={path(experience.href)}>Continue course</Link>
      </nav>
      <header
        className={`reflection-notebook-hero${journey ? " reflection-notebook-hero-journey" : ""}`}
      >
        <img
          className="reflection-notebook-art"
          src={journey ? "/brand/dydd-journey-road-cartoon-hero.png" : logo}
          alt={
            journey
              ? "An illustrated trail winding through the Discover Your Divine Design journey"
              : `${experience.title} course logo`
          }
        />
        <div>
          <p className="eyebrow">Field Kit · Course Reflections</p>
          <h1>{experience.title}</h1>
          <p className="lede">
            Your reflections, one step at a time. Open a module, then choose a
            lesson to revisit your discoveries.
          </p>
        </div>
      </header>
      {preview ? <p className="notice">Owner preview · {preview.review === "heather" ? "Heather" : "John"} workbook. Your preview reflections are saved here separately from learner accounts. No additional sign-in is needed.</p> : null}
      <ReflectionCourseShell courseSlug={courseSlug}>
        <ReflectionWorkbook />
      </ReflectionCourseShell>
    </main>
  );
}

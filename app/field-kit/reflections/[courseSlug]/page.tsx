import { notFound } from "next/navigation";
import Link from "next/link";
import { getReflectionExperience } from "@/lib/reflections/catalog";
import { ReflectionCourseShell } from "@/components/reflection-course-shell";
import { ReflectionWorkbook } from "@/components/reflection-session";
export const dynamic = "force-dynamic";
export default async function ReflectionWorkbookPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const experience = getReflectionExperience(courseSlug);
  if (!experience) notFound();
  return (
    <main className="journey-shell hq-standalone-page reflection-notebook-page">
      <nav className="course-nav">
        <Link href="/field-kit#artifacts">Back to Field Kit</Link>
        <Link href={experience.href}>Continue course</Link>
      </nav>
      <header className="standalone-hero">
        <div>
          <p className="eyebrow">Field Kit · Course Reflections</p>
          <h1>{experience.title}</h1>
          <p className="lede">
            Every question, your saved answers, and earlier dated reflections.
            These are the same reflections you use inside the course.
          </p>
        </div>
      </header>
      <ReflectionCourseShell courseSlug={courseSlug}>
        <ReflectionWorkbook />
      </ReflectionCourseShell>
    </main>
  );
}

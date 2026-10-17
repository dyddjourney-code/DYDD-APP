import type { ReactNode } from "react";
import { getReflectionExperience } from "@/lib/reflections/catalog";
import { ReflectionSession } from "@/components/reflection-session";
export function ReflectionCourseShell({
  courseSlug,
  children,
}: {
  courseSlug: string;
  children: ReactNode;
}) {
  const experience = getReflectionExperience(courseSlug);
  return experience ? (
    <ReflectionSession
      key={courseSlug}
      courseSlug={courseSlug}
      questions={experience.questions}
    >
      {children}
    </ReflectionSession>
  ) : (
    children
  );
}

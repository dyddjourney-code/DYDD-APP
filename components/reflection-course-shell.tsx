import type { ReactNode } from "react";
import { getReflectionExperience } from "@/lib/reflections/catalog";
import { ReflectionSession } from "@/components/reflection-session";
export function ReflectionCourseShell({
  courseSlug,
  children,
  compactControls = false,
  inlineEntry = false,
}: {
  courseSlug: string;
  children: ReactNode;
  compactControls?: boolean;
  inlineEntry?: boolean;
}) {
  const experience = getReflectionExperience(courseSlug);
  return experience ? (
    <ReflectionSession
      key={courseSlug}
      courseSlug={courseSlug}
      questions={experience.questions}
      compactControls={compactControls}
      inlineEntry={inlineEntry}
    >
      {children}
    </ReflectionSession>
  ) : (
    children
  );
}

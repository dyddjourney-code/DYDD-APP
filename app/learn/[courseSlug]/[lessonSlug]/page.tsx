import { notFound } from 'next/navigation';
import { designIdCourseReviewParams } from '@/lib/trails/course-preview';
import { getLearningLesson, learningCourses } from '@/lib/courses/course-catalog';
import { canonicalLessonRoute } from '@/lib/passport/lesson-route';
import type { ReviewSearchParams } from '@/lib/review/heather';

export const dynamic = 'force-dynamic';
type Props = {
 params: Promise<{courseSlug:string;lessonSlug:string}>;
 searchParams?: Promise<ReviewSearchParams & {lane?:string;origin?:string}>;
};
export function generateStaticParams() {
 return learningCourses.flatMap(course => course.modules.flatMap(module => module.lessons.map(lesson => ({courseSlug:course.slug,lessonSlug:lesson.slug}))));
}
export async function generateMetadata({params}:Props) {
 const {courseSlug,lessonSlug}=await params;
 const match=getLearningLesson(courseSlug,lessonSlug);
 return {title:match?`${match.lesson.title} | ${match.course.title}`:'Lesson'};
}
export default async function LearningLessonPage({params,searchParams}:Props) {
 const {courseSlug,lessonSlug}=await params;
 if(!getLearningLesson(courseSlug,lessonSlug))notFound();
 canonicalLessonRoute(courseSlug,lessonSlug,designIdCourseReviewParams(await searchParams));
}

import { notFound } from 'next/navigation';
import { designIdCourseReviewParams } from '@/lib/trails/course-preview';
import { designIdLessons, getDesignIdLesson } from '@/lib/courses/designid-foundations';
import { canonicalLessonRoute } from '@/lib/passport/lesson-route';
import type { ReviewSearchParams } from '@/lib/review/heather';

export const dynamic = 'force-dynamic';
type Props = {params:Promise<{lessonSlug:string}>;searchParams?:Promise<ReviewSearchParams>};
export function generateStaticParams() { return designIdLessons.map(lesson=>({lessonSlug:lesson.slug})); }
export async function generateMetadata({params}:Props) {
 const lesson=getDesignIdLesson((await params).lessonSlug);
 return {title:lesson?`${lesson.title} | DesignID Course`:'Lesson'};
}
export default async function DesignIdLessonPage({params,searchParams}:Props) {
 const {lessonSlug}=await params;
 if(!getDesignIdLesson(lessonSlug))notFound();
 canonicalLessonRoute('designid-foundations',lessonSlug,designIdCourseReviewParams(await searchParams));
}

import 'server-only';
import { redirect } from 'next/navigation';
import { withReviewQuery, type ReviewSearchParams } from '@/lib/review/heather';
/** Retain shared links while routing all learning through the one checklist gate.
 * An old standalone route must not provide a second unguarded forward path. */
export function canonicalLessonRoute(courseSlug:string,lessonSlug:string,params?:ReviewSearchParams & {lane?:string}) {
 redirect(withReviewQuery(`${courseSlug === "discover-your-divine-design" ? "/journey" : `/courses/${encodeURIComponent(courseSlug)}`}?lesson=${encodeURIComponent(lessonSlug)}${params?.lane==='fruitlife'?'&lane=fruitlife':''}`,params));
}

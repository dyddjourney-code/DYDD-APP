import { dyddMainCourseOutline } from '@/lib/journey/dydd-course-outline';
import { designIdCourse } from '@/lib/courses/designid-foundations';
import { learningCourses } from '@/lib/courses/course-catalog';
import { laterPathfinderIds } from '@/lib/journey/pathfinder';

export const journeySlug = 'discover-your-divine-design';
export const passportCurriculum = [
 { slug: journeySlug, title: 'DYDD Journey', lessons: dyddMainCourseOutline.flatMap(m => m.units.map(u => ({slug:u.slug,title:u.title,module:m.slug}))) },
 ...[designIdCourse, ...learningCourses.filter(c => c.slug !== journeySlug)].map(c => ({slug:c.slug,title:c.title,lessons:c.modules.flatMap(m => m.lessons.map(l => ({slug:l.slug,title:l.title,module:m.slug})))})),
];
export const journeyChapterBadges: Record<string,string> = {
 'welcome-and-orientation':'DYD Journey Started',
 'what-is-dydd':'What is DYDD?',
 identity:'Identity', expertise:'Expertise', story:'Story', desire:'Desire', gifts:'Gifts', niche:'Niche',
};
export const nicheRequiredPromptIds = [...new Set([...Object.values(laterPathfinderIds).flat(),
 'niche-resulting-in-my-73-pathfinder-line', 'niche-encouraged-by-74-pathfinder-line', 'niche-working-declaration'])];
export function courseCompleted(courseSlug: string, completed: string[]) {
 const course = passportCurriculum.find(c => c.slug === courseSlug);
 return Boolean(course?.lessons.length && course.lessons.every(l => completed.includes(l.slug)));
}
export function lessonAvailable(courseSlug: string, lessonSlug: string, completed: string[]) {
 const lessons = passportCurriculum.find(c => c.slug === courseSlug)?.lessons ?? [];
 const index = lessons.findIndex(l => l.slug === lessonSlug);
 return index >= 0 && (completed.includes(lessonSlug) || lessons.slice(0,index).every(l => completed.includes(l.slug)));
}

import { dyddMainCourseOutline } from '@/lib/journey/dydd-course-outline';
import { getWorkbookExperience } from '@/lib/journey/workbook-experience';
export const discussionCourse = 'discover-your-divine-design';
// Only questions rendered in CARE lessons, not Pathfinder or assessment-course prompts.
export const careDiscussionIds = new Set(dyddMainCourseOutline.flatMap((module, moduleIndex) =>
  module.units.flatMap((unit, unitIndex) => {
    const workbook = getWorkbookExperience({ module, moduleIndex, unit, unitIndex, section: unit.section, sectionIndex: 0 });
    return workbook?.kind === 'care' ? workbook.prompts.map(p => p.id) : [];
  })));
export type DiscussionReminder = { round_id: string; question_id: string; marked: boolean; note: string; revision: number; updated_at: string };

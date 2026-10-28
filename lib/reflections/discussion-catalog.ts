import { dyddMainCourseOutline } from '@/lib/journey/dydd-course-outline';
import { getWorkbookExperience } from '@/lib/journey/workbook-experience';
export const discussionCourse = 'discover-your-divine-design';
// Only actual Journey CARE (including DesignID) reflections; not Pathfinder or assessment courses.
export const careDiscussionIds = new Set(dyddMainCourseOutline.flatMap((module, moduleIndex) =>
  module.units.flatMap((unit, unitIndex) => {
    const workbook = getWorkbookExperience({ module, moduleIndex, unit, unitIndex, section: unit.section, sectionIndex: 0 });
    return workbook && workbook.kind !== 'pathfinder' ? workbook.prompts.map(p => p.id) : [];
  })));
export type DiscussionReminder = { round_id: string; question_id: string; marked: boolean; note: string; revision: number; updated_at: string };

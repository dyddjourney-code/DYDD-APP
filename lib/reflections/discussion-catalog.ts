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

/** Stable lesson/prompt coordinates for an explicitly submitted Circle callout.
 * Private reminders never use this map to send anything automatically. */
export const discussionPromptContexts = Object.fromEntries(dyddMainCourseOutline.flatMap((module,moduleIndex)=>module.units.flatMap((unit,unitIndex)=>{
 const workbook=getWorkbookExperience({module,moduleIndex,unit,unitIndex,section:unit.section,sectionIndex:0});
 return workbook&&workbook.kind!=='pathfinder'?workbook.prompts.map(prompt=>[prompt.id,{lesson:unit.slug,prompt:prompt.id,label:prompt.label}]):[];
}))) as Record<string,{lesson:string;prompt:string;label:string}>;

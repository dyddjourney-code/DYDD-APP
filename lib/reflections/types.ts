import type { ReflectionQuestion } from "./catalog";
export type ReflectionRound = {
  id: string;
  course_slug: string;
  last_lesson_slug: string | null;
  questions: ReflectionQuestion[];
  assessment_snapshot_id: string | null;
  assessment_label: string | null;
  source: string;
  started_at: string;
  updated_at: string;
};
export type ReflectionEntry = {
  id: string;
  round_id: string;
  question_id: string;
  prompt: string;
  question_version: string;
  lesson_slug: string;
  lesson_title: string;
  response: string;
  revision: number;
  saved_at: string;
};
export type ReflectionReport = { id: string; label: string };
export type ReflectionData = {
  rounds: ReflectionRound[];
  entries: ReflectionEntry[];
  reports: ReflectionReport[];
  canStart: boolean;
  signedIn: boolean;
};

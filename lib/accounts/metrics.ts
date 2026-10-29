/** Completion-only projections. Never accepts scores, reports or reflections. */
export const accountMilestones = [
  { key: 'journey', label: 'Journey', course: 'discover-your-divine-design', assessment: null },
  { key: 'designid', label: 'DesignID', course: 'designid-foundations', assessment: 'designid' },
  { key: 'spiritual_gifts', label: 'Spiritual Gifts', course: 'spiritual-gifts-service', assessment: 'spiritual_gifts' },
  { key: 'fruit_360', label: 'FruitLife360', course: 'fruitlife-360-formation', assessment: 'fruit_360' },
] as const;
export type Account = { id: string; email: string; name: string; createdAt: string };
export type Completion = { user_id: string; course_slug: string; lesson_slug: string; completed_at: string };
export type Award = { user_id: string; badge_key: string; awarded_at: string; course: string | null; source: string | null };
export type Access = { user_id: string; granted_at: string };
export type Circle = { id: string; status: string; user_id: string | null; roster: unknown };
export type Membership = { circle_id: string; user_id: string | null; email: string; status: string };
export type Curriculum = { slug: string; lessons: { slug: string }[] }[];
export type Milestone = { assessmentAt: string | null; courseAt: string | null };
export type AccountRow = Account & { betaAt: string | null; milestones: Record<string, Milestone> };
const validDate = (value: string) => Number.isFinite(Date.parse(value));
const latest = (dates: string[]) => dates.filter(validDate).sort().at(-1) ?? null;
const earliest = (dates: string[]) => dates.filter(validDate).sort()[0] ?? null;
export function monthKey(value: string) { return validDate(value) ? new Date(value).toISOString().slice(0,7) : ''; }
export function buildAccountRows(accounts: Account[], progress: Completion[], awards: Award[], access: Access[], curriculum: Curriculum): AccountRow[] {
  const progressByUser = new Map<string, Completion[]>(), awardsByUser = new Map<string, Award[]>();
  for (const p of progress) progressByUser.set(p.user_id, [...(progressByUser.get(p.user_id) ?? []), p]);
  for (const a of awards) awardsByUser.set(a.user_id, [...(awardsByUser.get(a.user_id) ?? []), a]);
  const beta = new Map(access.map(a => [a.user_id, a.granted_at]));
  return accounts.map(account => {
    const userAwards = awardsByUser.get(account.id) ?? [], userProgress = progressByUser.get(account.id) ?? [];
    const milestones = Object.fromEntries(accountMilestones.map(m => {
      const lessons = curriculum.find(c => c.slug === m.course)?.lessons ?? [];
      const saved = userProgress.filter(p => p.course_slug === m.course);
      const dates = new Map(saved.map(p => [p.lesson_slug, p.completed_at]));
      const checklistAt = lessons.length && lessons.every(l => dates.has(l.slug)) ? latest(lessons.map(l => dates.get(l.slug)!)) : null;
      const legacyAt = earliest(userAwards.filter(a => a.course === m.course && a.source === 'legacy_completed_enrollment').map(a => a.awarded_at));
      const assessmentAt = m.assessment ? earliest(userAwards.filter(a => a.badge_key === m.assessment).map(a => a.awarded_at)) : null;
      return [m.key, { assessmentAt, courseAt: checklistAt ?? legacyAt }];
    }));
    return { ...account, betaAt: beta.get(account.id) ?? null, milestones };
  }).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
export function circleMetrics(circles: Circle[], memberships: Membership[], accounts: AccountRow[]) {
  const active = circles.filter(c => c.status === 'active' && c.user_id !== null);
  const known = new Map(accounts.map(a=>[a.id,a]));
  let acceptedSeats = 0, completedSeats = 0, linkedSeats = 0;
  for (const circle of active) {
    const roster = new Set((Array.isArray(circle.roster) ? circle.roster : []).flatMap(p => p && typeof p.email === 'string' ? [p.email.trim().toLowerCase()] : []));
    const seen = new Set<string>();
    for (const member of memberships.filter(m => m.circle_id === circle.id && m.status === 'accepted' && roster.has(m.email.trim().toLowerCase()))) {
      const identity = member.user_id ?? member.email.trim().toLowerCase();
      if (seen.has(identity)) continue;
      seen.add(identity); acceptedSeats++;
      const account = member.user_id ? known.get(member.user_id) : undefined;
      if (account) linkedSeats++;
      if (account?.milestones.journey.courseAt) completedSeats++;
    }
  }
  return { active: active.length, acceptedSeats, linkedSeats, completedSeats, average: active.length ? acceptedSeats / active.length : null, completionPercent: acceptedSeats ? completedSeats / acceptedSeats * 100 : null };
}
export function monthCounts(accounts: AccountRow[], month: string) {
  return { signups: accounts.filter(a => monthKey(a.createdAt) === month).length, beta: accounts.filter(a => a.betaAt && monthKey(a.betaAt) === month).length,
    completions: Object.fromEntries(accountMilestones.map(m => [m.key, { assessments: accounts.filter(a => a.milestones[m.key].assessmentAt && monthKey(a.milestones[m.key].assessmentAt!) === month).length, courses: accounts.filter(a => a.milestones[m.key].courseAt && monthKey(a.milestones[m.key].courseAt!) === month).length }])) };
}

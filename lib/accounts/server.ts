import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { passportCurriculum, journeyChapterBadges } from '@/lib/passport/curriculum';
import { canReadAccounts } from './access';
import { buildAccountRows, circleMetrics, type Account, type Award, type Circle, type Completion, type Access, type Membership } from './metrics';
import type { OwnerPreviewParams } from '@/lib/owner-preview';

/** The only privileged dashboard reader. Authorize BEFORE creating the admin client. */
export async function readAccountsDashboard(params?: OwnerPreviewParams) {
  if (!await canReadAccounts(params)) throw new Error('ACCOUNTS_FORBIDDEN');
  const db = createSupabaseAdminClient();
  const accounts: Account[] = [];
  for (let page = 1; ; page++) {
    const result = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw new Error('Account signups could not be loaded.');
    accounts.push(...result.data.users.filter(u => !u.is_anonymous).map(u => ({ id: u.id, email: u.email ?? '', name: typeof u.user_metadata?.full_name === 'string' ? u.user_metadata.full_name.slice(0,160) : '', createdAt: u.created_at })));
    if (result.data.users.length < 1000) break;
  }
  // Paginate every source: Supabase's default response limit must not truncate totals.
  async function rows<T>(table: string, columns: string, order: string, allowedBadges?: string[]) {
    const all: T[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = db.from(table).select(columns).order(order);
      if (allowedBadges) query = query.in('badge_key', allowedBadges);
      if (table === 'passport_lesson_completions') query = query.order('course_slug').order('lesson_slug');
      if (table === 'passport_awards') query = query.order('badge_key');
      const result = await query.range(offset, offset + 999);
      if (result.error) throw new Error('Saved dashboard records could not be loaded. No partial totals are shown.');
      all.push(...result.data as unknown as T[]);
      if (result.data.length < 1000) return all;
    }
  }
  const [progress, awards, access, circles, memberships, codes] = await Promise.all([
    rows<Completion>('passport_lesson_completions', 'user_id,course_slug,lesson_slug,completed_at', 'user_id'),
    rows<Award>('passport_awards', 'user_id,badge_key,awarded_at,course:evidence->>course,source:evidence->>source', 'user_id', ['designid', 'spiritual_gifts', 'fruit_360', ...passportCurriculum.map(c=>c.slug), ...Object.values(journeyChapterBadges)]),
    rows<Access>('dydd_personal_access', 'user_id,granted_at', 'user_id'),
    rows<Circle>('journey_circle_plans', 'id,status,user_id,roster:plan->participants', 'id'),
    rows<Membership>('dydd_circle_memberships', 'circle_id,user_id,email,status', 'id'),
    db.from('dydd_beta_access_codes').select('id', { count: 'exact', head: true }).is('redeemed_at', null),
  ]);
  if (codes.error) throw new Error('Beta access totals could not be loaded.');
  const people = buildAccountRows(accounts, progress, awards, access, passportCurriculum);
  return { people, circles: circleMetrics(circles, memberships, people), unusedBetaCodes: codes.count ?? 0, fetchedAt: new Date().toISOString(), environment: 'sandbox' as const };
}
export type AccountsDashboardData = Awaited<ReturnType<typeof readAccountsDashboard>>;

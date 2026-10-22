import 'server-only';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { reportBucket } from '@/lib/assessments/report-storage';
import { getReflectionExperience, reflectionLessonExists, reflectionExperiences, withWhoWhoseExplore, withDesignIdWelcome, withDesignIdLens, withIdentityBelievers, withDesignReflectionsLove, withOneAnother } from './catalog';
import type { ReflectionRound, ReflectionEntry, ReflectionData } from './types';
import { getHeatherReviewReport, getNewReviewReport, isReviewRequest, type ReviewSearchParams } from '@/lib/review/heather';
import { isOwnerCoursePreview } from '@/lib/trails/course-preview';
import { isOwnerPreviewRequest } from '@/lib/owner-preview';
import { trailDefinitions, isTrailAssessmentComplete } from '@/lib/trails/catalog';
import { reflectionExportText } from './export';
export function previewParams(input: URL | ReviewSearchParams): ReviewSearchParams | null {
    const params = input instanceof URL ? { review: input.searchParams.get('review') ?? undefined, key: input.searchParams.get('key') ?? undefined } : input;
    if (isOwnerPreviewRequest(params))
        return { ...params, review: 'new' };
    return isReviewRequest(params) ? params : null;
}
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
type Saved = {
    rounds: ReflectionRound[];
    entries: ReflectionEntry[];
};
const pathFor = (p: ReviewSearchParams, slug: string) => `preview-reflections/${p.review}/${slug}.json`;
async function load(p: ReviewSearchParams, slug: string): Promise<Saved> {
    const { data, error } = await createSupabaseAdminClient().storage.from(reportBucket).download(pathFor(p, slug), { cacheNonce: randomUUID() }, { cache: "no-store" });
    if (error) {
        if (String(error.statusCode) === '404' || String(error.statusCode) === '400' && /not found/i.test(error.message))
            return { rounds: [], entries: [] };
        throw Error('Could not load the saved preview workbook. Please try again.');
    }
    const saved: Saved = JSON.parse(await data.text());
    if (saved.rounds[0]) saved.rounds[0].questions = withOneAnother(slug, withDesignReflectionsLove(slug, withIdentityBelievers(slug, withDesignIdLens(slug, withDesignIdWelcome(slug, withWhoWhoseExplore(slug, saved.rounds[0].questions))))));
    return saved;
}
export async function previewReflectionRounds(p: ReviewSearchParams) {
    return (await Promise.all(reflectionExperiences.map(e => load(p, e.slug)))).flatMap(d => d.rounds);
}
async function reportContext(p: ReviewSearchParams, slug: string) {
    const report = p.review === 'heather' ? await getHeatherReviewReport(p) : await getNewReviewReport(p);
    const trail = trailDefinitions.find(t => t.courseSlug === slug);
    const reports = (report?.all ?? []).filter(s => s.assessment_type === trail?.assessmentType && isTrailAssessmentComplete(s.assessment_type, [s])).map(s => ({ id: s.id, completedAt: s.source_submitted_at ?? s.created_at, label: `${getReflectionExperience(slug)!.title} — ${s.source_submitted_at ?? s.created_at}` }));
    return { reports, canStart: isOwnerCoursePreview(p) || !trail || reports.length > 0 };
}
export async function previewReflectionData(p: ReviewSearchParams, slug: string): Promise<ReflectionData> {
    const saved = await load(p, slug), ctx = await reportContext(p, slug);
    return { ...saved, ...ctx, signedIn: true, preview: true, nextAssessmentReportId: saved.rounds[0] && ctx.reports[0] && ctx.reports[0].id !== saved.rounds[0].assessment_snapshot_id && new Date(ctx.reports[0].completedAt) > new Date(saved.rounds[0].started_at) ? ctx.reports[0].id : null };
}
export async function previewReflectionRequest(request: Request, p: ReviewSearchParams) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
        const slug = url.searchParams.get('courseSlug') ?? '';
        if (!getReflectionExperience(slug))
            return reply({ error: 'Unknown course.' }, 400);
        try {
            return reply(await previewReflectionData(p, slug));
        }
        catch (e) {
            return reply({ error: (e as Error).message }, 503);
        }
    }
    const origin = request.headers.get('origin');
    if (origin && origin !== url.origin)
        return reply({ error: 'Open this workbook from Field Kit.' }, 403);
    const b = await request.json().catch(() => null), experience = getReflectionExperience(b?.courseSlug ?? '');
    if (!experience)
        return reply({ error: 'Unknown course.' }, 400);
    const bucket = createSupabaseAdminClient().storage.from(reportBucket), lock = `preview-reflections/${p.review}/${b.courseSlug}.lock`;
    const leased = await bucket.upload(lock, Buffer.from('{}'), { contentType: 'application/json', upsert: false });
    if (leased.error)
        return reply({ error: 'Another save is in progress. Your draft is safe; try saving again.' }, 409);
    try {
        const saved = await load(p, b.courseSlug), ctx = await reportContext(p, b.courseSlug), now = new Date().toISOString();
        let result: unknown;
        if (b.action === 'new-round' || b.action === 'sync-round' || b.action === 'ensure-round') {
            if (b.action === 'ensure-round' && b.courseSlug !== 'discover-your-divine-design')
                return reply({ error: 'Automatic setup is only available for the Journey.' }, 400);
            if (!ctx.canStart)
                return reply({ error: 'Complete this trail’s report first.' }, 403);
            const report = b.action === 'sync-round' ? ctx.reports[0] : ctx.reports.find(r => r.id === b.assessmentSnapshotId);
            if (b.assessmentSnapshotId && !report)
                return reply({ error: 'Choose a report from this preview.' }, 400);
            if (b.action === 'sync-round' && !report)
                return reply({ error: 'No completed report found.' }, 400);
            const existing = b.action === 'ensure-round' ? saved.rounds[0] : b.action === 'sync-round' ? saved.rounds.find(r => r.assessment_snapshot_id === report?.id) : null;
            const round: ReflectionRound = existing ?? { id: randomUUID(), course_slug: b.courseSlug, last_lesson_slug: null, questions: experience.questions, assessment_snapshot_id: report?.id ?? null, assessment_label: report?.label ?? null, source: 'owner-preview', started_at: now, updated_at: now };
            if (!existing)
                saved.rounds.unshift(round);
            result = { round };
        }
        else {
            const round = saved.rounds.find(r => r.id === b.roundId);
            if (!round)
                return reply({ error: 'Reflection walkthrough not found.' }, 404);
            const next = ctx.reports[0];
            if (round.id !== saved.rounds[0]?.id || next && next.id !== round.assessment_snapshot_id && new Date(next.completedAt) > new Date(round.started_at))
                return reply({ error: 'Previous walkthroughs are read-only. Reload to use the current walkthrough.' }, 409);
            if (b.action === 'position') {
                if (!reflectionLessonExists(b.courseSlug, b.lessonSlug))
                    return reply({ error: 'Unknown lesson.' }, 400);
                round.last_lesson_slug = b.lessonSlug;
                result = { ok: true };
            }
            else if (b.action === 'save') {
                const q = round.questions.find(q => q.id === b.questionId);
                if (!q || typeof b.response !== 'string' || b.response.length > 8000 || !Number.isSafeInteger(b.expectedRevision) || b.expectedRevision < 0)
                    return reply({ error: 'Invalid reflection details.' }, 400);
                const previous = saved.entries.filter(e => e.round_id === round.id && e.question_id === q.id).sort((a, b) => b.revision - a.revision)[0];
                if ((previous?.revision ?? 0) !== b.expectedRevision)
                    return reply({ error: 'This answer changed in another tab. Your draft is safe; reload before saving.' }, 409);
                const entry: ReflectionEntry = { id: randomUUID(), round_id: round.id, question_id: q.id, prompt: q.prompt, question_version: q.version, lesson_slug: q.lessonSlug, lesson_title: q.lessonTitle, response: b.response, revision: (previous?.revision ?? 0) + 1, saved_at: now };
                saved.entries.push(entry);
                result = { entry };
            }
            else
                return reply({ error: 'Unknown action.' }, 400);
            round.updated_at = now;
        }
        const { error } = await bucket.upload(pathFor(p, b.courseSlug), Buffer.from(JSON.stringify(saved)), { contentType: 'application/json', cacheControl: '0', upsert: true });
        if (error)
            throw Error('Could not save. Your draft is still here; try again.');
        return reply(result);
    }
    catch (e) {
        return reply({ error: (e as Error).message }, 503);
    }
    finally {
        await bucket.remove([lock]);
    }
}
export async function previewExport(request: Request, p: ReviewSearchParams) {
    if (request.method === 'POST')
        return reply({ error: 'Preview workbooks do not send email. Use Download text to keep your saved reflections.' }, 403);
    const url = new URL(request.url), scope = url.searchParams.get('scope') ?? 'round', slug = url.searchParams.get('courseSlug') ?? '', id = url.searchParams.get('round');
    if (!['round', 'course', 'all'].includes(scope) || scope !== 'all' && !getReflectionExperience(slug))
        return reply({ error: 'Choose a valid workbook.' }, 400);
    const slugs = scope === 'all' ? reflectionExperiences.map(x => x.slug) : [slug];
    const saved = await Promise.all(slugs.map(x => load(p, x)));
    const rounds = saved.flatMap(x => x.rounds).filter(r => scope !== 'round' || r.id === id);
    if (scope === 'round' && !rounds.length)
        return reply({ error: 'Walkthrough not found.' }, 404);
    return new NextResponse(reflectionExportText(rounds, saved.flatMap(x => x.entries)), { headers: { 'Cache-Control': 'private, no-store', 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="dydd-preview-reflections-${scope}.txt"` } });
}

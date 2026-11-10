import { NextResponse } from 'next/server';
import { membershipArtifactExpired } from '@/lib/commerce/account-artifact-access';
import { personalRenewalPath } from '@/lib/commerce/account-access';
import { isSandbox } from '@/lib/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeEmail } from '@/lib/identity/email';
import { getOwnedArtifactSnapshot } from '@/lib/assessments/artifact-access';
import { renderSavedReportPreview, reportPreviewHeaders } from '@/lib/public-assessments/report-preview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const unavailable = () => new Response('Report not found.', { status: 404, headers: reportPreviewHeaders });

export async function GET(request: Request, context: { params: Promise<{ snapshotId: string }> }) {
  // Never expose this read path against production data, even on a misconfigured host.
  if (!isSandbox() || process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF !== 'atemrshtshxoqnuevvqu' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://atemrshtshxoqnuevvqu.supabase.co') return unavailable();
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at || !normalizeEmail(user.email)) {
    const login = new URL('/login', request.url);
    // Query parameters cannot grant preview access or carry participant addresses.
    login.searchParams.set('next', new URL(request.url).pathname);
    return NextResponse.redirect(login, { status: 303, headers: reportPreviewHeaders });
  }
  const { snapshotId } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(snapshotId)) return unavailable();
  const snapshot = await getOwnedArtifactSnapshot(snapshotId, user.id, normalizeEmail(user.email));
  if (!snapshot || !['designid', 'designpd'].includes(snapshot.assessment_type)) return unavailable();
  if (await membershipArtifactExpired(user, snapshot)) return NextResponse.redirect(new URL(personalRenewalPath(new URL(request.url).pathname), request.url), {status:303,headers:reportPreviewHeaders});
  try {
    const html = await renderSavedReportPreview(snapshot);
    return html ? new Response(html, { headers: reportPreviewHeaders }) : unavailable();
  } catch {
    // Do not expose report payloads or provider internals in an error response.
    return new Response('The saved report preview is temporarily unavailable. Your assessment has not changed.', { status: 503, headers: reportPreviewHeaders });
  }
}

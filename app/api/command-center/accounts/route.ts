import { canReadAccounts } from '@/lib/accounts/access';
import { readAccountsDashboard } from '@/lib/accounts/server';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow' };
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = { review: url.searchParams.get('review'), key: url.searchParams.get('key') };
  if (!await canReadAccounts(params)) return Response.json({ error: 'Owner access required.' }, { status: 403, headers });
  try {
    return Response.json(await readAccountsDashboard(params), { headers });
  } catch {
    return Response.json({ error: 'Accounts unavailable. No partial totals are displayed.' }, { status: 503, headers });
  }
}

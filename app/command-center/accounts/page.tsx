import { notFound } from 'next/navigation';
import { readAccountsDashboard } from '@/lib/accounts/server';
import { canReadAccounts } from '@/lib/accounts/access';
import { AccountsDashboard } from './dashboard';
import type { OwnerPreviewParams } from '@/lib/owner-preview';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Owner Accounts | DYDD Command Center', robots: { index: false, follow: false } };
export default async function AccountsPage({ searchParams }: { searchParams: Promise<OwnerPreviewParams> }) {
  const params = await searchParams;
  if (!await canReadAccounts(params)) notFound();
  const overviewHref = '/command-center' + (params.review === 'owner' && params.key ? '?' + new URLSearchParams({ review: 'owner', key: params.key }) : '');
  try {
    const data = await readAccountsDashboard(params);
    return <AccountsDashboard data={data} overviewHref={overviewHref} />;
  } catch {
    return <main className="command-center-shell"><p className="section-label">Private owner accounts</p><h1>Accounts unavailable</h1><p role="alert">The saved account records could not be loaded. No partial totals are displayed.</p><p><a href="">Try loading again</a> · <a href={overviewHref}>Command Center</a></p></main>;
  }
}

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DesignIdAssessmentForm } from '../assessment-form';
export const dynamic = 'force-dynamic';
export default async function DesignIdPreview({searchParams}: {searchParams: Promise<{sort?: string}>}) {
  const params = await searchParams;
  const {data:{user}} = await (await createSupabaseServerClient()).auth.getUser();
  if (!user) redirect('/login?next=' + encodeURIComponent('/designid/preview' + (params.sort ? '?sort=1' : '')));
  if (!isDyddAdminEmail(user.email)) redirect('/field-kit');
  async function noSubmission() { 'use server'; }
  return <main className="fruitlife-shell fruitlife-public designid-shell">
    <section className="fruitlife-panel"><p><strong>Owner review — no results saved or emails sent.</strong></p><p><Link href="/designid/preview">Review full assessment</Link> · <Link href="/designid/preview?sort=1">Jump to word sort</Link></p></section>
    <DesignIdAssessmentForm action={noSubmission} preview startAtSort={params.sort === '1'} initialReviewer={{name:'Owner preview',email:user.email ?? ''}} />
  </main>;
}

import { redirect } from 'next/navigation';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import FiresideHost from './host';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Fireside Host | DYDD Command Center', robots: { index: false, follow: false } };
export default async function FiresideHostPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) redirect('/login?next=%2Fcommand-center%2Ffireside');
  if (!isDyddAdminEmail(user?.email)) redirect('/command-center');
  return <FiresideHost />;
}

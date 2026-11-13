import { isDyddAdminEmail } from '@/lib/admin-access';
import { isSandbox } from '@/lib/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import CommandCenterTabs from './tabs';

// Shared owner navigation persists across every Command Center route. Each page
// and API retains its own authorization checks; this layout grants no capability.
export default async function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  const authorized = isSandbox() && Boolean(user?.email_confirmed_at) && isDyddAdminEmail(user?.email);
  return <>{authorized && <CommandCenterTabs />}{children}</>;
}

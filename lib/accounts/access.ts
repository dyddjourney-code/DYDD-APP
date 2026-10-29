import { isPrivateOwnerConsole } from "@/lib/private-owner";
import 'server-only';
import { isDyddAdminEmail } from '@/lib/admin-access';
import { isOwnerPreviewRequest, type OwnerPreviewParams } from '@/lib/owner-preview';
import { isSandbox } from '@/lib/environment';
import { createSupabaseServerClient } from '@/lib/supabase/server';
/** Exact existing Command Center predicates; sandbox is an additional boundary. */
export async function canReadAccounts(params?: OwnerPreviewParams) {
  if (!isSandbox() && !isPrivateOwnerConsole()) return false;
  if (isOwnerPreviewRequest(params)) return true;
  const db = await createSupabaseServerClient();
  const { data: { user }, error } = await db.auth.getUser();
  return !error && Boolean(user) && isDyddAdminEmail(user?.email);
}

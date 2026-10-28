import { isDyddAdminEmail } from "@/lib/admin-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// A review query/cookie never authorizes support access.
export async function supportAdmin() {
  const db = await createSupabaseServerClient();
  const { data: { user }, error } = await db.auth.getUser();
  return !error && user && isDyddAdminEmail(user.email) ? user : null;
}

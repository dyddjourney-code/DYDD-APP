import Link from "next/link";
import { isDyddAdminEmail } from "@/lib/admin-access";
import { isSandbox } from "@/lib/environment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Verified owner navigation only; review links never grant hosting access. */
export async function FiresideOwnerEntry() {
  if (!isSandbox()) return null;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at || !isDyddAdminEmail(user.email)) return null;
  return <nav aria-label="Fireside owner controls" style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "24px 0" }}>
    <Link className="button" href="/command-center/fireside">Manage Live Fireside</Link>
    <Link className="button secondary" href="/command-center">Command Center</Link>
  </nav>;
}

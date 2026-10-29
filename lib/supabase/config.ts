export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox") {
    const expected = process.env.NEXT_PUBLIC_DYDD_SANDBOX_SUPABASE_REF;
    if (!expected || new URL(url).hostname !== `${expected}.supabase.co` || expected === "laojrzlqbkmirzcbcnyw") {
      throw new Error("Sandbox database isolation is not configured.");
    }
  }

  if (process.env.DYDD_PRIVATE_OWNER_MODE === "true" && new URL(url).hostname !== "laojrzlqbkmirzcbcnyw.supabase.co") {
    throw new Error("Original owner database identity mismatch.");
  }
  return { anonKey, url };
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const reviewToken = process.env.DYDD_REVIEW_TOKEN;
  const url = new URL(request.url);
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const explicitPreview = Boolean(reviewToken && url.searchParams.get("key") === reviewToken && ["new", "owner"].includes(url.searchParams.get("review") || ""));
  if (user && !explicitPreview) return NextResponse.redirect(new URL("/hq", url));

  if (!reviewToken) {
    return NextResponse.redirect(new URL("/login", url));
  }

  return NextResponse.redirect(
    new URL(`/hq?review=new&key=${encodeURIComponent(reviewToken)}`, url),
  );
}

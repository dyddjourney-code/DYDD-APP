import { isSandbox } from "@/lib/environment";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  const reviewToken = isSandbox() ? process.env.DYDD_REVIEW_TOKEN : undefined;
  const explicitPreview = Boolean(reviewToken && url.searchParams.get("key") === reviewToken && ["new", "owner"].includes(url.searchParams.get("review") || ""));
  if (user && !explicitPreview) return NextResponse.redirect(new URL("/hq?lane=fruitlife", url));

  if (!reviewToken) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent("/hq?lane=fruitlife")}`, url),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/hq?lane=fruitlife&review=new&key=${encodeURIComponent(reviewToken)}`,
      url,
    ),
  );
}

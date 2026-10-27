import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (user) return NextResponse.redirect(new URL("/hq?lane=fruitlife", url));
  const reviewToken = process.env.DYDD_REVIEW_TOKEN;

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

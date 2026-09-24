import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);
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

import { NextResponse } from "next/server";

export function GET(request: Request) {
  const reviewToken = process.env.DYDD_REVIEW_TOKEN;
  const url = new URL(request.url);

  if (!reviewToken) {
    return NextResponse.redirect(new URL("/login", url));
  }

  return NextResponse.redirect(
    new URL(`/hq?review=new&key=${encodeURIComponent(reviewToken)}`, url),
  );
}

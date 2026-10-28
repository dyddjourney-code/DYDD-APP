import { isSandbox } from "@/lib/environment";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  if (!isSandbox()) return new NextResponse("Not found", { status: 404 });
  const url = new URL(request.url);
  const reviewToken = process.env.DYDD_REVIEW_TOKEN;

  if (!reviewToken) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent("/command-center")}`, url),
    );
  }

  return NextResponse.redirect(
    new URL(`/command-center?review=owner&key=${encodeURIComponent(reviewToken)}`, url),
  );
}

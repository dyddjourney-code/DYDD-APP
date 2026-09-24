import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);

  return NextResponse.redirect(
    new URL(`/login?next=${encodeURIComponent("/command-center")}`, url),
  );
}

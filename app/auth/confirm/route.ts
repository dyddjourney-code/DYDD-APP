import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Exchange a one-time email token for an ordinary, cookie-backed account session.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const requestedNext = url.searchParams.get("next") ?? "/field-kit";
  const target = new URL(requestedNext, url.origin);
  const next = requestedNext.startsWith("/") && target.origin === url.origin
    ? `${target.pathname}${target.search}`
    : "/field-kit";

  if (tokenHash) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (!error) {
      const response = NextResponse.redirect(new URL(next, url.origin));
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    }
  }

  const login = new URL("/login", url.origin);
  login.searchParams.set("next", next);
  login.searchParams.set("message", "That one-time sign-in link expired or was already used. Sign in to continue.");
  return NextResponse.redirect(login);
}

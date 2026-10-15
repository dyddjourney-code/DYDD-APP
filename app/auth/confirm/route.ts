import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Exchange a one-time email token for an ordinary, cookie-backed account session.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
  // Link previews must never consume the one-time credential.
  return new NextResponse(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open DesignID</title><body style="font:20px system-ui;max-width:34rem;margin:12vh auto;padding:24px;background:#faf7ed;color:#243f27"><h1>Ready to explore your design?</h1><p>Continue to sign in securely and open your assessment.</p><form method="post" action="/auth/confirm"><input type="hidden" name="token_hash" value="${escape(url.searchParams.get("token_hash") ?? "")}"><input type="hidden" name="next" value="${escape(url.searchParams.get("next") ?? "/field-kit")}"><button style="font:inherit;padding:16px 24px;border:0;border-radius:8px;background:#243f27;color:white">Open assessment</button></form></body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" },
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const form = await request.formData();
  const tokenHash = String(form.get("token_hash") ?? "");
  const requestedNext = String(form.get("next") ?? "/field-kit");
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

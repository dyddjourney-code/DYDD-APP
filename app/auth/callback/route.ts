import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/hq";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/login?message=${encodeURIComponent(
            "That sign-in link could not be completed. Use the email code below, or request a fresh link in the same browser.",
          )}`,
          requestUrl.origin,
        ),
      );
    }
  } else {
    return NextResponse.redirect(
      new URL(
        `/login?message=${encodeURIComponent(
          "The sign-in link was missing its login code. Request a new link or use the email code.",
        )}`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

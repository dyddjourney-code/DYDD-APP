import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/hq";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/hq";

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const fullName =
        typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : null;

      try {
        const supabaseAdmin = createSupabaseAdminClient();

        await supabaseAdmin.from("school_profiles").upsert(
          {
            email: user.email.toLowerCase(),
            full_name: fullName,
            id: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      } catch (profileError) {
        console.error("Unable to sync school profile during auth callback", profileError);
      }
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

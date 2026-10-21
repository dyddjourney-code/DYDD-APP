import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Sandbox review is not a learner login. Preserve only the already-authorized
  // preview credential across plain links and existing gold-bar browser sessions.
  const sandbox = process.env.NEXT_PUBLIC_DYDD_ENVIRONMENT === "sandbox";
  const token = process.env.DYDD_REVIEW_TOKEN;
  const key = request.nextUrl.searchParams.get("key");
  const review = request.nextUrl.searchParams.get("review");
  const validQuery = Boolean(token && key === token && (review === "new" || review === "owner"));
  const validCookie = Boolean(token && request.cookies.get("dydd_sandbox_review")?.value === token);
  const previewPath = /^\/(?:hq|journey|trailheads|ranger-station|field-kit|gear|fireside|waypoints|live|camp-circle|command-center|courses|learn)(?:\/|$)/.test(request.nextUrl.pathname);
  if (sandbox && request.method === "GET" && previewPath && !key && validCookie) {
    const destination = request.nextUrl.clone();
    destination.searchParams.set("review", destination.pathname.startsWith("/command-center") ? "owner" : "new");
    destination.searchParams.set("key", token!);
    const restored = NextResponse.redirect(destination);
    restored.headers.set("Cache-Control", "private, no-store");
    restored.headers.set("Referrer-Policy", "no-referrer");
    return restored;
  }
  const { anonKey, url } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, options, value }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  if (sandbox && validQuery) {
    response.cookies.set("dydd_sandbox_review", token!, {
      httpOnly: true, secure: request.nextUrl.protocol === "https:",
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7,
    });
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

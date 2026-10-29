import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig } from "./lib/supabase/config";

export async function middleware(request: NextRequest) {
  if (process.env.DYDD_PRIVATE_OWNER_MODE === "true") {
    // Vercel Authentication gates ALL deployments before this middleware.
    // Keep this operational deployment out of every learner/API workflow.
    const pinned = process.env.VERCEL_PROJECT_ID === "prj_Aw8o5xjiMpVY9NaGvFBsamRIM4Aq" && process.env.VERCEL_ENV === "production";
    if (!pinned) return new NextResponse("Owner deployment unavailable", { status: 503 });
    const path = request.nextUrl.pathname;
    if (path === "/" || path === "/owner") return NextResponse.redirect(new URL("/command-center", request.url));
    const allowed = /^\/(?:command-center(?:\/|$)|api\/command-center(?:\/|$)|_next(?:\/|$)|brand(?:\/|$))/.test(path);
    if (!allowed) return new NextResponse("Not found", { status: 404 });
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      // Preserve original write paths, but require a same-origin owner action.
      // Platform authentication is not a substitute for CSRF protection.
      if (!origin || origin !== request.nextUrl.origin || request.headers.get("sec-fetch-site") === "cross-site") {
        return new NextResponse("Same-origin owner action required", { status: 403 });
      }
    }
    const response = NextResponse.next({ request });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
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

  const { data: { user } } = await supabase.auth.getUser();

  // Prefetched sandbox links may set a review cookie. It must never replace
  // a genuine signed-in learner on reload or ordinary navigation.
  if (sandbox && request.method === "GET" && previewPath && !key && validCookie && !user) {
    const destination = request.nextUrl.clone();
    destination.searchParams.set("review", destination.pathname.startsWith("/command-center") ? "owner" : "new");
    destination.searchParams.set("key", token!);
    const restored = NextResponse.redirect(destination);
    restored.headers.set("Cache-Control", "private, no-store");
    restored.headers.set("Referrer-Policy", "no-referrer");
    for (const cookie of response.cookies.getAll()) restored.cookies.set(cookie);
    return restored;
  }


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

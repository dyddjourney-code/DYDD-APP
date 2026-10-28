import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function unsubscribeHtml(message: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>DYDD Waypoints</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #fbfaf4;
        color: #243f27;
        font-family: Arial, sans-serif;
      }
      main {
        width: min(92vw, 560px);
        border: 1px solid rgba(36, 63, 39, 0.14);
        border-radius: 12px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 20px 48px rgba(70, 58, 35, 0.1);
      }
      h1 {
        margin: 0 0 10px;
        font-size: 2rem;
      }
      p {
        margin: 0;
        color: #667085;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Waypoint subscription updated</h1>
      <p>${message}</p>
    </main>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return new NextResponse(
      unsubscribeHtml("This unsubscribe link is missing its token."),
      {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control":"no-store", "Referrer-Policy":"no-referrer" },
        status: 400,
      },
    );
  }

  const supabase = createSupabaseAdminClient();
  const hash = hashToken(token);
  const history = await supabase.from("dydd_waypoint_unsubscribe_tokens").select("subscription_id").eq("token_hash",hash).maybeSingle();
  if(history.error) return new NextResponse(unsubscribeHtml("We could not update that subscription yet."),{status:503,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
  // Compatibility with the last legacy token, including subscriptions created before this migration.
  const lookup = history.data ? {data:{id:history.data.subscription_id},error:null} : await supabase.from("dydd_waypoint_subscriptions").select("id").eq("unsubscribe_token_hash",hash).maybeSingle();
  if(lookup.error) return new NextResponse(unsubscribeHtml("We could not update that subscription yet."),{status:503});
  if(!lookup.data) return new NextResponse(unsubscribeHtml("This unsubscribe link is not recognized. Use Waypoints in your account or contact DYDD for help."),{status:400,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
  const { error } = await supabase.from("dydd_waypoint_subscriptions").update({status:"unsubscribed",unsubscribed_at:new Date().toISOString()}).eq("id",lookup.data.id);

  if (error) {
    return new NextResponse(unsubscribeHtml("We could not update that subscription yet."), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control":"no-store", "Referrer-Policy":"no-referrer" },
      status: 500,
    });
  }

  return new NextResponse(
    unsubscribeHtml("You are unsubscribed from weekly DYDD Waypoint emails."),
    {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control":"no-store", "Referrer-Policy":"no-referrer" },
    },
  );
}

export async function POST(request: NextRequest) {
  // RFC 8058: the immutable token authenticates provider one-click POST; no account session needed.
  if(request.nextUrl.searchParams.has("token")) return GET(request);
  const payload = (await request.json().catch(() => ({}))) as {
    email?: string;
  };
  const email = normalizeEmail(payload.email ?? "");

  if (!email) {
    return NextResponse.json(
      { message: "Missing subscription email." },
      { status: 400 },
    );
  }

  const serverClient = await createSupabaseServerClient();
  const {
    data: { user },
  } = await serverClient.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Sign in before changing this subscription." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("dydd_waypoint_subscriptions")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("email", email)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "You're unsubscribed from weekly DYDD Waypoint emails.",
  });
}

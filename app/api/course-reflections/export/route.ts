import { previewParams, previewExport } from "@/lib/reflections/preview";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReflectionExperience } from "@/lib/reflections/catalog";
import { reflectionExportText } from "@/lib/reflections/export";
import type { ReflectionEntry, ReflectionRound } from "@/lib/reflections/types";
import { sendApplicationEmail as sendResendEmail } from "@/lib/lifecycle/application-mail";
import { createHash } from "node:crypto";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers });
async function prepare(request: Request) {
  const s = await createSupabaseServerClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return { error: fail("Sign in to export your reflections.", 401) };
  const url = new URL(request.url),
    scope = url.searchParams.get("scope") ?? "round",
    slug = url.searchParams.get("courseSlug") ?? "",
    roundId = url.searchParams.get("round") ?? "";
  if (
    !["round", "course", "all"].includes(scope) ||
    (scope !== "all" && !getReflectionExperience(slug)) ||
    (scope === "round" && !/^[0-9a-f-]{36}$/i.test(roundId))
  )
    return {
      error: fail("Choose a valid saved workbook or walkthrough.", 400),
    };
  let query = s
    .from("reflection_rounds")
    .select("*")
    .eq("user_id", user.id)
    .order("course_slug")
    .order("started_at", { ascending: false })
    .order("id", { ascending: false });
  if (scope !== "all") query = query.eq("course_slug", slug);
  if (scope === "round") query = query.eq("id", roundId);
  const rounds: ReflectionRound[] = [];
  for (let from = 0; ; from += 1000) {
    const page = await query.range(from, from + 999);
    if (page.error)
      return {
        error: fail("Could not load your saved work. Please try again.", 500),
      };
    rounds.push(...page.data);
    if (page.data.length < 1000) break;
  }
  if (scope === "round" && !rounds.length)
    return { error: fail("Reflection walkthrough not found.", 404) };
  const entries: ReflectionEntry[] = [];
  // Batch round IDs so long-term histories do not exceed URL limits.
  for (let batch = 0; batch < rounds.length; batch += 100) {
    for (let from = 0; ; from += 1000) {
      const page = await s
        .from("reflection_entries")
        .select("*")
        .eq("user_id", user.id)
        .in(
          "round_id",
          rounds.slice(batch, batch + 100).map((r) => r.id),
        )
        .order("id")
        .range(from, from + 999);
      if (page.error)
        return {
          error: fail(
            "Could not load your saved answers. Please try again.",
            500,
          ),
        };
      entries.push(...page.data);
      if (page.data.length < 1000) break;
    }
  }
  return {
    user,
    text: reflectionExportText(rounds, entries),
    title:
      scope === "all"
        ? "All my workbooks"
        : getReflectionExperience(slug)!.title,
    filename: `dydd-reflections-${scope === "all" ? "all-workbooks" : slug}-${new Date().toISOString().slice(0, 10)}.txt`,
  };
}
export async function GET(request: Request) {
  const preview = previewParams(new URL(request.url));
  if (preview) return previewExport(request, preview);
  const result = await prepare(request);
  if (result.error) return result.error;
  return new NextResponse(result.text, {
    headers: {
      ...headers,
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export async function POST(request: Request) {
  const preview = previewParams(new URL(request.url));
  if (preview) return previewExport(request, preview);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return fail("Please send from your workbook page.", 403);
  const result = await prepare(request);
  if (result.error) return result.error;
  if (!result.user.email || !result.user.email_confirmed_at)
    return fail(
      "Verify your account email before emailing your reflections. You can still download them.",
      403,
    );
  const hash = createHash("sha256")
    .update(result.text)
    .digest("hex")
    .slice(0, 32);
  try {
    const sent = await sendResendEmail({
      to: result.user.email,
      templateId:"requested-reflection-export",
      deliveryContext:{type:"account_service",userId:result.user.id},
      subject: `Your DYDD reflections — ${result.title}`,
      text: result.text,
      html: `<p>Your saved reflections are included below and in the attached text file.</p><pre style="white-space:pre-wrap;font-family:inherit">${result.text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>`,
      attachments: [
        {
          filename: result.filename,
          content: Buffer.from(result.text).toString("base64"),
        },
      ],
      idempotencyKey: `reflection-export-${result.user.id}-${hash}`,
    });
    if (!sent.sent)
      return fail(
        "Email could not be sent right now. Your reflections are safe; download the text file or try again shortly.",
        502,
      );
    return NextResponse.json(
      { sent: true, email: result.user.email },
      { headers },
    );
  } catch {
    return fail(
      "Email could not be sent right now. Download the text file or try again shortly.",
      502,
    );
  }
}

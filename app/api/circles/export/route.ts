import { NextResponse } from "next/server";
import { circleActor, circleQuery, sameOrigin } from "@/lib/circles/server";
import { testBillingEnabled, validUuid } from "@/lib/commerce/test-billing-config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCircleBillingState } from "@/lib/commerce/circle-billing";
import { validatePlan } from "@/lib/circles/plan";
import { circlePlanHtml } from "@/lib/circles/pdf";
export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
const fail = (error: string, status: number) =>
  NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return fail("Open your Circle page to download a plan.", 403);
  const actor = await circleActor(request);
  if (!actor)
    return fail("Sign in to download your Circle plan.", 401);
  const raw = await request.text();
  if (raw.length > 250000) return fail("This plan is too large.", 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("Check your Circle details.", 400);
  }
  const invalid = validatePlan(body?.plan);
  if (invalid) return fail(invalid, 400);
  if (testBillingEnabled() && actor.userId) {
    if (!validUuid(body.circleId)) return fail("Save your Circle before downloading its plan.", 400);
    const saved = await circleQuery(actor).eq("id", body.circleId).maybeSingle();
    if (saved.error) return fail("Your saved plan could not be checked.", 503);
    if (!saved.data) return fail("Choose a Circle saved in your account.", 404);
    try {
      const billing = await getCircleBillingState(actor.userId, body.circleId, saved.data.plan.format);
      if (!billing.canOperate) body.plan = saved.data.plan; // Preserve historical export, never mutate read-only work.
      const budget = await createSupabaseAdminClient().rpc("dydd_circle_report_budget", {who: actor.userId});
      if (budget.error) return fail("Your plan PDF budget has been reached. Try later or ask the owner for help.", 429);
    } catch { return fail("Your Circle access could not be checked.", 503); }
  }
  let browser;
  try {
    const chromium = await import("@sparticuz/chromium"),
      puppeteer = await import("puppeteer-core");
    browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => req.abort());
    await page.setContent(circlePlanHtml(body.plan), {
      waitUntil: "load",
      timeout: 30000,
    });
    const bytes = await page.pdf({ format: "Letter", printBackground: true });
    const filename =
      (body.plan.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "circle") +
      "-plan.pdf";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fail(
      "The PDF could not be created. Your plan is still here; please try again.",
      503,
    );
  } finally {
    await browser?.close();
  }
}

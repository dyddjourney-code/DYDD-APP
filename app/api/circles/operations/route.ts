import { testBillingEnabled } from "@/lib/commerce/test-billing-config";
import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/circles/server";
import { CircleOperationError, operationActor, loadCircleOperationDetail, listCircleOperations, operateCircle } from "@/lib/circles/operations";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie", "Referrer-Policy": "no-referrer" } });
function failed(error: unknown) { return error instanceof CircleOperationError ? reply({ error: error.message }, error.status) : reply({ error: "Your Circle records could not be checked. Please retry." }, 503); }
export async function GET(request: Request) {
  if (!testBillingEnabled()) return reply({error:"Not found."},404);
  try {
    const actor = await operationActor();
    if (!actor) return reply({ error: "Sign in with your verified email to open My Circles.", signedIn: false }, 401);
    const id = new URL(request.url).searchParams.get("circleId");
    return reply(id ? await loadCircleOperationDetail(actor, id) : await listCircleOperations(actor));
  } catch (error) { return failed(error); }
}
export async function POST(request: Request) {
  if (!testBillingEnabled()) return reply({error:"Not found."},404);
  if (!sameOrigin(request) || request.headers.get("sec-fetch-site") === "cross-site") return reply({ error: "Open My Circles on this site to make changes." }, 403);
  try {
    const actor = await operationActor();
    if (!actor) return reply({ error: "Sign in with your verified email to manage a Circle." }, 401);
    const raw = await request.text();
    if (raw.length > 250000) return reply({ error: "This Circle request is too large." }, 413);
    let body; try { body = JSON.parse(raw); } catch { return reply({ error: "Check your Circle action details." }, 400); }
    return reply(await operateCircle(actor, body));
  } catch (error) { return failed(error); }
}

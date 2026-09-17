import { NextResponse, type NextRequest } from "next/server";
import { grantFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import { fruitLifeProductSlug, getStripeClient } from "@/lib/commerce/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function safeReturnTo(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/field-kit?lane=fruitlife";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const checkoutSessionId = request.nextUrl.searchParams.get("session_id") ?? "";

  if (!checkoutSessionId) {
    return NextResponse.redirect(
      new URL("/field-kit?lane=fruitlife&checkout=missing", request.url),
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(`/field-kit?lane=fruitlife`)}`, request.url),
    );
  }

  const stripe = getStripeClient();
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["line_items.data.price"],
  });
  const metadataUserId = checkoutSession.metadata?.user_id ?? "";
  const productSlug = checkoutSession.metadata?.product_slug ?? "";

  if (
    checkoutSession.payment_status !== "paid" ||
    metadataUserId !== user.id ||
    productSlug !== fruitLifeProductSlug
  ) {
    return NextResponse.redirect(
      new URL("/field-kit?lane=fruitlife&checkout=unverified", request.url),
    );
  }

  const priceId = checkoutSession.line_items?.data[0]?.price?.id ?? null;
  await grantFruitLifeEntitlement({
    amountTotal: checkoutSession.amount_total,
    currency: checkoutSession.currency,
    customerEmail: checkoutSession.customer_details?.email ?? checkoutSession.customer_email,
    paymentIntentId:
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id,
    priceId,
    stripeCheckoutSessionId: checkoutSession.id,
    stripeCustomerId:
      typeof checkoutSession.customer === "string"
        ? checkoutSession.customer
        : checkoutSession.customer?.id,
    userId: user.id,
  });

  const returnTo = safeReturnTo(checkoutSession.metadata?.return_to);
  return NextResponse.redirect(
    new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=success`, request.url),
  );
}

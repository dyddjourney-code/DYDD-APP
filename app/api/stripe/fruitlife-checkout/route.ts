import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getActiveFruitLifeEntitlement } from "@/lib/commerce/fruitlife-entitlements";
import {
  fruitLifeProductSlug,
  fruitLifeStripeProductId,
  getFruitLifeStripePriceId,
  getStripeClient,
} from "@/lib/commerce/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const productionAppUrl = "https://dydd-online-school.vercel.app";

async function getAppBaseUrl(request: NextRequest) {
  const requestHeaders = await headers();
  const configuredUrl =
    process.env.DYDD_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  const origin = requestHeaders.get("origin") ?? request.nextUrl.origin;

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    return productionAppUrl;
  }

  return "http://localhost:3000";
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/field-kit?lane=fruitlife";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("return_to"));

  if (!user) {
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(`/field-kit?lane=fruitlife`)}`, request.url),
    );
  }

  const existingEntitlement = await getActiveFruitLifeEntitlement(user.id);

  if (existingEntitlement) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  let checkoutSession;

  try {
    const stripe = getStripeClient();
    const appBaseUrl = await getAppBaseUrl(request);
    checkoutSession = await stripe.checkout.sessions.create({
      allow_promotion_codes: true,
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: getFruitLifeStripePriceId(),
          quantity: 1,
        },
      ],
      metadata: {
        product_id: fruitLifeStripeProductId,
        product_slug: fruitLifeProductSlug,
        return_to: returnTo,
        user_id: user.id,
      },
      mode: "payment",
      success_url: `${appBaseUrl}/api/stripe/fruitlife-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}${returnTo}${returnTo.includes("?") ? "&" : "?"}checkout=cancelled`,
    });
  } catch (error) {
    console.error("Unable to create FruitLife Stripe checkout session.", error);
    return NextResponse.redirect(
      new URL("/field-kit?lane=fruitlife&checkout=config-error", request.url),
    );
  }

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  }

  return NextResponse.redirect(checkoutSession.url, 303);
}
